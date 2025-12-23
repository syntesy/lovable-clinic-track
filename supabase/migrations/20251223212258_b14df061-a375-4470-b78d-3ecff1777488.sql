-- Add columns for exam results to treatment_sessions table
ALTER TABLE public.treatment_sessions
ADD COLUMN IF NOT EXISTS hemoglobin numeric NULL,
ADD COLUMN IF NOT EXISTS hematocrit numeric NULL,
ADD COLUMN IF NOT EXISTS platelets numeric NULL,
ADD COLUMN IF NOT EXISTS leukocytes numeric NULL,
ADD COLUMN IF NOT EXISTS pcr numeric NULL,
ADD COLUMN IF NOT EXISTS glucose numeric NULL,
ADD COLUMN IF NOT EXISTS hba1c numeric NULL,
ADD COLUMN IF NOT EXISTS exam_observations text NULL,
ADD COLUMN IF NOT EXISTS aptitude_status text NULL,
ADD COLUMN IF NOT EXISTS selected_protocols text[] NULL;