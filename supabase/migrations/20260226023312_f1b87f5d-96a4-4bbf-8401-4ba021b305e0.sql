
-- RLS policy for students to view published paper file metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'academy_paper_files' 
    AND policyname = 'Students can view published paper files'
  ) THEN
    CREATE POLICY "Students can view published paper files"
      ON public.academy_paper_files
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.academy_papers ap
          WHERE ap.id = academy_paper_files.paper_id
          AND ap.curation_status = 'published'
          AND ap.deleted_at IS NULL
        )
      );
  END IF;
END $$;

-- Storage policy for signed URLs on published papers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Students can read published paper PDFs'
  ) THEN
    CREATE POLICY "Students can read published paper PDFs"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'academy-papers'
        AND EXISTS (
          SELECT 1 FROM public.academy_paper_files apf
          JOIN public.academy_papers ap ON ap.id = apf.paper_id
          WHERE apf.storage_path = name
          AND ap.curation_status = 'published'
          AND ap.deleted_at IS NULL
        )
      );
  END IF;
END $$;
