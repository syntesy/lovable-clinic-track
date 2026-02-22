
-- Index for PRP OA KL1 cohort queries on attendance_pathology
CREATE INDEX IF NOT EXISTS idx_ap_confirmed_structural 
ON public.attendance_pathology (attendance_id, structural_model, structural_grade)
WHERE diagnosis_stage = 'CONFIRMED';

-- Index for procedure type filtering
CREATE INDEX IF NOT EXISTS idx_psr_attendance_procedure_type
ON public.procedure_standard_records (attendance_id, procedure_type);

-- Composite index on PRO for attendance + timepoint (already has unique but adding clinic for scoped queries)
CREATE INDEX IF NOT EXISTS idx_pro_attendance_timepoint_clinic
ON public.patient_reported_outcomes (attendance_id, timepoint, clinic_id);
