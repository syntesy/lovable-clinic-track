
-- =====================================================
-- HOTFIX: RLS audit_logs — ISOLAMENTO POR CLÍNICA
-- =====================================================

-- 1) Adicionar coluna clinic_id a audit_logs (nullable para dados existentes)
ALTER TABLE public.audit_logs
ADD COLUMN clinic_id uuid;

-- 2) Criar índice para performance em queries de filtro
CREATE INDEX idx_audit_logs_clinic_id ON public.audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_clinic_user ON public.audit_logs(clinic_id, user_id);

-- 3) Criar função auxiliar para resolver clinic_id do usuário autenticado
-- Esta função verifica se o usuário é owner de uma clínica
-- Se existir múltipla clínica, considera a primeira (ou pode ser expandida para suportar contexto)
CREATE OR REPLACE FUNCTION public.current_user_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM public.clinics
  WHERE owner_user_id = auth.uid()
  LIMIT 1
$$;

-- 4) REMOVER policies antigas (problemáticas) de audit_logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Healthcare professionals can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

-- 5) CRIAR novas policies com isolamento por clinic_id
-- SELECT: Usuário vê logs apenas da sua clínica
CREATE POLICY "audit_logs_select_own_clinic"
ON public.audit_logs FOR SELECT
USING (clinic_id = current_user_clinic_id());

-- INSERT: Apenas usuários autenticados da clínica podem inserir
CREATE POLICY "audit_logs_insert_own_clinic"
ON public.audit_logs FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND clinic_id = current_user_clinic_id()
);

-- UPDATE: Bloquear updates em audit_logs (append-only)
CREATE POLICY "audit_logs_prevent_update"
ON public.audit_logs FOR UPDATE
USING (false);

-- DELETE: Bloquear deletes em audit_logs (append-only)
CREATE POLICY "audit_logs_prevent_delete"
ON public.audit_logs FOR DELETE
USING (false);
