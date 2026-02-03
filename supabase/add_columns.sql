-- Add new columns for requester details
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS requester_name TEXT,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Verify columns are added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings';
