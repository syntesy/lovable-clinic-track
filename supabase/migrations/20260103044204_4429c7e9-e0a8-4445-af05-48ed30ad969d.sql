-- =========================================================
-- REGENAPP EVIDENCE ENGINE™ - PHASE 2
-- Camada de agregação descritiva sobre o Clinical Registry™
-- =========================================================

-- Constante K_MIN para k-anonymity (será usada em RLS)
-- K_MIN = 10

-- =========================================================
-- 1. EVIDENCE DIMENSIONS
-- Representa o eixo Patologia × Técnica (Região opcional)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.evidence_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathology_tag TEXT NOT NULL,
  technique_tag TEXT NOT NULL,
  region_tag TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice único para evitar duplicatas (UPPER+TRIM já aplicado antes de inserir)
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_dimensions_unique 
ON public.evidence_dimensions (pathology_tag, technique_tag, COALESCE(region_tag, ''));

CREATE INDEX IF NOT EXISTS idx_evidence_dimensions_pathology ON public.evidence_dimensions(pathology_tag);
CREATE INDEX IF NOT EXISTS idx_evidence_dimensions_technique ON public.evidence_dimensions(technique_tag);

COMMENT ON TABLE public.evidence_dimensions IS 'REGENAPP Evidence Engine™ - Dimensões de agregação (Patologia × Técnica)';

-- =========================================================
-- 2. EVIDENCE SNAPSHOTS (APPEND-ONLY)
-- Snapshots versionados de métricas agregadas
-- =========================================================
CREATE TABLE IF NOT EXISTS public.evidence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL REFERENCES public.evidence_dimensions(id) ON DELETE CASCADE,
  time_window TEXT NOT NULL CHECK (time_window IN ('all_time', 'last_12_months')),
  
  -- Contagens obrigatórias
  n_cases_total INTEGER NOT NULL,
  n_with_followup_30 INTEGER NOT NULL DEFAULT 0,
  n_with_followup_90 INTEGER NOT NULL DEFAULT 0,
  n_with_followup_180 INTEGER NOT NULL DEFAULT 0,
  n_with_followup_365 INTEGER NOT NULL DEFAULT 0,
  
  -- Métricas opcionais (NULL se não calculáveis)
  pain_baseline_mean NUMERIC(5,2) DEFAULT NULL,
  pain_baseline_median NUMERIC(5,2) DEFAULT NULL,
  pain_followup_90_mean NUMERIC(5,2) DEFAULT NULL,
  pain_followup_90_median NUMERIC(5,2) DEFAULT NULL,
  pct_improved_90 NUMERIC(5,2) DEFAULT NULL,
  
  -- Governança
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL,
  canonical_hash TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_dimension ON public.evidence_snapshots(dimension_id);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_time_window ON public.evidence_snapshots(time_window);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_computed_at ON public.evidence_snapshots(computed_at DESC);

-- Índice para buscar versão mais recente
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_version ON public.evidence_snapshots(dimension_id, time_window, version DESC);

COMMENT ON TABLE public.evidence_snapshots IS 'REGENAPP Evidence Engine™ - Snapshots versionados de métricas agregadas (APPEND-ONLY)';

-- =========================================================
-- 3. CURATION REGISTRY LINKS
-- Vínculo entre curadoria científica e dimensões de evidência
-- =========================================================
CREATE TABLE IF NOT EXISTS public.curation_registry_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curation_id UUID NOT NULL REFERENCES public.curations(id) ON DELETE CASCADE,
  dimension_id UUID NOT NULL REFERENCES public.evidence_dimensions(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('supports', 'contextual', 'exploratory')) DEFAULT 'contextual',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID DEFAULT NULL,
  
  UNIQUE(curation_id, dimension_id)
);

CREATE INDEX IF NOT EXISTS idx_curation_registry_links_curation ON public.curation_registry_links(curation_id);
CREATE INDEX IF NOT EXISTS idx_curation_registry_links_dimension ON public.curation_registry_links(dimension_id);

COMMENT ON TABLE public.curation_registry_links IS 'REGENAPP Evidence Engine™ - Vínculo curadoria ↔ evidência agregada';

-- =========================================================
-- 4. EVIDENCE AUDIT LOG
-- =========================================================
CREATE TABLE IF NOT EXISTS public.evidence_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'snapshot_computed',
    'dimension_created',
    'link_created',
    'link_updated',
    'link_deleted',
    'batch_started',
    'batch_completed'
  )),
  user_id UUID DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_audit_log_type ON public.evidence_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_evidence_audit_log_created ON public.evidence_audit_log(created_at DESC);

COMMENT ON TABLE public.evidence_audit_log IS 'REGENAPP Evidence Engine™ - Audit trail de operações';

-- =========================================================
-- 5. ROW LEVEL SECURITY
-- =========================================================

-- Enable RLS on all Evidence Engine tables
ALTER TABLE public.evidence_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curation_registry_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_audit_log ENABLE ROW LEVEL SECURITY;

-- evidence_dimensions: todos podem ler
CREATE POLICY "evidence_dimensions_select_all" 
ON public.evidence_dimensions 
FOR SELECT 
USING (true);

-- evidence_dimensions: somente service role pode inserir/atualizar
CREATE POLICY "evidence_dimensions_insert_service" 
ON public.evidence_dimensions 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- evidence_snapshots: usuários só veem snapshots com N >= K_MIN (10)
CREATE POLICY "evidence_snapshots_select_k_anonymity" 
ON public.evidence_snapshots 
FOR SELECT 
USING (n_cases_total >= 10);

-- evidence_snapshots: somente service role pode inserir (append-only via batch)
CREATE POLICY "evidence_snapshots_insert_service" 
ON public.evidence_snapshots 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- curation_registry_links: todos podem ler
CREATE POLICY "curation_links_select_all" 
ON public.curation_registry_links 
FOR SELECT 
USING (true);

-- curation_registry_links: admins podem gerenciar
CREATE POLICY "curation_links_admin_manage" 
ON public.curation_registry_links 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- evidence_audit_log: somente admins podem ver
CREATE POLICY "evidence_audit_admin_select" 
ON public.evidence_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- evidence_audit_log: somente service role pode inserir
CREATE POLICY "evidence_audit_insert_service" 
ON public.evidence_audit_log 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- =========================================================
-- 6. FUNCTION: Normalizar tag (UPPER + TRIM)
-- =========================================================
CREATE OR REPLACE FUNCTION public.normalize_evidence_tag(tag TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN UPPER(TRIM(COALESCE(tag, '')));
END;
$$;

-- =========================================================
-- 7. FUNCTION: Calcular próxima versão do snapshot
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_next_snapshot_version(
  p_dimension_id UUID,
  p_time_window TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO v_max_version
  FROM public.evidence_snapshots
  WHERE dimension_id = p_dimension_id AND time_window = p_time_window;
  
  RETURN v_max_version + 1;
END;
$$;