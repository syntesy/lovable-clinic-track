-- Create table for patient discharges
CREATE TABLE IF NOT EXISTS public.patient_discharges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  discharge_date date NOT NULL DEFAULT CURRENT_DATE,
  discharge_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(patient_id)
);

-- Enable RLS
ALTER TABLE public.patient_discharges ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Enable all operations for all users" 
ON public.patient_discharges 
FOR ALL 
USING (true);