import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { query } from './db.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup database schema and seed data
 */
async function setupDatabase() {
    try {
        logger.info('Starting database setup...');

        // Read and execute schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        logger.info('Executing schema...');
        await query(schema);
        logger.info('✓ Schema created successfully');

        // Seed sample data
        logger.info('Seeding sample data...');

        // Create sample users
        const bcrypt = await import('bcrypt');
        const password1 = await bcrypt.hash('password123', 10);
        const password2 = await bcrypt.hash('testuser123', 10);

        await query(
            `INSERT INTO users (email, password_hash, name) VALUES 
       ($1, $2, $3),
       ($4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
            ['john@example.com', password1, 'John Doe',
                'jane@example.com', password2, 'Jane Smith']
        );
        logger.info('✓ Sample users created');

        // Create sample events with partitions
        const events = [
            {
                name: 'Tech Conference 2024',
                description: 'Annual technology conference featuring the latest innovations',
                venue: 'Tech Center, San Francisco',
                event_date: '2024-06-15 09:00:00',
                total_seats: 50,
                image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
            },
            {
                name: 'Music Festival Summer',
                description: 'Three-day music festival with top artists',
                venue: 'Central Park, New York',
                event_date: '2024-07-20 18:00:00',
                total_seats: 100,
                image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'
            },
            {
                name: 'Art Exhibition Opening',
                description: 'Grand opening of contemporary art exhibition',
                venue: 'Modern Art Gallery, Chicago',
                event_date: '2024-05-10 19:00:00',
                total_seats: 30,
                image_url: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800'
            },
            {
                name: 'Sports Championship Finals',
                description: 'Championship finals - don\'t miss the action!',
                venue: 'National Stadium, Los Angeles',
                event_date: '2024-08-05 14:00:00',
                total_seats: 75,
                image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800'
            }
        ];

        for (const event of events) {
            const result = await query(
                `INSERT INTO events (name, description, venue, event_date, total_seats, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
                [event.name, event.description, event.venue, event.event_date, event.total_seats, event.image_url]
            );

            const eventId = result.rows[0].id;

            // Create partition for this event (LIST partitioning)
            await query(`CREATE TABLE IF NOT EXISTS seats_event_${eventId} PARTITION OF seats FOR VALUES IN (${eventId})`);
            logger.info(`✓ Created partition for event ${eventId}`);

            // Generate seats
            const seatValues = [];
            const seatParams = [];
            let paramIndex = 1;

            for (let i = 1; i <= event.total_seats; i++) {
                const row = String.fromCharCode(65 + Math.floor((i - 1) / 10)); // A, B, C, etc.
                const col = ((i - 1) % 10) + 1;
                const seatNumber = `${row}${col}`;

                seatValues.push(`($${paramIndex}, $${paramIndex + 1})`);
                seatParams.push(eventId, seatNumber);
                paramIndex += 2;
            }

            await query(
                `INSERT INTO seats (event_id, seat_number) VALUES ${seatValues.join(', ')}`,
                seatParams
            );

            logger.info(`✓ Created ${event.total_seats} seats for \"${event.name}\"`);
        }

        logger.info('✓ Database setup completed successfully!');
        logger.info('\n📋 Sample credentials:');
        logger.info('  Email: john@example.com, Password: password123');
        logger.info('  Email: jane@example.com, Password: testuser123');

    } catch (error) {
        logger.error('Database setup failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run setup
setupDatabase();
