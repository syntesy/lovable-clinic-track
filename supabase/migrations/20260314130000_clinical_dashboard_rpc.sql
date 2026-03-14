-- Dashboard Clínico – Ortobiológicos
--
-- RPC de alta performance que retorna todas as métricas dos 8 cards
-- em uma única chamada ao banco, evitando N+1 queries no frontend.
--
-- Parâmetros:
--   p_user_id   — UUID do profissional logado
--   p_start     — data início do período (inclusive)
--   p_end       — data fim do período (inclusive)
--
-- Retorno: JSONB com cards 1–8

CREATE OR REPLACE FUNCTION get_clinical_dashboard_metrics(
  p_user_id uuid,
  p_start   date,
  p_end     date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Card 1
  v_unique_patients   int := 0;
  v_consultations     int := 0;
  v_procedures_done   int := 0;

  -- Card 2
  v_active_treatment  int := 0;

  -- Card 3
  v_fw_3m             int := 0;
  v_fw_6m             int := 0;
  v_fw_12m            int := 0;
  v_fw_overdue        int := 0;

  -- Cards 5 & 7
  v_total_pairs       int := 0;
  v_responders_50     int := 0;
  v_non_resp_30       int := 0;

  -- Card 8
  v_fw_pending_total  int := 0;
  v_fw_pending_due    int := 0;

BEGIN

  -- ================================================================
  -- CARD 1 – Pacientes Atendidos no período
  -- ================================================================
  SELECT
    COUNT(DISTINCT cse.patient_id),
    COUNT(*) FILTER (WHERE cse.clinical_stage = 'avaliacao'),
    COUNT(*) FILTER (WHERE cse.clinical_stage = 'procedimento')
  INTO v_unique_patients, v_consultations, v_procedures_done
  FROM clinical_scheduled_events cse
  WHERE cse.user_id  = p_user_id
    AND cse.attended = true
    AND cse.event_date BETWEEN p_start AND p_end;

  -- ================================================================
  -- CARD 2 – Pacientes em Tratamento Ativo
  -- (tem follow-up D7 ou D30 pendente com data futura ou recente)
  -- ================================================================
  SELECT COUNT(DISTINCT pf.patient_id)
  INTO v_active_treatment
  FROM procedure_followups pf
  WHERE pf.clinician_id = p_user_id
    AND pf.timepoint IN ('D7', 'D30')
    AND pf.status     = 'pending'
    AND pf.scheduled_for >= CURRENT_DATE - INTERVAL '7 days';

  -- ================================================================
  -- CARD 3 – Aguardando Follow-up (pós-tratamento)
  -- D90 = 3 meses | D180 = 6 meses | D365 = 12 meses
  -- ================================================================
  SELECT
    COUNT(*) FILTER (WHERE pf.timepoint = 'D90'  AND pf.status = 'pending'),
    COUNT(*) FILTER (WHERE pf.timepoint = 'D180' AND pf.status = 'pending'),
    COUNT(*) FILTER (WHERE pf.timepoint = 'D365' AND pf.status = 'pending'),
    COUNT(*) FILTER (
      WHERE pf.timepoint IN ('D90','D180','D365')
        AND pf.status = 'pending'
        AND pf.scheduled_for < CURRENT_DATE
    )
  INTO v_fw_3m, v_fw_6m, v_fw_12m, v_fw_overdue
  FROM procedure_followups pf
  WHERE pf.clinician_id = p_user_id;

  -- ================================================================
  -- CARDS 5 & 7 – Taxa de Melhora e Sem Resposta
  -- Par baseline + followup mais recente por procedure_standard_record
  -- ================================================================
  WITH outcome_pairs AS (
    SELECT
      b.pain_score                                          AS pain_baseline,
      f.pain_score                                          AS pain_followup,
      CASE
        WHEN b.pain_score > 0
        THEN ((b.pain_score - f.pain_score)::numeric / b.pain_score) * 100
        ELSE 0
      END                                                   AS pct_improvement
    FROM patient_reported_outcomes b
    JOIN patient_reported_outcomes f
      ON  b.procedure_standard_record_id = f.procedure_standard_record_id
      AND f.timepoint IN ('m3','m6','m12')
    JOIN procedure_standard_records psr
      ON  psr.id = b.procedure_standard_record_id
    JOIN attendance_sessions att
      ON  att.id = psr.attendance_id
    WHERE b.timepoint       = 'baseline'
      AND att.user_id       = p_user_id
      AND b.pain_score      IS NOT NULL
      AND f.pain_score      IS NOT NULL
      AND b.pain_score      > 0
  )
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE pct_improvement >= 50),
    COUNT(*) FILTER (WHERE pct_improvement < 30)
  INTO v_total_pairs, v_responders_50, v_non_resp_30
  FROM outcome_pairs;

  -- ================================================================
  -- CARD 8 – Follow-up Pendente (operacional)
  -- Todos os follow-ups com data passada e ainda pendentes
  -- ================================================================
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE pf.scheduled_for < CURRENT_DATE AND pf.status = 'pending')
  INTO v_fw_pending_total, v_fw_pending_due
  FROM procedure_followups pf
  WHERE pf.clinician_id = p_user_id
    AND pf.status IN ('pending', 'completed');

  -- ================================================================
  -- Retorno
  -- ================================================================
  RETURN jsonb_build_object(

    'card1', jsonb_build_object(
      'unique_patients', v_unique_patients,
      'consultations',   v_consultations,
      'procedures',      v_procedures_done
    ),

    'card2', jsonb_build_object(
      'active_treatment', v_active_treatment
    ),

    'card3', jsonb_build_object(
      'followup_3m',  v_fw_3m,
      'followup_6m',  v_fw_6m,
      'followup_12m', v_fw_12m,
      'overdue',      v_fw_overdue
    ),

    'card5', jsonb_build_object(
      'total_with_followup', v_total_pairs,
      'responders_50',       v_responders_50,
      'improvement_rate',    CASE
        WHEN v_total_pairs > 0
        THEN ROUND((v_responders_50::numeric / v_total_pairs) * 100)
        ELSE NULL
      END
    ),

    'card7', jsonb_build_object(
      'total_with_followup', v_total_pairs,
      'non_responders_30',   v_non_resp_30,
      'non_response_rate',   CASE
        WHEN v_total_pairs > 0
        THEN ROUND((v_non_resp_30::numeric / v_total_pairs) * 100)
        ELSE NULL
      END
    ),

    'card8', jsonb_build_object(
      'pending_total', v_fw_pending_total,
      'pending_due',   v_fw_pending_due,
      'pending_rate',  CASE
        WHEN v_fw_pending_total > 0
        THEN ROUND((v_fw_pending_due::numeric / v_fw_pending_total) * 100)
        ELSE NULL
      END
    )

  );
END;
$$;

-- Permissão: apenas usuários autenticados chamam para o próprio ID
REVOKE ALL ON FUNCTION get_clinical_dashboard_metrics(uuid, date, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_clinical_dashboard_metrics(uuid, date, date) TO authenticated;

COMMENT ON FUNCTION get_clinical_dashboard_metrics IS
  'Retorna métricas dos cards 1-3 e 5-8 do Dashboard Clínico de Ortobiológicos '
  'em uma única chamada. Card 4 (breakdown por técnica) é calculado separadamente.';
