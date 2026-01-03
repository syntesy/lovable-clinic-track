-- =====================================================
-- FIX 1: patients table - Add explicit auth check
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Professionals can view their own patients" ON public.patients;
DROP POLICY IF EXISTS "Professionals can insert their own patients" ON public.patients;
DROP POLICY IF EXISTS "Professionals can update their own patients" ON public.patients;
DROP POLICY IF EXISTS "Professionals can delete their own patients" ON public.patients;

-- Recreate with explicit auth.uid() IS NOT NULL check
CREATE POLICY "Professionals can view their own patients" 
ON public.patients 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND professional_id = auth.uid());

CREATE POLICY "Professionals can insert their own patients" 
ON public.patients 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND professional_id = auth.uid());

CREATE POLICY "Professionals can update their own patients" 
ON public.patients 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL AND professional_id = auth.uid());

CREATE POLICY "Professionals can delete their own patients" 
ON public.patients 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL AND professional_id = auth.uid());

-- =====================================================
-- FIX 2: user_profiles - Consolidate duplicate policies
-- =====================================================

-- Drop all existing policies to consolidate
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;

-- Create consolidated, clear policies
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- =====================================================
-- FIX 3: prp_screenings - Add explicit auth check
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Professionals can view screenings of their patients" ON public.prp_screenings;
DROP POLICY IF EXISTS "Professionals can insert screenings for their patients" ON public.prp_screenings;
DROP POLICY IF EXISTS "Professionals can update screenings of their patients" ON public.prp_screenings;
DROP POLICY IF EXISTS "Professionals can delete screenings of their patients" ON public.prp_screenings;

-- Recreate with explicit auth.uid() IS NOT NULL check
CREATE POLICY "Professionals can view screenings of their patients" 
ON public.prp_screenings 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert screenings for their patients" 
ON public.prp_screenings 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update screenings of their patients" 
ON public.prp_screenings 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND p.professional_id = auth.uid()
  )
);

CREATE POLICY "Professionals can delete screenings of their patients" 
ON public.prp_screenings 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND p.professional_id = auth.uid()
  )
);

-- =====================================================
-- FIX 4: registry_case_summary_v1_1 - Add RLS
-- Note: This is likely a VIEW, need to enable security_invoker
-- =====================================================

-- If it's a view, we need to recreate it with security_invoker = true
-- This ensures the view respects RLS of underlying tables
ALTER VIEW IF EXISTS public.registry_case_summary_v1_1 SET (security_invoker = true);