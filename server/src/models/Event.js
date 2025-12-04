import { query, getClient } from '../config/db.js';
import logger from '../utils/logger.js';

const Event = {
    /**
     * Get all events
     * @returns {Promise<Array>} Array of events
     */
    findAll: async () => {
        const result = await query(
            'SELECT * FROM events ORDER BY event_date ASC'
        );
        return result.rows;
    },

    /**
     * Get event by ID
     * @param {Number} id - Event ID
     * @returns {Promise<Object|null>} Event object or null
     */
    findById: async (id) => {
        const result = await query(
            'SELECT * FROM events WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Create a new event
     * @param {Object} eventData - Event data
     * @returns {Promise<Object>} Created event
     */
    create: async (eventData) => {
        const { name, description, venue, event_date, total_seats, image_url } = eventData;

        const result = await query(
            `INSERT INTO events (name, description, venue, event_date, total_seats, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
            [name, description, venue, event_date, total_seats, image_url]
        );

        return result.rows[0];
    },

    /**
     * Create event with seats (creates partition and inserts seats)
     * @param {Object} eventData - Event data
     * @param {Number} seatCount - Number of seats to generate
     * @returns {Promise<Object>} Created event with seats
     */
    createWithSeats: async (eventData, seatCount) => {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Create event
            const { name, description, venue, event_date, total_seats, image_url } = eventData;
            const eventResult = await client.query(
                `INSERT INTO events (name, description, venue, event_date, total_seats, image_url) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
                [name, description, venue, event_date, total_seats, image_url]
            );

            const event = eventResult.rows[0];

            // Create partition for this event using LIST partitioning
            await client.query(
                `CREATE TABLE IF NOT EXISTS seats_event_${event.id} 
         PARTITION OF seats FOR VALUES IN (${event.id})`
            );

            logger.info(`Created partition seats_event_${event.id}`);

            // Generate seats
            const seatValues = [];
            const seatParams = [];
            let paramIndex = 1;

            for (let i = 1; i <= seatCount; i++) {
                const seatNumber = `${String.fromCharCode(65 + Math.floor((i - 1) / 10))}${((i - 1) % 10) + 1}`;
                seatValues.push(`($${paramIndex}, $${paramIndex + 1})`);
                seatParams.push(event.id, seatNumber);
                paramIndex += 2;
            }

            if (seatValues.length > 0) {
                await client.query(
                    `INSERT INTO seats (event_id, seat_number) VALUES ${seatValues.join(', ')}`,
                    seatParams
                );
                logger.info(`Created ${seatCount} seats for event ${event.id}`);
            }

            await client.query('COMMIT');

            return event;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error creating event with seats:', error);
            throw error;
        } finally {
            client.release();
        }
    }
};

export default Event;
