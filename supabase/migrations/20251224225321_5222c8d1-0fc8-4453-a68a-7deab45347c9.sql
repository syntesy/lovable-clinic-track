
-- Criar enums para níveis estruturados
CREATE TYPE evidence_level AS ENUM (
  'ia', 'ib', 'iia', 'iib', 'iii', 'iv', 'v'
);

CREATE TYPE bias_risk AS ENUM (
  'baixo', 'moderado', 'alto', 'muito_alto', 'incerto'
);

CREATE TYPE applicability AS ENUM (
  'alta', 'moderada', 'baixa', 'muito_baixa', 'nao_aplicavel'
);

CREATE TYPE curation_status AS ENUM (
  'rascunho', 'em_revisao', 'aprovada', 'disponivel', 'rejeitada', 'arquivada'
);

-- Criar tabela de curadorias estruturadas
CREATE TABLE public.curations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.curadoria_articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status curation_status NOT NULL DEFAULT 'rascunho',
  
  -- Metadados de governança
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Estrutura PICO
  objective TEXT,
  design TEXT,
  population TEXT,
  sample_size TEXT,
  intervention TEXT,
  comparator TEXT,
  
  -- Resultados
  outcomes_primary TEXT,
  outcomes_secondary TEXT,
  results_key TEXT,
  
  -- Análise crítica
  adverse_events TEXT,
  limitations TEXT,
  authors_conclusion TEXT,
  
  -- Classificações estruturadas
  evidence_level evidence_level,
  bias_risk bias_risk,
  applicability applicability,
  
  -- Aplicação clínica
  clinical_takeaways TEXT[], -- Array de até 3 bullets
  what_changes_in_practice TEXT,
  
  -- Citações estruturadas
  citations JSONB DEFAULT '[]'::jsonb,
  
  -- Constraint para garantir versão única por artigo
  CONSTRAINT unique_article_version UNIQUE (article_id, version)
);

-- Índices para performance
CREATE INDEX idx_curations_article_id ON public.curations(article_id);
CREATE INDEX idx_curations_status ON public.curations(status);
CREATE INDEX idx_curations_created_by ON public.curations(created_by);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_curations_updated_at
  BEFORE UPDATE ON public.curations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.curations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Todos podem ver curadorias disponíveis
CREATE POLICY "Curadorias disponíveis são públicas"
  ON public.curations
  FOR SELECT
  USING (status = 'disponivel');

-- Usuários autenticados podem ver suas próprias curadorias
CREATE POLICY "Usuários veem suas próprias curadorias"
  ON public.curations
  FOR SELECT
  USING (auth.uid() = created_by);

-- Admins podem ver todas as curadorias
CREATE POLICY "Admins veem todas as curadorias"
  ON public.curations
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Usuários autenticados podem criar curadorias
CREATE POLICY "Usuários autenticados criam curadorias"
  ON public.curations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas o criador pode atualizar rascunhos
CREATE POLICY "Criador atualiza rascunhos"
  ON public.curations
  FOR UPDATE
  USING (auth.uid() = created_by AND status IN ('rascunho', 'em_revisao'));

-- Admins podem atualizar qualquer curadoria (para aprovar/publicar)
CREATE POLICY "Admins atualizam qualquer curadoria"
  ON public.curations
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem deletar curadorias
CREATE POLICY "Admins deletam curadorias"
  ON public.curations
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
