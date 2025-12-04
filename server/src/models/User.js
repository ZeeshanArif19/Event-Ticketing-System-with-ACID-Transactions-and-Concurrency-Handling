import bcrypt from 'bcrypt';
import { query } from '../config/db.js';

const User = {
    /**
     * Create a new user
     * @param {String} email - User email
     * @param {String} password - Plain text password
     * @param {String} name - User name
     * @returns {Promise<Object>} Created user
     */
    create: async (email, password, name) => {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const result = await query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
            [email, password_hash, name]
        );

        return result.rows[0];
    },

    /**
     * Find user by email
     * @param {String} email - User email
     * @returns {Promise<Object|null>} User object or null
     */
    findByEmail: async (email) => {
        const result = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        return result.rows[0] || null;
    },

    /**
     * Find user by ID
     * @param {Number} id - User ID
     * @returns {Promise<Object|null>} User object or null
     */
    findById: async (id) => {
        const result = await query(
            'SELECT id, email, name, created_at FROM users WHERE id = $1',
            [id]
        );

        return result.rows[0] || null;
    },

    /**
     * Verify password
     * @param {String} password - Plain text password
     * @param {String} hash - Hashed password
     * @returns {Promise<Boolean>} True if password matches
     */
    verifyPassword: async (password, hash) => {
        return await bcrypt.compare(password, hash);
    }
};

export default User;
