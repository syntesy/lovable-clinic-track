
-- 3) Remove duplicate UNIQUE constraint (keep protocol_versions_protocol_id_version_label_key)
ALTER TABLE public.protocol_versions DROP CONSTRAINT IF EXISTS unique_protocol_version_label;
