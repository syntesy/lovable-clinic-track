-- ===========================================
-- REGEN ACADEMY: Mentorias e Mentores
-- ===========================================

-- Tabela de Mentores (podem ser usuários ou cadastros externos)
CREATE TABLE public.mentors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    photo_url TEXT,
    specialty TEXT NOT NULL,
    headline TEXT,
    bio TEXT,
    clinical_areas TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Mentorias
CREATE TABLE public.mentorships (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    target_audience TEXT,
    topics TEXT[],
    clinical_area TEXT,
    modality TEXT NOT NULL DEFAULT 'online',
    type TEXT NOT NULL DEFAULT 'individual',
    price_cents INTEGER NOT NULL DEFAULT 0,
    max_spots INTEGER,
    duration_minutes INTEGER DEFAULT 60,
    meeting_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sessões de mentoria (datas específicas)
CREATE TABLE public.mentorship_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mentorship_id UUID NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    spots_available INTEGER,
    status TEXT NOT NULL DEFAULT 'scheduled',
    meeting_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inscrições em mentorias
CREATE TABLE public.mentorship_enrollments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentorship_id UUID NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.mentorship_sessions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    stripe_payment_id TEXT,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, session_id)
);

-- Enable RLS
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_enrollments ENABLE ROW LEVEL SECURITY;

-- Function para verificar se é admin/diretor
CREATE OR REPLACE FUNCTION public.is_edu_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.edu_institution_members
    WHERE user_id = _user_id
    AND role IN ('admin', 'director')
    AND status = 'active'
  )
$$;

-- Function para verificar se é mentor
CREATE OR REPLACE FUNCTION public.is_mentor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mentors
    WHERE user_id = _user_id
    AND is_active = true
  )
$$;

-- Policies para mentors
CREATE POLICY "Active mentors are viewable by everyone"
ON public.mentors FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can insert mentors"
ON public.mentors FOR INSERT
TO authenticated
WITH CHECK (public.is_edu_admin(auth.uid()));

CREATE POLICY "Admins can update mentors"
ON public.mentors FOR UPDATE
TO authenticated
USING (public.is_edu_admin(auth.uid()));

CREATE POLICY "Admins can delete mentors"
ON public.mentors FOR DELETE
TO authenticated
USING (public.is_edu_admin(auth.uid()));

-- Policies para mentorships
CREATE POLICY "Active mentorships are viewable by everyone"
ON public.mentorships FOR SELECT
USING (is_active = true);

CREATE POLICY "Mentors can manage their own mentorships"
ON public.mentorships FOR INSERT
TO authenticated
WITH CHECK (
    mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
    OR public.is_edu_admin(auth.uid())
);

CREATE POLICY "Mentors can update their own mentorships"
ON public.mentorships FOR UPDATE
TO authenticated
USING (
    mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
    OR public.is_edu_admin(auth.uid())
);

CREATE POLICY "Admins can delete mentorships"
ON public.mentorships FOR DELETE
TO authenticated
USING (public.is_edu_admin(auth.uid()));

-- Policies para sessions
CREATE POLICY "Sessions are viewable by everyone"
ON public.mentorship_sessions FOR SELECT
USING (true);

CREATE POLICY "Mentors and admins can manage sessions"
ON public.mentorship_sessions FOR ALL
TO authenticated
USING (
    mentorship_id IN (
        SELECT m.id FROM public.mentorships m
        JOIN public.mentors mt ON m.mentor_id = mt.id
        WHERE mt.user_id = auth.uid()
    )
    OR public.is_edu_admin(auth.uid())
);

-- Policies para enrollments
CREATE POLICY "Users can view their own enrollments"
ON public.mentorship_enrollments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all enrollments"
ON public.mentorship_enrollments FOR SELECT
TO authenticated
USING (public.is_edu_admin(auth.uid()) OR public.is_mentor(auth.uid()));

CREATE POLICY "Users can create their own enrollments"
ON public.mentorship_enrollments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollments"
ON public.mentorship_enrollments FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_edu_admin(auth.uid()));

-- Indexes para performance
CREATE INDEX idx_mentors_slug ON public.mentors(slug);
CREATE INDEX idx_mentors_user_id ON public.mentors(user_id);
CREATE INDEX idx_mentorships_slug ON public.mentorships(slug);
CREATE INDEX idx_mentorships_mentor_id ON public.mentorships(mentor_id);
CREATE INDEX idx_mentorships_clinical_area ON public.mentorships(clinical_area);
CREATE INDEX idx_mentorship_sessions_mentorship_id ON public.mentorship_sessions(mentorship_id);
CREATE INDEX idx_mentorship_sessions_scheduled_at ON public.mentorship_sessions(scheduled_at);
CREATE INDEX idx_mentorship_enrollments_user_id ON public.mentorship_enrollments(user_id);
CREATE INDEX idx_mentorship_enrollments_mentorship_id ON public.mentorship_enrollments(mentorship_id);

-- Trigger para updated_at
CREATE TRIGGER update_mentors_updated_at
BEFORE UPDATE ON public.mentors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorships_updated_at
BEFORE UPDATE ON public.mentorships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();