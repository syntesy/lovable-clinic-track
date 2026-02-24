
-- 1) Add tsvector column to academy_papers for full-text search
ALTER TABLE public.academy_papers
  ADD COLUMN IF NOT EXISTS tsv tsvector
    GENERATED ALWAYS AS (
      to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(abstract_text, ''))
    ) STORED;

-- GIN index on tsvector
CREATE INDEX IF NOT EXISTS idx_academy_papers_tsv ON public.academy_papers USING GIN (tsv);

-- 2) Add evidence score columns
ALTER TABLE public.academy_papers
  ADD COLUMN IF NOT EXISTS evidence_score int,
  ADD COLUMN IF NOT EXISTS evidence_label text,
  ADD COLUMN IF NOT EXISTS evidence_notes text;

-- 3) Create academy_pubmed_watchlists table
CREATE TABLE IF NOT EXISTS public.academy_pubmed_watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  query text NOT NULL,
  frequency text NOT NULL DEFAULT 'weekly',
  last_run_at timestamptz,
  last_run_results jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_pubmed_watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage watchlists" ON public.academy_pubmed_watchlists
  FOR ALL USING (public.is_academy_admin(auth.uid()));

-- 4) Create hybrid_match_papers RPC
CREATE OR REPLACE FUNCTION public.hybrid_match_papers(
  query_text text,
  query_embedding vector(1536),
  match_count int,
  allowed_statuses text[]
)
RETURNS TABLE (
  paper_id uuid,
  paper_title text,
  paper_year int,
  paper_journal text,
  paper_doi text,
  paper_pmid text,
  paper_warnings text[],
  paper_curation_data jsonb,
  score_final float,
  source text,
  best_chunks jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ts_query tsquery;
BEGIN
  -- Build tsquery from input
  ts_query := plainto_tsquery('portuguese', query_text);

  RETURN QUERY
  WITH vector_results AS (
    SELECT
      c.paper_id,
      1 - (c.embedding::vector <=> query_embedding) AS similarity,
      jsonb_build_object('chunk_id', c.id, 'content', c.content, 'similarity', 1 - (c.embedding::vector <=> query_embedding)) AS chunk_info
    FROM academy_chunks c
    JOIN academy_papers p ON p.id = c.paper_id
    WHERE p.curation_status = ANY(allowed_statuses)
      AND p.deleted_at IS NULL
    ORDER BY c.embedding::vector <=> query_embedding
    LIMIT 50
  ),
  vector_agg AS (
    SELECT
      vr.paper_id,
      MAX(vr.similarity) AS max_similarity,
      jsonb_agg(vr.chunk_info ORDER BY vr.similarity DESC) AS chunks
    FROM vector_results vr
    GROUP BY vr.paper_id
  ),
  fts_results AS (
    SELECT
      p.id AS paper_id,
      ts_rank_cd(p.tsv, ts_query) AS fts_rank
    FROM academy_papers p
    WHERE p.tsv @@ ts_query
      AND p.curation_status = ANY(allowed_statuses)
      AND p.deleted_at IS NULL
    ORDER BY ts_rank_cd(p.tsv, ts_query) DESC
    LIMIT 50
  ),
  fts_norm AS (
    SELECT
      f.paper_id,
      CASE WHEN MAX(f.fts_rank) OVER () > 0
        THEN f.fts_rank / MAX(f.fts_rank) OVER ()
        ELSE 0
      END AS norm_rank
    FROM fts_results f
  ),
  combined AS (
    SELECT
      COALESCE(v.paper_id, f.paper_id) AS paper_id,
      COALESCE(v.max_similarity, 0) AS score_vec,
      COALESCE(f.norm_rank, 0) AS score_fts,
      0.7 * COALESCE(v.max_similarity, 0) + 0.3 * COALESCE(f.norm_rank, 0) AS combined_score,
      CASE
        WHEN v.paper_id IS NOT NULL AND f.paper_id IS NOT NULL THEN 'both'
        WHEN v.paper_id IS NOT NULL THEN 'vector'
        ELSE 'fts'
      END AS match_source,
      COALESCE(v.chunks, '[]'::jsonb) AS best_chunks
    FROM vector_agg v
    FULL OUTER JOIN fts_norm f ON v.paper_id = f.paper_id
  )
  SELECT
    c.paper_id,
    p.title,
    p.year,
    p.journal,
    p.doi,
    p.pmid,
    p.warnings,
    p.curation_data,
    c.combined_score,
    c.match_source,
    c.best_chunks
  FROM combined c
  JOIN academy_papers p ON p.id = c.paper_id
  ORDER BY c.combined_score DESC
  LIMIT match_count;
END;
$$;
