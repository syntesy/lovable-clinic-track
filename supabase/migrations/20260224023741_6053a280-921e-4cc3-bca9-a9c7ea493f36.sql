
-- reghen_evidence_links: maps attendance to scientific topic
CREATE TABLE public.reghen_evidence_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_id uuid NOT NULL REFERENCES public.attendance_sessions(id),
  patient_id uuid REFERENCES public.patients(id),
  pathology_id uuid REFERENCES public.pathologies(id),
  intervention_code text,
  topic_key text NOT NULL CHECK (topic_key LIKE '%|%'),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attendance_id, topic_key)
);

-- reghen_evidence_snapshots: append-only evidence records
CREATE TABLE public.reghen_evidence_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_id uuid NOT NULL REFERENCES public.attendance_sessions(id),
  topic_key text NOT NULL,
  query_text text,
  retrieval_mode text NOT NULL CHECK (retrieval_mode IN ('auto_panel','manual_question')),
  papers jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_profile jsonb,
  answer_md text,
  snippets jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reghen_evidence_links_attendance ON public.reghen_evidence_links(attendance_id);
CREATE INDEX idx_reghen_evidence_snapshots_attendance ON public.reghen_evidence_snapshots(attendance_id);
CREATE INDEX idx_reghen_evidence_snapshots_created ON public.reghen_evidence_snapshots(created_at DESC);

-- Append-only triggers for snapshots
CREATE OR REPLACE FUNCTION public.prevent_evidence_snapshot_update()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RAISE EXCEPTION 'reghen_evidence_snapshots is append-only. UPDATE not allowed.';
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_evidence_snapshot_delete()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RAISE EXCEPTION 'reghen_evidence_snapshots is append-only. DELETE not allowed.';
END;
$$;

CREATE TRIGGER trg_prevent_evidence_snapshot_update
  BEFORE UPDATE ON public.reghen_evidence_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.prevent_evidence_snapshot_update();

CREATE TRIGGER trg_prevent_evidence_snapshot_delete
  BEFORE DELETE ON public.reghen_evidence_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.prevent_evidence_snapshot_delete();

-- RLS
ALTER TABLE public.reghen_evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reghen_evidence_snapshots ENABLE ROW LEVEL SECURITY;

-- Links: professional who owns the attendance can select/insert
CREATE POLICY "Professional can view own attendance evidence links"
  ON public.reghen_evidence_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions a
      WHERE a.id = reghen_evidence_links.attendance_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Professional can insert own attendance evidence links"
  ON public.reghen_evidence_links FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.attendance_sessions a
      WHERE a.id = reghen_evidence_links.attendance_id
        AND a.user_id = auth.uid()
    )
  );

-- Admin full access on links
CREATE POLICY "Admin full access on evidence links"
  ON public.reghen_evidence_links FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Snapshots: professional who owns the attendance can select/insert
CREATE POLICY "Professional can view own attendance evidence snapshots"
  ON public.reghen_evidence_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions a
      WHERE a.id = reghen_evidence_snapshots.attendance_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Professional can insert own attendance evidence snapshots"
  ON public.reghen_evidence_snapshots FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.attendance_sessions a
      WHERE a.id = reghen_evidence_snapshots.attendance_id
        AND a.user_id = auth.uid()
    )
  );

-- Admin full access on snapshots
CREATE POLICY "Admin full access on evidence snapshots"
  ON public.reghen_evidence_snapshots FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
