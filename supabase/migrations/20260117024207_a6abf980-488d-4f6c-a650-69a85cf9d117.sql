-- ================================================
-- MENTOR ONBOARDING: Status + Audit + RLS
-- ================================================

-- 1) Create mentor_status enum
CREATE TYPE public.mentor_status AS ENUM ('pending_review', 'approved', 'rejected', 'suspended');

-- 2) Add new columns to mentors table
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS status public.mentor_status DEFAULT 'pending_review'::public.mentor_status,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS formation text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 3) Update existing mentors to approved status (they were already active)
UPDATE public.mentors SET status = 'approved' WHERE is_active = true;

-- 4) Create helper function to check if user is a mentor (owner of their profile)
CREATE OR REPLACE FUNCTION public.is_mentor_owner(_mentor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.mentors
    WHERE id = _mentor_id
      AND user_id = auth.uid()
  )
$$;

-- 5) Create helper function to get mentor by user_id
CREATE OR REPLACE FUNCTION public.get_mentor_by_user_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.mentors WHERE user_id = _user_id LIMIT 1
$$;

-- 6) Drop existing policies on mentors table
DROP POLICY IF EXISTS "Mentors are viewable by everyone" ON public.mentors;
DROP POLICY IF EXISTS "Mentors can update own profile" ON public.mentors;
DROP POLICY IF EXISTS "Admin can manage mentors" ON public.mentors;
DROP POLICY IF EXISTS "Anyone can view approved active mentors" ON public.mentors;
DROP POLICY IF EXISTS "Mentors can view own profile" ON public.mentors;
DROP POLICY IF EXISTS "Public can insert mentor applications" ON public.mentors;

-- 7) Enable RLS on mentors
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- 8) Create new RLS policies for mentors

-- Public: View only approved and active mentors (marketplace)
CREATE POLICY "Public can view approved mentors"
ON public.mentors
FOR SELECT
TO anon, authenticated
USING (status = 'approved' AND is_active = true);

-- Mentors: View their own profile (any status)
CREATE POLICY "Mentors can view own profile"
ON public.mentors
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Mentors: Update their own profile (except status)
CREATE POLICY "Mentors can update own profile"
ON public.mentors
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Public insert: Allow mentor applications (pending_review only)
CREATE POLICY "Anyone can apply as mentor"
ON public.mentors
FOR INSERT
TO authenticated
WITH CHECK (status = 'pending_review');

-- Admin: Full access to all mentors (using is_edu_admin with auth.uid())
CREATE POLICY "Admin can view all mentors"
ON public.mentors
FOR SELECT
TO authenticated
USING (public.is_edu_admin(auth.uid()));

CREATE POLICY "Admin can update any mentor"
ON public.mentors
FOR UPDATE
TO authenticated
USING (public.is_edu_admin(auth.uid()));

CREATE POLICY "Admin can delete mentors"
ON public.mentors
FOR DELETE
TO authenticated
USING (public.is_edu_admin(auth.uid()));

-- 9) Create function to check if current user is an approved mentor
CREATE OR REPLACE FUNCTION public.is_approved_mentor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.mentors
    WHERE user_id = auth.uid()
      AND status = 'approved'
      AND is_active = true
  )
$$;

-- 10) Create trigger to prevent mentors from changing their own status
CREATE OR REPLACE FUNCTION public.prevent_mentor_status_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is the mentor owner (not admin), prevent status change
  IF OLD.user_id = auth.uid() AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- Check if user is admin
    IF NOT public.is_edu_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Mentors cannot change their own status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_mentor_status_self_change_trigger ON public.mentors;
CREATE TRIGGER prevent_mentor_status_self_change_trigger
  BEFORE UPDATE ON public.mentors
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_mentor_status_self_change();