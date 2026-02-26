-- Add RLS policies for academy-papers bucket
-- Allow admin/teacher to upload
CREATE POLICY "Academy admin upload papers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'academy-papers'
  AND (
    is_academy_admin(auth.uid())
    OR has_academy_role(auth.uid(), 'teacher_approved')
    OR has_academy_role(auth.uid(), 'teacher_candidate')
  )
);

-- Allow admin/teacher to read papers
CREATE POLICY "Academy admin read papers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'academy-papers'
  AND (
    is_academy_admin(auth.uid())
    OR has_academy_role(auth.uid(), 'teacher_approved')
    OR has_academy_role(auth.uid(), 'teacher_candidate')
  )
);

-- Allow admin to delete papers
CREATE POLICY "Academy admin delete papers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'academy-papers'
  AND is_academy_admin(auth.uid())
);