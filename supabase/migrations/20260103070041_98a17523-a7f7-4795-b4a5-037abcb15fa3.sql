-- Add patient self-declaration fields to procedure_followups
ALTER TABLE public.procedure_followups 
ADD COLUMN IF NOT EXISTS patient_self_declaration boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS patient_self_declaration_at timestamptz;