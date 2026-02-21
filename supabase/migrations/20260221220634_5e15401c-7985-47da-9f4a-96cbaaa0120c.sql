
-- 1) FIX RLS: Remove permissive policy and create correct one
DROP POLICY IF EXISTS "select_protocols_for_clinic" ON public.protocols;

CREATE POLICY "select_protocols_for_clinic" ON public.protocols
FOR SELECT USING (
  protocol_type = 'REGEN_BASE'
  OR clinic_id = current_user_clinic_id()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2) Add missing index for status-based queries
CREATE INDEX IF NOT EXISTS idx_protocols_clinic_status ON public.protocols (clinic_id, status);

-- 4) Make evidence_refs NOT NULL with default
UPDATE public.protocols SET evidence_refs = '[]'::jsonb WHERE evidence_refs IS NULL;
ALTER TABLE public.protocols ALTER COLUMN evidence_refs SET DEFAULT '[]'::jsonb;
ALTER TABLE public.protocols ALTER COLUMN evidence_refs SET NOT NULL;
