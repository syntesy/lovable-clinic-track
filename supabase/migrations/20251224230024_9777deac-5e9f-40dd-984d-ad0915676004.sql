
-- Adicionar campo practice_impact (renomear what_changes_in_practice)
ALTER TABLE public.curations 
ADD COLUMN IF NOT EXISTS practice_impact TEXT;

-- Copiar dados existentes
UPDATE public.curations 
SET practice_impact = what_changes_in_practice 
WHERE practice_impact IS NULL AND what_changes_in_practice IS NOT NULL;

-- Adicionar campo design como enum para tipos de estudo
CREATE TYPE study_design AS ENUM (
  'rct', 'cohort', 'case_control', 'case_series', 
  'systematic_review', 'meta_analysis', 'observational', 'other'
);

-- Adicionar coluna design_type com enum
ALTER TABLE public.curations 
ADD COLUMN IF NOT EXISTS design_type study_design;

-- Criar tabela de histórico de versões
CREATE TABLE IF NOT EXISTS public.curation_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  curation_id UUID NOT NULL REFERENCES public.curations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status curation_status NOT NULL,
  data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_reason TEXT,
  CONSTRAINT unique_curation_version UNIQUE (curation_id, version_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_curation_versions_curation_id ON public.curation_versions(curation_id);

-- Enable RLS
ALTER TABLE public.curation_versions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para curation_versions
CREATE POLICY "Admins podem ver todas as versões"
  ON public.curation_versions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir versões"
  ON public.curation_versions
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Atualizar enum curation_status para incluir em_producao se não existir
DO $$
BEGIN
  -- Verificar se em_producao já existe
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'em_producao' AND enumtypid = 'curation_status'::regtype) THEN
    ALTER TYPE curation_status ADD VALUE 'em_producao' AFTER 'rascunho';
  END IF;
END$$;

-- Adicionar campo approval_declaration para rastreabilidade
ALTER TABLE public.curations 
ADD COLUMN IF NOT EXISTS approval_declaration BOOLEAN DEFAULT false;

-- Adicionar campo rejection_reason para indeferimentos
ALTER TABLE public.curations 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
