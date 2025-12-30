-- ================================================
-- ORTHOREGEN CLINICAL REGISTRY™ - DATABASE SCHEMA
-- ================================================

-- 1. Tabela de consentimento do paciente para participação no Registry
CREATE TABLE public.registry_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  lgpd_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id)
);

-- 2. Tabela de snapshots do Registry (captura automática de cada etapa do fluxo)
CREATE TABLE public.registry_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL, -- 'triagem', 'score_inicial', 'exames_solicitados', 'exames_registrados', 'score_atualizado', 'procedimento_planejado', 'procedimento_realizado', 'follow_up'
  snapshot_version INTEGER NOT NULL DEFAULT 1,
  snapshot_data JSONB NOT NULL, -- dados anonimizáveis (sem nome, cpf, etc.)
  source_record_id UUID, -- referência ao registro original (screening, session, etc.)
  source_table TEXT, -- 'prp_screenings', 'treatment_sessions', 'patient_procedures', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_eligible BOOLEAN NOT NULL DEFAULT false -- só true se consent_given = true
);

-- 3. Tabela de logs de acesso ao painel institucional (auditoria)
CREATE TABLE public.registry_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'view_dashboard', 'export_aggregated', 'filter_applied'
  access_details JSONB, -- filtros usados, período consultado, etc.
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de métricas agregadas pré-calculadas (para performance)
CREATE TABLE public.registry_aggregated_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'score_distribution', 'procedure_outcomes', 'follow_up_rates', etc.
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  aggregation_level TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'yearly'
  metric_data JSONB NOT NULL, -- dados agregados sem identificadores
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================

-- registry_consents: profissionais gerenciam seus próprios consentimentos
ALTER TABLE public.registry_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage their patient registry consents"
  ON public.registry_consents
  FOR ALL
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- registry_snapshots: profissionais inserem, admins podem ver para agregação
ALTER TABLE public.registry_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can insert their patient snapshots"
  ON public.registry_snapshots
  FOR INSERT
  WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Professionals can view their own snapshots"
  ON public.registry_snapshots
  FOR SELECT
  USING (professional_id = auth.uid());

CREATE POLICY "Admins can view all snapshots for aggregation"
  ON public.registry_snapshots
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- registry_access_logs: apenas admins podem ver e inserir
ALTER TABLE public.registry_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage access logs"
  ON public.registry_access_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- registry_aggregated_metrics: admins podem gerenciar, todos podem ler (dados já anonimizados)
ALTER TABLE public.registry_aggregated_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage aggregated metrics"
  ON public.registry_aggregated_metrics
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view aggregated metrics"
  ON public.registry_aggregated_metrics
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX idx_registry_snapshots_patient ON public.registry_snapshots(patient_id);
CREATE INDEX idx_registry_snapshots_type ON public.registry_snapshots(snapshot_type);
CREATE INDEX idx_registry_snapshots_created ON public.registry_snapshots(created_at);
CREATE INDEX idx_registry_snapshots_eligible ON public.registry_snapshots(is_eligible) WHERE is_eligible = true;
CREATE INDEX idx_registry_consents_patient ON public.registry_consents(patient_id);
CREATE INDEX idx_registry_access_logs_user ON public.registry_access_logs(user_id);
CREATE INDEX idx_registry_access_logs_created ON public.registry_access_logs(created_at);

-- ================================================
-- TRIGGER: Update timestamps
-- ================================================

CREATE TRIGGER update_registry_consents_updated_at
  BEFORE UPDATE ON public.registry_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registry_aggregated_metrics_updated_at
  BEFORE UPDATE ON public.registry_aggregated_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- FUNÇÃO: Marcar snapshots como elegíveis quando consentimento é dado
-- ================================================

CREATE OR REPLACE FUNCTION public.update_snapshots_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consent_given = true AND OLD.consent_given = false THEN
    UPDATE public.registry_snapshots
    SET is_eligible = true
    WHERE patient_id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_consent_given_update_eligibility
  AFTER UPDATE ON public.registry_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_snapshots_eligibility();