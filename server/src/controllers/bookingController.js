import Seat from '../models/Seat.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { withSerializableTransaction, retryOnSerializationFailure } from '../utils/transaction.js';
import logger from '../utils/logger.js';

/**
 * Book multiple seats in a single transaction
 * All seats share the same booking reference
 * 
 * Body: { seatIds: [1, 2, 3], eventId: 1, totalAmount: 3540 }
 */
export const bookSeats = async (req, res) => {
    try {
        const { seatIds, eventId, totalAmount } = req.body;
        const userId = req.user.userId;

        // Validate input
        if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return res.status(400).json({ error: 'Seat IDs array is required' });
        }
        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        logger.info(`Bulk booking attempt - User: ${userId}, Seats: ${seatIds.join(',')}, Event: ${eventId}`);

        // Generate a single booking reference for all seats
        const bookingReference = Booking.generateReference();

        const result = await retryOnSerializationFailure(async () => {
            return await withSerializableTransaction(async (client) => {
                const bookings = [];
                const bookedSeats = [];

                // Book each seat in the transaction
                for (const seatId of seatIds) {
                    // Lock and check seat
                    const seat = await Seat.lockForUpdate(client, seatId);

                    if (seat.is_booked) {
                        throw new Error(`Seat ${seat.seat_number} is already booked`);
                    }

                    // Mark seat as booked
                    await Seat.bookSeat(client, seatId);
                    bookedSeats.push(seat.seat_number);

                    // Create booking with shared reference
                    const booking = await Booking.create(
                        client, userId, eventId, seatId,
                        bookingReference, totalAmount
                    );
                    bookings.push(booking);
                }

                // Create single payment for the entire booking
                const payment = await Payment.create(client, bookings[0].id, totalAmount || 50.00);

                // Simulate payment
                const paymentSuccess = await Payment.simulatePayment();

                if (!paymentSuccess) {
                    await Payment.updateStatus(client, payment.id, 'failed');
                    for (const booking of bookings) {
                        await Booking.updateStatus(client, booking.id, 'failed');
                    }
                    throw new Error('Payment failed');
                }

                // Mark all as confirmed
                await Payment.updateStatus(client, payment.id, 'success');
                for (const booking of bookings) {
                    await Booking.updateStatus(client, booking.id, 'confirmed');
                }

                logger.info(`Bulk booking successful - Reference: ${bookingReference}, Seats: ${bookedSeats.join(',')}`);

                return {
                    booking_reference: bookingReference,
                    seats: bookedSeats,
                    quantity: bookedSeats.length,
                    total_amount: totalAmount,
                    status: 'confirmed',
                    message: 'Booking confirmed successfully'
                };
            });
        }, 5);

        res.status(201).json(result);

    } catch (error) {
        logger.error('Bulk booking error:', error.message);

        if (error.message.includes('already booked')) {
            return res.status(409).json({ error: error.message });
        }
        if (error.message.includes('Payment failed')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Booking failed: ' + error.message });
    }
};

/**
 * Book a single seat (legacy support)
 */
export const bookSeat = async (req, res) => {
    try {
        const { seatId, eventId } = req.body;
        const userId = req.user.userId;
        const lockingMode = req.query.mode || 'pessimistic';

        if (!seatId || !eventId) {
            return res.status(400).json({ error: 'Seat ID and Event ID are required' });
        }

        logger.info(`Booking attempt - User: ${userId}, Seat: ${seatId}, Mode: ${lockingMode}`);

        const bookingReference = Booking.generateReference();

        const result = await retryOnSerializationFailure(async () => {
            return await withSerializableTransaction(async (client) => {
                let seat;

                if (lockingMode === 'pessimistic') {
                    seat = await Seat.lockForUpdate(client, seatId);

                    if (seat.is_booked) {
                        throw new Error('Seat is already booked');
                    }

                    await Seat.bookSeat(client, seatId);
                } else {
                    const currentSeat = await client.query(
                        'SELECT * FROM seats WHERE id = $1',
                        [seatId]
                    );

                    if (currentSeat.rows.length === 0) {
                        throw new Error('Seat not found');
                    }

                    seat = currentSeat.rows[0];

                    if (seat.is_booked) {
                        throw new Error('Seat is already booked');
                    }

                    const updatedSeat = await Seat.optimisticBookSeat(client, seatId, seat.version);

                    if (!updatedSeat) {
                        throw new Error('Seat booking conflict - version mismatch. Please retry.');
                    }
                }

                const booking = await Booking.create(client, userId, eventId, seatId, bookingReference);
                const payment = await Payment.create(client, booking.id, 50.00);
                const paymentSuccess = await Payment.simulatePayment();

                if (!paymentSuccess) {
                    await Payment.updateStatus(client, payment.id, 'failed');
                    await Booking.updateStatus(client, booking.id, 'failed');
                    throw new Error('Payment failed');
                }

                await Payment.updateStatus(client, payment.id, 'success');
                await Booking.updateStatus(client, booking.id, 'confirmed');

                logger.info(`Booking successful - Booking ID: ${booking.id}, Seat: ${seatId}`);

                return {
                    booking: { ...booking, booking_reference: bookingReference },
                    payment,
                    message: 'Booking confirmed successfully'
                };
            });
        }, 5);

        res.status(201).json(result);

    } catch (error) {
        logger.error('Booking error:', error.message);

        if (error.message.includes('already booked')) {
            return res.status(409).json({ error: error.message });
        }
        if (error.message.includes('Payment failed')) {
            return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('version mismatch')) {
            return res.status(409).json({ error: error.message });
        }

        res.status(500).json({ error: 'Booking failed: ' + error.message });
    }
};

/**
 * Get user's bookings (grouped by reference)
 */
export const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.userId;
        const bookings = await Booking.findByUserId(userId);
        res.json({ bookings });
    } catch (error) {
        logger.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};
