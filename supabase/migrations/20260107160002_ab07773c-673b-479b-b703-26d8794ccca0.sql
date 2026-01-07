-- ============================================
-- FASE B: Pseudonimização com Salt Seguro
-- ============================================

-- 1) Tabela para armazenar o salt (protegida por RLS)
CREATE TABLE IF NOT EXISTS public.research_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS (nenhuma policy = nenhum acesso direto)
ALTER TABLE public.research_config ENABLE ROW LEVEL SECURITY;

-- Inserir salt gerado aleatoriamente (64 chars hex = 256 bits)
INSERT INTO public.research_config (key, value)
VALUES ('pseudonymization_salt', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- 2) Função para gerar case_uid
CREATE OR REPLACE FUNCTION public.generate_case_uid(p_case_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_salt text;
BEGIN
  SELECT value INTO v_salt
  FROM public.research_config
  WHERE key = 'pseudonymization_salt';
  
  IF v_salt IS NULL THEN
    RAISE EXCEPTION 'Salt de pseudonimização não configurado';
  END IF;
  
  RETURN encode(
    sha256(('case:' || p_case_id::text || ':' || v_salt)::bytea),
    'hex'
  );
END;
$function$;

-- 3) Função para gerar procedure_uid
CREATE OR REPLACE FUNCTION public.generate_procedure_uid(p_procedure_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_salt text;
BEGIN
  SELECT value INTO v_salt
  FROM public.research_config
  WHERE key = 'pseudonymization_salt';
  
  IF v_salt IS NULL THEN
    RAISE EXCEPTION 'Salt de pseudonimização não configurado';
  END IF;
  
  RETURN encode(
    sha256(('procedure:' || p_procedure_id::text || ':' || v_salt)::bytea),
    'hex'
  );
END;
$function$;

-- 4) Função para gerar clinician_uid
CREATE OR REPLACE FUNCTION public.generate_clinician_uid(p_clinician_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_salt text;
BEGIN
  SELECT value INTO v_salt
  FROM public.research_config
  WHERE key = 'pseudonymization_salt';
  
  IF v_salt IS NULL THEN
    RAISE EXCEPTION 'Salt de pseudonimização não configurado';
  END IF;
  
  RETURN encode(
    sha256(('clinician:' || p_clinician_id::text || ':' || v_salt)::bytea),
    'hex'
  );
END;
$function$;

-- 5) Atualizar a VIEW com JOINs corretos
DROP VIEW IF EXISTS public.registry_research_export_v1;

CREATE VIEW public.registry_research_export_v1
WITH (security_invoker = true)
AS
SELECT
  -- UIDs pseudonimizados (estáveis, irreversíveis)
  public.generate_case_uid(rc.id) AS case_uid,
  public.generate_procedure_uid(rp.id) AS procedure_uid,
  public.generate_clinician_uid(rc.professional_id) AS clinician_uid,
  
  -- Dados clínicos (sem PII)
  rb.primary_diagnosis AS pathology_tag,
  rp.procedure_type AS technique_tag,
  rb.anatomical_region AS region_tag,
  rp.procedure_date,
  
  -- Baseline
  rb.age_range,
  rb.sex,
  rb.pain_duration_range,
  rb.initial_pain_score AS baseline_pain_nrs,
  rb.comorbidities,
  
  -- Procedimento
  rp.image_guided,
  rp.application_count,
  rp.therapy_item_code,
  
  -- Status
  rc.status,
  
  -- Metadados
  rc.created_at AS case_created_at,
  rp.created_at AS procedure_created_at,
  
  -- Versão do export
  '1.0'::text AS export_version
  
FROM public.registry_cases rc
LEFT JOIN public.registry_procedures rp ON rp.registry_case_id = rc.id
LEFT JOIN public.registry_baseline rb ON rb.registry_case_id = rc.id
WHERE rc.status = 'consented';

-- 6) Documentar funções
COMMENT ON FUNCTION public.generate_case_uid(uuid) IS 
'Gera UID pseudonimizado estável para case_id. 
Usa salt em research_config (SECURITY DEFINER). Irreversível.';

COMMENT ON FUNCTION public.generate_procedure_uid(uuid) IS 
'Gera UID pseudonimizado estável para procedure_id.
Usa salt em research_config (SECURITY DEFINER). Irreversível.';

COMMENT ON FUNCTION public.generate_clinician_uid(uuid) IS 
'Gera UID pseudonimizado estável para clinician_id.
Usa salt em research_config (SECURITY DEFINER). Irreversível.';

COMMENT ON TABLE public.research_config IS 
'Config segura para pesquisa. RLS sem policies = acesso só via SECURITY DEFINER.';

-- 7) Atualizar data dictionary
INSERT INTO public.registry_research_data_dictionary 
(view_name, view_version, field_name, field_type, definition, possible_values, source_table, transformation_rules, is_phi)
VALUES
  ('registry_research_export_v1', '1.0', 'case_uid', 'text', 'UID pseudonimizado do caso', NULL, 'registry_cases', 'SHA256("case:" || id || ":" || salt)', false),
  ('registry_research_export_v1', '1.0', 'procedure_uid', 'text', 'UID pseudonimizado do procedimento', NULL, 'registry_procedures', 'SHA256("procedure:" || id || ":" || salt)', false),
  ('registry_research_export_v1', '1.0', 'clinician_uid', 'text', 'UID pseudonimizado do profissional', NULL, 'registry_cases', 'SHA256("clinician:" || id || ":" || salt)', false)
ON CONFLICT (view_name, view_version, field_name) 
DO UPDATE SET 
  transformation_rules = EXCLUDED.transformation_rules,
  definition = EXCLUDED.definition;