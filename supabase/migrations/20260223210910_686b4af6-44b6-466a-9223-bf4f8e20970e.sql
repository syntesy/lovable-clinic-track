
-- Fix: drop the existing policy first then recreate
DROP POLICY IF EXISTS "Public collections readable" ON public.academy_article_collections;

CREATE POLICY "Public collections readable"
  ON public.academy_article_collections FOR SELECT TO authenticated
  USING (is_public = true AND deleted_at IS NULL);

-- 7.1.3 TOPIC FOLLOWS
CREATE TABLE IF NOT EXISTS public.academy_topic_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_type text NOT NULL CHECK (topic_type IN ('intervention', 'pathology', 'keyword')),
  topic_value text NOT NULL CHECK (length(trim(topic_value)) > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic_type, topic_value)
);
CREATE INDEX IF NOT EXISTS idx_academy_topic_follows_user ON public.academy_topic_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_topic_follows_topic ON public.academy_topic_follows(topic_type, topic_value);

ALTER TABLE public.academy_topic_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own topic follows"
  ON public.academy_topic_follows FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7.1.4 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.academy_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_article', 'new_official_collection', 'collection_updated')),
  title text NOT NULL,
  body text,
  link_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_academy_notifications_user ON public.academy_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_notifications_unread ON public.academy_notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.academy_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.academy_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.academy_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System inserts notifications"
  ON public.academy_notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Notification trigger for article publish
CREATE OR REPLACE FUNCTION public.notify_topic_followers_on_article()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  follower RECORD;
BEGIN
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    FOR follower IN
      SELECT DISTINCT tf.user_id
      FROM public.academy_topic_follows tf
      WHERE (tf.topic_type = 'intervention' AND tf.topic_value = ANY(COALESCE(NEW.interventions, '{}')))
         OR (tf.topic_type = 'pathology' AND tf.topic_value = ANY(COALESCE(NEW.pathologies, '{}')))
         OR (tf.topic_type = 'keyword' AND tf.topic_value = ANY(COALESCE(NEW.keywords, '{}')))
    LOOP
      INSERT INTO public.academy_notifications (user_id, type, title, body, link_url)
      VALUES (
        follower.user_id,
        'new_article',
        'Novo artigo: ' || left(NEW.title, 80),
        left(NEW.summary_short, 200),
        '/academy/biblioteca'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_article_publish ON public.academy_articles;
CREATE TRIGGER trg_notify_on_article_publish
  AFTER INSERT OR UPDATE OF is_published ON public.academy_articles
  FOR EACH ROW EXECUTE FUNCTION public.notify_topic_followers_on_article();
