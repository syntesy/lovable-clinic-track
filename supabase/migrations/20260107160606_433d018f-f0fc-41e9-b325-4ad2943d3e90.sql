-- ============================================
-- FASE C: Controle de Acesso e Auditoria
-- ============================================

-- 1) Adicionar campo status ao log existente
ALTER TABLE public.registry_exports_log 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'success' 
  CHECK (status IN ('success', 'fail', 'partial'));

ALTER TABLE public.registry_exports_log 
ADD COLUMN IF NOT EXISTS notes text;

-- Renomear para consistência (export_name = nome da view)
ALTER TABLE public.registry_exports_log 
ADD COLUMN IF NOT EXISTS export_name text NOT NULL DEFAULT 'registry_research_export_v1';

-- 2) Garantir RLS para registry_cases (base da view)
-- A view usa SECURITY INVOKER, então herda RLS de registry_cases
-- Verificar/criar policy para admin/research

-- Remover policy antiga se existir e recriar com lógica correta
DROP POLICY IF EXISTS "Research export access" ON public.registry_cases;

CREATE POLICY "Research export access" 
ON public.registry_cases
FOR SELECT
TO authenticated
USING (
  -- Admin/Research: veem TODOS os casos consentidos
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'research') OR
  -- Profissional: vê SOMENTE seus próprios casos
  (professional_id = auth.uid())
);

COMMENT ON POLICY "Research export access" ON public.registry_cases IS 
'Controle de acesso para export de pesquisa:
- Admin/Research: todos os casos (export institucional)
- Profissional: apenas seus casos (export pessoal)
A VIEW registry_research_export_v1 herda via SECURITY INVOKER.';

-- 3) Garantir RLS no log de exportação
-- Remover policies antigas
DROP POLICY IF EXISTS "Admin/research can insert export logs" ON public.registry_exports_log;
DROP POLICY IF EXISTS "Admin/research can view export logs" ON public.registry_exports_log;

-- Criar policies corretas
CREATE POLICY "Export log insert - admin/research only"
ON public.registry_exports_log
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'research')
);

CREATE POLICY "Export log select - admin/research only"
ON public.registry_exports_log
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'research')
);

-- 4) Garantir triggers append-only existem
-- (já criados anteriormente, mas garantir que existem)
CREATE OR REPLACE FUNCTION public.prevent_export_log_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'registry_exports_log is append-only. UPDATE not allowed.';
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_export_log_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'registry_exports_log is append-only. DELETE not allowed.';
END;
$function$;

-- Recriar triggers se não existirem
DROP TRIGGER IF EXISTS prevent_export_log_update ON public.registry_exports_log;
DROP TRIGGER IF EXISTS prevent_export_log_delete ON public.registry_exports_log;

CREATE TRIGGER prevent_export_log_update
  BEFORE UPDATE ON public.registry_exports_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_export_log_update();

CREATE TRIGGER prevent_export_log_delete
  BEFORE DELETE ON public.registry_exports_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_export_log_delete();

-- 5) Documentar tabela
COMMENT ON TABLE public.registry_exports_log IS 
'Log append-only de exportações de pesquisa.
- INSERT: apenas admin/research
- UPDATE/DELETE: bloqueado por triggers
- Sem PHI (apenas metadados do export)';

COMMENT ON COLUMN public.registry_exports_log.status IS 'success | fail | partial';
COMMENT ON COLUMN public.registry_exports_log.export_name IS 'Nome da view exportada (ex: registry_research_export_v1)';
COMMENT ON COLUMN public.registry_exports_log.filters_json IS 'Filtros aplicados no export (sem PHI)';

-- 6) Índice para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_exports_log_exported_at 
ON public.registry_exports_log(exported_at DESC);

CREATE INDEX IF NOT EXISTS idx_exports_log_exported_by 
ON public.registry_exports_log(exported_by);