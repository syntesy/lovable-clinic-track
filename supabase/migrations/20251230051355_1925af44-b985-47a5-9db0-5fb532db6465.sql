-- ====================================================================
-- ORTHOREGEN CLINICAL REGISTRY™ - TABELAS ESTRUTURADAS
-- ====================================================================

-- 1.1) registry_episode (representa um "caso" clínico)
CREATE TABLE public.registry_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  region_primary TEXT,
  suspected_diagnosis TEXT,
  pain_duration TEXT,
  baseline_pain_0_10 NUMERIC,
  planned_procedure_type TEXT,
  registry_consent_status TEXT NOT NULL DEFAULT 'not_asked' CHECK (registry_consent_status IN ('not_asked', 'declined', 'granted')),
  registry_eligible BOOLEAN NOT NULL DEFAULT false,
  registry_case_id TEXT,
  registry_partner TEXT DEFAULT 'Orthoregen',
  safety_block BOOLEAN NOT NULL DEFAULT false,
  notes_internal TEXT
);

-- 1.2) registry_triage_snapshot (captura questionário e flags)
CREATE TABLE public.registry_triage_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.registry_episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  triage_version TEXT NOT NULL DEFAULT 'v1.0',
  answers_json JSONB NOT NULL DEFAULT '{}',
  red_flags_present BOOLEAN NOT NULL DEFAULT false,
  red_flags_list JSONB DEFAULT '[]',
  medications_flags_json JSONB DEFAULT '{}',
  biological_soil_flags_json JSONB DEFAULT '{}',
  nutrition_flags_json JSONB DEFAULT '{}',
  lifestyle_flags_json JSONB DEFAULT '{}'
);

-- 1.3) registry_score_snapshot (captura score e justificativa)
CREATE TABLE public.registry_score_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.registry_episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score_version TEXT NOT NULL DEFAULT 'v1.0',
  score_context TEXT NOT NULL DEFAULT 'triage_only' CHECK (score_context IN ('triage_only', 'triage_plus_labs')),
  score_value NUMERIC,
  score_classification TEXT,
  reasoning_json JSONB DEFAULT '{}',
  recommendations_json JSONB DEFAULT '[]'
);

-- 1.4) registry_lab_order (pedido de exames)
CREATE TABLE public.registry_lab_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.registry_episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_version TEXT NOT NULL DEFAULT 'v1.0',
  requested_tests_json JSONB NOT NULL DEFAULT '[]'
);

-- 1.5) registry_lab_result (exames registrados)
CREATE TABLE public.registry_lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.registry_episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  collected_date DATE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'upload')),
  labs_json JSONB NOT NULL DEFAULT '{}'
);

-- 1.6) registry_procedure_plan (plano/procedimento pretendido)
CREATE TABLE public.registry_procedure_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.registry_episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  planned_date DATE,
  procedure_type TEXT,
  target TEXT,
  guidance BOOLEAN,
  sessions_planned INTEGER,
  notes TEXT
);

-- 1.7) registry_procedure_performed (procedimento realizado)
CREATE TABLE public.registry_procedures_performed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.registry_episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  performed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  procedure_type TEXT,
  target TEXT,
  guidance BOOLEAN,
  session_number INTEGER,
  volume_used NUMERIC,
  product_details_json JSONB DEFAULT '{}',
  adverse_event BOOLEAN NOT NULL DEFAULT false,
  adverse_event_notes TEXT,
  clinician_notes TEXT
);

-- 1.8) registry_followup (evolução/follow-up)
CREATE TABLE public.registry_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.registry_episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  timepoint TEXT NOT NULL DEFAULT 'baseline' CHECK (timepoint IN ('baseline', '1m', '3m', '6m', '12m')),
  pain_0_10 NUMERIC,
  function_score NUMERIC,
  patient_satisfaction_0_10 NUMERIC,
  notes TEXT
);

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.registry_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_triage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_procedure_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_procedures_performed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_followups ENABLE ROW LEVEL SECURITY;

-- registry_episodes policies
CREATE POLICY "Clinicians can manage their episodes"
  ON public.registry_episodes FOR ALL
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Admins can view all episodes"
  ON public.registry_episodes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for snapshot tables (clinicians via episode ownership)
CREATE POLICY "Clinicians can manage triage snapshots"
  ON public.registry_triage_snapshots FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()));

CREATE POLICY "Admins can view triage snapshots"
  ON public.registry_triage_snapshots FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage score snapshots"
  ON public.registry_score_snapshots FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()));

CREATE POLICY "Admins can view score snapshots"
  ON public.registry_score_snapshots FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage lab orders"
  ON public.registry_lab_orders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()));

CREATE POLICY "Admins can view lab orders"
  ON public.registry_lab_orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage lab results"
  ON public.registry_lab_results FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()));

CREATE POLICY "Admins can view lab results"
  ON public.registry_lab_results FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage procedure plans"
  ON public.registry_procedure_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()));

CREATE POLICY "Admins can view procedure plans"
  ON public.registry_procedure_plans FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage procedures performed"
  ON public.registry_procedures_performed FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()));

CREATE POLICY "Admins can view procedures performed"
  ON public.registry_procedures_performed FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage followups"
  ON public.registry_followups FOR ALL
  USING (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.registry_episodes e WHERE e.id = episode_id AND e.clinician_id = auth.uid()));

CREATE POLICY "Admins can view followups"
  ON public.registry_followups FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ====================================================================
-- INDEXES
-- ====================================================================
CREATE INDEX idx_registry_episodes_patient ON public.registry_episodes(patient_id);
CREATE INDEX idx_registry_episodes_clinician ON public.registry_episodes(clinician_id);
CREATE INDEX idx_registry_episodes_status ON public.registry_episodes(status);
CREATE INDEX idx_registry_episodes_eligible ON public.registry_episodes(registry_eligible) WHERE registry_eligible = true;
CREATE INDEX idx_registry_triage_episode ON public.registry_triage_snapshots(episode_id);
CREATE INDEX idx_registry_score_episode ON public.registry_score_snapshots(episode_id);
CREATE INDEX idx_registry_lab_order_episode ON public.registry_lab_orders(episode_id);
CREATE INDEX idx_registry_lab_result_episode ON public.registry_lab_results(episode_id);
CREATE INDEX idx_registry_proc_plan_episode ON public.registry_procedure_plans(episode_id);
CREATE INDEX idx_registry_proc_perf_episode ON public.registry_procedures_performed(episode_id);
CREATE INDEX idx_registry_followup_episode ON public.registry_followups(episode_id);

-- ====================================================================
-- TRIGGERS
-- ====================================================================
CREATE OR REPLACE FUNCTION public.update_registry_episode_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_registry_episodes_updated_at
  BEFORE UPDATE ON public.registry_episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_registry_episode_updated_at();

-- Consent log table
CREATE TABLE public.registry_consent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.registry_episodes(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registry_consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view consent logs"
  ON public.registry_consent_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert consent logs"
  ON public.registry_consent_logs FOR INSERT
  WITH CHECK (true);

-- Trigger to log consent changes
CREATE OR REPLACE FUNCTION public.log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.registry_consent_status IS DISTINCT FROM NEW.registry_consent_status THEN
    INSERT INTO public.registry_consent_logs (episode_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.registry_consent_status, NEW.registry_consent_status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_registry_consent_change
  AFTER UPDATE ON public.registry_episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_consent_change();