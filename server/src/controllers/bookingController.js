import Seat from '../models/Seat.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { withSerializableTransaction, retryOnSerializationFailure } from '../utils/transaction.js';
import logger from '../utils/logger.js';

/**
 * Book a seat with concurrency control
 * Supports both pessimistic and optimistic locking via query parameter
 * 
 * Query params:
 * - mode: 'pessimistic' (default) or 'optimistic'
 * 
 * Example: POST /api/bookings/book?mode=optimistic
 */
export const bookSeat = async (req, res) => {
    try {
        const { seatId, eventId } = req.body;
        const userId = req.user.userId;
        const lockingMode = req.query.mode || 'pessimistic';

        // Validate input
        if (!seatId || !eventId) {
            return res.status(400).json({ error: 'Seat ID and Event ID are required' });
        }

        if (!['pessimistic', 'optimistic'].includes(lockingMode)) {
            return res.status(400).json({ error: 'Invalid locking mode. Use "pessimistic" or "optimistic"' });
        }

        logger.info(`Booking attempt - User: ${userId}, Seat: ${seatId}, Mode: ${lockingMode}`);

        // Retry on serialization failures
        const result = await retryOnSerializationFailure(async () => {
            return await withSerializableTransaction(async (client) => {
                let seat;

                if (lockingMode === 'pessimistic') {
                    // PESSIMISTIC LOCKING: SELECT ... FOR UPDATE
                    seat = await Seat.lockForUpdate(client, seatId);

                    if (seat.is_booked) {
                        throw new Error('Seat is already booked');
                    }

                    // Update seat
                    await Seat.bookSeat(client, seatId);
                } else {
                    // OPTIMISTIC LOCKING: Version-based
                    // First, get current version
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

                    // Try to update with version check
                    const updatedSeat = await Seat.optimisticBookSeat(client, seatId, seat.version);

                    if (!updatedSeat) {
                        throw new Error('Seat booking conflict - version mismatch. Please retry.');
                    }
                }

                // Create booking
                const booking = await Booking.create(client, userId, eventId, seatId);

                // Create payment record
                const payment = await Payment.create(client, booking.id, 50.00);

                // Simulate payment processing (INSIDE THE TRANSACTION)
                const paymentSuccess = await Payment.simulatePayment();

                if (!paymentSuccess) {
                    // Payment failed - this will cause rollback
                    await Payment.updateStatus(client, payment.id, 'failed');
                    await Booking.updateStatus(client, booking.id, 'failed');
                    throw new Error('Payment failed');
                }

                // Payment succeeded
                await Payment.updateStatus(client, payment.id, 'success');
                await Booking.updateStatus(client, booking.id, 'confirmed');

                logger.info(`Booking successful - Booking ID: ${booking.id}, Seat: ${seatId}`);

                return {
                    booking,
                    payment,
                    message: 'Booking confirmed successfully'
                };
            });
        }, 5); // Max 5 retries

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
 * Get user's bookings
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
