-- Create table for patient evaluation reports
CREATE TABLE public.patient_evaluation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  report_content JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),
  professional_name TEXT,
  professional_registration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_evaluation_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Healthcare professionals can view patient reports"
ON public.patient_evaluation_reports
FOR SELECT
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert patient reports"
ON public.patient_evaluation_reports
FOR INSERT
WITH CHECK (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update patient reports"
ON public.patient_evaluation_reports
FOR UPDATE
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete patient reports"
ON public.patient_evaluation_reports
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_patient_evaluation_reports_patient_id ON public.patient_evaluation_reports(patient_id);
CREATE INDEX idx_patient_evaluation_reports_generated_at ON public.patient_evaluation_reports(generated_at DESC);