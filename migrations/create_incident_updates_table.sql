-- Create incident_updates table for storing live updates on incidents
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES location_pins(id) ON DELETE CASCADE,
  creator_uid UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  body TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_key DATE NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_created_at ON incident_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_updates_date_key ON incident_updates(date_key);

-- Add update_count column to location_pins if it doesn't exist
ALTER TABLE location_pins 
ADD COLUMN IF NOT EXISTS update_count INTEGER DEFAULT 0;

-- Create a function to increment update_count (optional, for atomic updates)
CREATE OR REPLACE FUNCTION increment_update_count(incident_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE location_pins
  SET update_count = COALESCE(update_count, 0) + 1
  WHERE id = incident_id_param;
END;
$$ LANGUAGE plpgsql;
