-- Event Ticketing System Database Schema
-- PostgreSQL with LIST partitioning for seats table

-- Drop existing tables and partitions
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  venue VARCHAR(255) NOT NULL,
  event_date TIMESTAMP NOT NULL,
  total_seats INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seats table with LIST PARTITIONING by event_id
CREATE TABLE seats (
  id SERIAL,
  event_id INTEGER NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 0,
  locked_at TIMESTAMP,
  locked_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, event_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) PARTITION BY LIST (event_id);

-- Create index on partitioned table
CREATE INDEX idx_seats_event_id ON seats(event_id);
CREATE INDEX idx_seats_seat_number ON seats(seat_number);
CREATE INDEX idx_seats_is_booked ON seats(is_booked);

-- Bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  seat_id INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- Function to create partition for a specific event
-- Usage: SELECT create_seats_partition(1);
CREATE OR REPLACE FUNCTION create_seats_partition(event_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS seats_event_%s PARTITION OF seats FOR VALUES IN (%s)', 
    event_id_param, event_id_param);
END;
$$ LANGUAGE plpgsql;

-- Note: Partitions must be created when events are created
-- Example for first 5 events (will be done in seed script):
-- SELECT create_seats_partition(1);
-- SELECT create_seats_partition(2);
-- etc.
