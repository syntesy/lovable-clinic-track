-- Add new fields to treatment_sessions table
ALTER TABLE treatment_sessions
ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS light_type text,
ADD COLUMN IF NOT EXISTS treatment_time numeric,
ADD COLUMN IF NOT EXISTS pharmaceutical_used text,
ADD COLUMN IF NOT EXISTS associated_techniques text;