-- ============================================
-- CORREÇÃO DE SEGURANÇA: RBAC + RLS RESTRITIVO
-- ============================================

-- 1. Criar enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'professional', 'viewer');

-- 2. Criar tabela de roles de usuários
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'professional',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Habilitar RLS na tabela de roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função segura para verificar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Criar função para verificar se é profissional ou admin
CREATE OR REPLACE FUNCTION public.is_healthcare_professional(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'professional')
  )
$$;

-- 6. Políticas para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. CORRIGIR RLS DE PACIENTES - Apenas profissionais de saúde
-- Remover políticas antigas
DROP POLICY IF EXISTS "Authenticated users can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON public.patients;

-- Criar novas políticas restritivas
CREATE POLICY "Healthcare professionals can view patients"
ON public.patients
FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert patients"
ON public.patients
FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update patients"
ON public.patients
FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete patients"
ON public.patients
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 8. CORRIGIR RLS DE AUDIT_LOGS - Apenas admins podem ver
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Atualizar políticas de tabelas relacionadas a pacientes
-- treatment_sessions
DROP POLICY IF EXISTS "Authenticated users can view treatment sessions" ON public.treatment_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert treatment sessions" ON public.treatment_sessions;
DROP POLICY IF EXISTS "Authenticated users can update treatment sessions" ON public.treatment_sessions;
DROP POLICY IF EXISTS "Authenticated users can delete treatment sessions" ON public.treatment_sessions;

CREATE POLICY "Healthcare professionals can view treatment sessions"
ON public.treatment_sessions FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert treatment sessions"
ON public.treatment_sessions FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update treatment sessions"
ON public.treatment_sessions FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can delete treatment sessions"
ON public.treatment_sessions FOR DELETE
USING (public.is_healthcare_professional(auth.uid()));

-- clinical_records
DROP POLICY IF EXISTS "Authenticated users can view clinical records" ON public.clinical_records;
DROP POLICY IF EXISTS "Authenticated users can insert clinical records" ON public.clinical_records;
DROP POLICY IF EXISTS "Authenticated users can update clinical records" ON public.clinical_records;
DROP POLICY IF EXISTS "Authenticated users can delete clinical records" ON public.clinical_records;

CREATE POLICY "Healthcare professionals can view clinical records"
ON public.clinical_records FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert clinical records"
ON public.clinical_records FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update clinical records"
ON public.clinical_records FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can delete clinical records"
ON public.clinical_records FOR DELETE
USING (public.is_healthcare_professional(auth.uid()));

-- prp_screenings
DROP POLICY IF EXISTS "Authenticated users can view prp screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Authenticated users can insert prp screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Authenticated users can update prp screenings" ON public.prp_screenings;
DROP POLICY IF EXISTS "Authenticated users can delete prp screenings" ON public.prp_screenings;

CREATE POLICY "Healthcare professionals can view prp screenings"
ON public.prp_screenings FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert prp screenings"
ON public.prp_screenings FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update prp screenings"
ON public.prp_screenings FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can delete prp screenings"
ON public.prp_screenings FOR DELETE
USING (public.is_healthcare_professional(auth.uid()));

-- mac_protocols
DROP POLICY IF EXISTS "Authenticated users can view MAC protocols" ON public.mac_protocols;
DROP POLICY IF EXISTS "Authenticated users can insert MAC protocols" ON public.mac_protocols;
DROP POLICY IF EXISTS "Authenticated users can update MAC protocols" ON public.mac_protocols;
DROP POLICY IF EXISTS "Authenticated users can delete MAC protocols" ON public.mac_protocols;

CREATE POLICY "Healthcare professionals can view MAC protocols"
ON public.mac_protocols FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert MAC protocols"
ON public.mac_protocols FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update MAC protocols"
ON public.mac_protocols FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can delete MAC protocols"
ON public.mac_protocols FOR DELETE
USING (public.is_healthcare_professional(auth.uid()));

-- 10. Trigger para atribuir role padrão a novos usuários
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'professional')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- 11. Atribuir role a usuários existentes que não têm role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'professional'::app_role
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.users.id
)
ON CONFLICT (user_id, role) DO NOTHING;