-- =====================================================
-- TRIGGER AUTOMÁTICO: Criar follow-ups após procedimento
-- =====================================================

-- Função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.auto_create_followups_on_procedure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_screening_id UUID;
  v_timepoints TEXT[] := ARRAY['D30', 'D90', 'D180', 'D365'];
  v_days INTEGER[] := ARRAY[30, 90, 180, 365];
  v_i INTEGER;
BEGIN
  -- Buscar o screening mais recente do paciente (se existir)
  SELECT id INTO v_screening_id
  FROM public.prp_screenings
  WHERE patient_id = NEW.patient_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se não encontrar screening, não criar follow-ups
  IF v_screening_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Criar 4 follow-ups (D30, D90, D180, D365) - D7 geralmente é revisão imediata
  FOR v_i IN 1..array_length(v_timepoints, 1) LOOP
    INSERT INTO public.procedure_followups (
      screening_id,
      patient_id,
      clinician_id,
      timepoint,
      scheduled_for,
      status
    ) VALUES (
      v_screening_id,
      NEW.patient_id,
      COALESCE(NEW.created_by, auth.uid()),
      v_timepoints[v_i],
      NEW.procedure_date + v_days[v_i],
      'pending'
    )
    ON CONFLICT (screening_id, timepoint) DO NOTHING; -- Idempotência
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger que dispara após INSERT em patient_procedures
DROP TRIGGER IF EXISTS trigger_auto_create_followups ON public.patient_procedures;

CREATE TRIGGER trigger_auto_create_followups
  AFTER INSERT ON public.patient_procedures
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_followups_on_procedure();

-- Comentário explicativo
COMMENT ON FUNCTION public.auto_create_followups_on_procedure() IS 
'Cria automaticamente 4 follow-ups (D30, D90, D180, D365) quando um procedimento é registrado em patient_procedures. Usa o screening mais recente do paciente. Idempotente via ON CONFLICT.';