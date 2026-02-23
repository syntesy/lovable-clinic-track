
-- Fix the permissive INSERT policy - only allow via admin
DROP POLICY IF EXISTS "System inserts notifications" ON public.academy_notifications;

CREATE POLICY "Admin inserts notifications"
  ON public.academy_notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_academy_admin(auth.uid()));
