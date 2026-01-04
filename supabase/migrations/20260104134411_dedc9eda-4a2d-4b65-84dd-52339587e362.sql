-- =========================================================
-- REGENAPP DILIGENCE & COMPLIANCE LAYER™
-- Camada downstream, read-only sobre dados clínicos
-- Write-only sobre suas próprias tabelas
-- =========================================================

-- 1. diligence_case_reports - Relatórios factuais por caso
CREATE TABLE public.diligence_case_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  report_version INTEGER NOT NULL DEFAULT 1,
  report_content JSONB NOT NULL,
  pdf_storage_path TEXT,
  pdf_checksum TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  immutable BOOLEAN NOT NULL DEFAULT true
);

-- Unique constraint para idempotência
CREATE UNIQUE INDEX idx_diligence_reports_unique 
  ON public.diligence_case_reports(user_id, case_id, report_version);

-- 2. diligence_case_timelines - Linha do tempo técnica por caso
CREATE TABLE public.diligence_case_timelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  source_table TEXT,
  source_record_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  immutable BOOLEAN NOT NULL DEFAULT true
);

-- 3. diligence_risk_disclosures - Matriz de riscos documentados
CREATE TABLE public.diligence_risk_disclosures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  risk_category TEXT NOT NULL,
  risk_description TEXT NOT NULL,
  disclosed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  disclosure_method TEXT,
  patient_acknowledged BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  immutable BOOLEAN NOT NULL DEFAULT true
);

-- 4. diligence_checklists - Checklist de boas práticas
CREATE TABLE public.diligence_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id UUID,
  checklist_type TEXT NOT NULL,
  checklist_items JSONB NOT NULL,
  completed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  immutable BOOLEAN NOT NULL DEFAULT false
);

-- Unique constraint
CREATE UNIQUE INDEX idx_diligence_checklists_unique 
  ON public.diligence_checklists(user_id, case_id, checklist_type) 
  WHERE case_id IS NOT NULL;

-- 5. diligence_practice_statements - Declaração geral do profissional
CREATE TABLE public.diligence_practice_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  statement_type TEXT NOT NULL,
  statement_content JSONB NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  immutable BOOLEAN NOT NULL DEFAULT true
);

-- 6. diligence_compliance_logs - Log imutável append-only
CREATE TABLE public.diligence_compliance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id UUID,
  action TEXT NOT NULL,
  action_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  immutable BOOLEAN NOT NULL DEFAULT true
);

-- =========================================================
-- RLS POLICIES - Isolamento total por user_id
-- =========================================================

ALTER TABLE public.diligence_case_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diligence_case_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diligence_risk_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diligence_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diligence_practice_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diligence_compliance_logs ENABLE ROW LEVEL SECURITY;

-- diligence_case_reports policies
CREATE POLICY "Users can view their own case reports"
  ON public.diligence_case_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own case reports"
  ON public.diligence_case_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NO UPDATE policy - records are immutable

-- diligence_case_timelines policies
CREATE POLICY "Users can view their own timelines"
  ON public.diligence_case_timelines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timelines"
  ON public.diligence_case_timelines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NO UPDATE policy - records are immutable

-- diligence_risk_disclosures policies
CREATE POLICY "Users can view their own risk disclosures"
  ON public.diligence_risk_disclosures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own risk disclosures"
  ON public.diligence_risk_disclosures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NO UPDATE policy - records are immutable

-- diligence_checklists policies (UPDATE allowed only for completed_items and status)
CREATE POLICY "Users can view their own checklists"
  ON public.diligence_checklists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklists"
  ON public.diligence_checklists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own non-immutable checklists"
  ON public.diligence_checklists FOR UPDATE
  USING (auth.uid() = user_id AND immutable = false)
  WITH CHECK (auth.uid() = user_id);

-- diligence_practice_statements policies
CREATE POLICY "Users can view their own practice statements"
  ON public.diligence_practice_statements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice statements"
  ON public.diligence_practice_statements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NO UPDATE policy - records are immutable

-- diligence_compliance_logs policies (append-only)
CREATE POLICY "Users can view their own compliance logs"
  ON public.diligence_compliance_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compliance logs"
  ON public.diligence_compliance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NO UPDATE, NO DELETE policies - logs are append-only

-- =========================================================
-- TRIGGERS - Enforce immutability at database level
-- =========================================================

CREATE OR REPLACE FUNCTION public.prevent_update_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.immutable = true THEN
    RAISE EXCEPTION 'Cannot update immutable record';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.prevent_delete_diligence()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Cannot delete diligence records';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply immutability triggers
CREATE TRIGGER prevent_update_case_reports
  BEFORE UPDATE ON public.diligence_case_reports
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_immutable();

CREATE TRIGGER prevent_delete_case_reports
  BEFORE DELETE ON public.diligence_case_reports
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_diligence();

CREATE TRIGGER prevent_update_timelines
  BEFORE UPDATE ON public.diligence_case_timelines
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_immutable();

CREATE TRIGGER prevent_delete_timelines
  BEFORE DELETE ON public.diligence_case_timelines
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_diligence();

CREATE TRIGGER prevent_update_risk_disclosures
  BEFORE UPDATE ON public.diligence_risk_disclosures
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_immutable();

CREATE TRIGGER prevent_delete_risk_disclosures
  BEFORE DELETE ON public.diligence_risk_disclosures
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_diligence();

CREATE TRIGGER prevent_update_practice_statements
  BEFORE UPDATE ON public.diligence_practice_statements
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_immutable();

CREATE TRIGGER prevent_delete_practice_statements
  BEFORE DELETE ON public.diligence_practice_statements
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_diligence();

CREATE TRIGGER prevent_update_compliance_logs
  BEFORE UPDATE ON public.diligence_compliance_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_immutable();

CREATE TRIGGER prevent_delete_compliance_logs
  BEFORE DELETE ON public.diligence_compliance_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_diligence();

-- Checklists have special update handling (only non-immutable can be updated)
CREATE TRIGGER prevent_delete_checklists
  BEFORE DELETE ON public.diligence_checklists
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_diligence();