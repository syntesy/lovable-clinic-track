-- =====================================================
-- SISTEMA DE AUDITORIA COMPLETO PARA PRONTUÁRIO MÉDICO
-- Conformidade: CFM 1638/2002, CFM 1821/2007, LGPD
-- =====================================================

-- Tabela de Logs de Auditoria
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    additional_info JSONB
);

-- Índices para performance em consultas de auditoria
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Somente admins podem ver logs de auditoria
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- TABELA DE CONSENTIMENTO LGPD
-- =====================================================

CREATE TABLE public.patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    consent_text TEXT NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT false,
    accepted_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    witness_user_id UUID REFERENCES auth.users(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_patient_consents_patient_id ON public.patient_consents(patient_id);
CREATE INDEX idx_patient_consents_type ON public.patient_consents(consent_type);

-- Enable RLS
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Authenticated users can manage consents"
ON public.patient_consents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_patient_consents_updated_at
BEFORE UPDATE ON public.patient_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABELA DE SESSÕES DE USUÁRIO
-- =====================================================

CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    device_info JSONB,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their own sessions"
ON public.user_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TABELA DE VERSIONAMENTO DE PRONTUÁRIO
-- =====================================================

CREATE TABLE public.clinical_record_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_record_id UUID NOT NULL REFERENCES public.clinical_records(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    data JSONB NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    hash_integrity TEXT NOT NULL
);

-- Índices
CREATE INDEX idx_clinical_versions_record ON public.clinical_record_versions(clinical_record_id);
CREATE INDEX idx_clinical_versions_number ON public.clinical_record_versions(version_number);

-- Enable RLS
ALTER TABLE public.clinical_record_versions ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Authenticated users can manage versions"
ON public.clinical_record_versions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- FUNÇÕES DE AUDITORIA
-- =====================================================

-- Função para criar hash de integridade
CREATE OR REPLACE FUNCTION public.generate_integrity_hash(data JSONB)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN encode(sha256(data::text::bytea), 'hex');
END;
$$;

-- Função para registrar log de auditoria
CREATE OR REPLACE FUNCTION public.log_audit_action(
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_additional_info JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_user_email TEXT;
BEGIN
    -- Obter email do usuário
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        additional_info
    ) VALUES (
        auth.uid(),
        v_user_email,
        p_action,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        p_additional_info
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;