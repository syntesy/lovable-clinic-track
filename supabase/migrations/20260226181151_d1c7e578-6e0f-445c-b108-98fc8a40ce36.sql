
ALTER TABLE public.academy_paper_curation
  ADD COLUMN IF NOT EXISTS paper_template text NOT NULL DEFAULT 'OTHER',
  ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS data_quality_warnings jsonb NULL DEFAULT '[]'::jsonb;

-- Add check constraint for paper_template values
ALTER TABLE public.academy_paper_curation
  ADD CONSTRAINT academy_paper_curation_paper_template_check
  CHECK (paper_template IN ('CLINICAL_COMPARATIVE', 'REVIEW_CONSENSUS', 'TRANSLATIONAL_PRECLINICAL', 'OTHER'));

-- Create index on paper_template for filtering
CREATE INDEX IF NOT EXISTS idx_academy_paper_curation_paper_template
  ON public.academy_paper_curation(paper_template);
