-- Drop all mentorship_enrollments policies first
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.mentorship_enrollments;
DROP POLICY IF EXISTS "Admins can update all enrollments" ON public.mentorship_enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.mentorship_enrollments;
DROP POLICY IF EXISTS "Students can create own enrollments" ON public.mentorship_enrollments;
DROP POLICY IF EXISTS "Mentors can view enrollments for their mentorships" ON public.mentorship_enrollments;
DROP POLICY IF EXISTS "Mentors can update enrollments for their mentorships" ON public.mentorship_enrollments;

-- Recreate mentorship_enrollments policies
CREATE POLICY "Students can view own enrollments"
ON public.mentorship_enrollments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Students can create own enrollments"
ON public.mentorship_enrollments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentors can view enrollments for their mentorships"
ON public.mentorship_enrollments FOR SELECT TO authenticated
USING (public.is_mentorship_owner(auth.uid(), mentorship_id));

CREATE POLICY "Mentors can update enrollments for their mentorships"
ON public.mentorship_enrollments FOR UPDATE TO authenticated
USING (public.is_mentorship_owner(auth.uid(), mentorship_id));

CREATE POLICY "Admins can view all enrollments"
ON public.mentorship_enrollments FOR SELECT TO authenticated
USING (public.is_edu_admin(auth.uid()));

CREATE POLICY "Admins can update all enrollments"
ON public.mentorship_enrollments FOR UPDATE TO authenticated
USING (public.is_edu_admin(auth.uid()));