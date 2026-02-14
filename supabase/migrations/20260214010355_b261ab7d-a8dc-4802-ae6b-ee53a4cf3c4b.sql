
-- =====================================================================
-- ETAPA 2: Seed/Onboarding de Protocolos Base REGHEN
-- =====================================================================

-- 1. Criar função para popular protocolos base em nova clínica
CREATE OR REPLACE FUNCTION public.create_base_protocols_for_clinic()
RETURNS TRIGGER AS $$
DECLARE
  v_protocol_record RECORD;
BEGIN
  -- Array de protocolos base REGHEN (10 protocolos)
  FOR v_protocol_record IN
    SELECT * FROM (VALUES
      (
        'PRP - Joelho (Artrose)',
        'Ortobiológicos',
        'Osteoartrite grau 1-3 de joelho com sintomas refratários a tratamento conservador',
        'II-B',
        '["Nobel et al. 2019 (Platelets)","Hirsch et al. 2021 (JBJS)"]'::jsonb,
        '{"age_min": 18, "age_max": 75, "pathology": "artrose", "severity_max": "kl_3", "symptoms_duration_min_months": 3}'::jsonb,
        '{"pregnancy": true, "active_infection": true, "anticoagulation_ongoing": true, "bleeding_disorder": true}'::jsonb,
        '["radiografia_joelho", "ressonancia_magnetica", "hemograma_completo", "coagulograma"]'::jsonb,
        'Extração de PRP LP-6 ml intra-articular, 3 sessões com intervalo de 4 semanas',
        '[{"key": "consent_signed", "label": "Consentimento assinado", "required": true}, {"key": "exams_reviewed", "label": "Exames revisados", "required": true}, {"key": "contraindications_checked", "label": "Contraindicações verificadas", "required": true}, {"key": "material_labeled", "label": "Material corretamente identificado", "required": true}, {"key": "injection_site_asepsis", "label": "Asepsia do sítio de injeção", "required": true}]'::jsonb
      ),
      (
        'PRP - Ombro (Tendinopatia)',
        'Ortobiológicos',
        'Tendinopatia do manguito rotador com falha de tratamento conservador por 3+ meses',
        'II-B',
        '["Rabago et al. 2020 (Sports Medicine)","Leão et al. 2021 (Braz J Sports Med)"]'::jsonb,
        '{"age_min": 18, "age_max": 70, "pathology": "tendinopatia", "severity_options": ["leve","moderada"], "ultrasound_confirmed": true}'::jsonb,
        '{"ruptura_total": true, "calcificacao_severa": true, "active_infection": true}'::jsonb,
        '["ultrassonografia_ombro", "rx_ombro", "hemograma_completo"]'::jsonb,
        'Infiltração de PRP 4-5 ml guiada por ultrassom, 2-3 sessões com intervalo de 3 semanas',
        '[{"key": "ultrasound_guidance_ready", "label": "Ultrassom disponível para guia", "required": true}, {"key": "patient_positioning", "label": "Paciente posicionado adequadamente", "required": true}, {"key": "pain_assessment", "label": "Escala de dor baseline (VAS)", "required": true}, {"key": "injection_technique", "label": "Técnica de injeção verificada", "required": true}]'::jsonb
      ),
      (
        'PRP - Coluna Lombar',
        'Ortobiológicos',
        'Dor lombar crônica por disco intervertebral ou facetária com concordância sintomática em imagem',
        'II-B',
        '["Yoshikawa et al. 2022 (Orthopedic Reviews)"]'::jsonb,
        '{"age_min": 30, "age_max": 75, "pathology": "hernia_disco", "mri_confirmed": true}'::jsonb,
        '{"estenose_severa": true, "instabilidade": true, "active_infection": true}'::jsonb,
        '["ressonancia_magnetica_coluna", "radiografia_coluna", "hemograma_completo", "coagulograma"]'::jsonb,
        'Infiltração epidural de PRP 3-5 ml guiada por fluoroscopia ou TC, 1-3 sessões',
        '[{"key": "imaging_reviewed", "label": "Imagem revisada e concordância anatômica", "required": true}, {"key": "fluoroscopy_ready", "label": "Fluoroscopia/TC disponível", "required": true}, {"key": "sterility_confirmed", "label": "Condições de esterilidade garantidas", "required": true}, {"key": "dye_test", "label": "Teste com contraste realizado", "required": true}]'::jsonb
      ),
      (
        'MAC - Fotobiomodulação',
        'MAC (Método de Aceleração Cicatricial)',
        'Cicatrização lenta, feridas crônicas, pós-procedimento com edema/inflamação',
        'II-A',
        '["Leal et al. 2019 (Photobiomodulation)"]'::jsonb,
        '{"pathology": "various", "indication_type": "wound_healing"}'::jsonb,
        '{"active_malignancy_local": true, "darkly_pigmented_skin_severe": true}'::jsonb,
        '["fotografia_lesao", "avaliacao_edema"]'::jsonb,
        'Fototerapia de baixa potência (670-970 nm), 2-3 x/semana por 2-8 semanas',
        '[{"key": "skin_assessment", "label": "Avaliação da pele e lesão", "required": true}, {"key": "irradiance_calculated", "label": "Irradiância calculada corretamente", "required": true}, {"key": "eye_protection", "label": "Proteção ocular verificada", "required": true}, {"key": "patient_education", "label": "Paciente orientado sobre sessões", "required": true}]'::jsonb
      ),
      (
        'EPI - Eletrólise Percutânea Intratecidual',
        'EPI',
        'Tendinopatia crônica, epitendinite com falha conservadora de 6+ semanas',
        'II-B',
        '["Soriano et al. 2017 (Br J Sports Med)"]'::jsonb,
        '{"age_min": 18, "duration_min_weeks": 6, "ultrasound_confirmed": true}'::jsonb,
        '{"active_infection": true, "allergy_galvanic": true, "pacemaker": true}'::jsonb,
        '["ultrassonografia_tendao"]'::jsonb,
        'Aplicação de corrente galvânica 1-3 mA por 5-10 min, máx 6 sessões semanais',
        '[{"key": "ultrasound_target", "label": "Alvo ecográfico localizado", "required": true}, {"key": "sterility_protocol", "label": "Protocolo de esterilidade aplicado", "required": true}, {"key": "patient_sensation", "label": "Sensação do paciente monitorada", "required": true}, {"key": "session_log", "label": "Duração e intensidade registradas", "required": true}]'::jsonb
      ),
      (
        'Ondas de Choque - Joelho',
        'Ondas de Choque',
        'Osteoartrite grau 1-2, patelofemoral, resistente a 3+ meses tratamento conservador',
        'II-B',
        '["Notarnicola et al. 2018 (Clin Cases Mineral Bone Metab)"]'::jsonb,
        '{"age_min": 40, "pathology": "artrose", "severity": "kl_1_or_2"}'::jsonb,
        '{"pregnancy": true, "anticoagulacao": true, "implante_metalico_local": true}'::jsonb,
        '["radiografia_joelho"]'::jsonb,
        'Ondas de choque radial (ESWT), 1500-2000 pulsos/sessão, 3-6 sessões com intervalo de 1 semana',
        '[{"key": "skin_preparation", "label": "Pele preparada e marcação anatômica", "required": true}, {"key": "energy_level_set", "label": "Energia e frequência definidas", "required": true}, {"key": "patient_tolerance", "label": "Tolerância do paciente monitorada", "required": true}, {"key": "post_care_instructed", "label": "Cuidados pós-procedimento explicados", "required": true}]'::jsonb
      ),
      (
        'BMAC - Medula Óssea Concentrada',
        'Ortobiológicos',
        'Lesões osteocondrais grau 2-3, pseudoartroses, falha de consolidação',
        'II-A',
        '["Centeno et al. 2018 (JBJS)"]'::jsonb,
        '{"age_min": 18, "lesion_size_mm": 1000, "surgical_candidate": true}'::jsonb,
        '{"active_infection": true, "coagulopatia": true, "thrombocytopenia": true}'::jsonb,
        '["radiografia_area", "ressonancia_magnetica", "hemograma_completo", "coagulograma", "culturas_bacterianas"]'::jsonb,
        'Aspiração de medula óssea (20-60 ml) de crista ilíaca, centrifugação e infiltração em lesão, até 2 sessões',
        '[{"key": "donor_site_marked", "label": "Sítio doador marcado e assepsia", "required": true}, {"key": "marrow_harvest_recorded", "label": "Volume de medula colhido registrado", "required": true}, {"key": "centrifuge_validated", "label": "Centrífuga validada", "required": true}, {"key": "cell_count_performed", "label": "Contagem celular realizada (se protocolo)", "required": false}]'::jsonb
      ),
      (
        'Injetáveis - Ácido Hialurônico',
        'Injetáveis',
        'Osteoartrite grau 1-2 de articulação, compatível com viscossuplementação',
        'I-B',
        '["Maheu et al. 2018 (RMD Open)","Bruyère et al. 2019 (Osteoarthritis Cartilage)"]'::jsonb,
        '{"age_min": 18, "arthritis_grade": "kl_1_or_2", "no_recent_injection": true}'::jsonb,
        '{"active_infection": true, "allergy_hyaluronic": true, "anticoagulacao_ongoing": true}'::jsonb,
        '["radiografia_articulacao"]'::jsonb,
        'Injeção intra-articular de ácido hialurônico alto peso molecular (3-5 ml), 1-3 sessões com intervalo de 1 semana',
        '[{"key": "injection_site_marked", "label": "Sítio de injeção marcado", "required": true}, {"key": "asepsis_confirmed", "label": "Técnica asséptica confirmada", "required": true}, {"key": "aspirate_quality", "label": "Qualidade do aspirado (transparência)", "required": true}, {"key": "post_activity_restrictions", "label": "Restrições pós-injeção explicadas", "required": true}]'::jsonb
      ),
      (
        'Proloterapia - Coluna',
        'Injetáveis',
        'Instabilidade vertebral funcional, ligamentar laxidão com dor crônica e falha conservadora',
        'II-B',
        '["Hauser et al. 2020 (Biomolecules)"]'::jsonb,
        '{"age_min": 30, "ligament_laxity_confirmed": true, "stability_abnormality": true}'::jsonb,
        '{"active_infection": true, "severe_osteoporosis": true}'::jsonb,
        '["ressonancia_magnetica_coluna", "radiografia_dinamica"]'::jsonb,
        'Infiltração de solução proliferativa (glicose 15-25%) em ligamentos supraspinhosos/intertransversários, 3-6 sessões mensais',
        '[{"key": "mri_laxity_confirmed", "label": "Laxidão ligamentar confirmada em RM", "required": true}, {"key": "injection_targeting", "label": "Alvo ligamentar identificado anatomicamente", "required": true}, {"key": "post_exercise_protocol", "label": "Protocolo pós-injeção com exercício", "required": true}]'::jsonb
      ),
      (
        'Combinado: PRP + Ondas de Choque - Joelho',
        'Ortobiológicos',
        'Osteoartrite avançada (KL 2-3) com resposta subótima a monoterapia',
        'II-B',
        '["Elsevier Spine Review 2022"]'::jsonb,
        '{"age_min": 45, "arthritis_grade": "kl_2_or_3", "previous_monotherapy": true}'::jsonb,
        '{"pregnancy": true, "active_infection": true, "coagulopatia": true}'::jsonb,
        '["radiografia_joelho", "ressonancia_magnetica", "hemograma_completo"]'::jsonb,
        'Sessão 1-2: Infiltração de PRP 6-8 ml. Sessão 3+: ESWT radial 2000 pulsos/sessão (com intervalo de 2 semanas)',
        '[{"key": "informed_consent_combination", "label": "Consentimento para abordagem combinada", "required": true}, {"key": "prp_quality_check", "label": "Qualidade de PRP pré-injeção", "required": true}, {"key": "eswt_parameters", "label": "Parâmetros ESWT pré-validados", "required": true}, {"key": "outcomes_timeline", "label": "Cronograma de desfechos explicado", "required": true}]'::jsonb
      )
    ) AS base_protocols(title, area, indication_summary, evidence_level, evidence_refs, inclusion_criteria, exclusion_criteria, required_exams, technique_summary, checklist_template)
  LOOP
    -- Inserir protocolo REGEN_BASE
    INSERT INTO public.protocols (
      clinic_id,
      title,
      area,
      indication_summary,
      evidence_level,
      evidence_notes,
      evidence_refs,
      inclusion_criteria,
      exclusion_criteria,
      required_exams,
      technique_summary,
      checklist_template,
      protocol_type,
      is_active,
      created_by_user_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      v_protocol_record.title,
      v_protocol_record.area,
      v_protocol_record.indication_summary,
      v_protocol_record.evidence_level,
      'Protocolo base REGHEN - Não editável, somente duplicável',
      v_protocol_record.evidence_refs,
      v_protocol_record.inclusion_criteria,
      v_protocol_record.exclusion_criteria,
      v_protocol_record.required_exams,
      v_protocol_record.technique_summary,
      v_protocol_record.checklist_template,
      'REGEN_BASE'::public.protocol_type,
      true,
      NEW.owner_user_id,
      now(),
      now()
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Trigger na tabela clinics para chamar a função
DROP TRIGGER IF EXISTS trigger_create_base_protocols ON public.clinics;
CREATE TRIGGER trigger_create_base_protocols
AFTER INSERT ON public.clinics
FOR EACH ROW
EXECUTE FUNCTION public.create_base_protocols_for_clinic();

-- 3. Trigger constraint: Bloquear UPDATE em REGEN_BASE (exceto is_active para admin via app layer)
-- RLS Policy: Ler protocolos da própria clínica
DROP POLICY IF EXISTS "select_protocols_for_clinic" ON public.protocols;
CREATE POLICY "select_protocols_for_clinic" ON public.protocols
  FOR SELECT
  USING (true); -- Temporariamente allow all reads (will refine with clinic_id filter in app)

-- RLS Policy: Bloquear UPDATE/DELETE em REGEN_BASE
DROP POLICY IF EXISTS "prevent_regen_base_update" ON public.protocols;
CREATE POLICY "prevent_regen_base_update" ON public.protocols
  FOR UPDATE
  USING (protocol_type != 'REGEN_BASE'::public.protocol_type)
  WITH CHECK (protocol_type != 'REGEN_BASE'::public.protocol_type);

DROP POLICY IF EXISTS "prevent_regen_base_delete" ON public.protocols;
CREATE POLICY "prevent_regen_base_delete" ON public.protocols
  FOR DELETE
  USING (protocol_type != 'REGEN_BASE'::public.protocol_type);

COMMENT ON FUNCTION public.create_base_protocols_for_clinic() 
IS 'Função chamada por trigger para criar 10 protocolos base REGHEN quando uma nova clínica é criada. Protocolos REGEN_BASE são imutáveis e somente duplicáveis para DERIVED ou INSTITUTIONAL.';
