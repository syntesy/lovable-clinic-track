
-- 8.1.1 Product → Articles
CREATE TABLE public.academy_product_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.academy_products(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.academy_articles(id),
  relation_type text NOT NULL DEFAULT 'supports' CHECK (relation_type IN ('supports','recommended','contrasts')),
  note text,
  order_index int DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, article_id)
);
CREATE INDEX idx_apa_product ON public.academy_product_articles(product_id);
CREATE INDEX idx_apa_article ON public.academy_product_articles(article_id);

-- 8.1.2 Product → Collections
CREATE TABLE public.academy_product_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.academy_products(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.academy_article_collections(id),
  order_index int DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, collection_id)
);
CREATE INDEX idx_apc_product ON public.academy_product_collections(product_id);
CREATE INDEX idx_apc_collection ON public.academy_product_collections(collection_id);

-- 8.1.3 Lesson → Articles
CREATE TABLE public.academy_lesson_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_course_lessons(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.academy_articles(id),
  relation_type text NOT NULL DEFAULT 'supports' CHECK (relation_type IN ('supports','recommended','contrasts')),
  note text,
  order_index int DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lesson_id, article_id)
);
CREATE INDEX idx_ala_lesson ON public.academy_lesson_articles(lesson_id);
CREATE INDEX idx_ala_article ON public.academy_lesson_articles(article_id);

-- Validation trigger: prevent linking unpublished/deleted articles
CREATE OR REPLACE FUNCTION public.validate_article_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_published boolean;
  v_deleted timestamptz;
BEGIN
  SELECT is_published, deleted_at INTO v_published, v_deleted
  FROM public.academy_articles WHERE id = NEW.article_id;
  
  IF v_published IS NULL THEN
    RAISE EXCEPTION 'Article not found';
  END IF;
  IF v_published = false THEN
    RAISE EXCEPTION 'Cannot link unpublished article';
  END IF;
  IF v_deleted IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot link deleted article';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_product_article
  BEFORE INSERT OR UPDATE ON public.academy_product_articles
  FOR EACH ROW EXECUTE FUNCTION public.validate_article_link();

CREATE TRIGGER trg_validate_lesson_article
  BEFORE INSERT OR UPDATE ON public.academy_lesson_articles
  FOR EACH ROW EXECUTE FUNCTION public.validate_article_link();

-- Validation trigger: prevent linking deleted collections
CREATE OR REPLACE FUNCTION public.validate_collection_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_deleted timestamptz;
BEGIN
  SELECT deleted_at INTO v_deleted
  FROM public.academy_article_collections WHERE id = NEW.collection_id;
  
  IF v_deleted IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot link deleted collection';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_product_collection
  BEFORE INSERT OR UPDATE ON public.academy_product_collections
  FOR EACH ROW EXECUTE FUNCTION public.validate_collection_link();

-- RLS
ALTER TABLE public.academy_product_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_articles ENABLE ROW LEVEL SECURITY;

-- academy_product_articles RLS
CREATE POLICY "Public read product articles for published products"
  ON public.academy_product_articles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_products p
      WHERE p.id = product_id AND p.status = 'published'
    )
  );

CREATE POLICY "Teacher manages own product articles"
  ON public.academy_product_articles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_products p
      WHERE p.id = product_id AND p.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_products p
      WHERE p.id = product_id AND p.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admin full access product articles"
  ON public.academy_product_articles FOR ALL TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- academy_product_collections RLS
CREATE POLICY "Public read product collections for published products"
  ON public.academy_product_collections FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_products p
      WHERE p.id = product_id AND p.status = 'published'
    )
  );

CREATE POLICY "Teacher manages own product collections"
  ON public.academy_product_collections FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_products p
      WHERE p.id = product_id AND p.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_products p
      WHERE p.id = product_id AND p.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admin full access product collections"
  ON public.academy_product_collections FOR ALL TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));

-- academy_lesson_articles RLS
CREATE POLICY "Read lesson articles if enrolled or teacher"
  ON public.academy_lesson_articles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_course_lessons cl
      JOIN public.academy_course_modules cm ON cm.id = cl.module_id
      JOIN public.academy_products p ON p.id = cm.product_id
      WHERE cl.id = lesson_id
      AND (
        p.teacher_id = auth.uid()
        OR public.is_academy_admin(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.academy_enrollments e
          WHERE e.product_id = p.id AND e.user_id = auth.uid() AND e.access_status = 'active'
        )
      )
    )
  );

CREATE POLICY "Teacher manages own lesson articles"
  ON public.academy_lesson_articles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_course_lessons cl
      JOIN public.academy_course_modules cm ON cm.id = cl.module_id
      JOIN public.academy_products p ON p.id = cm.product_id
      WHERE cl.id = lesson_id AND p.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_course_lessons cl
      JOIN public.academy_course_modules cm ON cm.id = cl.module_id
      JOIN public.academy_products p ON p.id = cm.product_id
      WHERE cl.id = lesson_id AND p.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admin full access lesson articles"
  ON public.academy_lesson_articles FOR ALL TO authenticated
  USING (public.is_academy_admin(auth.uid()))
  WITH CHECK (public.is_academy_admin(auth.uid()));
