-- Fix: default status should be 'draft', not 'active'
ALTER TABLE public.protocols ALTER COLUMN status SET DEFAULT 'draft'::protocol_status;

-- Fix: make title uniqueness case-insensitive
-- Drop existing case-sensitive constraint
ALTER TABLE public.protocols DROP CONSTRAINT IF EXISTS protocols_clinic_title_unique;

-- Create case-insensitive unique index
CREATE UNIQUE INDEX protocols_clinic_title_unique ON public.protocols (clinic_id, lower(title));
