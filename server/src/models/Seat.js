import { query } from '../config/db.js';
import { lockSeatForUpdate, optimisticLockUpdate, pessimisticLockUpdate } from '../utils/locking.js';

const Seat = {
    /**
     * Get all seats for an event
     * @param {Number} eventId - Event ID
     * @returns {Promise<Array>} Array of seats
     */
    findByEventId: async (eventId) => {
        const result = await query(
            'SELECT * FROM seats WHERE event_id = $1 ORDER BY seat_number ASC',
            [eventId]
        );
        return result.rows;
    },

    /**
     * Get seat by ID
     * @param {Number} seatId - Seat ID
     * @returns {Promise<Object|null>} Seat object or null
     */
    findById: async (seatId) => {
        const result = await query(
            'SELECT * FROM seats WHERE id = $1',
            [seatId]
        );
        return result.rows[0] || null;
    },

    /**
     * Lock seat for update (pessimistic locking)
     * @param {Object} client - PostgreSQL client
     * @param {Number} seatId - Seat ID
     * @returns {Promise<Object>} Locked seat
     */
    lockForUpdate: async (client, seatId) => {
        return await lockSeatForUpdate(client, seatId);
    },

    /**
     * Book seat using pessimistic locking
     * @param {Object} client - PostgreSQL client
     * @param {Number} seatId - Seat ID
     * @returns {Promise<Object>} Updated seat
     */
    bookSeat: async (client, seatId) => {
        return await pessimisticLockUpdate(client, seatId);
    },

    /**
     * Book seat using optimistic locking
     * @param {Object} client - PostgreSQL client
     * @param {Number} seatId - Seat ID
     * @param {Number} version - Expected version
     * @returns {Promise<Object|null>} Updated seat or null if failed
     */
    optimisticBookSeat: async (client, seatId, version) => {
        return await optimisticLockUpdate(client, seatId, version);
    }
};

export default Seat;
