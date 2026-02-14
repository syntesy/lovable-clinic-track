
-- Fix 1: Make patient-photos bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'patient-photos';

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view patient photos" ON storage.objects;

-- Create authenticated-only policy
CREATE POLICY "Authenticated users can view patient photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-photos' 
  AND auth.uid() IS NOT NULL
);

-- Fix 2: Clean up duplicate user_profiles policies
-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "Users can insert only their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Drop all existing UPDATE policies
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Recreate clean policies (authenticated role only)
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
