
-- 1. Create academy_role enum
CREATE TYPE public.academy_role AS ENUM ('student', 'teacher_candidate', 'teacher_approved', 'admin_academy');

-- 2. Create academy_user_roles table
CREATE TABLE public.academy_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role academy_role NOT NULL DEFAULT 'student',
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.academy_user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create teacher_applications table
CREATE TABLE public.teacher_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  formation TEXT NOT NULL,
  professional_registration TEXT NOT NULL,
  clinical_area TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  links JSONB DEFAULT '{}',
  course_proposal_title TEXT NOT NULL,
  course_proposal_summary TEXT NOT NULL,
  course_proposal_audience TEXT NOT NULL,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_changes')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;

-- 4. Helper function: check academy role
CREATE OR REPLACE FUNCTION public.has_academy_role(_user_id UUID, _role academy_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Helper function: check if user is academy admin
CREATE OR REPLACE FUNCTION public.is_academy_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_user_roles
    WHERE user_id = _user_id AND role = 'admin_academy'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- 6. Auto-assign student role on signup
CREATE OR REPLACE FUNCTION public.assign_default_academy_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.academy_user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_academy_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_academy_role();

-- 7. RLS policies for academy_user_roles
CREATE POLICY "Users can view their own roles"
  ON public.academy_user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Academy admins can view all roles"
  ON public.academy_user_roles FOR SELECT
  USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "Academy admins can manage roles"
  ON public.academy_user_roles FOR INSERT
  WITH CHECK (public.is_academy_admin(auth.uid()));

CREATE POLICY "Academy admins can update roles"
  ON public.academy_user_roles FOR UPDATE
  USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "Academy admins can delete roles"
  ON public.academy_user_roles FOR DELETE
  USING (public.is_academy_admin(auth.uid()));

-- 8. RLS policies for teacher_applications
CREATE POLICY "Users can view their own applications"
  ON public.teacher_applications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own applications"
  ON public.teacher_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending applications"
  ON public.teacher_applications FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('pending', 'needs_changes'));

CREATE POLICY "Academy admins can view all applications"
  ON public.teacher_applications FOR SELECT
  USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "Academy admins can update applications"
  ON public.teacher_applications FOR UPDATE
  USING (public.is_academy_admin(auth.uid()));

-- 9. Updated_at trigger
CREATE TRIGGER update_teacher_applications_updated_at
  BEFORE UPDATE ON public.teacher_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_academy_user_roles_updated_at
  BEFORE UPDATE ON public.academy_user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
