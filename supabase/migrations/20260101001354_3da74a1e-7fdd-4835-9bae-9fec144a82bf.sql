-- Tabela de follow-ups para acompanhamento pós-procedimento
CREATE TABLE public.procedure_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  screening_id UUID NOT NULL REFERENCES public.prp_screenings(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL,
  
  -- Scheduling
  timepoint TEXT NOT NULL CHECK (timepoint IN ('D7', 'D30', 'D90', 'D180', 'D365')),
  scheduled_for DATE NOT NULL,
  rescheduled_from DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  
  -- Outcome data (quando completed)
  pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
  function_score INTEGER CHECK (function_score >= 0 AND function_score <= 100),
  function_text TEXT,
  global_change TEXT CHECK (global_change IN ('much_better', 'better', 'same', 'worse', 'much_worse')),
  
  -- Adverse events
  adverse_event BOOLEAN DEFAULT false,
  adverse_event_severity TEXT CHECK (adverse_event_severity IN ('mild', 'moderate', 'severe')),
  adverse_event_description TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_followups_screening ON public.procedure_followups(screening_id);
CREATE INDEX idx_followups_patient ON public.procedure_followups(patient_id);
CREATE INDEX idx_followups_clinician ON public.procedure_followups(clinician_id);
CREATE INDEX idx_followups_status ON public.procedure_followups(status);
CREATE INDEX idx_followups_scheduled ON public.procedure_followups(scheduled_for);
CREATE INDEX idx_followups_status_scheduled ON public.procedure_followups(status, scheduled_for);

-- Unique constraint: um follow-up por timepoint por screening
CREATE UNIQUE INDEX idx_followups_unique_timepoint ON public.procedure_followups(screening_id, timepoint);

-- RLS
ALTER TABLE public.procedure_followups ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Clinicians can view their own followups"
ON public.procedure_followups
FOR SELECT
USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can insert their own followups"
ON public.procedure_followups
FOR INSERT
WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update their own followups"
ON public.procedure_followups
FOR UPDATE
USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can delete their own followups"
ON public.procedure_followups
FOR DELETE
USING (clinician_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_procedure_followups_updated_at
  BEFORE UPDATE ON public.procedure_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar follow-ups automaticamente após procedimento
CREATE OR REPLACE FUNCTION public.create_followups_for_screening(
  p_screening_id UUID,
  p_patient_id UUID,
  p_clinician_id UUID,
  p_procedure_date DATE DEFAULT CURRENT_DATE
)
RETURNS SETOF public.procedure_followups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_timepoints TEXT[] := ARRAY['D7', 'D30', 'D90', 'D180', 'D365'];
  v_days INTEGER[] := ARRAY[7, 30, 90, 180, 365];
  v_i INTEGER;
BEGIN
  FOR v_i IN 1..array_length(v_timepoints, 1) LOOP
    INSERT INTO public.procedure_followups (
      screening_id,
      patient_id,
      clinician_id,
      timepoint,
      scheduled_for,
      status
    ) VALUES (
      p_screening_id,
      p_patient_id,
      p_clinician_id,
      v_timepoints[v_i],
      p_procedure_date + v_days[v_i],
      'pending'
    )
    ON CONFLICT (screening_id, timepoint) DO NOTHING;
  END LOOP;
  
  RETURN QUERY SELECT * FROM public.procedure_followups WHERE screening_id = p_screening_id;
END;
$$;

-- Função para marcar follow-ups atrasados como missed (para ser chamada via cron ou manualmente)
CREATE OR REPLACE FUNCTION public.mark_missed_followups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.procedure_followups
    SET status = 'missed', updated_at = now()
    WHERE status = 'pending'
      AND scheduled_for < CURRENT_DATE - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM updated;
  
  RETURN v_count;
END;
$$;