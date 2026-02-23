
-- ===== ACADEMY ENROLLMENTS =====
CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.academy_products(id) ON DELETE CASCADE,
  access_status text NOT NULL DEFAULT 'active' CHECK (access_status IN ('active','expired','refunded','canceled')),
  access_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_enrollment_active_unique ON public.academy_enrollments (user_id, product_id) WHERE access_status = 'active';
CREATE INDEX idx_enrollments_user ON public.academy_enrollments (user_id);
CREATE INDEX idx_enrollments_product ON public.academy_enrollments (product_id);

ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;

-- Student: SELECT own enrollments only
CREATE POLICY "Students can view own enrollments"
  ON public.academy_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Teacher: SELECT enrollments for own products
CREATE POLICY "Teachers can view enrollments for own products"
  ON public.academy_enrollments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_products ap
      WHERE ap.id = product_id AND ap.teacher_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "Admin full access enrollments"
  ON public.academy_enrollments FOR ALL TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- ===== ACADEMY LESSON PROGRESS =====
CREATE TABLE public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.academy_course_lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  progress_seconds integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user ON public.academy_lesson_progress (user_id);
CREATE INDEX idx_lesson_progress_lesson ON public.academy_lesson_progress (lesson_id);

ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Student: CRUD own progress
CREATE POLICY "Users manage own lesson progress"
  ON public.academy_lesson_progress FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin: full access
CREATE POLICY "Admin full access lesson progress"
  ON public.academy_lesson_progress FOR ALL TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- ===== STORAGE BUCKETS =====
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('academy-videos', 'academy-videos', false, 524288000, ARRAY['video/mp4','video/webm','video/quicktime']),
  ('academy-files', 'academy-files', false, 52428800, ARRAY['application/pdf','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','image/png','image/jpeg','image/webp']);

-- Storage RLS: teacher_approved can upload to own product folders
CREATE POLICY "Teachers upload academy videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy-videos' AND
    public.has_academy_role(auth.uid(), 'teacher_approved')
  );

CREATE POLICY "Teachers upload academy files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy-files' AND
    public.has_academy_role(auth.uid(), 'teacher_approved')
  );

-- Admin can upload too
CREATE POLICY "Admin upload academy videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy-videos' AND
    public.is_academy_admin(auth.uid())
  );

CREATE POLICY "Admin upload academy files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy-files' AND
    public.is_academy_admin(auth.uid())
  );

-- Read via signed URLs (authenticated users)
CREATE POLICY "Authenticated read academy videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'academy-videos');

CREATE POLICY "Authenticated read academy files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'academy-files');

-- Teachers can update/delete own uploads
CREATE POLICY "Teachers manage own academy videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'academy-videos' AND public.has_academy_role(auth.uid(), 'teacher_approved'));

CREATE POLICY "Teachers delete own academy videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'academy-videos' AND public.has_academy_role(auth.uid(), 'teacher_approved'));

CREATE POLICY "Teachers manage own academy files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'academy-files' AND public.has_academy_role(auth.uid(), 'teacher_approved'));

CREATE POLICY "Teachers delete own academy files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'academy-files' AND public.has_academy_role(auth.uid(), 'teacher_approved'));

-- ===== ADMIN GRANT ENROLLMENT FUNCTION =====
CREATE OR REPLACE FUNCTION public.admin_grant_enrollment(p_user_id uuid, p_product_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id uuid;
  v_access_policy text;
  v_access_days integer;
  v_expires_at timestamptz;
BEGIN
  -- Only admin can grant
  IF NOT public.is_academy_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin_academy role required';
  END IF;

  -- Get product access policy
  SELECT access_policy, access_days INTO v_access_policy, v_access_days
  FROM public.academy_products WHERE id = p_product_id AND status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or not published';
  END IF;

  -- Calculate expiration
  IF v_access_policy = 'time_limited' AND v_access_days IS NOT NULL THEN
    v_expires_at := now() + (v_access_days || ' days')::interval;
  END IF;

  -- Cancel any existing active enrollment first
  UPDATE public.academy_enrollments
  SET access_status = 'canceled'
  WHERE user_id = p_user_id AND product_id = p_product_id AND access_status = 'active';

  -- Create new enrollment
  INSERT INTO public.academy_enrollments (user_id, product_id, access_status, access_expires_at)
  VALUES (p_user_id, p_product_id, 'active', v_expires_at)
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;
