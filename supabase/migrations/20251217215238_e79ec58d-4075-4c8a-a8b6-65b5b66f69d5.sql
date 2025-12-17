-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for biological screenings (triagens)
CREATE TABLE public.prp_screenings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  screening_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  questionnaire_responses JSONB NOT NULL,
  analysis_result TEXT,
  classification TEXT CHECK (classification IN ('APTO', 'NAO_APTO_PREPARO', 'CONTRAINDICADO')),
  recommended_exams JSONB,
  patient_orientations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for lab results linked to screenings
CREATE TABLE public.prp_lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  screening_id UUID NOT NULL REFERENCES public.prp_screenings(id) ON DELETE CASCADE,
  lab_values JSONB,
  raw_text TEXT,
  interpretation TEXT,
  updated_classification TEXT CHECK (updated_classification IN ('APTO', 'NAO_APTO_PREPARO', 'CONTRAINDICADO')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prp_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prp_lab_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prp_screenings
CREATE POLICY "Authenticated users can view prp screenings" 
ON public.prp_screenings FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert prp screenings" 
ON public.prp_screenings FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update prp screenings" 
ON public.prp_screenings FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete prp screenings" 
ON public.prp_screenings FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for prp_lab_results
CREATE POLICY "Authenticated users can view prp lab results" 
ON public.prp_lab_results FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert prp lab results" 
ON public.prp_lab_results FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update prp lab results" 
ON public.prp_lab_results FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete prp lab results" 
ON public.prp_lab_results FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_prp_screenings_updated_at
BEFORE UPDATE ON public.prp_screenings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();