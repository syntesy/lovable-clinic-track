
-- =======================================================================
-- ETAPA 5: Checklist instanciação automática via trigger
-- =======================================================================

-- Trigger: auto-instantiate safety_checklist on INSERT based on protocol's checklist_template
CREATE OR REPLACE FUNCTION public.auto_instantiate_safety_checklist()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_protocol_template jsonb;
  v_global_items jsonb;
  v_merged_items jsonb;
  v_template_item jsonb;
  v_existing_keys text[];
BEGIN
  -- Only auto-set on INSERT when safety_checklist is NULL
  IF TG_OP = 'INSERT' AND NEW.safety_checklist IS NULL THEN
    
    -- Define global minimum checklist items (always present, always required)
    v_global_items := '[]'::jsonb;
    v_global_items := v_global_items || jsonb_build_array(
      jsonb_build_object('key', 'consent', 'label', 'Consentimento registrado', 'required', true, 'checked', false, 'note', ''),
      jsonb_build_object('key', 'inclusion_ok', 'label', 'Critérios de inclusão confirmados', 'required', true, 'checked', false, 'note', ''),
      jsonb_build_object('key', 'exclusion_ok', 'label', 'Critérios de exclusão revisados', 'required', true, 'checked', false, 'note', ''),
      jsonb_build_object('key', 'meds_reviewed', 'label', 'Medicamentos revisados', 'required', true, 'checked', false, 'note', ''),
      jsonb_build_object('key', 'anticoag_nsaid', 'label', 'Anticoagulantes/AINE avaliados', 'required', true, 'checked', false, 'note', ''),
      jsonb_build_object('key', 'material_logged', 'label', 'Material/lote registrado', 'required', true, 'checked', false, 'note', ''),
      jsonb_build_object('key', 'exams_reviewed', 'label', 'Exames revisados', 'required', true, 'checked', false, 'note', '')
    );
    
    -- Collect keys from global items
    SELECT array_agg(item->>'key')
    INTO v_existing_keys
    FROM jsonb_array_elements(v_global_items) AS item;
    
    -- Fetch checklist_template from protocol
    SELECT checklist_template
    INTO v_protocol_template
    FROM protocols
    WHERE id = NEW.protocol_id;
    
    -- Merge protocol-specific items (skip duplicates)
    v_merged_items := v_global_items;
    IF v_protocol_template IS NOT NULL AND jsonb_typeof(v_protocol_template) = 'array' THEN
      FOR v_template_item IN SELECT * FROM jsonb_array_elements(v_protocol_template)
      LOOP
        -- Only add if key is not already in global items
        IF NOT (v_template_item->>'key' = ANY(v_existing_keys)) THEN
          v_merged_items := v_merged_items || jsonb_build_array(
            jsonb_build_object(
              'key', v_template_item->>'key',
              'label', v_template_item->>'label',
              'required', COALESCE((v_template_item->>'required')::boolean, true),
              'checked', false,
              'note', ''
            )
          );
        END IF;
      END LOOP;
    END IF;
    
    -- Set the safety_checklist with merged items
    NEW.safety_checklist := jsonb_build_object(
      'items', v_merged_items,
      'completed_at', null
    );
    
    -- Set initial status
    NEW.safety_checklist_status := 'NOT_STARTED';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger (runs BEFORE the other triggers)
CREATE TRIGGER trg_auto_instantiate_checklist
  BEFORE INSERT ON procedure_standard_records
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_instantiate_safety_checklist();
