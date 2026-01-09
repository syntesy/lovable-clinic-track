
-- Add RLS policy for research_config - admin only table
CREATE POLICY "Admins can view research config"
ON public.research_config FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update research config"
ON public.research_config FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert research config"
ON public.research_config FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
