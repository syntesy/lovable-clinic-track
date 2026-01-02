-- Migração: Reestruturação do fluxo REGENAPP - Máquina de Estados
-- Adiciona campos para suportar o fluxo S0 → S1 → S2 → S3

-- 1. Campo de status do caso (máquina de estados)
ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS regen_case_status TEXT DEFAULT 'S0' 
CHECK (regen_case_status IN ('S0', 'S1', 'S2', 'S3'));

-- 2. Campos de triagem (secretária/paciente)
ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS triage_completed_at TIMESTAMP WITH TIME ZONE;

-- 3. Campos de avaliação clínica profissional
ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS clinical_chief_complaint TEXT; -- Queixa Principal

ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS clinical_anamnesis TEXT; -- Anamnese

ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS clinical_physical_exam TEXT; -- Exame Físico

ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS clinical_diagnosis TEXT; -- Diagnóstico

ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS clinical_assessment_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS clinical_assessment_by TEXT; -- user_id do profissional

-- 4. Campos de exames laboratoriais estruturados
ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS labs_validated JSONB; -- Exames validados pelo DIE

ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS labs_collected_date DATE; -- Data de coleta

-- 5. Campo para rastreamento de mudanças (stale detection)
ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS canonical_updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS engine_computed_at TIMESTAMP WITH TIME ZONE;

-- 6. Hash do canonical para detecção de mudanças
ALTER TABLE public.prp_screenings 
ADD COLUMN IF NOT EXISTS canonical_hash TEXT;

-- 7. Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_prp_screenings_regen_case_status 
ON public.prp_screenings(regen_case_status);

-- 8. Índice para busca por paciente + status
CREATE INDEX IF NOT EXISTS idx_prp_screenings_patient_status 
ON public.prp_screenings(patient_id, regen_case_status);

-- Comentário explicativo
COMMENT ON COLUMN public.prp_screenings.regen_case_status IS 
'Estado do caso REGENAPP: S0=Triagem Concluída, S1=Avaliação Clínica Concluída, S2=Exames Completos, S3=Score Definitivo Gerado';