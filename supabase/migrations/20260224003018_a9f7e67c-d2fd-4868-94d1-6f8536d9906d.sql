
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create academy_chunks table
CREATE TABLE public.academy_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.academy_papers(id) ON DELETE CASCADE,
  source_part TEXT NOT NULL DEFAULT 'abstract',
  chunk_index INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding extensions.vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_academy_chunks_paper_id ON public.academy_chunks(paper_id);
CREATE INDEX idx_academy_chunks_embedding ON public.academy_chunks USING hnsw (embedding extensions.vector_cosine_ops);

ALTER TABLE public.academy_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chunks"
  ON public.academy_chunks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage chunks"
  ON public.academy_chunks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_user_roles
      WHERE user_id = auth.uid() AND role = 'admin_academy'
    )
  );

-- RPC for vector similarity search
CREATE OR REPLACE FUNCTION public.match_academy_chunks(
  query_embedding extensions.vector(1536),
  match_count INT DEFAULT 8,
  allowed_statuses TEXT[] DEFAULT ARRAY['published']
)
RETURNS TABLE (
  id UUID,
  paper_id UUID,
  content TEXT,
  similarity FLOAT,
  paper_title TEXT,
  paper_authors TEXT,
  paper_year INT,
  paper_journal TEXT,
  paper_doi TEXT,
  paper_pmid TEXT,
  paper_status TEXT
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    c.id,
    c.paper_id,
    c.content,
    1 - (c.embedding <=> query_embedding)::float AS similarity,
    p.title AS paper_title,
    p.authors AS paper_authors,
    p.year AS paper_year,
    p.journal AS paper_journal,
    p.doi AS paper_doi,
    p.pmid AS paper_pmid,
    p.curation_status::text AS paper_status
  FROM academy_chunks c
  JOIN academy_papers p ON p.id = c.paper_id
  WHERE p.curation_status::text = ANY(allowed_statuses)
    AND p.deleted_at IS NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
