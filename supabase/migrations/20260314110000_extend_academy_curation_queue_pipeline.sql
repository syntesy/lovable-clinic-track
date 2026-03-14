-- Estende academy_curation_queue para suportar o pipeline completo de descoberta automática:
--
-- Fluxo:
--   watchlist-run → PubMed → [pending]
--   pre-filter IA (Haiku) → [awaiting_review | auto_rejected]
--   Gate 1 (admin)        → [approved | rejected]
--   academy-generate-curation → [curating → curated]
--
-- Adiciona:
--   1. Status expandido (awaiting_review, auto_rejected, approved, curating)
--   2. Colunas de pre-filter IA (relevance_score, reasoning, study_type_hint, is_human_hint, area_hint)
--   3. Colunas de Gate 1 (approved_by, approved_at, rejection_reason)
--   4. Vínculo com academy_papers após aprovação (paper_id)
--   5. Índices para a fila do Gate 1


-- ============================================================
-- 1. Remover constraint de status existente e recriar expandida
-- ============================================================

ALTER TABLE public.academy_curation_queue
  DROP CONSTRAINT IF EXISTS academy_curation_queue_status_check;

ALTER TABLE public.academy_curation_queue
  ADD CONSTRAINT academy_curation_queue_status_check
  CHECK (status IN (
    'pending',           -- recém-inserido pela watchlist, aguardando pre-filter
    'processing',        -- pre-filter IA em andamento
    'awaiting_review',   -- passou no pre-filter (score >= threshold), aguarda Gate 1
    'auto_rejected',     -- rejeitado automaticamente pelo pre-filter (score baixo)
    'approved',          -- aprovado pelo admin no Gate 1, importação em andamento
    'curating',          -- curadoria IA em andamento
    'curated',           -- curadoria concluída, aguarda revisão humana (Gate 2)
    'rejected',          -- rejeitado pelo admin (Gate 1 ou Gate 2)
    'error'              -- erro em qualquer etapa do pipeline
  ));


-- ============================================================
-- 2. Colunas de pre-filter IA
-- ============================================================

ALTER TABLE public.academy_curation_queue
  ADD COLUMN IF NOT EXISTS relevance_score    numeric(3,1)
    CHECK (relevance_score >= 0 AND relevance_score <= 10),
  ADD COLUMN IF NOT EXISTS relevance_reasoning text,
  ADD COLUMN IF NOT EXISTS study_type_hint    text
    CHECK (study_type_hint IN ('meta','systematic_review','rct','cohort','case_control',
                                'case_series','animal','in_vitro','other')),
  ADD COLUMN IF NOT EXISTS is_human_hint      boolean,
  ADD COLUMN IF NOT EXISTS area_hint          text
    CHECK (area_hint IN ('PRP','PRF','PPP','BMP','Outro'));


-- ============================================================
-- 3. Colunas de Gate 1 (aprovação humana)
-- ============================================================

ALTER TABLE public.academy_curation_queue
  ADD COLUMN IF NOT EXISTS approved_by      uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at      timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;


-- ============================================================
-- 4. Vínculo com academy_papers após importação
-- ============================================================

ALTER TABLE public.academy_curation_queue
  ADD COLUMN IF NOT EXISTS paper_id uuid
    REFERENCES public.academy_papers(id) ON DELETE SET NULL;


-- ============================================================
-- 5. Índices para a fila do Gate 1
-- ============================================================

-- Fila principal do Gate 1: artigos aguardando revisão, os mais recentes primeiro
CREATE INDEX IF NOT EXISTS idx_acq_awaiting_review
  ON public.academy_curation_queue (created_at DESC)
  WHERE status = 'awaiting_review';

-- Ordenação por score dentro da fila (score alto = revisar primeiro)
CREATE INDEX IF NOT EXISTS idx_acq_relevance_score
  ON public.academy_curation_queue (relevance_score DESC)
  WHERE status = 'awaiting_review';

-- Lookup de paper criado a partir da queue
CREATE INDEX IF NOT EXISTS idx_acq_paper_id
  ON public.academy_curation_queue (paper_id)
  WHERE paper_id IS NOT NULL;


-- ============================================================
-- 6. Comentários
-- ============================================================

COMMENT ON COLUMN public.academy_curation_queue.relevance_score IS
  'Score 0–10 de relevância para o REGHEN, calculado pelo pre-filter (Claude Haiku).';

COMMENT ON COLUMN public.academy_curation_queue.relevance_reasoning IS
  'Raciocínio do pre-filter IA sobre a relevância do artigo para ortobiológicos.';

COMMENT ON COLUMN public.academy_curation_queue.study_type_hint IS
  'Tipo de estudo identificado pelo pre-filter: meta, systematic_review, rct, cohort, '
  'case_control, case_series, animal, in_vitro, other.';

COMMENT ON COLUMN public.academy_curation_queue.is_human_hint IS
  'True se o pre-filter identificou estudo conduzido em humanos.';

COMMENT ON COLUMN public.academy_curation_queue.area_hint IS
  'Área terapêutica principal identificada: PRP, PRF, PPP, BMP, Outro.';

COMMENT ON COLUMN public.academy_curation_queue.approved_by IS
  'UUID do admin que aprovou o artigo no Gate 1 para iniciar curadoria.';

COMMENT ON COLUMN public.academy_curation_queue.approved_at IS
  'Timestamp da aprovação no Gate 1.';

COMMENT ON COLUMN public.academy_curation_queue.rejection_reason IS
  'Motivo de rejeição informado pelo admin no Gate 1 (ou pelo admin de curadoria no Gate 2).';

COMMENT ON COLUMN public.academy_curation_queue.paper_id IS
  'ID do paper criado em academy_papers após aprovação no Gate 1. '
  'Null enquanto o artigo ainda não foi importado.';
