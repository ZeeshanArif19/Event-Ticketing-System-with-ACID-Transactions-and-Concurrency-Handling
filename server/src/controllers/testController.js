import { getClient } from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Simulate concurrent booking attempts
 * This endpoint is for testing concurrency control
 * 
 * Uses Promise.allSettled() with setImmediate() to avoid blocking
 */
export const simulateConcurrentBooking = async (req, res) => {
    try {
        const { seatId, attempts = 200, eventId, userId = 1 } = req.body;

        if (!seatId || !eventId) {
            return res.status(400).json({ error: 'Seat ID and Event ID are required' });
        }

        logger.info(`Starting load test: ${attempts} attempts on seat ${seatId}`);

        const startTime = Date.now();

        // Create array of booking promises
        const bookingPromises = [];

        for (let i = 0; i < attempts; i++) {
            // Wrap each booking in setImmediate to avoid blocking
            const promise = new Promise((resolve) => {
                setImmediate(async () => {
                    const client = await getClient();
                    try {
                        await client.query('BEGIN');
                        await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

                        // Lock the seat
                        const seatResult = await client.query(
                            'SELECT * FROM seats WHERE id = $1 FOR UPDATE',
                            [seatId]
                        );

                        if (seatResult.rows.length === 0) {
                            throw new Error('Seat not found');
                        }

                        const seat = seatResult.rows[0];

                        if (seat.is_booked) {
                            throw new Error('Seat already booked');
                        }

                        // Update seat
                        await client.query(
                            'UPDATE seats SET is_booked = TRUE, version = version + 1 WHERE id = $1',
                            [seatId]
                        );

                        // Create booking
                        await client.query(
                            'INSERT INTO bookings (user_id, event_id, seat_id, status) VALUES ($1, $2, $3, $4)',
                            [userId, eventId, seatId, 'confirmed']
                        );

                        await client.query('COMMIT');
                        resolve({ success: true });
                    } catch (error) {
                        await client.query('ROLLBACK');
                        resolve({ success: false, error: error.message, code: error.code });
                    } finally {
                        client.release();
                    }
                });
            });

            bookingPromises.push(promise);
        }

        // Wait for all attempts to complete
        const results = await Promise.allSettled(bookingPromises);

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Analyze results
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;
        const rejected = results.filter(r => r.status === 'rejected').length;

        // Get error breakdown
        const errorTypes = {};
        results.forEach(r => {
            if (r.status === 'fulfilled' && !r.value.success) {
                const errorMsg = r.value.error || 'Unknown';
                errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
            }
        });

        // Verify seat state
        const finalCheck = await getClient();
        try {
            const seatCheck = await finalCheck.query(
                'SELECT is_booked FROM seats WHERE id = $1',
                [seatId]
            );

            const bookingCount = await finalCheck.query(
                'SELECT COUNT(*) FROM bookings WHERE seat_id = $1',
                [seatId]
            );

            logger.info(`Load test complete: ${successful} successful, ${failed} failed, ${rejected} rejected`);

            res.json({
                summary: {
                    totalAttempts: attempts,
                    successful,
                    failed,
                    rejected,
                    durationMs: duration
                },
                verification: {
                    seatIsBooked: seatCheck.rows[0]?.is_booked || false,
                    totalBookingsCreated: parseInt(bookingCount.rows[0].count)
                },
                errorBreakdown: errorTypes,
                message: bookingCount.rows[0].count <= 1 ?
                    '✓ No overselling detected!' :
                    '✗ WARNING: Overselling detected!'
            });
        } finally {
            finalCheck.release();
        }

    } catch (error) {
        logger.error('Load test error:', error);
        res.status(500).json({ error: 'Load test failed: ' + error.message });
    }
};
