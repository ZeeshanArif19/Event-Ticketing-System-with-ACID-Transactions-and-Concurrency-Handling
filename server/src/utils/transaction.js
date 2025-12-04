import { getClient } from '../config/db.js';
import logger from './logger.js';

/**
 * Execute a callback within a database transaction
 * @param {Function} callback - Async function that receives the client
 * @returns {Promise} Result from callback
 */
export const withTransaction = async (callback) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        logger.transaction('Transaction started');

        const result = await callback(client);

        await client.query('COMMIT');
        logger.transaction('Transaction committed');

        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.transaction('Transaction rolled back', { error: error.message });
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Execute a callback within a SERIALIZABLE transaction
 * This provides the highest isolation level to prevent concurrency issues
 * @param {Function} callback - Async function that receives the client
 * @returns {Promise} Result from callback
 */
export const withSerializableTransaction = async (callback) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        logger.transaction('SERIALIZABLE transaction started');

        const result = await callback(client);

        await client.query('COMMIT');
        logger.transaction('SERIALIZABLE transaction committed');

        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.transaction('SERIALIZABLE transaction rolled back', { error: error.message });
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Retry a function on serialization failure
 * @param {Function} fn - Async function to retry
 * @param {Number} maxRetries - Maximum number of retries (default: 5)
 * @returns {Promise} Result from function
 */
export const retryOnSerializationFailure = async (fn, maxRetries = 5) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logger.debug(`Attempt ${attempt} of ${maxRetries}`);
            const result = await fn();
            return result;
        } catch (error) {
            lastError = error;

            // Check if this is a serialization failure or deadlock
            const isSerializationError =
                error.code === '40001' || // serialization_failure
                error.code === '40P01' || // deadlock_detected
                error.message.includes('could not serialize');

            if (!isSerializationError) {
                // Not a serialization error, don't retry
                throw error;
            }

            logger.warn(`Serialization failure on attempt ${attempt}`, {
                code: error.code,
                message: error.message
            });

            if (attempt < maxRetries) {
                // Exponential backoff before retry
                const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries exhausted
    logger.error('All retry attempts exhausted', { error: lastError.message });
    throw new Error(`Transaction failed after ${maxRetries} attempts: ${lastError.message}`);
};
