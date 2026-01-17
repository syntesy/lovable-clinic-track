-- Create edu_modules table (sem FK para views)
CREATE TABLE IF NOT EXISTS public.edu_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  cohort_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create edu_learning_objects table
CREATE TABLE IF NOT EXISTS public.edu_learning_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  module_id UUID REFERENCES public.edu_modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  object_type TEXT NOT NULL DEFAULT 'article',
  content_url TEXT,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.edu_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_learning_objects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for edu_modules
CREATE POLICY "Institution members can view modules"
ON public.edu_modules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.edu_institution_members m
    WHERE m.institution_id = edu_modules.institution_id
    AND m.user_id = auth.uid()
    AND m.status = 'active'
  )
);

CREATE POLICY "Teachers and admins can manage modules"
ON public.edu_modules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.edu_institution_members m
    WHERE m.institution_id = edu_modules.institution_id
    AND m.user_id = auth.uid()
    AND m.role IN ('teacher', 'director', 'admin')
    AND m.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.edu_institution_members m
    WHERE m.institution_id = edu_modules.institution_id
    AND m.user_id = auth.uid()
    AND m.role IN ('teacher', 'director', 'admin')
    AND m.status = 'active'
  )
);

-- RLS Policies for edu_learning_objects
CREATE POLICY "Institution members can view learning objects"
ON public.edu_learning_objects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.edu_institution_members m
    WHERE m.institution_id = edu_learning_objects.institution_id
    AND m.user_id = auth.uid()
    AND m.status = 'active'
  )
);

CREATE POLICY "Teachers and admins can manage learning objects"
ON public.edu_learning_objects FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.edu_institution_members m
    WHERE m.institution_id = edu_learning_objects.institution_id
    AND m.user_id = auth.uid()
    AND m.role IN ('teacher', 'director', 'admin')
    AND m.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.edu_institution_members m
    WHERE m.institution_id = edu_learning_objects.institution_id
    AND m.user_id = auth.uid()
    AND m.role IN ('teacher', 'director', 'admin')
    AND m.status = 'active'
  )
);

-- Create indexes
CREATE INDEX idx_edu_modules_institution ON public.edu_modules(institution_id);
CREATE INDEX idx_edu_modules_cohort ON public.edu_modules(cohort_id);
CREATE INDEX idx_edu_learning_objects_institution ON public.edu_learning_objects(institution_id);
CREATE INDEX idx_edu_learning_objects_module ON public.edu_learning_objects(module_id);