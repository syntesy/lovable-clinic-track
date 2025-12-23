-- Índices para otimização de buscas frequentes
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients USING btree (full_name);
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients USING btree (status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_treated_region ON public.patients USING btree (treated_region);

-- Índices para treatment_sessions
CREATE INDEX IF NOT EXISTS idx_treatment_sessions_patient_id ON public.treatment_sessions USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_sessions_session_date ON public.treatment_sessions USING btree (session_date DESC);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs USING btree (action);

-- Índices para user_sessions (controle de sessões concorrentes)
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_active ON public.user_sessions USING btree (user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);

-- Índices para prp_screenings
CREATE INDEX IF NOT EXISTS idx_prp_screenings_patient_id ON public.prp_screenings USING btree (patient_id);

-- Índices para clinical_records
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient_id ON public.clinical_records USING btree (patient_id);

-- Função para limitar sessões concorrentes (máx 3 por usuário)
CREATE OR REPLACE FUNCTION public.enforce_session_limit()
RETURNS TRIGGER AS $$
DECLARE
    session_count INTEGER;
    oldest_session_id UUID;
BEGIN
    -- Contar sessões ativas do usuário
    SELECT COUNT(*) INTO session_count
    FROM public.user_sessions
    WHERE user_id = NEW.user_id AND is_active = true;
    
    -- Se já tem 3 ou mais, desativar a mais antiga
    IF session_count >= 3 THEN
        SELECT id INTO oldest_session_id
        FROM public.user_sessions
        WHERE user_id = NEW.user_id AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1;
        
        UPDATE public.user_sessions
        SET is_active = false
        WHERE id = oldest_session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para aplicar limite de sessões
DROP TRIGGER IF EXISTS trigger_enforce_session_limit ON public.user_sessions;
CREATE TRIGGER trigger_enforce_session_limit
    BEFORE INSERT ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_session_limit();

-- Função para limpar sessões expiradas (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.user_sessions
        WHERE expires_at < NOW() OR is_active = false
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;