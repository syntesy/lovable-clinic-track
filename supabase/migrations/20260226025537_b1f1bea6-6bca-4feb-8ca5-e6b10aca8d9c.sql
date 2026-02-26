
-- Create academy_paper_curation table
CREATE TABLE IF NOT EXISTS public.academy_paper_curation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID NOT NULL REFERENCES public.academy_papers(id) ON DELETE CASCADE,
  curation_json JSONB NOT NULL,
  nivel_evidencia TEXT,
  score_metodologico INTEGER,
  risco_vies TEXT,
  request_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_paper_curation UNIQUE (paper_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_curation_paper_id ON public.academy_paper_curation(paper_id);
CREATE INDEX IF NOT EXISTS idx_curation_nivel_evidencia ON public.academy_paper_curation(nivel_evidencia);
CREATE INDEX IF NOT EXISTS idx_curation_score_metodologico ON public.academy_paper_curation(score_metodologico);

-- RLS
ALTER TABLE public.academy_paper_curation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Academy admins can manage curations"
  ON public.academy_paper_curation
  FOR ALL
  USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "Authenticated users can read curations"
  ON public.academy_paper_curation
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
