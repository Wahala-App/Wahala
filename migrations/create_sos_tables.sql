-- Create SOS feature tables
-- Run this SQL in your Supabase SQL editor

-- sos_recipients: stores which emails receive SOS for each user
CREATE TABLE IF NOT EXISTS sos_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uid TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_uid, recipient_email)
);

CREATE INDEX IF NOT EXISTS idx_sos_recipients_user_uid ON sos_recipients(user_uid);
CREATE INDEX IF NOT EXISTS idx_sos_recipients_recipient_email ON sos_recipients(recipient_email);

-- sos_events: stores each SOS trigger
CREATE TABLE IF NOT EXISTS sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_uid TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT DEFAULT 'SOS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_events_sender_uid ON sos_events(sender_uid);
CREATE INDEX IF NOT EXISTS idx_sos_events_created_at ON sos_events(created_at DESC);
