-- Migration: Add categories, seat tiers, and event configuration tables
-- Run this with: psql -U postgres -d event_ticketing -f migration.sql

-- 1. Add price and category columns to events table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'price') THEN
        ALTER TABLE events ADD COLUMN price DECIMAL(10,2) DEFAULT 500;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'category') THEN
        ALTER TABLE events ADD COLUMN category VARCHAR(100) DEFAULT 'Entertainment';
    END IF;
END $$;

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(100),
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create seat_tiers table
CREATE TABLE IF NOT EXISTS seat_tiers (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    row_start INTEGER NOT NULL,
    row_end INTEGER NOT NULL,
    color VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create event_config table
CREATE TABLE IF NOT EXISTS event_config (
    id SERIAL PRIMARY KEY,
    event_id INTEGER UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    seat_rows INTEGER DEFAULT 10,
    seat_columns INTEGER DEFAULT 14,
    max_seats_per_booking INTEGER DEFAULT 8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed categories data
INSERT INTO categories (id, name, description, color, icon, display_order) VALUES
    ('music', 'Music', 'Live concerts, festivals, and music events', 'from-purple-500 to-pink-500', 'Music', 1),
    ('sports', 'Sports', 'Sporting events, matches, and tournaments', 'from-green-500 to-emerald-500', 'Trophy', 2),
    ('comedy', 'Comedy', 'Stand-up shows and comedy nights', 'from-yellow-500 to-orange-500', 'Laugh', 3),
    ('tech', 'Tech', 'Tech conferences, workshops, and meetups', 'from-blue-500 to-cyan-500', 'Laptop', 4),
    ('kids', 'Kids', 'Family-friendly events and activities', 'from-pink-500 to-rose-500', 'Baby', 5),
    ('entertainment', 'Entertainment', 'Shows, exhibitions, and other entertainment', 'from-indigo-500 to-purple-500', 'Theater', 6)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    display_order = EXCLUDED.display_order;

-- 6. Update existing events with categories based on their names
UPDATE events SET category = 'tech' WHERE LOWER(name) LIKE '%tech%' OR LOWER(name) LIKE '%conference%';
UPDATE events SET category = 'music' WHERE LOWER(name) LIKE '%music%' OR LOWER(name) LIKE '%festival%' OR LOWER(name) LIKE '%concert%';
UPDATE events SET category = 'sports' WHERE LOWER(name) LIKE '%sports%' OR LOWER(name) LIKE '%championship%';
UPDATE events SET category = 'entertainment' WHERE LOWER(name) LIKE '%art%' OR LOWER(name) LIKE '%exhibition%';

-- 7. Create default seat tiers for all existing events
INSERT INTO seat_tiers (event_id, name, price, row_start, row_end, color)
SELECT id, 'VIP', 1500, 1, 2, 'from-amber-500 to-yellow-500' FROM events
WHERE NOT EXISTS (SELECT 1 FROM seat_tiers WHERE seat_tiers.event_id = events.id);

INSERT INTO seat_tiers (event_id, name, price, row_start, row_end, color)
SELECT id, 'Premium', 1000, 3, 5, 'from-purple-500 to-pink-500' FROM events
WHERE NOT EXISTS (SELECT 1 FROM seat_tiers WHERE seat_tiers.event_id = events.id AND seat_tiers.name = 'Premium');

INSERT INTO seat_tiers (event_id, name, price, row_start, row_end, color)
SELECT id, 'Standard', 500, 6, 10, 'from-blue-500 to-cyan-500' FROM events
WHERE NOT EXISTS (SELECT 1 FROM seat_tiers WHERE seat_tiers.event_id = events.id AND seat_tiers.name = 'Standard');

-- 8. Create default event config for all existing events
INSERT INTO event_config (event_id, seat_rows, seat_columns, max_seats_per_booking)
SELECT id, 10, 14, 8 FROM events
WHERE NOT EXISTS (SELECT 1 FROM event_config WHERE event_config.event_id = events.id);

-- Done! Output summary
SELECT 'Migration completed!' AS status;
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Seat Tiers: ' || COUNT(*) FROM seat_tiers;
SELECT 'Event Configs: ' || COUNT(*) FROM event_config;
