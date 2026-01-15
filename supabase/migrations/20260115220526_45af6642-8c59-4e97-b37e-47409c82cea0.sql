-- Add attendance_id column to clinical_records for proper FK relationship
ALTER TABLE public.clinical_records 
ADD COLUMN attendance_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL;

-- Create unique constraint to prevent duplicate prontuários per atendimento
-- Using UNIQUE on attendance_id allows one prontuário per attendance
-- NULL values are allowed (for legacy records without attendance)
CREATE UNIQUE INDEX idx_clinical_records_attendance_unique 
ON public.clinical_records (attendance_id) 
WHERE attendance_id IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX idx_clinical_records_attendance_id 
ON public.clinical_records (attendance_id) 
WHERE attendance_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.clinical_records.attendance_id IS 'FK to attendance_sessions. Unique per attendance to prevent duplicate prontuários.';