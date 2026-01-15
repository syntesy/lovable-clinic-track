-- Performance indexes for clinical_records lookup
-- These ensure fast queries by attendance_id and patient_id

-- Index for attendance_id (partial - only non-null values, matching use pattern)
CREATE INDEX IF NOT EXISTS idx_clinical_records_attendance_id_perf
ON public.clinical_records (attendance_id)
WHERE attendance_id IS NOT NULL;

-- Index for patient_id (frequently queried for patient history)
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient_id
ON public.clinical_records (patient_id);

-- Composite index for common query pattern: patient + created_at (for history)
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient_created
ON public.clinical_records (patient_id, created_at DESC);