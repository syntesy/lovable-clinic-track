-- Fix: make UNIQUE index use lower(trim(title)) to prevent trailing space duplicates
DROP INDEX IF EXISTS public.protocols_clinic_title_unique;
CREATE UNIQUE INDEX protocols_clinic_title_unique ON public.protocols (clinic_id, lower(trim(title)));
