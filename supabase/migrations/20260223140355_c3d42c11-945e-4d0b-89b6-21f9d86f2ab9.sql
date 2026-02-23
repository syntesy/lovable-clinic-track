
-- ============================================
-- ACADEMY PRODUCTS - Central marketplace entity
-- ============================================
CREATE TABLE public.academy_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('course','mentorship','subscription')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','published','archived')),
  title text NOT NULL,
  subtitle text,
  description text NOT NULL,
  category text,
  cover_image_url text,
  language text DEFAULT 'pt-BR',
  price_cents integer,
  currency text DEFAULT 'BRL',
  access_policy text DEFAULT 'lifetime' CHECK (access_policy IN ('lifetime','time_limited')),
  access_days integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_academy_products_teacher ON public.academy_products(teacher_id);
CREATE INDEX idx_academy_products_status ON public.academy_products(status);
CREATE INDEX idx_academy_products_type ON public.academy_products(type);
CREATE INDEX idx_academy_products_search ON public.academy_products USING gin(to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description,'')));

ALTER TABLE public.academy_products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COURSE MODULES
-- ============================================
CREATE TABLE public.academy_course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.academy_products(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.academy_course_modules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COURSE LESSONS
-- ============================================
CREATE TABLE public.academy_course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  video_url text,
  duration_seconds integer,
  is_free_preview boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.academy_course_lessons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LESSON ASSETS
-- ============================================
CREATE TABLE public.academy_lesson_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_course_lessons(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('pdf','slides','attachment')),
  title text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.academy_lesson_assets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MENTORSHIP COHORTS
-- ============================================
CREATE TABLE public.academy_mentorship_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.academy_products(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_at timestamptz,
  end_at timestamptz,
  capacity integer,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','ongoing','completed','canceled')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.academy_mentorship_cohorts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MENTORSHIP SESSIONS
-- ============================================
CREATE TABLE public.academy_mentorship_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.academy_mentorship_cohorts(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_at timestamptz,
  meeting_url text,
  recording_url text,
  notes text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.academy_mentorship_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SUBSCRIPTION POSTS
-- ============================================
CREATE TABLE public.academy_subscription_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.academy_products(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  video_url text,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.academy_subscription_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCT REVIEW NOTES (Admin feedback)
-- ============================================
CREATE TABLE public.academy_product_review_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.academy_products(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.academy_product_review_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.is_teacher_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_user_roles
    WHERE user_id = _user_id AND role = 'teacher_approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.owns_academy_product(_user_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_products
    WHERE id = _product_id AND teacher_id = _user_id
  )
$$;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER set_academy_products_updated_at
  BEFORE UPDATE ON public.academy_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- ANTI-ESCALATION: Teacher cannot set status to published
-- ============================================
CREATE OR REPLACE FUNCTION public.prevent_teacher_publish()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    IF NOT public.is_academy_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only academy admins can publish products';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_teacher_publish
  BEFORE UPDATE ON public.academy_products
  FOR EACH ROW EXECUTE FUNCTION public.prevent_teacher_publish();

-- ============================================
-- RLS POLICIES: academy_products
-- ============================================

-- Students: read published only
CREATE POLICY "Anyone can view published products"
  ON public.academy_products FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Teacher: read own products (any status)
CREATE POLICY "Teachers can view own products"
  ON public.academy_products FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Teacher: insert own products
CREATE POLICY "Teachers can create products"
  ON public.academy_products FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND
    public.is_teacher_approved(auth.uid())
  );

-- Teacher: update own draft/in_review products
CREATE POLICY "Teachers can update own draft products"
  ON public.academy_products FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid() AND
    status IN ('draft','in_review')
  )
  WITH CHECK (
    teacher_id = auth.uid()
  );

-- Admin: full access
CREATE POLICY "Admins full access products"
  ON public.academy_products FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- ============================================
-- RLS: course modules (inherit from product ownership)
-- ============================================
CREATE POLICY "View modules of accessible products"
  ON public.academy_course_modules FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_products p
    WHERE p.id = product_id AND (p.status = 'published' OR p.teacher_id = auth.uid() OR public.is_academy_admin(auth.uid()))
  ));

CREATE POLICY "Teachers manage own modules"
  ON public.academy_course_modules FOR ALL
  TO authenticated
  USING (public.owns_academy_product(auth.uid(), product_id))
  WITH CHECK (public.owns_academy_product(auth.uid(), product_id));

CREATE POLICY "Admins manage all modules"
  ON public.academy_course_modules FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- ============================================
-- RLS: course lessons
-- ============================================
CREATE POLICY "View lessons of accessible modules"
  ON public.academy_course_lessons FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_course_modules m
    JOIN public.academy_products p ON p.id = m.product_id
    WHERE m.id = module_id AND (p.status = 'published' OR p.teacher_id = auth.uid() OR public.is_academy_admin(auth.uid()))
  ));

CREATE POLICY "Teachers manage own lessons"
  ON public.academy_course_lessons FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_course_modules m
    JOIN public.academy_products p ON p.id = m.product_id
    WHERE m.id = module_id AND p.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.academy_course_modules m
    JOIN public.academy_products p ON p.id = m.product_id
    WHERE m.id = module_id AND p.teacher_id = auth.uid()
  ));

CREATE POLICY "Admins manage all lessons"
  ON public.academy_course_lessons FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- ============================================
-- RLS: lesson assets
-- ============================================
CREATE POLICY "View assets of accessible lessons"
  ON public.academy_lesson_assets FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_course_lessons l
    JOIN public.academy_course_modules m ON m.id = l.module_id
    JOIN public.academy_products p ON p.id = m.product_id
    WHERE l.id = lesson_id AND (p.status = 'published' OR p.teacher_id = auth.uid() OR public.is_academy_admin(auth.uid()))
  ));

CREATE POLICY "Teachers manage own assets"
  ON public.academy_lesson_assets FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_course_lessons l
    JOIN public.academy_course_modules m ON m.id = l.module_id
    JOIN public.academy_products p ON p.id = m.product_id
    WHERE l.id = lesson_id AND p.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.academy_course_lessons l
    JOIN public.academy_course_modules m ON m.id = l.module_id
    JOIN public.academy_products p ON p.id = m.product_id
    WHERE l.id = lesson_id AND p.teacher_id = auth.uid()
  ));

CREATE POLICY "Admins manage all assets"
  ON public.academy_lesson_assets FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- ============================================
-- RLS: mentorship cohorts
-- ============================================
CREATE POLICY "View cohorts of accessible products"
  ON public.academy_mentorship_cohorts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_products p
    WHERE p.id = product_id AND (p.status = 'published' OR p.teacher_id = auth.uid() OR public.is_academy_admin(auth.uid()))
  ));

CREATE POLICY "Teachers manage own cohorts"
  ON public.academy_mentorship_cohorts FOR ALL
  TO authenticated
  USING (public.owns_academy_product(auth.uid(), product_id))
  WITH CHECK (public.owns_academy_product(auth.uid(), product_id));

CREATE POLICY "Admins manage all cohorts"
  ON public.academy_mentorship_cohorts FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- ============================================
-- RLS: mentorship sessions
-- ============================================
CREATE POLICY "View sessions of accessible cohorts"
  ON public.academy_mentorship_sessions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_mentorship_cohorts c
    JOIN public.academy_products p ON p.id = c.product_id
    WHERE c.id = cohort_id AND (p.status = 'published' OR p.teacher_id = auth.uid() OR public.is_academy_admin(auth.uid()))
  ));

CREATE POLICY "Teachers manage own sessions"
  ON public.academy_mentorship_sessions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_mentorship_cohorts c
    JOIN public.academy_products p ON p.id = c.product_id
    WHERE c.id = cohort_id AND p.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.academy_mentorship_cohorts c
    JOIN public.academy_products p ON p.id = c.product_id
    WHERE c.id = cohort_id AND p.teacher_id = auth.uid()
  ));

CREATE POLICY "Admins manage all sessions"
  ON public.academy_mentorship_sessions FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- ============================================
-- RLS: subscription posts
-- ============================================
CREATE POLICY "View published posts of published products"
  ON public.academy_subscription_posts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.academy_products p
    WHERE p.id = product_id AND (p.status = 'published' OR p.teacher_id = auth.uid() OR public.is_academy_admin(auth.uid()))
  ));

CREATE POLICY "Teachers manage own posts"
  ON public.academy_subscription_posts FOR ALL
  TO authenticated
  USING (public.owns_academy_product(auth.uid(), product_id))
  WITH CHECK (public.owns_academy_product(auth.uid(), product_id));

CREATE POLICY "Admins manage all posts"
  ON public.academy_subscription_posts FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- ============================================
-- RLS: review notes
-- ============================================
CREATE POLICY "Teachers view own product notes"
  ON public.academy_product_review_notes FOR SELECT
  TO authenticated
  USING (public.owns_academy_product(auth.uid(), product_id));

CREATE POLICY "Admins manage review notes"
  ON public.academy_product_review_notes FOR ALL
  TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));
