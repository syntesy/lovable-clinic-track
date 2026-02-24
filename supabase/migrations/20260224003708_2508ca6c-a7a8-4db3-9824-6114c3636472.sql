
-- 1) academy_paper_revisions (append-only versioning)
CREATE TABLE public.academy_paper_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.academy_papers(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  curation_data jsonb,
  warnings jsonb,
  tags_norm jsonb,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_paper_revisions_paper ON public.academy_paper_revisions(paper_id);
CREATE INDEX idx_paper_revisions_created ON public.academy_paper_revisions(created_at DESC);

ALTER TABLE public.academy_paper_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read revisions" ON public.academy_paper_revisions
  FOR SELECT TO authenticated
  USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "Admin can insert revisions" ON public.academy_paper_revisions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- Append-only triggers
CREATE OR REPLACE FUNCTION public.prevent_paper_revision_update()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  RAISE EXCEPTION 'academy_paper_revisions is append-only. UPDATE not allowed.';
END; $$;

CREATE OR REPLACE FUNCTION public.prevent_paper_revision_delete()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  RAISE EXCEPTION 'academy_paper_revisions is append-only. DELETE not allowed.';
END; $$;

CREATE TRIGGER trg_prevent_paper_revision_update
  BEFORE UPDATE ON public.academy_paper_revisions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_paper_revision_update();

CREATE TRIGGER trg_prevent_paper_revision_delete
  BEFORE DELETE ON public.academy_paper_revisions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_paper_revision_delete();

-- 2) Add char_start/char_end + fingerprint
ALTER TABLE public.academy_chunks ADD COLUMN IF NOT EXISTS char_start int;
ALTER TABLE public.academy_chunks ADD COLUMN IF NOT EXISTS char_end int;

ALTER TABLE public.academy_papers ADD COLUMN IF NOT EXISTS fingerprint text UNIQUE;

-- 3) academy_ai_tests table
CREATE TABLE public.academy_ai_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid NOT NULL,
  test_cases jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.academy_ai_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage ai tests" ON public.academy_ai_tests
  FOR ALL TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));
