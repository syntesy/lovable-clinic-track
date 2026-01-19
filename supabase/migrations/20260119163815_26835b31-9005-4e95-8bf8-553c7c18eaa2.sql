-- Create enum for outcome timepoints
DO $$ BEGIN
  CREATE TYPE outcome_timepoint AS ENUM ('baseline', 'm1', 'm3', 'm6', 'm12');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for function scale types
DO $$ BEGIN
  CREATE TYPE function_scale_type AS ENUM ('WOMAC', 'KOOS', 'ODI', 'NDI', 'DASH', 'VISA_A', 'OUTRA');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create patient_reported_outcomes table
CREATE TABLE IF NOT EXISTS public.patient_reported_outcomes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  procedure_standard_record_id uuid REFERENCES public.procedure_standard_records(id) ON DELETE SET NULL,
  timepoint text NOT NULL CHECK (timepoint IN ('baseline', 'm1', 'm3', 'm6', 'm12')),
  pain_score integer CHECK (pain_score >= 0 AND pain_score <= 10),
  function_scale_type text CHECK (function_scale_type IN ('WOMAC', 'KOOS', 'ODI', 'NDI', 'DASH', 'VISA_A', 'OUTRA')),
  function_score numeric,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Unique constraint: one outcome per timepoint per attendance
  CONSTRAINT unique_attendance_timepoint UNIQUE (attendance_id, timepoint)
);

-- Enable RLS
ALTER TABLE public.patient_reported_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Users can view outcomes" ON public.patient_reported_outcomes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert outcomes" ON public.patient_reported_outcomes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update outcomes" ON public.patient_reported_outcomes
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_outcomes_attendance ON public.patient_reported_outcomes(attendance_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_procedure ON public.patient_reported_outcomes(procedure_standard_record_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_timepoint ON public.patient_reported_outcomes(timepoint);

-- Composite index for dashboard aggregations
CREATE INDEX IF NOT EXISTS idx_outcomes_procedure_timepoint 
ON public.patient_reported_outcomes(procedure_standard_record_id, timepoint) 
WHERE procedure_standard_record_id IS NOT NULL;