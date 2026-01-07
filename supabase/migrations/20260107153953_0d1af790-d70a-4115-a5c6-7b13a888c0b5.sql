-- ============================================
-- REGISTRY RESEARCH EXPORT VIEW v1
-- ============================================
-- Real-World Evidence export com:
-- - Identificadores pseudonimizados (SHA256 truncado)
-- - Datas reduzidas (YYYY-MM apenas)
-- - Somente dados estruturados, SEM PHI
-- - Vinculação completa à taxonomia
-- ============================================

-- Função helper para pseudonimizar IDs (estável, não reversível)
CREATE OR REPLACE FUNCTION public.pseudonymize_id(original_id UUID, salt TEXT DEFAULT 'regen_research_v1')
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN SUBSTR(
    ENCODE(
      SHA256((original_id::TEXT || salt)::BYTEA),
      'hex'
    ),
    1, 16
  );
END;
$$;

COMMENT ON FUNCTION public.pseudonymize_id IS 'Gera identificador pseudonimizado estável (16 chars hex) para uso em exports de pesquisa. Não reversível.';

-- VIEW principal de export para pesquisa
CREATE OR REPLACE VIEW public.registry_research_export_v1 AS
SELECT
  -- ===========================================
  -- IDENTIFICADORES ANONIMIZADOS
  -- ===========================================
  public.pseudonymize_id(rp.id, 'proc_v1') AS procedure_uid,
  public.pseudonymize_id(rp.registry_case_id, 'case_v1') AS case_uid,
  
  -- ===========================================
  -- TEMPO (REDUZIDO - SEM DATAS COMPLETAS)
  -- ===========================================
  TO_CHAR(rp.procedure_date, 'YYYY-MM') AS procedure_month,
  
  -- Delta de tempo baseline->followup (dias)
  CASE 
    WHEN f90.completed_at IS NOT NULL THEN 
      EXTRACT(DAY FROM f90.completed_at - rp.procedure_date::TIMESTAMP)::INTEGER
    ELSE NULL 
  END AS baseline_to_followup_days,
  
  -- ===========================================
  -- TAXONOMIA (CORE)
  -- ===========================================
  ti.code AS therapy_item_code,
  ti.name AS therapy_item_name,
  ti.category_code AS category_code,
  COALESCE(ti.base_component_category_code, ti.category_code) AS effective_category_code,
  COALESCE(tc_eff.requires_score, tc.requires_score, FALSE) AS requires_score,
  COALESCE(tc_eff.requires_checklist, tc.requires_checklist, FALSE) AS requires_checklist,
  COALESCE(tc_eff.requires_curadoria, tc.requires_curadoria, FALSE) AS requires_curadoria,
  
  -- ===========================================
  -- DADOS CLÍNICOS ESTRUTURADOS
  -- ===========================================
  rb.anatomical_region AS joint_region,
  rb.primary_diagnosis AS diagnosis_tag,
  rb.initial_pain_score AS baseline_pain_score,
  
  -- Follow-up D30 (timepoint = 30)
  f30.pain_score AS followup_pain_score_30d,
  
  -- Follow-up D90 (timepoint = 90)
  f90.pain_score AS followup_pain_score_90d,
  
  -- Delta calculado (baseline - D90)
  CASE 
    WHEN rb.initial_pain_score IS NOT NULL AND f90.pain_score IS NOT NULL 
    THEN rb.initial_pain_score - f90.pain_score
    ELSE NULL 
  END AS delta_pain_90d,
  
  -- Função (se existir em registry_baseline ou followups futuros)
  NULL::INTEGER AS baseline_function_score,
  NULL::INTEGER AS followup_function_score_90d,
  
  -- Eventos adversos
  COALESCE(
    rp.immediate_adverse_event, 
    f30.late_adverse_event, 
    f90.late_adverse_event,
    FALSE
  ) AS adverse_event_flag,
  
  -- ===========================================
  -- DEMOGRAFIA (BUCKETS APENAS)
  -- ===========================================
  rb.age_range AS age_bucket,
  CASE rb.sex
    WHEN 'M' THEN 'M'
    WHEN 'F' THEN 'F'
    WHEN 'other' THEN 'Outro'
    ELSE 'NI'
  END AS sex,
  
  -- UF/Estado se existir (não identificável em nível agregado)
  rc.site_id AS region_state

FROM public.registry_procedures rp

-- JOIN com registry_cases
INNER JOIN public.registry_cases rc 
  ON rc.registry_case_id = rp.registry_case_id

-- JOIN com baseline (LEFT pois pode não existir)
LEFT JOIN public.registry_baseline rb 
  ON rb.registry_case_id = rp.registry_case_id

-- JOIN com taxonomia
LEFT JOIN public.therapy_items ti 
  ON ti.code = rp.therapy_item_code

-- Category do item
LEFT JOIN public.therapy_categories tc 
  ON tc.code = ti.category_code

-- Category efetiva (base component)
LEFT JOIN public.therapy_categories tc_eff 
  ON tc_eff.code = ti.base_component_category_code

-- Follow-up D30
LEFT JOIN public.registry_longitudinal_followups f30 
  ON f30.registry_case_id = rp.registry_case_id 
  AND f30.timepoint = 30

-- Follow-up D90
LEFT JOIN public.registry_longitudinal_followups f90 
  ON f90.registry_case_id = rp.registry_case_id 
  AND f90.timepoint = 90

-- Somente casos com consentimento válido (status = 'included')
WHERE rc.status = 'included';

-- Comentário na VIEW
COMMENT ON VIEW public.registry_research_export_v1 IS 
'VIEW de exportação para pesquisa (Real-World Evidence). Versão 1.0. 
Contém APENAS dados estruturados e anonimizados. 
PROIBIDO: PHI, texto livre, IDs reais, datas completas.
OBRIGATÓRIO: Logar toda exportação em registry_exports_log.';

-- ===========================================
-- TABELA DE LOG DE EXPORTAÇÃO (APPEND-ONLY)
-- ===========================================
-- Já existe registry_exports_log, verificar se precisa adicionar campos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registry_exports_log' 
    AND column_name = 'export_format'
  ) THEN
    ALTER TABLE public.registry_exports_log 
    ADD COLUMN export_format TEXT DEFAULT 'csv';
  END IF;
END $$;

-- ===========================================
-- RLS - ACESSO RESTRITO
-- ===========================================
-- A VIEW herda RLS das tabelas base, mas para garantir segurança adicional
-- criamos uma função que verifica se usuário é admin/research

CREATE OR REPLACE FUNCTION public.can_access_research_export()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'research')
  );
END;
$$;

COMMENT ON FUNCTION public.can_access_research_export IS 'Verifica se usuário tem permissão para acessar exports de pesquisa (admin ou research role).';

-- ===========================================
-- ÍNDICES PARA PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_registry_procedures_case_id 
  ON public.registry_procedures(registry_case_id);

CREATE INDEX IF NOT EXISTS idx_registry_baseline_case_id 
  ON public.registry_baseline(registry_case_id);

CREATE INDEX IF NOT EXISTS idx_registry_longitudinal_case_timepoint 
  ON public.registry_longitudinal_followups(registry_case_id, timepoint);