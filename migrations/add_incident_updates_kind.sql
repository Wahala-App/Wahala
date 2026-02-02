-- Add update kind support (live update vs disprove)
-- Run this SQL in your Supabase SQL editor

ALTER TABLE incident_updates
ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'update';

-- Constrain allowed kinds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'incident_updates_kind_check'
  ) THEN
    ALTER TABLE incident_updates
    ADD CONSTRAINT incident_updates_kind_check
    CHECK (kind IN ('update', 'disprove'));
  END IF;
END $$;

-- Optional: decrement helper to keep location_pins.update_count in sync
CREATE OR REPLACE FUNCTION decrement_update_count(incident_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE location_pins
  SET update_count = GREATEST(COALESCE(update_count, 0) - 1, 0)
  WHERE id = incident_id_param;
END;
$$ LANGUAGE plpgsql;

