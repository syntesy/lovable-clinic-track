-- Tabela de eventos clínicos agendados para o Daily Dashboard
CREATE TABLE public.clinical_scheduled_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.prp_screenings(id) ON DELETE SET NULL,
  
  -- Tempo (BLOCO 1)
  event_date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME,
  
  -- Identificação derivada (BLOCO 2) - copiados no momento do agendamento
  patient_name TEXT NOT NULL,
  case_summary TEXT, -- Formato: "Região — Diagnóstico"
  
  -- Etapa clínica (BLOCO 3) - congelado no momento do agendamento
  clinical_stage TEXT NOT NULL CHECK (clinical_stage IN ('avaliacao', 'procedimento', 'followup', 'alta')),
  
  -- Ação do dia (BLOCO 4)
  today_action TEXT NOT NULL,
  
  -- Status clínico recente (BLOCO 5) - opcional, última evolução
  last_outcome TEXT,
  
  -- Alertas clínicos (BLOCO 6) - lista pré-calculada
  alerts JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  
  -- O evento pode ser marcado como atendido
  attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_clinical_events_user_date ON public.clinical_scheduled_events(user_id, event_date);
CREATE INDEX idx_clinical_events_patient ON public.clinical_scheduled_events(patient_id);
CREATE INDEX idx_clinical_events_case ON public.clinical_scheduled_events(case_id);

-- RLS
ALTER TABLE public.clinical_scheduled_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON public.clinical_scheduled_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
  ON public.clinical_scheduled_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON public.clinical_scheduled_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON public.clinical_scheduled_events FOR DELETE
  USING (auth.uid() = user_id);