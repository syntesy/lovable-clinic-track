-- Create EPI protocols table
CREATE TABLE public.epi_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  protocol_name TEXT NOT NULL,
  injury_region TEXT,
  specific_tissue TEXT,
  needle_type TEXT,
  current_intensity NUMERIC,
  application_time NUMERIC,
  technique TEXT,
  session_frequency TEXT,
  total_sessions INTEGER,
  clinical_observations TEXT,
  contraindications TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.epi_protocols ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view EPI protocols" 
ON public.epi_protocols 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert EPI protocols" 
ON public.epi_protocols 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update EPI protocols" 
ON public.epi_protocols 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete EPI protocols" 
ON public.epi_protocols 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_epi_protocols_updated_at
BEFORE UPDATE ON public.epi_protocols
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create Ortobiologicos protocols table
CREATE TABLE public.ortobiologicos_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  protocol_name TEXT NOT NULL,
  therapy_type TEXT NOT NULL,
  collection_method TEXT,
  processing_method TEXT,
  volume_collected NUMERIC,
  volume_applied NUMERIC,
  application_site TEXT,
  injection_technique TEXT,
  associated_therapies TEXT,
  session_frequency TEXT,
  total_sessions INTEGER,
  clinical_observations TEXT,
  contraindications TEXT,
  pre_procedure_exams TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ortobiologicos_protocols ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view Ortobiologicos protocols" 
ON public.ortobiologicos_protocols 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert Ortobiologicos protocols" 
ON public.ortobiologicos_protocols 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update Ortobiologicos protocols" 
ON public.ortobiologicos_protocols 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete Ortobiologicos protocols" 
ON public.ortobiologicos_protocols 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_ortobiologicos_protocols_updated_at
BEFORE UPDATE ON public.ortobiologicos_protocols
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();