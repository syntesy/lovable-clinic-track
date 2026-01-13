-- Trigger para bloquear UPDATE em clinical_records com status = 'final'
-- Permite apenas a transição de draft → final (finalização)

CREATE OR REPLACE FUNCTION public.prevent_final_record_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o registro atual já é 'final', bloqueia qualquer UPDATE
  -- EXCETO se for exatamente a operação de finalizar (draft → final)
  IF OLD.status = 'final' THEN
    RAISE EXCEPTION 'Prontuário finalizado não pode ser editado. Status atual: final';
  END IF;
  
  -- Permite a operação (incluindo draft → final)
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS prevent_final_record_update_trigger ON public.clinical_records;

CREATE TRIGGER prevent_final_record_update_trigger
BEFORE UPDATE ON public.clinical_records
FOR EACH ROW
EXECUTE FUNCTION public.prevent_final_record_update();

-- Comentário explicativo
COMMENT ON FUNCTION public.prevent_final_record_update() IS 
'Bloqueia edição de prontuários finalizados (status=final). Permite transição draft→final.';