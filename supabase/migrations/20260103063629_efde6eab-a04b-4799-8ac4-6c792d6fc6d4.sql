-- Add treatment_adherence column to procedure_followups
ALTER TABLE public.procedure_followups 
ADD COLUMN IF NOT EXISTS treatment_adherence text;

-- Add check constraint for valid values
ALTER TABLE public.procedure_followups 
ADD CONSTRAINT procedure_followups_treatment_adherence_check 
CHECK (treatment_adherence IS NULL OR treatment_adherence IN ('full', 'partial', 'none'));

-- Add column comment for documentation
COMMENT ON COLUMN public.procedure_followups.treatment_adherence IS 'Patient self-reported treatment adherence: full, partial, or none';