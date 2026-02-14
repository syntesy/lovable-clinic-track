
-- ETAPA 9.2 — Auto-instantiação do method_run via trigger

CREATE OR REPLACE FUNCTION public.auto_instantiate_method_run()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_template jsonb;
BEGIN
  -- Só preencher se method_run ainda não foi fornecido
  IF NEW.method_run IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar method_template do protocolo vinculado
  SELECT method_template INTO v_template
  FROM public.protocols
  WHERE id = NEW.protocol_id;

  IF v_template IS NOT NULL THEN
    -- Copiar template e adicionar metadata de instanciação
    NEW.method_run := v_template || jsonb_build_object(
      'confirmed_from_template', true,
      'filled_at', now()::text,
      'filled_by_user_id', auth.uid()::text
    );
  ELSE
    -- Criar method_run mínimo
    NEW.method_run := jsonb_build_object(
      'meta', jsonb_build_object(
        'procedure_category', 'OTHER',
        'requires_collection_or_prep', false
      ),
      'system', jsonb_build_object(
        'system_type', 'NA'
      ),
      'required_fields', '[]'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger BEFORE INSERT
CREATE TRIGGER trg_auto_instantiate_method_run
  BEFORE INSERT ON public.procedure_standard_records
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_instantiate_method_run();
