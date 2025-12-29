-- Create table for patient procedures
CREATE TABLE public.patient_procedures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    procedure_type TEXT NOT NULL,
    procedure_name TEXT NOT NULL,
    procedure_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Enable RLS
ALTER TABLE public.patient_procedures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Healthcare professionals can view patient procedures"
ON public.patient_procedures
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'professional')
    )
);

CREATE POLICY "Healthcare professionals can insert patient procedures"
ON public.patient_procedures
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'professional')
    )
);

CREATE POLICY "Healthcare professionals can update patient procedures"
ON public.patient_procedures
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'professional')
    )
);

CREATE POLICY "Healthcare professionals can delete patient procedures"
ON public.patient_procedures
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'professional')
    )
);

-- Create index for better performance
CREATE INDEX idx_patient_procedures_patient_id ON public.patient_procedures(patient_id);
CREATE INDEX idx_patient_procedures_procedure_date ON public.patient_procedures(procedure_date DESC);