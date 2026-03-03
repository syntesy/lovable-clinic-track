
-- Create academy_review_task table
CREATE TABLE public.academy_review_task (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.academy_papers(id) ON DELETE CASCADE,
  reason text NOT NULL,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'open',
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_academy_review_task_paper_id ON public.academy_review_task (paper_id);
CREATE INDEX idx_academy_review_task_status ON public.academy_review_task (status);
CREATE INDEX idx_academy_review_task_assigned ON public.academy_review_task (assigned_to) WHERE assigned_to IS NOT NULL;

-- Function + Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_review_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_review_task_updated_at
  BEFORE UPDATE ON public.academy_review_task
  FOR EACH ROW EXECUTE FUNCTION public.update_review_task_updated_at();

-- RLS
ALTER TABLE public.academy_review_task ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Academy admins/teachers can view review tasks"
  ON public.academy_review_task FOR SELECT TO authenticated
  USING (
    public.is_academy_admin(auth.uid())
    OR public.has_academy_role(auth.uid(), 'teacher_approved')
  );

CREATE POLICY "Academy admins can create review tasks"
  ON public.academy_review_task FOR INSERT TO authenticated
  WITH CHECK (
    public.is_academy_admin(auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Academy admins can update review tasks"
  ON public.academy_review_task FOR UPDATE TO authenticated
  USING (public.is_academy_admin(auth.uid()));

CREATE POLICY "Assigned users can update their review tasks"
  ON public.academy_review_task FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid());
