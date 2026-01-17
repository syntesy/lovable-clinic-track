-- Add status column to mentorships (draft | published | paused)
ALTER TABLE public.mentorships ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused'));

-- Add stripe_price_id column to mentorships
ALTER TABLE public.mentorships ADD COLUMN stripe_price_id TEXT;

-- Add stripe_session_id to mentorship_enrollments  
ALTER TABLE public.mentorship_enrollments ADD COLUMN stripe_session_id TEXT;

-- Helper function to check if user owns a mentorship via their mentor profile
CREATE OR REPLACE FUNCTION public.is_mentorship_owner(_user_id uuid, _mentor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mentors
    WHERE id = _mentor_id
    AND user_id = _user_id
    AND is_active = true
  )
$$;

-- MENTORSHIPS POLICIES

-- Only mentors can insert their own mentorships
CREATE POLICY "Mentors insert own mentorships"
ON public.mentorships
FOR INSERT
TO authenticated
WITH CHECK (public.is_mentorship_owner(auth.uid(), mentor_id));

-- Mentors can update their own mentorships
CREATE POLICY "Mentors update own mentorships"
ON public.mentorships
FOR UPDATE
TO authenticated
USING (public.is_mentorship_owner(auth.uid(), mentor_id))
WITH CHECK (public.is_mentorship_owner(auth.uid(), mentor_id));

-- Admins can update any mentorship (for publishing)
CREATE POLICY "Admins update any mentorship"
ON public.mentorships
FOR UPDATE
TO authenticated
USING (public.is_edu_admin(auth.uid()))
WITH CHECK (public.is_edu_admin(auth.uid()));

-- Admins can delete any mentorship
CREATE POLICY "Admins delete any mentorship"
ON public.mentorships
FOR DELETE
TO authenticated
USING (public.is_edu_admin(auth.uid()));

-- Students only see published mentorships, mentors see their own, admins see all
CREATE POLICY "Select published or owned mentorships"
ON public.mentorships
FOR SELECT
TO authenticated
USING (
  status = 'published' 
  OR public.is_mentorship_owner(auth.uid(), mentor_id) 
  OR public.is_edu_admin(auth.uid())
);

-- MENTORSHIP SESSIONS POLICIES

-- Mentors can insert sessions for their mentorships
CREATE POLICY "Mentors insert own sessions"
ON public.mentorship_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mentorships m 
    WHERE m.id = mentorship_id 
    AND public.is_mentorship_owner(auth.uid(), m.mentor_id)
  )
);

-- Mentors can update sessions for their mentorships
CREATE POLICY "Mentors update own sessions"
ON public.mentorship_sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mentorships m 
    WHERE m.id = mentorship_id 
    AND public.is_mentorship_owner(auth.uid(), m.mentor_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mentorships m 
    WHERE m.id = mentorship_id 
    AND public.is_mentorship_owner(auth.uid(), m.mentor_id)
  )
);

-- View sessions for published mentorships or owned
CREATE POLICY "Select published or owned sessions"
ON public.mentorship_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mentorships m 
    WHERE m.id = mentorship_id 
    AND (
      m.status = 'published' 
      OR public.is_mentorship_owner(auth.uid(), m.mentor_id)
      OR public.is_edu_admin(auth.uid())
    )
  )
);

-- Index for status filtering
CREATE INDEX idx_mentorships_status ON public.mentorships(status);