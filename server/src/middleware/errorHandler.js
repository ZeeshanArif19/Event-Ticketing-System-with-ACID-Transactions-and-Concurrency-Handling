import logger from '../utils/logger.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // PostgreSQL errors
    if (err.code) {
        switch (err.code) {
            case '23505': // unique_violation
                return res.status(409).json({ error: 'Duplicate entry' });
            case '23503': // foreign_key_violation
                return res.status(400).json({ error: 'Invalid reference' });
            case '40001': // serialization_failure
                return res.status(409).json({ error: 'Transaction conflict, please retry' });
            case '40P01': // deadlock_detected
                return res.status(409).json({ error: 'Deadlock detected, please retry' });
            default:
                logger.error('Database error code:', err.code);
        }
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal server error'
    });
};
