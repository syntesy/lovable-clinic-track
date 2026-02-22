
-- 1) Create table attendance_previous_treatments
CREATE TABLE public.attendance_previous_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL UNIQUE REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  treatments text[] NOT NULL DEFAULT '{}'::text[],
  last_treatment_time_bucket text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Index on attendance_id (UNIQUE already creates one, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_apt_attendance_id ON public.attendance_previous_treatments (attendance_id);

-- 3) Trigger for updated_at
CREATE TRIGGER update_apt_updated_at
  BEFORE UPDATE ON public.attendance_previous_treatments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4) Enable RLS
ALTER TABLE public.attendance_previous_treatments ENABLE ROW LEVEL SECURITY;

-- 5) RLS policies (same pattern as attendance_sessions — owner access)
CREATE POLICY "Users can select own attendance_previous_treatments"
  ON public.attendance_previous_treatments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions a
      WHERE a.id = attendance_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own attendance_previous_treatments"
  ON public.attendance_previous_treatments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions a
      WHERE a.id = attendance_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own attendance_previous_treatments"
  ON public.attendance_previous_treatments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions a
      WHERE a.id = attendance_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own attendance_previous_treatments"
  ON public.attendance_previous_treatments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions a
      WHERE a.id = attendance_id AND a.user_id = auth.uid()
    )
  );
