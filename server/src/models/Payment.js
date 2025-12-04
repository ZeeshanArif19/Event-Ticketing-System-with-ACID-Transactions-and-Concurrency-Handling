import logger from '../utils/logger.js';

const Payment = {
    /**
     * Create a payment record within a transaction
     * @param {Object} client - PostgreSQL client
     * @param {Number} bookingId - Booking ID
     * @param {Number} amount - Payment amount
     * @returns {Promise<Object>} Created payment
     */
    create: async (client, bookingId, amount) => {
        const result = await client.query(
            `INSERT INTO payments (booking_id, amount, status) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
            [bookingId, amount, 'pending']
        );

        return result.rows[0];
    },

    /**
     * Simulate payment processing (100% success rate for testing)
     * IMPORTANT: This must be called within the same transaction
     * so that the booking can be rolled back if payment fails
     * @returns {Promise<Boolean>} True if payment succeeded
     */
    simulatePayment: async () => {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // 100% success rate for testing (change to 0.7 for 70% in production)
        const success = Math.random() < 1.0;

        logger.info(`Payment simulation: ${success ? 'SUCCESS' : 'FAILED'}`);

        return success;
    },

    /**
     * Update payment status
     * @param {Object} client - PostgreSQL client
     * @param {Number} paymentId - Payment ID
     * @param {String} status - New status (success/failed)
     * @returns {Promise<Object>} Updated payment
     */
    updateStatus: async (client, paymentId, status) => {
        const result = await client.query(
            'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *',
            [status, paymentId]
        );

        return result.rows[0];
    }
};

export default Payment;
