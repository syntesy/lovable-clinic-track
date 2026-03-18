-- Add biological_soil_data JSONB column to attendance_sessions
-- This stores the full structured biological soil evaluation data
-- (distinct from biological_soil_flags_json which stores only boolean flags)

ALTER TABLE attendance_sessions
  ADD COLUMN IF NOT EXISTS biological_soil_data JSONB DEFAULT NULL;

COMMENT ON COLUMN attendance_sessions.biological_soil_data IS
  'Structured biological soil evaluation: hematological, inflammatory, metabolic, nutritional markers + lifestyle/safety flags';
