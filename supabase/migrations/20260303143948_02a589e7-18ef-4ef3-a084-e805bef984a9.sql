
-- 1.2: Add missing columns to academy_papers
ALTER TABLE public.academy_papers
  ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS locked_for_processing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_code text;

-- 1.2: Add missing columns to academy_paper_curation
ALTER TABLE public.academy_paper_curation
  ADD COLUMN IF NOT EXISTS llm_input_hash text,
  ADD COLUMN IF NOT EXISTS llm_output_hash text,
  ADD COLUMN IF NOT EXISTS tokens_used int,
  ADD COLUMN IF NOT EXISTS cost_estimate_usd numeric,
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS model text;

-- 1.1: Create academy_paper_ingestion
CREATE TABLE public.academy_paper_ingestion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid REFERENCES public.academy_papers(id) ON DELETE CASCADE,
  route_used text NOT NULL,
  source_identifier text NOT NULL,
  raw_response_size int,
  parsed_fields jsonb,
  warnings text[],
  error_message text,
  status text NOT NULL DEFAULT 'pending',
  duration_ms int,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.3: Indices
CREATE UNIQUE INDEX idx_academy_papers_unique_doi
  ON public.academy_papers (doi)
  WHERE doi IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX idx_academy_papers_unique_pmid
  ON public.academy_papers (pmid)
  WHERE pmid IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_academy_papers_status ON public.academy_papers (curation_status);
CREATE INDEX idx_academy_papers_created_at ON public.academy_papers (created_at DESC);
CREATE INDEX idx_academy_papers_locked ON public.academy_papers (locked_for_processing) WHERE locked_for_processing = true;

CREATE INDEX idx_academy_paper_ingestion_paper_id ON public.academy_paper_ingestion (paper_id);
CREATE INDEX idx_academy_paper_ingestion_status ON public.academy_paper_ingestion (status);
CREATE INDEX idx_academy_paper_ingestion_created_at ON public.academy_paper_ingestion (created_at DESC);

-- 1.4: RLS for academy_paper_ingestion
ALTER TABLE public.academy_paper_ingestion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Academy admins/teachers can view ingestion logs"
  ON public.academy_paper_ingestion FOR SELECT TO authenticated
  USING (
    public.is_academy_admin(auth.uid())
    OR public.has_academy_role(auth.uid(), 'teacher_approved')
  );

CREATE POLICY "Academy admins can insert ingestion logs"
  ON public.academy_paper_ingestion FOR INSERT TO authenticated
  WITH CHECK (
    public.is_academy_admin(auth.uid())
    AND created_by = auth.uid()
  );
