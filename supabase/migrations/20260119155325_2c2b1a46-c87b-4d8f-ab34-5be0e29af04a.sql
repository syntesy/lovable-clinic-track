-- =============================================================================
-- CLINICAL STANDARD ENGINE - CORE DATASET TABLES
-- =============================================================================

-- 1. Main procedure standard record (links to attendance)
CREATE TABLE public.procedure_standard_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  procedure_type TEXT NOT NULL DEFAULT 'PRP',
  pathology TEXT NOT NULL,
  anatomic_region TEXT NOT NULL,
  specific_location TEXT,
  severity_classification TEXT NOT NULL,
  symptom_duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One standardized protocol per attendance
  CONSTRAINT unique_attendance_standard_record UNIQUE (attendance_id)
);

-- 2. PRP Protocol Core data
CREATE TABLE public.prp_protocol_core (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_standard_record_id UUID NOT NULL REFERENCES public.procedure_standard_records(id) ON DELETE CASCADE,
  
  -- Session details
  sessions_count TEXT NOT NULL,
  sessions_interval TEXT NOT NULL,
  volume_per_session_range TEXT NOT NULL,
  
  -- PRP characteristics
  prp_type TEXT NOT NULL,
  prp_activation TEXT NOT NULL,
  activation_method TEXT,
  
  -- Guidance
  imaging_guidance TEXT NOT NULL,
  
  -- Associations
  prp_with_hyaluronic_acid BOOLEAN NOT NULL DEFAULT false,
  hyaluronic_acid_type TEXT,
  
  -- NSAID use
  recent_nsaid_use TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_prp_per_record UNIQUE (procedure_standard_record_id)
);

-- 3. Co-interventions Core data
CREATE TABLE public.co_interventions_core (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_standard_record_id UUID NOT NULL REFERENCES public.procedure_standard_records(id) ON DELETE CASCADE,
  
  exercise_therapy BOOLEAN NOT NULL DEFAULT false,
  shockwave_therapy TEXT NOT NULL DEFAULT 'none',
  epi_associated BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_cointerventions_per_record UNIQUE (procedure_standard_record_id)
);

-- 4. Add flag to attendance_sessions
ALTER TABLE public.attendance_sessions 
ADD COLUMN IF NOT EXISTS has_standardized_procedure BOOLEAN DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.procedure_standard_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prp_protocol_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_interventions_core ENABLE ROW LEVEL SECURITY;

-- RLS Policies for procedure_standard_records
CREATE POLICY "Users can view procedure_standard_records" 
ON public.procedure_standard_records 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create procedure_standard_records" 
ON public.procedure_standard_records 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update procedure_standard_records" 
ON public.procedure_standard_records 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete procedure_standard_records" 
ON public.procedure_standard_records 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for prp_protocol_core
CREATE POLICY "Users can view prp_protocol_core" 
ON public.prp_protocol_core 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create prp_protocol_core" 
ON public.prp_protocol_core 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update prp_protocol_core" 
ON public.prp_protocol_core 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete prp_protocol_core" 
ON public.prp_protocol_core 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for co_interventions_core
CREATE POLICY "Users can view co_interventions_core" 
ON public.co_interventions_core 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create co_interventions_core" 
ON public.co_interventions_core 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update co_interventions_core" 
ON public.co_interventions_core 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete co_interventions_core" 
ON public.co_interventions_core 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_procedure_standard_records_attendance ON public.procedure_standard_records(attendance_id);
CREATE INDEX idx_prp_protocol_core_record ON public.prp_protocol_core(procedure_standard_record_id);
CREATE INDEX idx_co_interventions_core_record ON public.co_interventions_core(procedure_standard_record_id);