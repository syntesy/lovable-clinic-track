-- ============================================
-- MIGRAÇÃO: Adicionar campos clínicos faltantes à tabela clinical_records
-- Objetivo: Criar fonte única para os 4 campos obrigatórios
-- ============================================

-- Adicionar chief_complaint e physical_exam à tabela clinical_records
ALTER TABLE public.clinical_records
ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
ADD COLUMN IF NOT EXISTS physical_exam TEXT,
ADD COLUMN IF NOT EXISTS clinical_diagnosis TEXT,
ADD COLUMN IF NOT EXISTS legacy_migrated_at TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN public.clinical_records.chief_complaint IS 'Queixa principal do paciente - Fonte única';
COMMENT ON COLUMN public.clinical_records.physical_exam IS 'Exame físico - Fonte única';
COMMENT ON COLUMN public.clinical_records.clinical_diagnosis IS 'Diagnóstico clínico - Fonte única (substituindo patients.clinical_diagnosis)';
COMMENT ON COLUMN public.clinical_records.legacy_migrated_at IS 'Timestamp da migração de dados legados de prp_screenings';