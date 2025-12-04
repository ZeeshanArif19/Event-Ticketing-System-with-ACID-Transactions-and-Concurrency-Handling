-- Migration: Add booking reference and total amount to bookings table
-- This allows grouping multiple seats under a single booking

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_reference') THEN
        ALTER TABLE bookings ADD COLUMN booking_reference VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_amount') THEN
        ALTER TABLE bookings ADD COLUMN total_amount DECIMAL(10,2);
    END IF;
END $$;

-- Create index on booking_reference for faster grouping queries
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);

SELECT 'Migration completed: booking_reference and total_amount columns added' AS status;
