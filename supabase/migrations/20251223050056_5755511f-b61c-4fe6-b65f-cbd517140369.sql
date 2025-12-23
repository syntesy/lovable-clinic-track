-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Restringir mais tabelas médicas
-- =====================================================

-- 1. EPI_PROTOCOLS
DROP POLICY IF EXISTS "Authenticated users can view EPI protocols" ON public.epi_protocols;
DROP POLICY IF EXISTS "Authenticated users can insert EPI protocols" ON public.epi_protocols;
DROP POLICY IF EXISTS "Authenticated users can update EPI protocols" ON public.epi_protocols;
DROP POLICY IF EXISTS "Authenticated users can delete EPI protocols" ON public.epi_protocols;

CREATE POLICY "Healthcare professionals can view EPI protocols"
ON public.epi_protocols FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert EPI protocols"
ON public.epi_protocols FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update EPI protocols"
ON public.epi_protocols FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete EPI protocols"
ON public.epi_protocols FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 2. ORTOBIOLOGICOS_PROTOCOLS
DROP POLICY IF EXISTS "Authenticated users can view Ortobiologicos protocols" ON public.ortobiologicos_protocols;
DROP POLICY IF EXISTS "Authenticated users can insert Ortobiologicos protocols" ON public.ortobiologicos_protocols;
DROP POLICY IF EXISTS "Authenticated users can update Ortobiologicos protocols" ON public.ortobiologicos_protocols;
DROP POLICY IF EXISTS "Authenticated users can delete Ortobiologicos protocols" ON public.ortobiologicos_protocols;

CREATE POLICY "Healthcare professionals can view Ortobiologicos protocols"
ON public.ortobiologicos_protocols FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert Ortobiologicos protocols"
ON public.ortobiologicos_protocols FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update Ortobiologicos protocols"
ON public.ortobiologicos_protocols FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete Ortobiologicos protocols"
ON public.ortobiologicos_protocols FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 3. PRP_LAB_RESULTS
DROP POLICY IF EXISTS "Authenticated users can view prp lab results" ON public.prp_lab_results;
DROP POLICY IF EXISTS "Authenticated users can insert prp lab results" ON public.prp_lab_results;
DROP POLICY IF EXISTS "Authenticated users can update prp lab results" ON public.prp_lab_results;
DROP POLICY IF EXISTS "Authenticated users can delete prp lab results" ON public.prp_lab_results;

CREATE POLICY "Healthcare professionals can view prp lab results"
ON public.prp_lab_results FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert prp lab results"
ON public.prp_lab_results FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update prp lab results"
ON public.prp_lab_results FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete prp lab results"
ON public.prp_lab_results FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 4. PATIENT_DISCHARGES
DROP POLICY IF EXISTS "Authenticated users can view patient discharges" ON public.patient_discharges;
DROP POLICY IF EXISTS "Authenticated users can insert patient discharges" ON public.patient_discharges;
DROP POLICY IF EXISTS "Authenticated users can update patient discharges" ON public.patient_discharges;
DROP POLICY IF EXISTS "Authenticated users can delete patient discharges" ON public.patient_discharges;

CREATE POLICY "Healthcare professionals can view patient discharges"
ON public.patient_discharges FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert patient discharges"
ON public.patient_discharges FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update patient discharges"
ON public.patient_discharges FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete patient discharges"
ON public.patient_discharges FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. CLINICAL_RECORD_VERSIONS (restringir a profissionais)
DROP POLICY IF EXISTS "Authenticated users can manage versions" ON public.clinical_record_versions;

CREATE POLICY "Healthcare professionals can view clinical record versions"
ON public.clinical_record_versions FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert clinical record versions"
ON public.clinical_record_versions FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update clinical record versions"
ON public.clinical_record_versions FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete clinical record versions"
ON public.clinical_record_versions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 6. PATIENT_CONSENTS (restringir a profissionais)
DROP POLICY IF EXISTS "Authenticated users can manage consents" ON public.patient_consents;

CREATE POLICY "Healthcare professionals can view patient consents"
ON public.patient_consents FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert patient consents"
ON public.patient_consents FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update patient consents"
ON public.patient_consents FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete patient consents"
ON public.patient_consents FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));