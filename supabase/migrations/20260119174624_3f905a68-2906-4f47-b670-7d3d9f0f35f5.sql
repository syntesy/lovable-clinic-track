-- Add is_synthetic column to key tables for safe QA data management
-- This enables explicit identification of synthetic test data

-- 1. Add is_synthetic to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS is_synthetic boolean DEFAULT false;

-- 2. Add is_synthetic to attendance_sessions table  
ALTER TABLE public.attendance_sessions
ADD COLUMN IF NOT EXISTS is_synthetic boolean DEFAULT false;

-- 3. Add is_synthetic to procedure_standard_records table
ALTER TABLE public.procedure_standard_records
ADD COLUMN IF NOT EXISTS is_synthetic boolean DEFAULT false;

-- 4. Add is_synthetic to prp_protocol_core table
ALTER TABLE public.prp_protocol_core
ADD COLUMN IF NOT EXISTS is_synthetic boolean DEFAULT false;

-- 5. Add is_synthetic to co_interventions_core table
ALTER TABLE public.co_interventions_core
ADD COLUMN IF NOT EXISTS is_synthetic boolean DEFAULT false;

-- 6. Add is_synthetic to patient_reported_outcomes table
ALTER TABLE public.patient_reported_outcomes
ADD COLUMN IF NOT EXISTS is_synthetic boolean DEFAULT false;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_patients_is_synthetic ON public.patients(is_synthetic) WHERE is_synthetic = true;
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_is_synthetic ON public.attendance_sessions(is_synthetic) WHERE is_synthetic = true;
CREATE INDEX IF NOT EXISTS idx_procedure_standard_records_is_synthetic ON public.procedure_standard_records(is_synthetic) WHERE is_synthetic = true;
CREATE INDEX IF NOT EXISTS idx_prp_protocol_core_is_synthetic ON public.prp_protocol_core(is_synthetic) WHERE is_synthetic = true;
CREATE INDEX IF NOT EXISTS idx_co_interventions_core_is_synthetic ON public.co_interventions_core(is_synthetic) WHERE is_synthetic = true;
CREATE INDEX IF NOT EXISTS idx_patient_reported_outcomes_is_synthetic ON public.patient_reported_outcomes(is_synthetic) WHERE is_synthetic = true;