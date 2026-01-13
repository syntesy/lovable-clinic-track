-- =====================================================
-- REGHEN RLS POLICIES - BASELINE EXPORT
-- Generated: 2025-01-13
-- Environment: Production (Lovable Cloud / Supabase)
-- Project ID: oedlipwpqkvhreqipoji
-- =====================================================

-- =====================================================
-- TABLE: registry_score_snapshots
-- =====================================================
ALTER TABLE public.registry_score_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view score snapshots"
ON public.registry_score_snapshots FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage score snapshots"
ON public.registry_score_snapshots FOR ALL
USING (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_score_snapshots.episode_id AND e.clinician_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_score_snapshots.episode_id AND e.clinician_id = auth.uid()
));

-- =====================================================
-- TABLE: user_sessions
-- =====================================================
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
ON public.user_sessions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TABLE: curation_versions
-- =====================================================
ALTER TABLE public.curation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem inserir versões"
ON public.curation_versions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver todas as versões"
ON public.curation_versions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: app_events
-- =====================================================
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events"
ON public.app_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
ON public.app_events FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: patient_events
-- =====================================================
ALTER TABLE public.patient_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can insert patient events"
ON public.patient_events FOR INSERT
WITH CHECK ((professional_id = auth.uid()) OR (professional_id IS NULL));

CREATE POLICY "Professionals can view their patient events"
ON public.patient_events FOR SELECT
USING (professional_id = auth.uid());

-- =====================================================
-- TABLE: registry_procedure_plans
-- =====================================================
ALTER TABLE public.registry_procedure_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view procedure plans"
ON public.registry_procedure_plans FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage procedure plans"
ON public.registry_procedure_plans FOR ALL
USING (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_procedure_plans.episode_id AND e.clinician_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_procedure_plans.episode_id AND e.clinician_id = auth.uid()
));

-- =====================================================
-- TABLE: registry_aggregated_metrics
-- =====================================================
ALTER TABLE public.registry_aggregated_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage aggregated metrics"
ON public.registry_aggregated_metrics FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view aggregated metrics"
ON public.registry_aggregated_metrics FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- TABLE: registry_snapshots
-- =====================================================
ALTER TABLE public.registry_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all snapshots for aggregation"
ON public.registry_snapshots FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can insert their patient snapshots"
ON public.registry_snapshots FOR INSERT
WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Professionals can view their own snapshots"
ON public.registry_snapshots FOR SELECT
USING (professional_id = auth.uid());

-- =====================================================
-- TABLE: therapy_items
-- =====================================================
ALTER TABLE public.therapy_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapy items are readable by authenticated users"
ON public.therapy_items FOR SELECT
USING (true);

-- =====================================================
-- TABLE: therapy_categories
-- =====================================================
ALTER TABLE public.therapy_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapy categories are readable by authenticated users"
ON public.therapy_categories FOR SELECT
USING (true);

-- =====================================================
-- TABLE: curations
-- =====================================================
ALTER TABLE public.curations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins atualizam qualquer curadoria"
ON public.curations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins deletam curadorias"
ON public.curations FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins veem todas as curadorias"
ON public.curations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Criador atualiza rascunhos"
ON public.curations FOR UPDATE
USING ((auth.uid() = created_by) AND (status = ANY (ARRAY['rascunho'::curation_status, 'em_revisao'::curation_status])));

CREATE POLICY "Curadorias disponíveis são públicas"
ON public.curations FOR SELECT
USING (status = 'disponivel'::curation_status);

CREATE POLICY "Usuários autenticados criam curadorias"
ON public.curations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários veem suas próprias curadorias"
ON public.curations FOR SELECT
USING (auth.uid() = created_by);

-- =====================================================
-- TABLE: registry_procedures
-- =====================================================
ALTER TABLE public.registry_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all procedures"
ON public.registry_procedures FOR SELECT
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals insert own procedures"
ON public.registry_procedures FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_procedures.registry_case_id AND rc.professional_id = auth.uid()
)));

CREATE POLICY "Professionals view own procedures"
ON public.registry_procedures FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_procedures.registry_case_id AND rc.professional_id = auth.uid()
)));

-- =====================================================
-- TABLE: diligence_risk_disclosures
-- =====================================================
ALTER TABLE public.diligence_risk_disclosures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own risk disclosures"
ON public.diligence_risk_disclosures FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own risk disclosures"
ON public.diligence_risk_disclosures FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: career_consistency_index
-- =====================================================
ALTER TABLE public.career_consistency_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own consistency index"
ON public.career_consistency_index FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consistency index"
ON public.career_consistency_index FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own consistency index"
ON public.career_consistency_index FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: prp_lab_results
-- =====================================================
ALTER TABLE public.prp_lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can delete prp lab results"
ON public.prp_lab_results FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can insert own patient lab results"
ON public.prp_lab_results FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM prp_screenings s
    JOIN patients p ON p.id = s.patient_id
    WHERE s.id = prp_lab_results.screening_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Professionals can update own patient lab results"
ON public.prp_lab_results FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM prp_screenings s
    JOIN patients p ON p.id = s.patient_id
    WHERE s.id = prp_lab_results.screening_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Professionals can view own patient lab results"
ON public.prp_lab_results FOR SELECT
USING (EXISTS (
    SELECT 1 FROM prp_screenings s
    JOIN patients p ON p.id = s.patient_id
    WHERE s.id = prp_lab_results.screening_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- =====================================================
-- TABLE: career_case_complexity
-- =====================================================
ALTER TABLE public.career_case_complexity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own case complexity"
ON public.career_case_complexity FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own case complexity"
ON public.career_case_complexity FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own case complexity"
ON public.career_case_complexity FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: prp_screenings
-- =====================================================
ALTER TABLE public.prp_screenings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can manage their own screenings"
ON public.prp_screenings FOR ALL
USING (clinician_id = auth.uid())
WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Admins can view all screenings"
ON public.prp_screenings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: evidence_dimensions
-- =====================================================
ALTER TABLE public.evidence_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage evidence dimensions"
ON public.evidence_dimensions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view evidence dimensions"
ON public.evidence_dimensions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- TABLE: patients
-- =====================================================
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can delete patients"
ON public.patients FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can delete their own patients"
ON public.patients FOR DELETE
USING ((auth.uid() IS NOT NULL) AND (professional_id = auth.uid()));

CREATE POLICY "Professionals can insert own patients"
ON public.patients FOR INSERT
WITH CHECK (is_healthcare_professional(auth.uid()));

CREATE POLICY "Professionals can insert their own patients"
ON public.patients FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND (professional_id = auth.uid()));

CREATE POLICY "Professionals can update own patients"
ON public.patients FOR UPDATE
USING ((professional_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can update their own patients"
ON public.patients FOR UPDATE
USING ((auth.uid() IS NOT NULL) AND (professional_id = auth.uid()));

CREATE POLICY "Professionals can view own patients"
ON public.patients FOR SELECT
USING ((professional_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can view their own patients"
ON public.patients FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (professional_id = auth.uid()));

-- =====================================================
-- TABLE: audit_logs
-- =====================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Healthcare professionals can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own audit logs"
ON public.audit_logs FOR SELECT
USING (user_id = auth.uid());

-- =====================================================
-- TABLE: registry_consents
-- =====================================================
ALTER TABLE public.registry_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage their patient registry consents"
ON public.registry_consents FOR ALL
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- =====================================================
-- TABLE: patient_documents
-- =====================================================
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can delete patient documents"
ON public.patient_documents FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can insert own patient documents"
ON public.patient_documents FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = patient_documents.patient_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Professionals can update own patient documents"
ON public.patient_documents FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = patient_documents.patient_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Professionals can view own patient documents"
ON public.patient_documents FOR SELECT
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = patient_documents.patient_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- =====================================================
-- TABLE: registry_access_logs
-- =====================================================
ALTER TABLE public.registry_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage access logs"
ON public.registry_access_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: patient_portal_access
-- =====================================================
ALTER TABLE public.patient_portal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage their patients portal access"
ON public.patient_portal_access FOR ALL
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- =====================================================
-- TABLE: partner_events
-- =====================================================
ALTER TABLE public.partner_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all partner events"
ON public.partner_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert partner events"
ON public.partner_events FOR INSERT
WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL));

-- =====================================================
-- TABLE: subscriptions
-- =====================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON public.subscriptions FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: registry_consent_audit
-- =====================================================
ALTER TABLE public.registry_consent_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all consent audit"
ON public.registry_consent_audit FOR SELECT
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals insert consent audit"
ON public.registry_consent_audit FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_consent_audit.registry_case_id AND rc.professional_id = auth.uid()
)));

CREATE POLICY "Professionals view own consent audit"
ON public.registry_consent_audit FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_consent_audit.registry_case_id AND rc.professional_id = auth.uid()
)));

-- =====================================================
-- TABLE: patient_consents
-- =====================================================
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can delete patient consents"
ON public.patient_consents FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can insert consents for own patients"
ON public.patient_consents FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = patient_consents.patient_id AND p.professional_id = auth.uid()
));

CREATE POLICY "Professionals can update consents for own patients"
ON public.patient_consents FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = patient_consents.patient_id AND p.professional_id = auth.uid()
));

CREATE POLICY "Professionals can view consents for own patients"
ON public.patient_consents FOR SELECT
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = patient_consents.patient_id AND p.professional_id = auth.uid()
));

-- =====================================================
-- TABLE: registry_labs
-- =====================================================
ALTER TABLE public.registry_labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all labs"
ON public.registry_labs FOR SELECT
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals insert own labs"
ON public.registry_labs FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_labs.registry_case_id AND rc.professional_id = auth.uid()
)));

CREATE POLICY "Professionals view own labs"
ON public.registry_labs FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_labs.registry_case_id AND rc.professional_id = auth.uid()
)));

-- =====================================================
-- TABLE: registry_engine_snapshots
-- =====================================================
ALTER TABLE public.registry_engine_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all snapshots"
ON public.registry_engine_snapshots FOR SELECT
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals insert own snapshots"
ON public.registry_engine_snapshots FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_engine_snapshots.registry_case_id AND rc.professional_id = auth.uid()
)));

CREATE POLICY "Professionals view own snapshots"
ON public.registry_engine_snapshots FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_engine_snapshots.registry_case_id AND rc.professional_id = auth.uid()
)));

-- =====================================================
-- TABLE: career_narratives
-- =====================================================
ALTER TABLE public.career_narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own narratives"
ON public.career_narratives FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own narratives"
ON public.career_narratives FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own narratives"
ON public.career_narratives FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: evidence_audit_log
-- =====================================================
ALTER TABLE public.evidence_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_audit_admin_select"
ON public.evidence_audit_log FOR SELECT
USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
));

CREATE POLICY "evidence_audit_insert_service"
ON public.evidence_audit_log FOR INSERT
WITH CHECK (auth.role() = 'service_role'::text);

-- =====================================================
-- TABLE: registry_consent_logs
-- =====================================================
ALTER TABLE public.registry_consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view consent logs"
ON public.registry_consent_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consent logs inserted via trigger"
ON public.registry_consent_logs FOR INSERT
WITH CHECK (changed_by = auth.uid());

-- =====================================================
-- TABLE: registry_lab_orders
-- =====================================================
ALTER TABLE public.registry_lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view lab orders"
ON public.registry_lab_orders FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage lab orders"
ON public.registry_lab_orders FOR ALL
USING (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_lab_orders.episode_id AND e.clinician_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_lab_orders.episode_id AND e.clinician_id = auth.uid()
));

-- =====================================================
-- TABLE: patient_procedures
-- =====================================================
ALTER TABLE public.patient_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Healthcare professionals can delete patient procedures"
ON public.patient_procedures FOR DELETE
USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY (ARRAY['admin'::app_role, 'professional'::app_role])
));

CREATE POLICY "Healthcare professionals can insert patient procedures"
ON public.patient_procedures FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY (ARRAY['admin'::app_role, 'professional'::app_role])
));

CREATE POLICY "Healthcare professionals can update patient procedures"
ON public.patient_procedures FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY (ARRAY['admin'::app_role, 'professional'::app_role])
));

CREATE POLICY "Healthcare professionals can view patient procedures"
ON public.patient_procedures FOR SELECT
USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY (ARRAY['admin'::app_role, 'professional'::app_role])
));

CREATE POLICY "Professionals can insert procedures for own patients"
ON public.patient_procedures FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = patient_procedures.patient_id AND p.professional_id = auth.uid()
));

CREATE POLICY "Professionals can update procedures for own patients"
ON public.patient_procedures FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = patient_procedures.patient_id AND p.professional_id = auth.uid()
));

CREATE POLICY "Professionals can view own patients procedures"
ON public.patient_procedures FOR SELECT
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = patient_procedures.patient_id AND p.professional_id = auth.uid()
));

-- =====================================================
-- TABLE: curadoria_articles
-- =====================================================
ALTER TABLE public.curadoria_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete articles"
ON public.curadoria_articles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert articles"
ON public.curadoria_articles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update articles"
ON public.curadoria_articles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can view curadoria articles"
ON public.curadoria_articles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view articles"
ON public.curadoria_articles FOR SELECT
USING (true);

CREATE POLICY "Only admins can delete curadoria articles"
ON public.curadoria_articles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert curadoria articles"
ON public.curadoria_articles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update curadoria articles"
ON public.curadoria_articles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: registry_cases
-- =====================================================
ALTER TABLE public.registry_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all registry cases"
ON public.registry_cases FOR SELECT
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals insert own registry cases"
ON public.registry_cases FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND (professional_id = auth.uid()));

CREATE POLICY "Professionals update own registry cases"
ON public.registry_cases FOR UPDATE
USING ((auth.uid() IS NOT NULL) AND (professional_id = auth.uid()));

CREATE POLICY "Professionals view own registry cases"
ON public.registry_cases FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (professional_id = auth.uid()));

CREATE POLICY "Research export access"
ON public.registry_cases FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'research'::app_role) OR (professional_id = auth.uid()));

-- =====================================================
-- TABLE: patient_prescriptions
-- =====================================================
ALTER TABLE public.patient_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage their prescriptions"
ON public.patient_prescriptions FOR ALL
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- =====================================================
-- TABLE: diligence_case_timelines
-- =====================================================
ALTER TABLE public.diligence_case_timelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own timelines"
ON public.diligence_case_timelines FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own timelines"
ON public.diligence_case_timelines FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: research_config
-- =====================================================
ALTER TABLE public.research_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage research config"
ON public.research_config FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update research config"
ON public.research_config FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view research config"
ON public.research_config FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: ultrasound_images
-- =====================================================
ALTER TABLE public.ultrasound_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can delete ultrasound images"
ON public.ultrasound_images FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can insert own patient ultrasound images"
ON public.ultrasound_images FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = ultrasound_images.patient_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Professionals can update own patient ultrasound images"
ON public.ultrasound_images FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = ultrasound_images.patient_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Professionals can view own patient ultrasound images"
ON public.ultrasound_images FOR SELECT
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = ultrasound_images.patient_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- =====================================================
-- TABLE: evidence_snapshots
-- =====================================================
ALTER TABLE public.evidence_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_snapshots_insert_service"
ON public.evidence_snapshots FOR INSERT
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "evidence_snapshots_select_k_anonymity"
ON public.evidence_snapshots FOR SELECT
USING (n_cases_total >= 10);

-- =====================================================
-- TABLE: registry_research_data_dictionary
-- =====================================================
ALTER TABLE public.registry_research_data_dictionary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read data dictionary"
ON public.registry_research_data_dictionary FOR SELECT
USING (true);

CREATE POLICY "Only admins can modify dictionary"
ON public.registry_research_data_dictionary FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: registry_lab_results
-- =====================================================
ALTER TABLE public.registry_lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view lab results"
ON public.registry_lab_results FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage lab results"
ON public.registry_lab_results FOR ALL
USING (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_lab_results.episode_id AND e.clinician_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_lab_results.episode_id AND e.clinician_id = auth.uid()
));

-- =====================================================
-- TABLE: consent_forms
-- =====================================================
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Healthcare professionals can insert consent forms"
ON public.consent_forms FOR INSERT
WITH CHECK (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update consent forms"
ON public.consent_forms FOR UPDATE
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can view consent forms"
ON public.consent_forms FOR SELECT
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete consent forms"
ON public.consent_forms FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: registry_triage_snapshots
-- =====================================================
ALTER TABLE public.registry_triage_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view triage snapshots"
ON public.registry_triage_snapshots FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage triage snapshots"
ON public.registry_triage_snapshots FOR ALL
USING (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_triage_snapshots.episode_id AND e.clinician_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_triage_snapshots.episode_id AND e.clinician_id = auth.uid()
));

-- =====================================================
-- TABLE: partners
-- =====================================================
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage partners"
ON public.partners FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active partners"
ON public.partners FOR SELECT
USING (is_active = true);

-- =====================================================
-- TABLE: patient_discharges
-- =====================================================
ALTER TABLE public.patient_discharges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Healthcare professionals can insert patient discharges"
ON public.patient_discharges FOR INSERT
WITH CHECK (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update patient discharges"
ON public.patient_discharges FOR UPDATE
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can view patient discharges"
ON public.patient_discharges FOR SELECT
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete patient discharges"
ON public.patient_discharges FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: registry_exports_log
-- =====================================================
ALTER TABLE public.registry_exports_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all export logs"
ON public.registry_exports_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Export log insert - admin/research only"
ON public.registry_exports_log FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'research'::app_role));

CREATE POLICY "Export log select - admin/research only"
ON public.registry_exports_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'research'::app_role));

CREATE POLICY "Research can insert export logs"
ON public.registry_exports_log FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'research'::app_role));

CREATE POLICY "Research can read export logs"
ON public.registry_exports_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'research'::app_role));

CREATE POLICY "Users can insert their own export logs"
ON public.registry_exports_log FOR INSERT
WITH CHECK (exported_by = auth.uid());

CREATE POLICY "Users can view their own export logs"
ON public.registry_exports_log FOR SELECT
USING (exported_by = auth.uid());

-- =====================================================
-- TABLE: research_export_snapshots
-- =====================================================
ALTER TABLE public.research_export_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage export snapshots"
ON public.research_export_snapshots FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Research users can view export snapshots"
ON public.research_export_snapshots FOR SELECT
USING (has_role(auth.uid(), 'research'::app_role));

-- =====================================================
-- TABLE: curation_registry_links
-- =====================================================
ALTER TABLE public.curation_registry_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curation_links_admin_manage"
ON public.curation_registry_links FOR ALL
USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
));

CREATE POLICY "curation_links_select_all"
ON public.curation_registry_links FOR SELECT
USING (true);

-- =====================================================
-- TABLE: career_alerts
-- =====================================================
ALTER TABLE public.career_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own career alerts"
ON public.career_alerts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career alerts"
ON public.career_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career alerts"
ON public.career_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own career alerts"
ON public.career_alerts FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: career_certifications
-- =====================================================
ALTER TABLE public.career_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own certifications"
ON public.career_certifications FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certifications"
ON public.career_certifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own certifications"
ON public.career_certifications FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: registry_followups
-- =====================================================
ALTER TABLE public.registry_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view followups"
ON public.registry_followups FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage followups"
ON public.registry_followups FOR ALL
USING (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_followups.episode_id AND e.clinician_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_followups.episode_id AND e.clinician_id = auth.uid()
));

-- =====================================================
-- TABLE: registry_procedures_performed
-- =====================================================
ALTER TABLE public.registry_procedures_performed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view procedures performed"
ON public.registry_procedures_performed FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage procedures performed"
ON public.registry_procedures_performed FOR ALL
USING (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_procedures_performed.episode_id AND e.clinician_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM registry_episodes e
    WHERE e.id = registry_procedures_performed.episode_id AND e.clinician_id = auth.uid()
));

-- =====================================================
-- TABLE: registry_longitudinal_followups
-- =====================================================
ALTER TABLE public.registry_longitudinal_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all followups"
ON public.registry_longitudinal_followups FOR SELECT
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals manage own followups"
ON public.registry_longitudinal_followups FOR ALL
USING ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_longitudinal_followups.registry_case_id AND rc.professional_id = auth.uid()
)));

CREATE POLICY "Professionals view own followups"
ON public.registry_longitudinal_followups FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_longitudinal_followups.registry_case_id AND rc.professional_id = auth.uid()
)));

-- =====================================================
-- TABLE: registry_audit_events
-- =====================================================
ALTER TABLE public.registry_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all audit events"
ON public.registry_audit_events FOR SELECT
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals view own audit events"
ON public.registry_audit_events FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((user_id = auth.uid()) OR (EXISTS (
    SELECT 1 FROM registry_cases rc
    WHERE rc.registry_case_id = registry_audit_events.registry_case_id AND rc.professional_id = auth.uid()
))));

CREATE POLICY "System insert audit events"
ON public.registry_audit_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- TABLE: career_metrics
-- =====================================================
ALTER TABLE public.career_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own career metrics"
ON public.career_metrics FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career metrics"
ON public.career_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career metrics"
ON public.career_metrics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own career metrics"
ON public.career_metrics FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: procedure_followups
-- =====================================================
ALTER TABLE public.procedure_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can delete their own followups"
ON public.procedure_followups FOR DELETE
USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can insert own followups"
ON public.procedure_followups FOR INSERT
WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can insert their own followups"
ON public.procedure_followups FOR INSERT
WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update own followups"
ON public.procedure_followups FOR UPDATE
USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update their own followups"
ON public.procedure_followups FOR UPDATE
USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can view own followups"
ON public.procedure_followups FOR SELECT
USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can view their own followups"
ON public.procedure_followups FOR SELECT
USING (clinician_id = auth.uid());

-- =====================================================
-- TABLE: user_profiles
-- =====================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: ortobiologicos_protocols
-- =====================================================
ALTER TABLE public.ortobiologicos_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Healthcare professionals can insert Ortobiologicos protocols"
ON public.ortobiologicos_protocols FOR INSERT
WITH CHECK (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update Ortobiologicos protocols"
ON public.ortobiologicos_protocols FOR UPDATE
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can view Ortobiologicos protocols"
ON public.ortobiologicos_protocols FOR SELECT
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete Ortobiologicos protocols"
ON public.ortobiologicos_protocols FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: treatment_sessions
-- =====================================================
ALTER TABLE public.treatment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Healthcare professionals can delete treatment sessions"
ON public.treatment_sessions FOR DELETE
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete treatment sessions"
ON public.treatment_sessions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can insert own patient treatment sessions"
ON public.treatment_sessions FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = treatment_sessions.patient_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Professionals can update own patient treatment sessions"
ON public.treatment_sessions FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = treatment_sessions.patient_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Professionals can view own patient treatment sessions"
ON public.treatment_sessions FOR SELECT
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = treatment_sessions.patient_id AND (p.professional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- =====================================================
-- TABLE: curadoria_requests
-- =====================================================
ALTER TABLE public.curadoria_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all curadoria requests"
ON public.curadoria_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create curadoria requests"
ON public.curadoria_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update curadoria requests"
ON public.curadoria_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own curadoria requests"
ON public.curadoria_requests FOR SELECT
USING (user_id = auth.uid());

-- =====================================================
-- TABLE: clinical_record_versions
-- =====================================================
ALTER TABLE public.clinical_record_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Healthcare professionals can insert clinical record versions"
ON public.clinical_record_versions FOR INSERT
WITH CHECK (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can view clinical record versions"
ON public.clinical_record_versions FOR SELECT
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete clinical record versions"
ON public.clinical_record_versions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: chat_messages
-- =====================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert messages in own conversations"
ON public.chat_messages FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id AND chat_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can view messages from own conversations"
ON public.chat_messages FOR SELECT
USING (EXISTS (
    SELECT 1 FROM chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id AND chat_conversations.user_id = auth.uid()
));

-- =====================================================
-- TABLE: clinical_records
-- =====================================================
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Healthcare professionals can delete clinical records"
ON public.clinical_records FOR DELETE
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert clinical records"
ON public.clinical_records FOR INSERT
WITH CHECK (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update clinical records"
ON public.clinical_records FOR UPDATE
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can view clinical records"
ON public.clinical_records FOR SELECT
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Professionals can insert clinical records for own patients"
ON public.clinical_records FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = clinical_records.patient_id AND p.professional_id = auth.uid()
));

CREATE POLICY "Professionals can update clinical records for own patients"
ON public.clinical_records FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = clinical_records.patient_id AND p.professional_id = auth.uid()
));

CREATE POLICY "Professionals can view own patients clinical records"
ON public.clinical_records FOR SELECT
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = clinical_records.patient_id AND p.professional_id = auth.uid()
));

-- =====================================================
-- TABLE: user_roles
-- =====================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- =====================================================
-- TABLE: chat_conversations
-- =====================================================
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete own conversations"
ON public.chat_conversations FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.chat_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations"
ON public.chat_conversations FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: registry_episodes
-- =====================================================
ALTER TABLE public.registry_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all episodes"
ON public.registry_episodes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can insert own patient episodes"
ON public.registry_episodes FOR INSERT
WITH CHECK ((clinician_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can manage their episodes"
ON public.registry_episodes FOR ALL
USING (clinician_id = auth.uid())
WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update own patient episodes"
ON public.registry_episodes FOR UPDATE
USING ((clinician_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinicians can view own patient episodes"
ON public.registry_episodes FOR SELECT
USING ((clinician_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete episodes"
ON public.registry_episodes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: blood_tests
-- =====================================================
ALTER TABLE public.blood_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Healthcare professionals can insert blood tests"
ON public.blood_tests FOR INSERT
WITH CHECK (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update blood tests"
ON public.blood_tests FOR UPDATE
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can view blood tests"
ON public.blood_tests FOR SELECT
USING (is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete blood tests"
ON public.blood_tests FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can delete blood tests for own patients"
ON public.blood_tests FOR DELETE
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = blood_tests.patient_id AND p.professional_id = auth.uid()
));

CREATE POLICY "Professionals can insert blood tests for own patients"
ON public.blood_tests FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = blood_tests.patient_id AND p.professional_id = auth.uid()
));

CREATE POLICY "Professionals can update blood tests for own patients"
ON public.blood_tests FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = blood_tests.patient_id AND p.professional_id = auth.uid()
));

CREATE POLICY "Professionals can view own patients blood tests"
ON public.blood_tests FOR SELECT
USING (EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = blood_tests.patient_id AND p.professional_id = auth.uid()
));

-- =====================================================
-- TABLE: diligence_checklists
-- =====================================================
ALTER TABLE public.diligence_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own checklists"
ON public.diligence_checklists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own non-immutable checklists"
ON public.diligence_checklists FOR UPDATE
USING ((auth.uid() = user_id) AND (immutable = false))
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own checklists"
ON public.diligence_checklists FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: career_opportunities
-- =====================================================
ALTER TABLE public.career_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own opportunities"
ON public.career_opportunities FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own opportunities"
ON public.career_opportunities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own opportunities"
ON public.career_opportunities FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own opportunities"
ON public.career_opportunities FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: diligence_compliance_logs
-- =====================================================
ALTER TABLE public.diligence_compliance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own compliance logs"
ON public.diligence_compliance_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own compliance logs"
ON public.diligence_compliance_logs FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: curadoria_content
-- =====================================================
ALTER TABLE public.curadoria_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view curadoria content"
ON public.curadoria_content FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage curadoria content"
ON public.curadoria_content FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- TABLE: curation_jobs
-- =====================================================
ALTER TABLE public.curation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can update curation jobs"
ON public.curation_jobs FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view curation jobs"
ON public.curation_jobs FOR SELECT
USING (true);


-- =====================================================
-- END OF POLICIES
-- =====================================================
