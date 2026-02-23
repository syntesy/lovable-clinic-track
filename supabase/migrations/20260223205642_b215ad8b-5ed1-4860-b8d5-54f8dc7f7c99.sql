
-- ============================================
-- ACADEMY ARTICLES TABLE
-- ============================================
CREATE TABLE public.academy_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authors text,
  journal text,
  year int NOT NULL CHECK (year >= 1900),
  study_type text NOT NULL,
  interventions text[] DEFAULT '{}',
  pathologies text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  pubmed_url text,
  doi_url text,
  abstract_text text,
  summary_short text NOT NULL,
  summary_full text,
  effect_summary text,
  limitations text[],
  follow_up text,
  external_id text,
  ai_summary text,
  evidence_score numeric,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT false,
  deleted_at timestamptz NULL,
  -- Full-text search vector
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(summary_short, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(summary_full, '')), 'C')
  ) STORED,
  -- At least one link required (enforced via trigger)
  CONSTRAINT academy_articles_link_check CHECK (pubmed_url IS NOT NULL OR doi_url IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_academy_articles_year ON public.academy_articles (year);
CREATE INDEX idx_academy_articles_study_type ON public.academy_articles (study_type);
CREATE INDEX idx_academy_articles_interventions ON public.academy_articles USING GIN (interventions);
CREATE INDEX idx_academy_articles_pathologies ON public.academy_articles USING GIN (pathologies);
CREATE INDEX idx_academy_articles_keywords ON public.academy_articles USING GIN (keywords);
CREATE INDEX idx_academy_articles_search_vector ON public.academy_articles USING GIN (search_vector);
CREATE INDEX idx_academy_articles_published ON public.academy_articles (is_published, deleted_at);

-- Updated_at trigger
CREATE TRIGGER set_academy_articles_updated_at
  BEFORE UPDATE ON public.academy_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.academy_articles ENABLE ROW LEVEL SECURITY;

-- Students/Teachers: read only published, non-deleted
CREATE POLICY "Published articles readable by authenticated"
  ON public.academy_articles FOR SELECT TO authenticated
  USING (
    (is_published = true AND deleted_at IS NULL)
    OR public.is_academy_admin(auth.uid())
  );

-- Admin: full CRUD
CREATE POLICY "Admin can insert articles"
  ON public.academy_articles FOR INSERT TO authenticated
  WITH CHECK (public.is_academy_admin(auth.uid()));

CREATE POLICY "Admin can update articles"
  ON public.academy_articles FOR UPDATE TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

CREATE POLICY "Admin can delete articles"
  ON public.academy_articles FOR DELETE TO authenticated
  USING (public.is_academy_admin(auth.uid()));

-- ============================================
-- ARTICLE COLLECTIONS
-- ============================================
CREATE TABLE public.academy_article_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz NULL
);

CREATE TRIGGER set_academy_collections_updated_at
  BEFORE UPDATE ON public.academy_article_collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.academy_article_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own collections"
  ON public.academy_article_collections FOR ALL TO authenticated
  USING (owner_user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Public collections readable"
  ON public.academy_article_collections FOR SELECT TO authenticated
  USING (is_public = true AND deleted_at IS NULL);

-- ============================================
-- COLLECTION ITEMS
-- ============================================
CREATE TABLE public.academy_article_collection_items (
  collection_id uuid REFERENCES public.academy_article_collections(id) ON DELETE CASCADE,
  article_id uuid REFERENCES public.academy_articles(id) ON DELETE CASCADE,
  order_index int DEFAULT 0,
  PRIMARY KEY (collection_id, article_id)
);

CREATE INDEX idx_collection_items_collection ON public.academy_article_collection_items (collection_id);
CREATE INDEX idx_collection_items_article ON public.academy_article_collection_items (article_id);

ALTER TABLE public.academy_article_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection items follow collection access"
  ON public.academy_article_collection_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_article_collections c
      WHERE c.id = collection_id
      AND (c.owner_user_id = auth.uid() OR c.is_public = true)
      AND c.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_article_collections c
      WHERE c.id = collection_id
      AND c.owner_user_id = auth.uid()
      AND c.deleted_at IS NULL
    )
  );

-- Validation trigger: arrays cannot contain empty strings
CREATE OR REPLACE FUNCTION public.validate_academy_article()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove empty strings from arrays
  NEW.interventions := array_remove(NEW.interventions, '');
  NEW.pathologies := array_remove(NEW.pathologies, '');
  NEW.keywords := array_remove(NEW.keywords, '');
  IF NEW.limitations IS NOT NULL THEN
    NEW.limitations := array_remove(NEW.limitations, '');
  END IF;
  
  -- Validate publication requirements
  IF NEW.is_published = true THEN
    IF NEW.pubmed_url IS NULL AND NEW.doi_url IS NULL THEN
      RAISE EXCEPTION 'Cannot publish article without a valid link (pubmed_url or doi_url)';
    END IF;
    IF NEW.title IS NULL OR trim(NEW.title) = '' THEN
      RAISE EXCEPTION 'Cannot publish article without a title';
    END IF;
    IF NEW.summary_short IS NULL OR trim(NEW.summary_short) = '' THEN
      RAISE EXCEPTION 'Cannot publish article without summary_short';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_academy_article_trigger
  BEFORE INSERT OR UPDATE ON public.academy_articles
  FOR EACH ROW EXECUTE FUNCTION public.validate_academy_article();
