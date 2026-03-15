-- Add scientific characterization JSON column to attendance_pathology
-- Stores metadata-driven characterization results (protocol, fields, scientific mappings)
ALTER TABLE attendance_pathology
  ADD COLUMN IF NOT EXISTS characterization_json JSONB DEFAULT NULL;
