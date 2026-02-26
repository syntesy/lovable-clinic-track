
-- ============================================
-- EVIDENCE ENGINE: Mappings + Aggregates
-- ============================================

-- A) MAPPINGS: pathology_key × intervention_key → matching rules
CREATE TABLE public.academy_evidence_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pathology_key TEXT NOT NULL,
  intervention_key TEXT NOT NULL,
  synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags_required JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pathology_key, intervention_key)
);

CREATE INDEX idx_evidence_mappings_pathology ON public.academy_evidence_mappings(pathology_key);
CREATE INDEX idx_evidence_mappings_intervention ON public.academy_evidence_mappings(intervention_key);

-- B) AGGREGATES: cached recommendation per pathology×intervention
CREATE TABLE public.academy_evidence_aggregates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pathology_key TEXT NOT NULL,
  intervention_key TEXT NOT NULL,
  papers_count INT NOT NULL DEFAULT 0,
  best_level_evidence TEXT,
  average_method_score NUMERIC(4,2),
  average_evidence_score NUMERIC(5,2),
  consistency_score NUMERIC(4,2) NOT NULL DEFAULT 0,
  recommendation_strength TEXT NOT NULL DEFAULT 'insufficient',
  confidence_level TEXT NOT NULL DEFAULT 'low',
  direction_summary TEXT NOT NULL DEFAULT 'unknown',
  top_paper_ids UUID[] NOT NULL DEFAULT '{}',
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pathology_key, intervention_key)
);

CREATE INDEX idx_evidence_aggregates_pathology ON public.academy_evidence_aggregates(pathology_key);
CREATE INDEX idx_evidence_aggregates_intervention ON public.academy_evidence_aggregates(intervention_key);
CREATE INDEX idx_evidence_aggregates_strength ON public.academy_evidence_aggregates(recommendation_strength);

-- RLS for mappings
ALTER TABLE public.academy_evidence_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read mappings"
  ON public.academy_evidence_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage mappings"
  ON public.academy_evidence_mappings FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()));

-- RLS for aggregates
ALTER TABLE public.academy_evidence_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read aggregates"
  ON public.academy_evidence_aggregates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage aggregates"
  ON public.academy_evidence_aggregates FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()));

-- Seed 2 example mappings
INSERT INTO public.academy_evidence_mappings (pathology_key, intervention_key, synonyms, tags_required) VALUES
  ('knee_osteoarthritis', 'prp', 
   '["platelet-rich plasma", "PRP", "plasma rico em plaquetas", "platelet plasma concentrate"]'::jsonb,
   '["osteoarthritis", "knee", "artrose", "joelho"]'::jsonb),
  ('knee_osteoarthritis', 'corticosteroid_injection',
   '["corticosteroid", "corticoide", "cortisone injection", "infiltração de corticoide"]'::jsonb,
   '["osteoarthritis", "knee", "artrose", "joelho"]'::jsonb);
