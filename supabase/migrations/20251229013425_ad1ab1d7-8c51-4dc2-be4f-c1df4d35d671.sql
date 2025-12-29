-- Drop the existing constraint and add new one with updated prescription types
ALTER TABLE public.patient_prescriptions 
DROP CONSTRAINT IF EXISTS patient_prescriptions_prescription_type_check;

ALTER TABLE public.patient_prescriptions 
ADD CONSTRAINT patient_prescriptions_prescription_type_check 
CHECK (prescription_type IN ('cuidados_gerais', 'medicacoes', 'suplementacoes', 'alimentar', 'medicamentosa', 'suplementar', 'orientacoes'));