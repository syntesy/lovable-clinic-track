-- ============================================
-- PARTE 2: Policies, Dicionário e Log Append-Only
-- ============================================

-- 1) POLICY para acesso de pesquisa na registry_cases
DROP POLICY IF EXISTS "Research export access" ON public.registry_cases;

CREATE POLICY "Research export access"
  ON public.registry_cases
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'research')
    OR professional_id = auth.uid()
  );

-- ============================================
-- 2) DICIONÁRIO DE DADOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.registry_research_data_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_name TEXT NOT NULL,
  view_version TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  definition TEXT NOT NULL,
  possible_values TEXT,
  source_table TEXT,
  transformation_rules TEXT,
  is_phi BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (view_name, view_version, field_name)
);

ALTER TABLE public.registry_research_data_dictionary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read data dictionary" ON public.registry_research_data_dictionary;
CREATE POLICY "Anyone can read data dictionary"
  ON public.registry_research_data_dictionary
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify dictionary" ON public.registry_research_data_dictionary;
CREATE POLICY "Only admins can modify dictionary"
  ON public.registry_research_data_dictionary
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Popular o dicionário v1
INSERT INTO public.registry_research_data_dictionary 
  (view_name, view_version, field_name, field_type, definition, possible_values, source_table, transformation_rules, is_phi)
VALUES
  ('registry_research_export_v1', '1.0.0', 'procedure_uid', 'text', 'Identificador pseudonimizado do procedimento (16 chars hex)', NULL, 'registry_procedures.id', 'SHA256 truncado com salt "proc_v1"', false),
  ('registry_research_export_v1', '1.0.0', 'case_uid', 'text', 'Identificador pseudonimizado do caso (16 chars hex)', NULL, 'registry_cases.registry_case_id', 'SHA256 truncado com salt "case_v1"', false),
  ('registry_research_export_v1', '1.0.0', 'procedure_month', 'text', 'Mês/ano do procedimento', 'YYYY-MM (ex: 2026-01)', 'registry_procedures.procedure_date', 'TO_CHAR(date, ''YYYY-MM'')', false),
  ('registry_research_export_v1', '1.0.0', 'baseline_to_followup_days', 'integer', 'Dias entre procedimento e follow-up D90', 'Inteiro positivo ou NULL', 'registry_longitudinal_followups.completed_at', 'EXTRACT(DAY FROM diff)', false),
  ('registry_research_export_v1', '1.0.0', 'therapy_item_code', 'text', 'Código do item de terapia na taxonomia', 'Código da therapy_items (ex: PRP, PRF, BMAC)', 'registry_procedures.therapy_item_code', 'Direto', false),
  ('registry_research_export_v1', '1.0.0', 'therapy_item_name', 'text', 'Nome legível do item de terapia', NULL, 'therapy_items.name', 'Direto', false),
  ('registry_research_export_v1', '1.0.0', 'category_code', 'text', 'Código da categoria do item', 'autologous_biologic, bio_stimulator, injectable_nutrition, neuromodulation_light', 'therapy_items.category_code', 'Direto', false),
  ('registry_research_export_v1', '1.0.0', 'effective_category_code', 'text', 'Categoria efetiva (considera base_component)', 'Mesmos valores de category_code', 'therapy_items', 'COALESCE(base_component_category_code, category_code)', false),
  ('registry_research_export_v1', '1.0.0', 'requires_score', 'boolean', 'Se categoria requer SCORE pré-procedimento', 'true, false', 'therapy_categories.requires_score', 'Da categoria efetiva', false),
  ('registry_research_export_v1', '1.0.0', 'requires_checklist', 'boolean', 'Se categoria requer checklist', 'true, false', 'therapy_categories.requires_checklist', 'Da categoria efetiva', false),
  ('registry_research_export_v1', '1.0.0', 'requires_curadoria', 'boolean', 'Se categoria requer curadoria científica', 'true, false', 'therapy_categories.requires_curadoria', 'Da categoria efetiva', false),
  ('registry_research_export_v1', '1.0.0', 'joint_region', 'text', 'Região anatômica tratada', 'joelho, ombro, coluna, quadril, etc.', 'registry_baseline.anatomical_region', 'Direto', false),
  ('registry_research_export_v1', '1.0.0', 'diagnosis_tag', 'text', 'Tag de diagnóstico estruturada', 'Tendinopatia, Osteoartrite, etc.', 'registry_baseline.primary_diagnosis', 'Direto (sem texto livre)', false),
  ('registry_research_export_v1', '1.0.0', 'baseline_pain_score', 'integer', 'Dor inicial NRS 0-10', '0-10', 'registry_baseline.initial_pain_score', 'Direto', false),
  ('registry_research_export_v1', '1.0.0', 'followup_pain_score_30d', 'integer', 'Dor em D30 NRS 0-10', '0-10 ou NULL', 'registry_longitudinal_followups (timepoint=30)', 'Direto', false),
  ('registry_research_export_v1', '1.0.0', 'followup_pain_score_90d', 'integer', 'Dor em D90 NRS 0-10', '0-10 ou NULL', 'registry_longitudinal_followups (timepoint=90)', 'Direto', false),
  ('registry_research_export_v1', '1.0.0', 'delta_pain_90d', 'integer', 'Redução de dor baseline→D90', '-10 a 10 ou NULL', 'Calculado', 'baseline_pain_score - followup_pain_score_90d', false),
  ('registry_research_export_v1', '1.0.0', 'baseline_function_score', 'integer', 'Score de função inicial (0-100)', '0-100 ou NULL', 'Reservado', 'Placeholder para versão futura', false),
  ('registry_research_export_v1', '1.0.0', 'followup_function_score_90d', 'integer', 'Score de função em D90', '0-100 ou NULL', 'Reservado', 'Placeholder para versão futura', false),
  ('registry_research_export_v1', '1.0.0', 'adverse_event_flag', 'boolean', 'Indica ocorrência de evento adverso', 'true, false', 'registry_procedures + followups', 'COALESCE de immediate e late adverse events', false),
  ('registry_research_export_v1', '1.0.0', 'age_bucket', 'text', 'Faixa etária do paciente', '18-29, 30-39, 40-49, 50-59, 60-69, 70+', 'registry_baseline.age_range', 'Direto (bucket pré-definido)', false),
  ('registry_research_export_v1', '1.0.0', 'sex', 'text', 'Sexo biológico', 'M, F, Outro, NI', 'registry_baseline.sex', 'Mapeamento M/F/other→NI', false),
  ('registry_research_export_v1', '1.0.0', 'region_state', 'text', 'UF/Estado do site', 'Siglas UF brasileiras', 'registry_cases.site_id', 'Direto (não identificável agregado)', false)
ON CONFLICT (view_name, view_version, field_name) DO NOTHING;

-- ============================================
-- 3) EXPORT LOG APPEND-ONLY
-- ============================================

-- Adicionar colunas extras se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registry_exports_log' AND column_name = 'user_agent') THEN
    ALTER TABLE public.registry_exports_log ADD COLUMN user_agent TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registry_exports_log' AND column_name = 'ip_address') THEN
    ALTER TABLE public.registry_exports_log ADD COLUMN ip_address TEXT;
  END IF;
END $$;

ALTER TABLE public.registry_exports_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Research can insert export logs" ON public.registry_exports_log;
CREATE POLICY "Research can insert export logs"
  ON public.registry_exports_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'research')
  );

DROP POLICY IF EXISTS "Research can read export logs" ON public.registry_exports_log;
CREATE POLICY "Research can read export logs"
  ON public.registry_exports_log
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'research')
  );

-- Triggers append-only
CREATE OR REPLACE FUNCTION public.prevent_export_log_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'registry_exports_log is append-only. UPDATE not allowed.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_export_log_update_trigger ON public.registry_exports_log;
CREATE TRIGGER prevent_export_log_update_trigger
  BEFORE UPDATE ON public.registry_exports_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_export_log_update();

CREATE OR REPLACE FUNCTION public.prevent_export_log_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'registry_exports_log is append-only. DELETE not allowed.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_export_log_delete_trigger ON public.registry_exports_log;
CREATE TRIGGER prevent_export_log_delete_trigger
  BEFORE DELETE ON public.registry_exports_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_export_log_delete();

COMMENT ON TABLE public.registry_exports_log IS 'Log append-only de exportações de pesquisa. UPDATE/DELETE bloqueados por trigger.';
COMMENT ON TABLE public.registry_research_data_dictionary IS 'Dicionário de dados para VIEWs de pesquisa. Imutável para auditoria.';