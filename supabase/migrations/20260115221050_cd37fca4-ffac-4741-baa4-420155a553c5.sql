-- Fix FK constraint: add proper ON DELETE CASCADE behavior
-- First drop the existing constraint and recreate with CASCADE
ALTER TABLE public.clinical_records 
DROP CONSTRAINT IF EXISTS clinical_records_attendance_id_fkey;

ALTER TABLE public.clinical_records
ADD CONSTRAINT clinical_records_attendance_id_fkey 
FOREIGN KEY (attendance_id) 
REFERENCES public.attendance_sessions(id) 
ON DELETE CASCADE;

-- Note: We keep attendance_id as nullable to support legacy records
-- New records created via the service ALWAYS have attendance_id set
-- The unique constraint already only applies to non-null values