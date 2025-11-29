-- Fix RLS policies for all medical data tables
-- Replace public access (true) with authenticated user access (auth.uid() IS NOT NULL)

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.patients;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.blood_tests;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.clinical_records;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.consent_forms;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.mac_protocols;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.patient_discharges;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.patient_documents;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.reference_protocols;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.session_images;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.thermography_images;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.treatment_sessions;
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.ultrasound_images;

-- Create secure policies requiring authentication for patients table
CREATE POLICY "Authenticated users can view all patients"
ON public.patients FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert patients"
ON public.patients FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update patients"
ON public.patients FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete patients"
ON public.patients FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for blood_tests
CREATE POLICY "Authenticated users can view blood tests"
ON public.blood_tests FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert blood tests"
ON public.blood_tests FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update blood tests"
ON public.blood_tests FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete blood tests"
ON public.blood_tests FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for clinical_records
CREATE POLICY "Authenticated users can view clinical records"
ON public.clinical_records FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert clinical records"
ON public.clinical_records FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clinical records"
ON public.clinical_records FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete clinical records"
ON public.clinical_records FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for consent_forms
CREATE POLICY "Authenticated users can view consent forms"
ON public.consent_forms FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert consent forms"
ON public.consent_forms FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update consent forms"
ON public.consent_forms FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete consent forms"
ON public.consent_forms FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for mac_protocols
CREATE POLICY "Authenticated users can view MAC protocols"
ON public.mac_protocols FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert MAC protocols"
ON public.mac_protocols FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update MAC protocols"
ON public.mac_protocols FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete MAC protocols"
ON public.mac_protocols FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for patient_discharges
CREATE POLICY "Authenticated users can view patient discharges"
ON public.patient_discharges FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert patient discharges"
ON public.patient_discharges FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update patient discharges"
ON public.patient_discharges FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete patient discharges"
ON public.patient_discharges FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for patient_documents
CREATE POLICY "Authenticated users can view patient documents"
ON public.patient_documents FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert patient documents"
ON public.patient_documents FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update patient documents"
ON public.patient_documents FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete patient documents"
ON public.patient_documents FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for reference_protocols
CREATE POLICY "Authenticated users can view reference protocols"
ON public.reference_protocols FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert reference protocols"
ON public.reference_protocols FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update reference protocols"
ON public.reference_protocols FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete reference protocols"
ON public.reference_protocols FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for session_images
CREATE POLICY "Authenticated users can view session images"
ON public.session_images FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert session images"
ON public.session_images FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update session images"
ON public.session_images FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete session images"
ON public.session_images FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for thermography_images
CREATE POLICY "Authenticated users can view thermography images"
ON public.thermography_images FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert thermography images"
ON public.thermography_images FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update thermography images"
ON public.thermography_images FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete thermography images"
ON public.thermography_images FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for treatment_sessions
CREATE POLICY "Authenticated users can view treatment sessions"
ON public.treatment_sessions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert treatment sessions"
ON public.treatment_sessions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update treatment sessions"
ON public.treatment_sessions FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete treatment sessions"
ON public.treatment_sessions FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create secure policies for ultrasound_images
CREATE POLICY "Authenticated users can view ultrasound images"
ON public.ultrasound_images FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert ultrasound images"
ON public.ultrasound_images FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ultrasound images"
ON public.ultrasound_images FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete ultrasound images"
ON public.ultrasound_images FOR DELETE
USING (auth.uid() IS NOT NULL);