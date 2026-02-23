
-- 5.1 Webhook failures / dead-letter table
CREATE TABLE public.academy_webhook_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb,
  error_message text,
  failed_at timestamptz NOT NULL DEFAULT now(),
  retry_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'failed' CHECK (status IN ('failed','reprocessed','ignored'))
);

ALTER TABLE public.academy_webhook_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_webhook_failures" ON public.academy_webhook_failures
  FOR ALL USING (public.is_academy_admin(auth.uid()));

-- 5.2 Disputes table
CREATE TABLE public.academy_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.academy_orders(id),
  stripe_dispute_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'needs_response' CHECK (status IN ('needs_response','warning_needs_response','won','lost')),
  amount_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'brl',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_disputes" ON public.academy_disputes
  FOR ALL USING (public.is_academy_admin(auth.uid()));

-- Add 'disputed' to academy_orders status (we use text so just document it)

-- 5.7 Audit log table
CREATE TABLE public.academy_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_audit_log" ON public.academy_audit_log
  FOR SELECT USING (public.is_academy_admin(auth.uid()));
CREATE POLICY "service_insert_audit_log" ON public.academy_audit_log
  FOR INSERT WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_academy_audit_log_action ON public.academy_audit_log(action);
CREATE INDEX idx_academy_audit_log_entity ON public.academy_audit_log(entity_type, entity_id);
CREATE INDEX idx_academy_webhook_failures_status ON public.academy_webhook_failures(status);
CREATE INDEX idx_academy_disputes_order ON public.academy_disputes(order_id);
