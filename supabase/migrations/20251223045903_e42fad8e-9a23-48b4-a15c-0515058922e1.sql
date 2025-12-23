-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Restringir acesso a dados médicos
-- Apenas profissionais de saúde (admin/professional) podem acessar
-- =====================================================

-- 1. BLOOD_TESTS - Exames de sangue
DROP POLICY IF EXISTS "Authenticated users can view blood tests" ON public.blood_tests;
DROP POLICY IF EXISTS "Authenticated users can insert blood tests" ON public.blood_tests;
DROP POLICY IF EXISTS "Authenticated users can update blood tests" ON public.blood_tests;
DROP POLICY IF EXISTS "Authenticated users can delete blood tests" ON public.blood_tests;

CREATE POLICY "Healthcare professionals can view blood tests"
ON public.blood_tests FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert blood tests"
ON public.blood_tests FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update blood tests"
ON public.blood_tests FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete blood tests"
ON public.blood_tests FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 2. CONSENT_FORMS - Termos de consentimento
DROP POLICY IF EXISTS "Authenticated users can view consent forms" ON public.consent_forms;
DROP POLICY IF EXISTS "Authenticated users can insert consent forms" ON public.consent_forms;
DROP POLICY IF EXISTS "Authenticated users can update consent forms" ON public.consent_forms;
DROP POLICY IF EXISTS "Authenticated users can delete consent forms" ON public.consent_forms;

CREATE POLICY "Healthcare professionals can view consent forms"
ON public.consent_forms FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert consent forms"
ON public.consent_forms FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update consent forms"
ON public.consent_forms FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete consent forms"
ON public.consent_forms FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 3. PATIENT_DOCUMENTS - Documentos do paciente
DROP POLICY IF EXISTS "Authenticated users can view patient documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Authenticated users can insert patient documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Authenticated users can update patient documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Authenticated users can delete patient documents" ON public.patient_documents;

CREATE POLICY "Healthcare professionals can view patient documents"
ON public.patient_documents FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert patient documents"
ON public.patient_documents FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update patient documents"
ON public.patient_documents FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete patient documents"
ON public.patient_documents FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 4. SESSION_IMAGES - Imagens de sessão
DROP POLICY IF EXISTS "Authenticated users can view session images" ON public.session_images;
DROP POLICY IF EXISTS "Authenticated users can insert session images" ON public.session_images;
DROP POLICY IF EXISTS "Authenticated users can update session images" ON public.session_images;
DROP POLICY IF EXISTS "Authenticated users can delete session images" ON public.session_images;

CREATE POLICY "Healthcare professionals can view session images"
ON public.session_images FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert session images"
ON public.session_images FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update session images"
ON public.session_images FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete session images"
ON public.session_images FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. THERMOGRAPHY_IMAGES - Imagens de termografia
DROP POLICY IF EXISTS "Authenticated users can view thermography images" ON public.thermography_images;
DROP POLICY IF EXISTS "Authenticated users can insert thermography images" ON public.thermography_images;
DROP POLICY IF EXISTS "Authenticated users can update thermography images" ON public.thermography_images;
DROP POLICY IF EXISTS "Authenticated users can delete thermography images" ON public.thermography_images;

CREATE POLICY "Healthcare professionals can view thermography images"
ON public.thermography_images FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert thermography images"
ON public.thermography_images FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update thermography images"
ON public.thermography_images FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete thermography images"
ON public.thermography_images FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 6. ULTRASOUND_IMAGES - Imagens de ultrassom
DROP POLICY IF EXISTS "Authenticated users can view ultrasound images" ON public.ultrasound_images;
DROP POLICY IF EXISTS "Authenticated users can insert ultrasound images" ON public.ultrasound_images;
DROP POLICY IF EXISTS "Authenticated users can update ultrasound images" ON public.ultrasound_images;
DROP POLICY IF EXISTS "Authenticated users can delete ultrasound images" ON public.ultrasound_images;

CREATE POLICY "Healthcare professionals can view ultrasound images"
ON public.ultrasound_images FOR SELECT
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can insert ultrasound images"
ON public.ultrasound_images FOR INSERT
WITH CHECK (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Healthcare professionals can update ultrasound images"
ON public.ultrasound_images FOR UPDATE
USING (public.is_healthcare_professional(auth.uid()));

CREATE POLICY "Only admins can delete ultrasound images"
ON public.ultrasound_images FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));