import logger from './logger.js';

/**
 * Lock a seat row for update (pessimistic locking)
 * Uses SELECT ... FOR UPDATE to ensure exclusive lock
 * @param {Object} client - PostgreSQL client
 * @param {Number} seatId - Seat ID to lock
 * @returns {Promise<Object>} Locked seat row
 */
export const lockSeatForUpdate = async (client, seatId) => {
    logger.debug(`Locking seat ${seatId} for update`);

    const result = await client.query(
        'SELECT * FROM seats WHERE id = $1 FOR UPDATE',
        [seatId]
    );

    if (result.rows.length === 0) {
        throw new Error('Seat not found');
    }

    return result.rows[0];
};

/**
 * Check if a seat is available for booking
 * @param {Object} client - PostgreSQL client
 * @param {Number} seatId - Seat ID to check
 * @returns {Promise<Boolean>} True if available
 */
export const checkSeatAvailability = async (client, seatId) => {
    const result = await client.query(
        'SELECT is_booked FROM seats WHERE id = $1',
        [seatId]
    );

    if (result.rows.length === 0) {
        throw new Error('Seat not found');
    }

    return !result.rows[0].is_booked;
};

/**
 * Update seat using optimistic locking (version check)
 * @param {Object} client - PostgreSQL client
 * @param {Number} seatId - Seat ID
 * @param {Number} expectedVersion - Expected version number
 * @returns {Promise<Object>} Updated seat or null if version mismatch
 */
export const optimisticLockUpdate = async (client, seatId, expectedVersion) => {
    logger.debug(`Optimistic lock update for seat ${seatId}, version ${expectedVersion}`);

    const result = await client.query(
        `UPDATE seats 
     SET is_booked = TRUE, version = version + 1 
     WHERE id = $1 AND version = $2 AND is_booked = FALSE
     RETURNING *`,
        [seatId, expectedVersion]
    );

    if (result.rows.length === 0) {
        // Either seat doesn't exist, version mismatch, or already booked
        logger.warn(`Optimistic lock failed for seat ${seatId}`);
        return null;
    }

    return result.rows[0];
};

/**
 * Update seat using pessimistic locking (already locked with FOR UPDATE)
 * @param {Object} client - PostgreSQL client
 * @param {Number} seatId - Seat ID
 * @returns {Promise<Object>} Updated seat
 */
export const pessimisticLockUpdate = async (client, seatId) => {
    logger.debug(`Pessimistic lock update for seat ${seatId}`);

    const result = await client.query(
        `UPDATE seats 
     SET is_booked = TRUE, version = version + 1 
     WHERE id = $1 AND is_booked = FALSE
     RETURNING *`,
        [seatId]
    );

    if (result.rows.length === 0) {
        throw new Error('Seat is already booked or does not exist');
    }

    return result.rows[0];
};
