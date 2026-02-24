
ALTER TABLE public.academy_papers
ADD COLUMN IF NOT EXISTS evidence_score_breakdown JSONB DEFAULT NULL;

COMMENT ON COLUMN public.academy_papers.evidence_score_breakdown IS 'Transparent breakdown of evidence score derived from Reghen Evidence Method™ 7 layers';
