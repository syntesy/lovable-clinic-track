
-- Storage bucket for paper PDFs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-papers', 'academy-papers', false)
ON CONFLICT (id) DO NOTHING;

-- Table for paper file uploads
CREATE TABLE IF NOT EXISTS public.academy_paper_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.academy_papers(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_paper_files_paper_id ON public.academy_paper_files(paper_id);

-- Table for extracted full text (for audit trail)
CREATE TABLE IF NOT EXISTS public.academy_paper_fulltext (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.academy_papers(id) ON DELETE CASCADE UNIQUE,
  extracted_text text NOT NULL,
  char_count int,
  extraction_method text DEFAULT 'pdf-parse',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for academy_paper_files
ALTER TABLE public.academy_paper_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_paper_files" ON public.academy_paper_files
  FOR ALL USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "teacher_insert_paper_files" ON public.academy_paper_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_user_roles
      WHERE user_id = auth.uid() AND role IN ('teacher_approved', 'teacher_candidate')
    )
  );

CREATE POLICY "teacher_select_paper_files" ON public.academy_paper_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.academy_user_roles
      WHERE user_id = auth.uid() AND role IN ('teacher_approved', 'teacher_candidate')
    )
  );

-- RLS for academy_paper_fulltext
ALTER TABLE public.academy_paper_fulltext ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_paper_fulltext" ON public.academy_paper_fulltext
  FOR ALL USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "teacher_select_paper_fulltext" ON public.academy_paper_fulltext
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.academy_user_roles
      WHERE user_id = auth.uid() AND role IN ('teacher_approved', 'teacher_candidate')
    )
  );

-- Storage RLS policies
CREATE POLICY "admin_teacher_upload_papers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'academy-papers' AND (
      public.is_academy_admin(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.academy_user_roles
        WHERE user_id = auth.uid() AND role IN ('teacher_approved', 'teacher_candidate')
      )
    )
  );

CREATE POLICY "admin_teacher_read_papers" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'academy-papers' AND (
      public.is_academy_admin(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.academy_user_roles
        WHERE user_id = auth.uid() AND role IN ('teacher_approved', 'teacher_candidate')
      )
    )
  );
