
-- Cleanup failed partial migration if needed
DROP TABLE IF EXISTS public.academy_ai_logs;
DROP TABLE IF EXISTS public.academy_papers;
DROP TYPE IF EXISTS public.paper_curation_status;
DROP TYPE IF EXISTS public.paper_import_source;

-- ============================================
-- MÓDULO 1: academy_papers
-- ============================================
CREATE TYPE public.paper_curation_status AS ENUM ('draft', 'curating', 'ready', 'published', 'rejected', 'archived');
CREATE TYPE public.paper_import_source AS ENUM ('pmid', 'doi', 'manual');

CREATE TABLE public.academy_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pmid TEXT,
  doi TEXT,
  title TEXT NOT NULL,
  authors TEXT,
  journal TEXT,
  year INTEGER,
  abstract_text TEXT,
  mesh_terms TEXT[],
  import_source public.paper_import_source NOT NULL DEFAULT 'manual',
  import_payload JSONB,
  curation_status public.paper_curation_status NOT NULL DEFAULT 'draft',
  curation_data JSONB,
  warnings TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL,
  curated_by UUID,
  published_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_pmid UNIQUE (pmid),
  CONSTRAINT unique_doi UNIQUE (doi)
);

CREATE INDEX idx_academy_papers_curation_status ON public.academy_papers (curation_status);
CREATE INDEX idx_academy_papers_created_by ON public.academy_papers (created_by);
CREATE INDEX idx_academy_papers_year ON public.academy_papers (year);

CREATE TRIGGER set_academy_papers_updated_at
  BEFORE UPDATE ON public.academy_papers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.academy_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_papers_admin_all"
  ON public.academy_papers FOR ALL TO authenticated
  USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "academy_papers_teacher_select"
  ON public.academy_papers FOR SELECT TO authenticated
  USING (
    public.has_academy_role(auth.uid(), 'teacher_approved')
    AND curation_status IN ('draft', 'ready', 'published')
    AND deleted_at IS NULL
  );

CREATE POLICY "academy_papers_student_select"
  ON public.academy_papers FOR SELECT TO authenticated
  USING (curation_status = 'published' AND deleted_at IS NULL);

-- ============================================
-- MÓDULO 3: academy_ai_logs
-- ============================================
CREATE TABLE public.academy_ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  paper_id UUID REFERENCES public.academy_papers(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  citations JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  duration_ms INTEGER,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_ai_logs_paper_id ON public.academy_ai_logs (paper_id);
CREATE INDEX idx_academy_ai_logs_user_id ON public.academy_ai_logs (user_id);
CREATE INDEX idx_academy_ai_logs_action ON public.academy_ai_logs (action);
CREATE INDEX idx_academy_ai_logs_created_at ON public.academy_ai_logs (created_at DESC);

ALTER TABLE public.academy_ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_ai_logs_admin_select"
  ON public.academy_ai_logs FOR SELECT TO authenticated
  USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "academy_ai_logs_insert"
  ON public.academy_ai_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_academy_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.prevent_academy_ai_log_update()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN RAISE EXCEPTION 'academy_ai_logs is append-only. UPDATE not allowed.'; END; $$;

CREATE OR REPLACE FUNCTION public.prevent_academy_ai_log_delete()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN RAISE EXCEPTION 'academy_ai_logs is append-only. DELETE not allowed.'; END; $$;

CREATE TRIGGER prevent_academy_ai_logs_update
  BEFORE UPDATE ON public.academy_ai_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_academy_ai_log_update();

CREATE TRIGGER prevent_academy_ai_logs_delete
  BEFORE DELETE ON public.academy_ai_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_academy_ai_log_delete();
