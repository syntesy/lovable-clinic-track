-- Add UPDATE policy for storage.objects on attendance-files bucket
-- This allows users to update their own files if needed

CREATE POLICY "Users can update their attendance files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'attendance-files'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'attendance-files'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);