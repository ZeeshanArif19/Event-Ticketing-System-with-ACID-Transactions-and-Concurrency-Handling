import { query } from '../config/db.js';

const Booking = {
    /**
     * Create a new booking within a transaction
     * @param {Object} client - PostgreSQL client
     * @param {Number} userId - User ID
     * @param {Number} eventId - Event ID
     * @param {Number} seatId - Seat ID
     * @returns {Promise<Object>} Created booking
     */
    create: async (client, userId, eventId, seatId) => {
        const result = await client.query(
            `INSERT INTO bookings (user_id, event_id, seat_id, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
            [userId, eventId, seatId, 'pending']
        );

        return result.rows[0];
    },

    /**
     * Get all bookings for a user
     * @param {Number} userId - User ID
     * @returns {Promise<Array>} Array of bookings with event and seat details
     */
    findByUserId: async (userId) => {
        const result = await query(
            `SELECT 
        b.*,
        e.name as event_name,
        e.venue,
        e.event_date,
        s.seat_number
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       JOIN seats s ON b.seat_id = s.id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC`,
            [userId]
        );

        return result.rows;
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
    }
};

export default Booking;
