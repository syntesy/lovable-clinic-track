
-- 1. Add Stripe columns to academy_products
ALTER TABLE public.academy_products
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- 2. Academy Teacher Profiles (Stripe Connect)
CREATE TABLE IF NOT EXISTS public.academy_teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_account_id text,
  stripe_onboarding_status text NOT NULL DEFAULT 'not_started'
    CHECK (stripe_onboarding_status IN ('not_started','pending','complete','restricted')),
  stripe_payouts_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_teacher_profiles_user ON public.academy_teacher_profiles(user_id);

ALTER TABLE public.academy_teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_own_profile_select" ON public.academy_teacher_profiles
  FOR SELECT USING (user_id = auth.uid() OR public.is_academy_admin(auth.uid()));
CREATE POLICY "teacher_own_profile_update" ON public.academy_teacher_profiles
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "teacher_own_profile_insert" ON public.academy_teacher_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_teacher_profiles_all" ON public.academy_teacher_profiles
  FOR ALL USING (public.is_academy_admin(auth.uid()));

-- 3. Academy Orders
CREATE TABLE IF NOT EXISTS public.academy_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.academy_products(id) ON DELETE CASCADE,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','refunded','failed','canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_orders_user ON public.academy_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_orders_product ON public.academy_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_academy_orders_status ON public.academy_orders(status);

ALTER TABLE public.academy_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_orders_select" ON public.academy_orders
  FOR SELECT USING (user_id = auth.uid() OR public.is_academy_admin(auth.uid()));
CREATE POLICY "admin_orders_all" ON public.academy_orders
  FOR ALL USING (public.is_academy_admin(auth.uid()));

-- 4. Academy Payment Events (idempotency log)
CREATE TABLE IF NOT EXISTS public.academy_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.academy_orders(id) ON DELETE SET NULL,
  stripe_event_id text UNIQUE NOT NULL,
  type text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_payment_events" ON public.academy_payment_events
  FOR ALL USING (public.is_academy_admin(auth.uid()));

-- 5. Academy Subscriptions
CREATE TABLE IF NOT EXISTS public.academy_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.academy_products(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','past_due','canceled')),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_subs_user ON public.academy_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_subs_product ON public.academy_subscriptions(product_id);

ALTER TABLE public.academy_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_subs_select" ON public.academy_subscriptions
  FOR SELECT USING (user_id = auth.uid() OR public.is_academy_admin(auth.uid()));
CREATE POLICY "admin_subs_all" ON public.academy_subscriptions
  FOR ALL USING (public.is_academy_admin(auth.uid()));
