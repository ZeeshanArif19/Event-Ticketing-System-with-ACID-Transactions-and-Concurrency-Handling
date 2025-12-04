import { query } from '../config/db.js';

/**
 * Generate a unique booking reference
 * Format: TKT-XXXXXX (6 alphanumeric characters)
 */
const generateBookingReference = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars like 0,O,1,I
    let ref = 'TKT-';
    for (let i = 0; i < 6; i++) {
        ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ref;
};

const Booking = {
    /**
     * Create a new booking within a transaction
     * @param {Object} client - PostgreSQL client
     * @param {Number} userId - User ID
     * @param {Number} eventId - Event ID
     * @param {Number} seatId - Seat ID
     * @param {String} bookingReference - Shared booking reference for grouped seats
     * @param {Number} totalAmount - Total amount for the booking
     * @returns {Promise<Object>} Created booking
     */
    create: async (client, userId, eventId, seatId, bookingReference = null, totalAmount = null) => {
        const ref = bookingReference || generateBookingReference();
        const result = await client.query(
            `INSERT INTO bookings (user_id, event_id, seat_id, status, booking_reference, total_amount) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
            [userId, eventId, seatId, 'pending', ref, totalAmount]
        );

        return result.rows[0];
    },

    /**
     * Get all bookings for a user, grouped by booking reference
     * @param {Number} userId - User ID
     * @returns {Promise<Array>} Array of grouped bookings with event and seat details
     */
    findByUserId: async (userId) => {
        // Get all bookings with event/seat info
        const result = await query(
            `SELECT 
        b.*,
        e.name as event_name,
        e.venue,
        e.event_date,
        e.image_url,
        s.seat_number
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       JOIN seats s ON b.seat_id = s.id AND s.event_id = b.event_id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC`,
            [userId]
        );

        // Group bookings by booking_reference
        const groupedBookings = new Map();
        
        for (const booking of result.rows) {
            const ref = booking.booking_reference || `LEGACY-${booking.id}`;
            
            if (!groupedBookings.has(ref)) {
                groupedBookings.set(ref, {
                    id: booking.id,
                    booking_reference: ref,
                    user_id: booking.user_id,
                    event_id: booking.event_id,
                    event_name: booking.event_name,
                    venue: booking.venue,
                    event_date: booking.event_date,
                    image_url: booking.image_url,
                    status: booking.status,
                    booking_date: booking.booking_date,
                    total_amount: booking.total_amount,
                    seats: [],
                    seat_ids: []
                });
            }
            
            const group = groupedBookings.get(ref);
            group.seats.push(booking.seat_number);
            group.seat_ids.push(booking.seat_id);
            
            // Use the most recent status and amount
            if (booking.status === 'confirmed') {
                group.status = 'confirmed';
            }
            if (booking.total_amount) {
                group.total_amount = booking.total_amount;
            }
        }

        // Convert Map to array and format
        return Array.from(groupedBookings.values()).map(booking => ({
            ...booking,
            quantity: booking.seats.length,
            seat_numbers: booking.seats.join(', ')
        }));
    },

    /**
     * Get booking by ID
     * @param {Number} bookingId - Booking ID
     * @returns {Promise<Object|null>} Booking object or null
     */
    findById: async (bookingId) => {
        const result = await query(
            'SELECT * FROM bookings WHERE id = $1',
            [bookingId]
        );

        return result.rows[0] || null;
    },

    /**
     * Update booking status
     * @param {Object} client - PostgreSQL client
     * @param {Number} bookingId - Booking ID
     * @param {String} status - New status
     * @returns {Promise<Object>} Updated booking
     */
    updateStatus: async (client, bookingId, status) => {
        const result = await client.query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
            [status, bookingId]
        );

        return result.rows[0];
    },

    /**
     * Generate a new booking reference
     */
    generateReference: generateBookingReference
};

export default Booking;
