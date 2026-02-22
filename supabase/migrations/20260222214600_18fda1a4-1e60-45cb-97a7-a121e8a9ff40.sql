
-- Add diagnosis_stage column to attendance_pathology
ALTER TABLE public.attendance_pathology 
ADD COLUMN IF NOT EXISTS diagnosis_stage text NOT NULL DEFAULT 'SUSPECTED';

-- Add observation field for the hypothesis stage
ALTER TABLE public.attendance_pathology 
ADD COLUMN IF NOT EXISTS clinical_observation text;

-- Add check constraint for valid values
ALTER TABLE public.attendance_pathology 
ADD CONSTRAINT chk_diagnosis_stage CHECK (diagnosis_stage IN ('SUSPECTED', 'CONFIRMED'));
