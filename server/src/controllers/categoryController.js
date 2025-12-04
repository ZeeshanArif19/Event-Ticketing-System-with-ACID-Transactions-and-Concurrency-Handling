import { query } from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Get all categories
 */
export const getAllCategories = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM categories ORDER BY display_order ASC'
        );
        res.json({ categories: result.rows });
    } catch (error) {
        logger.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

/**
 * Get seat tiers for an event
 */
export const getEventSeatTiers = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM seat_tiers WHERE event_id = $1 ORDER BY row_start ASC',
            [id]
        );
        res.json({ tiers: result.rows });
    } catch (error) {
        logger.error('Error fetching seat tiers:', error);
        res.status(500).json({ error: 'Failed to fetch seat tiers' });
    }
};

/**
 * Get event configuration
 */
export const getEventConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT * FROM event_config WHERE event_id = $1',
            [id]
        );

        // Return default config if none exists
        if (result.rows.length === 0) {
            res.json({
                config: {
                    event_id: parseInt(id),
                    seat_rows: 10,
                    seat_columns: 14,
                    max_seats_per_booking: 8
                }
            });
        } else {
            res.json({ config: result.rows[0] });
        }
    } catch (error) {
        logger.error('Error fetching event config:', error);
        res.status(500).json({ error: 'Failed to fetch event config' });
    }
};
