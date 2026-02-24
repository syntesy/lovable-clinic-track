
-- B) Add snapshot_hash to reghen_evidence_snapshots for deduplication
ALTER TABLE public.reghen_evidence_snapshots 
  ADD COLUMN IF NOT EXISTS snapshot_hash text;

-- Create unique constraint for dedup (only on non-null hashes for backward compat)
CREATE UNIQUE INDEX IF NOT EXISTS uq_reghen_snapshot_hash 
  ON public.reghen_evidence_snapshots (attendance_id, snapshot_hash) 
  WHERE snapshot_hash IS NOT NULL;

-- C) Add is_active and superseded_at to reghen_evidence_links
ALTER TABLE public.reghen_evidence_links 
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz;
