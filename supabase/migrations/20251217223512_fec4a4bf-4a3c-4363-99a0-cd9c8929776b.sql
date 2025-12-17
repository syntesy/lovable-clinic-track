-- Create storage bucket for exam files
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-files', 'exam-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for exam files
CREATE POLICY "Authenticated users can upload exam files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exam-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view exam files"
ON storage.objects FOR SELECT
USING (bucket_id = 'exam-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete exam files"
ON storage.objects FOR DELETE
USING (bucket_id = 'exam-files' AND auth.uid() IS NOT NULL);

-- Add attached_files column to prp_lab_results
ALTER TABLE public.prp_lab_results
ADD COLUMN IF NOT EXISTS attached_files jsonb DEFAULT '[]'::jsonb;

-- Add extracted_text column to prp_lab_results
ALTER TABLE public.prp_lab_results
ADD COLUMN IF NOT EXISTS extracted_text text;