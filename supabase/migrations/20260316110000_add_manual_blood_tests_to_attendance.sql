-- Add manual_blood_tests JSONB column to attendance_sessions
-- Stores manually entered lab values for Plaquetas, Hemoglobina, Leucócitos,
-- Hematócrito, PCR, Ferritina, Glicemia entered during the attendance flow

ALTER TABLE attendance_sessions
  ADD COLUMN IF NOT EXISTS manual_blood_tests JSONB DEFAULT NULL;

COMMENT ON COLUMN attendance_sessions.manual_blood_tests IS
  'Manually entered blood test values: {platelets, hemoglobin, leukocytes, hematocrit, crp, ferritin, glucose, collected_at}';
