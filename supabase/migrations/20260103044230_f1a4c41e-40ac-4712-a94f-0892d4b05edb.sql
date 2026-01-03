-- Fix search_path for Evidence Engine functions
CREATE OR REPLACE FUNCTION public.normalize_evidence_tag(tag TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN UPPER(TRIM(COALESCE(tag, '')));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_next_snapshot_version(
  p_dimension_id UUID,
  p_time_window TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO v_max_version
  FROM public.evidence_snapshots
  WHERE dimension_id = p_dimension_id AND time_window = p_time_window;
  
  RETURN v_max_version + 1;
END;
$$;