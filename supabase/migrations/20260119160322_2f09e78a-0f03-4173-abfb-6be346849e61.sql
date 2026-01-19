-- Add new columns to procedure_standard_records for eligibility status
ALTER TABLE public.procedure_standard_records 
ADD COLUMN IF NOT EXISTS clinical_standard_status text NOT NULL DEFAULT 'not_eligible',
ADD COLUMN IF NOT EXISTS clinical_standard_notes text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS is_comparable boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS last_evaluated_at timestamp with time zone;

-- Add constraint for valid status values
ALTER TABLE public.procedure_standard_records
ADD CONSTRAINT valid_clinical_standard_status 
CHECK (clinical_standard_status IN ('eligible', 'eligible_with_penalty', 'not_eligible'));

-- Create unique constraint to prevent multiple records per attendance/procedure
CREATE UNIQUE INDEX IF NOT EXISTS unique_attendance_procedure 
ON public.procedure_standard_records (attendance_id, procedure_type);