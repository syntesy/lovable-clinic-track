
-- Add unique constraint for subscription upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_academy_subs_user_product ON public.academy_subscriptions(user_id, product_id);
