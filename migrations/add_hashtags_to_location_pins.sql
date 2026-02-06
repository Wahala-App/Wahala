-- Add hashtags column to location_pins for tracking report hashtags
-- Run this SQL in your Supabase SQL editor

ALTER TABLE location_pins 
ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';
