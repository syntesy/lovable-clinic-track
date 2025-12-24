-- Create storage bucket for article PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('articles', 'articles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for articles bucket
CREATE POLICY "Admins can upload article PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'articles' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update article PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'articles' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete article PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'articles' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view article PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'articles');

-- Add pdf_path and abstract columns to curadoria_articles if not exists
ALTER TABLE public.curadoria_articles 
ADD COLUMN IF NOT EXISTS pdf_path TEXT,
ADD COLUMN IF NOT EXISTS abstract TEXT;

-- Update RLS policies for curadoria_articles
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view articles" ON public.curadoria_articles;
DROP POLICY IF EXISTS "Admins can insert articles" ON public.curadoria_articles;
DROP POLICY IF EXISTS "Admins can update articles" ON public.curadoria_articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON public.curadoria_articles;

-- Enable RLS
ALTER TABLE public.curadoria_articles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Anyone can view articles" 
ON public.curadoria_articles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can insert articles" 
ON public.curadoria_articles 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles" 
ON public.curadoria_articles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles" 
ON public.curadoria_articles 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));