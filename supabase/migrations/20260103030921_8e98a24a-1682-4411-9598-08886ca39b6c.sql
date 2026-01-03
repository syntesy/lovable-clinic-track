-- =====================================================
-- REGISTRO OBSERVACIONAL FASE 1 - CAMADA PARALELA
-- Motor clínico: CONGELADO - NÃO TOCAR
-- =====================================================

-- 1. REGISTRY CASES (identificação anonimizada)
CREATE TABLE IF NOT EXISTS public.registry_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_case_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  screening_id UUID REFERENCES public.prp_screenings(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  site_id TEXT DEFAULT 'default_site',
  professional_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'included' CHECK (status IN ('included', 'withdrawn')),
  consented_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. REGISTRY BASELINE (dados clínicos anonimizados)
CREATE TABLE IF NOT EXISTS public.registry_baseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_case_id UUID REFERENCES public.registry_cases(registry_case_id) ON DELETE CASCADE NOT NULL,
  age_range TEXT, -- faixa etária (ex: "30-39", "40-49")
  sex TEXT CHECK (sex IN ('M', 'F', 'other', 'not_informed')),
  primary_diagnosis TEXT,
  anatomical_region TEXT,
  pain_duration_range TEXT, -- faixa (ex: "<3m", "3-6m", "6-12m", ">12m")
  initial_pain_score INTEGER CHECK (initial_pain_score >= 0 AND initial_pain_score <= 10),
  comorbidities JSONB DEFAULT '[]'::jsonb, -- checklist simples
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. REGISTRY PROCEDURES (evento index)
CREATE TABLE IF NOT EXISTS public.registry_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_case_id UUID REFERENCES public.registry_cases(registry_case_id) ON DELETE CASCADE NOT NULL,
  procedure_type TEXT NOT NULL, -- PRP, PRF, EPI, Neuromodulação, etc.
  procedure_date DATE NOT NULL,
  image_guided BOOLEAN DEFAULT false,
  anatomical_site_detail TEXT,
  application_count INTEGER DEFAULT 1,
  immediate_adverse_event BOOLEAN DEFAULT false,
  adverse_event_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. REGISTRY LABS (biologia - opcional)
CREATE TABLE IF NOT EXISTS public.registry_labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_case_id UUID REFERENCES public.registry_cases(registry_case_id) ON DELETE CASCADE NOT NULL,
  hemoglobin DECIMAL(5,2),
  leukocytes DECIMAL(10,2),
  platelets INTEGER,
  crp DECIMAL(6,2),
  hba1c DECIMAL(4,2),
  ferritin DECIMAL(8,2),
  collection_date DATE,
  status TEXT DEFAULT 'USE' CHECK (status IN ('USE', 'CAUTION', 'AVOID')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. REGISTRY ENGINE SNAPSHOTS (somente leitura do motor)
CREATE TABLE IF NOT EXISTS public.registry_engine_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_case_id UUID REFERENCES public.registry_cases(registry_case_id) ON DELETE CASCADE NOT NULL,
  final_state TEXT CHECK (final_state IN ('S0', 'S1', 'S2', 'S3')),
  engine_outputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  engine_computed_at TIMESTAMPTZ,
  canonical_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. REGISTRY FOLLOWUPS LONGITUDINAIS
CREATE TABLE IF NOT EXISTS public.registry_longitudinal_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_case_id UUID REFERENCES public.registry_cases(registry_case_id) ON DELETE CASCADE NOT NULL,
  timepoint INTEGER NOT NULL CHECK (timepoint IN (30, 90, 180, 365)),
  pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
  perceived_improvement INTEGER CHECK (perceived_improvement >= 1 AND perceived_improvement <= 5), -- Likert
  return_to_activity BOOLEAN,
  new_intervention BOOLEAN DEFAULT false,
  late_adverse_event BOOLEAN DEFAULT false,
  adverse_event_type TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(registry_case_id, timepoint)
);

-- 7. REGISTRY CONSENT LOG (auditoria de consentimento)
CREATE TABLE IF NOT EXISTS public.registry_consent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_case_id UUID REFERENCES public.registry_cases(registry_case_id) ON DELETE CASCADE NOT NULL,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  accepted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  text_hash TEXT NOT NULL, -- hash do texto do termo
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. REGISTRY AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.registry_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_case_id UUID REFERENCES public.registry_cases(registry_case_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'case_included',
    'consent_accepted',
    'consent_withdrawn',
    'followup_created',
    'followup_updated',
    'baseline_created',
    'procedure_recorded',
    'labs_recorded',
    'snapshot_created'
  )),
  user_id UUID,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.registry_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_baseline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_engine_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_longitudinal_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_consent_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_audit_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Profissional vê apenas seus casos
-- =====================================================

-- Registry Cases
CREATE POLICY "Professionals view own registry cases"
ON public.registry_cases FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND professional_id = auth.uid());

CREATE POLICY "Professionals insert own registry cases"
ON public.registry_cases FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND professional_id = auth.uid());

CREATE POLICY "Professionals update own registry cases"
ON public.registry_cases FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL AND professional_id = auth.uid());

CREATE POLICY "Admins view all registry cases"
ON public.registry_cases FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Registry Baseline
CREATE POLICY "Professionals view own baseline"
ON public.registry_baseline FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_baseline.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Professionals insert own baseline"
ON public.registry_baseline FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_baseline.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Admins view all baseline"
ON public.registry_baseline FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Registry Procedures
CREATE POLICY "Professionals view own procedures"
ON public.registry_procedures FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_procedures.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Professionals insert own procedures"
ON public.registry_procedures FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_procedures.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Admins view all procedures"
ON public.registry_procedures FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Registry Labs
CREATE POLICY "Professionals view own labs"
ON public.registry_labs FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_labs.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Professionals insert own labs"
ON public.registry_labs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_labs.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Admins view all labs"
ON public.registry_labs FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Registry Engine Snapshots
CREATE POLICY "Professionals view own snapshots"
ON public.registry_engine_snapshots FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_engine_snapshots.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Professionals insert own snapshots"
ON public.registry_engine_snapshots FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_engine_snapshots.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Admins view all snapshots"
ON public.registry_engine_snapshots FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Registry Longitudinal Followups
CREATE POLICY "Professionals view own followups"
ON public.registry_longitudinal_followups FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_longitudinal_followups.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Professionals manage own followups"
ON public.registry_longitudinal_followups FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_longitudinal_followups.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Admins view all followups"
ON public.registry_longitudinal_followups FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Registry Consent Audit
CREATE POLICY "Professionals view own consent audit"
ON public.registry_consent_audit FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_consent_audit.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Professionals insert consent audit"
ON public.registry_consent_audit FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.registry_cases rc
  WHERE rc.registry_case_id = registry_consent_audit.registry_case_id
  AND rc.professional_id = auth.uid()
));

CREATE POLICY "Admins view all consent audit"
ON public.registry_consent_audit FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Registry Audit Events
CREATE POLICY "Professionals view own audit events"
ON public.registry_audit_events FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.registry_cases rc
    WHERE rc.registry_case_id = registry_audit_events.registry_case_id
    AND rc.professional_id = auth.uid()
  )
));

CREATE POLICY "System insert audit events"
ON public.registry_audit_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins view all audit events"
ON public.registry_audit_events FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger for registry_cases
CREATE TRIGGER update_registry_cases_updated_at
BEFORE UPDATE ON public.registry_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_registry_cases_professional ON public.registry_cases(professional_id);
CREATE INDEX IF NOT EXISTS idx_registry_cases_status ON public.registry_cases(status);
CREATE INDEX IF NOT EXISTS idx_registry_cases_patient ON public.registry_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_registry_baseline_case ON public.registry_baseline(registry_case_id);
CREATE INDEX IF NOT EXISTS idx_registry_procedures_case ON public.registry_procedures(registry_case_id);
CREATE INDEX IF NOT EXISTS idx_registry_followups_case ON public.registry_longitudinal_followups(registry_case_id);
CREATE INDEX IF NOT EXISTS idx_registry_followups_timepoint ON public.registry_longitudinal_followups(timepoint);
CREATE INDEX IF NOT EXISTS idx_registry_audit_case ON public.registry_audit_events(registry_case_id);
CREATE INDEX IF NOT EXISTS idx_registry_audit_type ON public.registry_audit_events(event_type);