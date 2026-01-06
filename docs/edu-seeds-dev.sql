-- ============================================================================
-- REGENAPP Education Academy - Seeds DEV
-- ============================================================================
-- VERSÃO: 1.0.0
-- DATA: 2025-01-06
-- ESCOPO: Apenas edu.* - NÃO altera core clínico
-- ============================================================================
-- 
-- INSTRUÇÕES:
-- 1. Substitua os UUIDs abaixo por usuários REAIS do seu ambiente (auth.users)
-- 2. Execute como service_role (bypass RLS) no ambiente DEV
-- 3. NÃO execute em produção
--
-- ============================================================================

-- ============================================================================
-- PASSO 1: DEFINA OS USER IDs DO SEU AMBIENTE
-- ============================================================================
-- Copie UUIDs de auth.users existentes e substitua abaixo:

DO $$
DECLARE
    -- ===== SUBSTITUIR ESTES UUIDs PELOS USUÁRIOS REAIS DO AMBIENTE =====
    v_admin_user_id    UUID := '28d182d6-acd5-411d-9996-ec37390baabf'; -- institution_admin
    v_teacher_user_id  UUID := '28d182d6-acd5-411d-9996-ec37390baabf'; -- teacher (mesmo user se só houver 1)
    v_director_user_id UUID := '28d182d6-acd5-411d-9996-ec37390baabf'; -- director
    v_student1_user_id UUID := '28d182d6-acd5-411d-9996-ec37390baabf'; -- student 1
    v_student2_user_id UUID := '28d182d6-acd5-411d-9996-ec37390baabf'; -- student 2
    -- ===================================================================
    
    -- IDs gerados (não altere)
    v_institution_id    UUID;
    v_dummy_inst_id     UUID; -- Para QA de isolamento
    v_program_id        UUID;
    v_cohort_id         UUID;
    v_module1_id        UUID;
    v_module2_id        UUID;
    v_case1_id          UUID;
    v_case2_id          UUID;
    v_case3_id          UUID;
    v_case4_id          UUID;
    v_lo1_id            UUID;
    v_lo2_id            UUID;
    v_lo3_id            UUID;
    v_lo4_id            UUID;
    v_concept1_id       UUID;
    v_concept2_id       UUID;
    v_technique1_id     UUID;
    v_technique2_id     UUID;
    v_checkpoint1_id    UUID;
    v_checkpoint2_id    UUID;
    v_scenario1_id      UUID;
    v_scenario2_id      UUID;
    
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'REGENAPP Education Academy - Seeds DEV';
    RAISE NOTICE '============================================';

    -- ========================================================================
    -- 3.1) INSTITUIÇÃO PRINCIPAL: Orthoregen
    -- ========================================================================
    INSERT INTO edu.institutions (name, slug, status)
    VALUES ('Orthoregen Academy', 'orthoregen', 'active')
    RETURNING id INTO v_institution_id;
    
    RAISE NOTICE 'Instituição Orthoregen criada: %', v_institution_id;

    -- ========================================================================
    -- 3.1.1) INSTITUIÇÃO DUMMY (para QA de isolamento)
    -- ========================================================================
    INSERT INTO edu.institutions (name, slug, status)
    VALUES ('Dummy Institute', 'dummy', 'active')
    RETURNING id INTO v_dummy_inst_id;
    
    RAISE NOTICE 'Instituição Dummy (QA) criada: %', v_dummy_inst_id;

    -- ========================================================================
    -- 3.2) MEMBERSHIPS
    -- ========================================================================
    INSERT INTO edu.institution_members (institution_id, user_id, role, status) VALUES
        (v_institution_id, v_admin_user_id, 'institution_admin', 'active'),
        (v_institution_id, v_teacher_user_id, 'teacher', 'active'),
        (v_institution_id, v_director_user_id, 'director', 'active'),
        (v_institution_id, v_student1_user_id, 'student', 'active'),
        (v_institution_id, v_student2_user_id, 'student', 'active');
    
    RAISE NOTICE 'Memberships criados: 5 membros';

    -- ========================================================================
    -- 3.3) PROGRAM + COHORT + MODULES
    -- ========================================================================
    INSERT INTO edu.programs (institution_id, title, status)
    VALUES (v_institution_id, 'Programa de Ortobiológicos Avançado', 'published')
    RETURNING id INTO v_program_id;
    
    INSERT INTO edu.cohorts (institution_id, program_id, title, status)
    VALUES (v_institution_id, v_program_id, 'Turma 2025.1 - Ortobiológicos', 'active')
    RETURNING id INTO v_cohort_id;
    
    INSERT INTO edu.modules (institution_id, cohort_id, title, status)
    VALUES (v_institution_id, v_cohort_id, 'Módulo 1: Fundamentos de PRP', 'published')
    RETURNING id INTO v_module1_id;
    
    INSERT INTO edu.modules (institution_id, cohort_id, title, status)
    VALUES (v_institution_id, v_cohort_id, 'Módulo 2: Aplicações Clínicas', 'published')
    RETURNING id INTO v_module2_id;
    
    -- Módulo DRAFT na Dummy (para QA-02)
    INSERT INTO edu.modules (institution_id, cohort_id, title, status)
    VALUES (v_dummy_inst_id, v_cohort_id, 'Módulo Secreto Dummy', 'draft');
    
    RAISE NOTICE 'Program, Cohort e Modules criados';

    -- ========================================================================
    -- 3.4) ENROLLMENTS
    -- ========================================================================
    INSERT INTO edu.enrollments (institution_id, cohort_id, user_id, status) VALUES
        (v_institution_id, v_cohort_id, v_student1_user_id, 'active'),
        (v_institution_id, v_cohort_id, v_student2_user_id, 'active');
    
    RAISE NOTICE 'Enrollments criados: 2 estudantes';

    -- ========================================================================
    -- 3.5) CASES (4 casos, 2 versões cada, published_version_number = 2)
    -- ========================================================================
    -- Case 1: Módulo 1, intro
    INSERT INTO edu.cases (institution_id, module_id, title, case_type, difficulty, status, published_version_number)
    VALUES (v_institution_id, v_module1_id, 'Caso 1: Artrose de Joelho Grau II', 'simulated', 'intro', 'published', 2)
    RETURNING id INTO v_case1_id;
    
    -- Case 2: Módulo 1, intermediate
    INSERT INTO edu.cases (institution_id, module_id, title, case_type, difficulty, status, published_version_number)
    VALUES (v_institution_id, v_module1_id, 'Caso 2: Tendinopatia de Aquiles', 'simulated', 'intermediate', 'published', 2)
    RETURNING id INTO v_case2_id;
    
    -- Case 3: Módulo 2, intro
    INSERT INTO edu.cases (institution_id, module_id, title, case_type, difficulty, status, published_version_number)
    VALUES (v_institution_id, v_module2_id, 'Caso 3: Epicondilite Lateral', 'simulated', 'intro', 'published', 2)
    RETURNING id INTO v_case3_id;
    
    -- Case 4: Módulo 2, intermediate
    INSERT INTO edu.cases (institution_id, module_id, title, case_type, difficulty, status, published_version_number)
    VALUES (v_institution_id, v_module2_id, 'Caso 4: Fascite Plantar Refratária', 'simulated', 'intermediate', 'published', 2)
    RETURNING id INTO v_case4_id;
    
    RAISE NOTICE 'Cases criados: 4';

    -- ========================================================================
    -- 3.5.1) CASE VERSIONS (2 versões por caso)
    -- ========================================================================
    -- Case 1 versions
    INSERT INTO edu.case_versions (institution_id, case_id, version_number, content) VALUES
        (v_institution_id, v_case1_id, 1, '{"title": "v1 - Rascunho inicial", "description": "Paciente 62 anos, artrose grau II"}'::jsonb),
        (v_institution_id, v_case1_id, 2, '{"title": "v2 - Versão publicada", "description": "Paciente 62 anos, artrose grau II bilateral, IMC 28, sem comorbidades graves", "objectives": ["Avaliar indicação de PRP", "Identificar contraindicações relativas"]}'::jsonb);
    
    -- Case 2 versions
    INSERT INTO edu.case_versions (institution_id, case_id, version_number, content) VALUES
        (v_institution_id, v_case2_id, 1, '{"title": "v1 - Rascunho", "description": "Tendinopatia Aquiles"}'::jsonb),
        (v_institution_id, v_case2_id, 2, '{"title": "v2 - Final", "description": "Corredor 35 anos, tendinopatia insercional crônica há 8 meses", "objectives": ["Avaliar preparo do tendão", "Discutir protocolo de reabilitação"]}'::jsonb);
    
    -- Case 3 versions
    INSERT INTO edu.case_versions (institution_id, case_id, version_number, content) VALUES
        (v_institution_id, v_case3_id, 1, '{"title": "v1", "description": "Epicondilite"}'::jsonb),
        (v_institution_id, v_case3_id, 2, '{"title": "v2 - Publicado", "description": "Tenista amador 45 anos, dor lateral há 6 meses, falha em fisioterapia convencional", "objectives": ["Avaliar resposta prévia", "Indicar procedimento"]}'::jsonb);
    
    -- Case 4 versions
    INSERT INTO edu.case_versions (institution_id, case_id, version_number, content) VALUES
        (v_institution_id, v_case4_id, 1, '{"title": "v1", "description": "Fascite plantar"}'::jsonb),
        (v_institution_id, v_case4_id, 2, '{"title": "v2 - Final", "description": "Paciente 50 anos, fascite plantar bilateral refratária, 12 meses de evolução", "objectives": ["Avaliar cronicidade", "Discutir abordagem multimodal"]}'::jsonb);
    
    RAISE NOTICE 'Case versions criadas: 8 (2 por caso)';

    -- ========================================================================
    -- 3.5.2) CASE ASSETS (placeholder URLs)
    -- ========================================================================
    INSERT INTO edu.case_assets (institution_id, case_id, asset_type, external_url) VALUES
        (v_institution_id, v_case1_id, 'image', 'https://placeholder.edu/case1-xray.jpg'),
        (v_institution_id, v_case2_id, 'image', 'https://placeholder.edu/case2-mri.jpg'),
        (v_institution_id, v_case3_id, 'pdf', 'https://placeholder.edu/case3-report.pdf'),
        (v_institution_id, v_case4_id, 'image', 'https://placeholder.edu/case4-ultrasound.jpg');
    
    RAISE NOTICE 'Case assets criados: 4';

    -- ========================================================================
    -- 3.6) LEARNING OBJECTS + LINKS
    -- ========================================================================
    -- Concepts e Techniques
    INSERT INTO edu.concepts (institution_id, title)
    VALUES (v_institution_id, 'Mecanismos de Regeneração Tecidual')
    RETURNING id INTO v_concept1_id;
    
    INSERT INTO edu.concepts (institution_id, title)
    VALUES (v_institution_id, 'Fatores de Crescimento Plaquetários')
    RETURNING id INTO v_concept2_id;
    
    INSERT INTO edu.techniques (institution_id, title)
    VALUES (v_institution_id, 'Técnica de Centrifugação Dupla')
    RETURNING id INTO v_technique1_id;
    
    INSERT INTO edu.techniques (institution_id, title)
    VALUES (v_institution_id, 'Infiltração Guiada por USG')
    RETURNING id INTO v_technique2_id;
    
    -- Learning Objects
    INSERT INTO edu.learning_objects (institution_id, module_id, title, object_type, status, external_url)
    VALUES (v_institution_id, v_module1_id, 'Introdução ao PRP: Conceitos Básicos', 'reading', 'published', 'https://placeholder.edu/intro-prp.pdf')
    RETURNING id INTO v_lo1_id;
    
    INSERT INTO edu.learning_objects (institution_id, module_id, title, object_type, status, external_url)
    VALUES (v_institution_id, v_module1_id, 'Vídeo: Preparo de PRP na Prática', 'video', 'published', 'https://placeholder.edu/video-prp.mp4')
    RETURNING id INTO v_lo2_id;
    
    INSERT INTO edu.learning_objects (institution_id, module_id, title, object_type, status, external_url)
    VALUES (v_institution_id, v_module2_id, 'Artigo: Evidências em Tendinopatias', 'pdf', 'published', 'https://placeholder.edu/evidencias-tendao.pdf')
    RETURNING id INTO v_lo3_id;
    
    INSERT INTO edu.learning_objects (institution_id, module_id, title, object_type, status, external_url)
    VALUES (v_institution_id, v_module2_id, 'Checklist: Avaliação Pré-Procedimento', 'checklist', 'published', 'https://placeholder.edu/checklist.pdf')
    RETURNING id INTO v_lo4_id;
    
    RAISE NOTICE 'Learning objects criados: 4';

    -- Learning Links
    INSERT INTO edu.learning_links (institution_id, learning_object_id, target_type, target_id) VALUES
        (v_institution_id, v_lo1_id, 'concept', v_concept1_id),
        (v_institution_id, v_lo1_id, 'case', v_case1_id),
        (v_institution_id, v_lo2_id, 'technique', v_technique1_id),
        (v_institution_id, v_lo3_id, 'concept', v_concept2_id),
        (v_institution_id, v_lo3_id, 'case', v_case2_id),
        (v_institution_id, v_lo4_id, 'technique', v_technique2_id),
        (v_institution_id, v_lo4_id, 'case', v_case3_id);
    
    RAISE NOTICE 'Learning links criados: 7';

    -- ========================================================================
    -- 3.7) EVIDENCE LINKS
    -- ========================================================================
    INSERT INTO edu.evidence_links (institution_id, module_id, case_id, source, citation) VALUES
        (v_institution_id, v_module1_id, NULL, 'regenapp_curated', 'REGENAPP Clinical Evidence Database - PRP para Osteoartrite: Meta-análise 2024'),
        (v_institution_id, NULL, v_case1_id, 'regenapp_curated', 'REGENAPP Curation ID#1247 - Eficácia de PRP em OA de joelho'),
        (v_institution_id, v_module2_id, NULL, 'external', 'Smith J et al. Platelet-Rich Plasma for Tendinopathy: A Systematic Review. AJSM 2023;51(4):890-902'),
        (v_institution_id, NULL, v_case2_id, 'external', 'Chen W et al. PRP vs Corticosteroids in Achilles Tendinopathy: RCT. JOSPT 2024;54(1):45-58');
    
    RAISE NOTICE 'Evidence links criados: 4 (2 curated + 2 external)';

    -- ========================================================================
    -- 3.8) CHECKPOINTS
    -- ========================================================================
    INSERT INTO edu.checkpoints (institution_id, module_id, title, status)
    VALUES (v_institution_id, v_module1_id, 'Checkpoint 1: Fundamentos de PRP', 'published')
    RETURNING id INTO v_checkpoint1_id;
    
    INSERT INTO edu.checkpoints (institution_id, module_id, title, status)
    VALUES (v_institution_id, v_module2_id, 'Checkpoint 2: Aplicações Clínicas', 'published')
    RETURNING id INTO v_checkpoint2_id;
    
    -- Checkpoint Items (5 cada)
    INSERT INTO edu.checkpoint_items (institution_id, checkpoint_id, item_text, order_index) VALUES
        (v_institution_id, v_checkpoint1_id, 'Compreendo os mecanismos de ação do PRP', 1),
        (v_institution_id, v_checkpoint1_id, 'Sei identificar contraindicações absolutas', 2),
        (v_institution_id, v_checkpoint1_id, 'Conheço os principais protocolos de centrifugação', 3),
        (v_institution_id, v_checkpoint1_id, 'Entendo a importância da contagem plaquetária', 4),
        (v_institution_id, v_checkpoint1_id, 'Sei avaliar qualidade do preparado final', 5);
    
    INSERT INTO edu.checkpoint_items (institution_id, checkpoint_id, item_text, order_index) VALUES
        (v_institution_id, v_checkpoint2_id, 'Compreendo indicações para tendinopatias', 1),
        (v_institution_id, v_checkpoint2_id, 'Sei selecionar pacientes adequados', 2),
        (v_institution_id, v_checkpoint2_id, 'Conheço protocolos de reabilitação pós-procedimento', 3),
        (v_institution_id, v_checkpoint2_id, 'Entendo a importância do acompanhamento longitudinal', 4),
        (v_institution_id, v_checkpoint2_id, 'Sei avaliar resposta clínica ao tratamento', 5);
    
    RAISE NOTICE 'Checkpoints criados: 2 com 5 itens cada';

    -- Checkpoint Attempts (1 por student no checkpoint 1)
    INSERT INTO edu.checkpoint_attempts (institution_id, checkpoint_id, user_id, attempt_no, responses) VALUES
        (v_institution_id, v_checkpoint1_id, v_student1_user_id, 1, '{"completed": [1,2,3,4,5], "notes": "Concluído com sucesso"}'::jsonb);
    
    RAISE NOTICE 'Checkpoint attempts criados: 1';

    -- ========================================================================
    -- 3.9) DECISION REASONING LAB
    -- ========================================================================
    INSERT INTO edu.decision_scenarios (institution_id, case_id, title, status)
    VALUES (v_institution_id, v_case1_id, 'Decisão: Indicação de PRP em OA Grau II', 'published')
    RETURNING id INTO v_scenario1_id;
    
    INSERT INTO edu.decision_scenarios (institution_id, case_id, title, status)
    VALUES (v_institution_id, v_case2_id, 'Decisão: Protocolo para Tendinopatia Crônica', 'published')
    RETURNING id INTO v_scenario2_id;
    
    -- Decision Prompts (3 por scenario)
    INSERT INTO edu.decision_prompts (institution_id, scenario_id, prompt_type, prompt_text, order_index) VALUES
        (v_institution_id, v_scenario1_id, 'multiple_choice', 'Qual a principal indicação de PRP neste caso?', 1),
        (v_institution_id, v_scenario1_id, 'short_text', 'Descreva os fatores que influenciam sua decisão:', 2),
        (v_institution_id, v_scenario1_id, 'checklist', 'Marque os exames necessários antes do procedimento:', 3);
    
    INSERT INTO edu.decision_prompts (institution_id, scenario_id, prompt_type, prompt_text, order_index) VALUES
        (v_institution_id, v_scenario2_id, 'multiple_choice', 'Qual protocolo de reabilitação você indicaria?', 1),
        (v_institution_id, v_scenario2_id, 'short_text', 'Justifique sua escolha de número de aplicações:', 2),
        (v_institution_id, v_scenario2_id, 'checklist', 'Selecione os critérios de sucesso para acompanhamento:', 3);
    
    RAISE NOTICE 'Decision scenarios criados: 2 com 3 prompts cada';

    -- Instructor Reference (apenas staff vê)
    INSERT INTO edu.instructor_reference (institution_id, scenario_id, reference_text) VALUES
        (v_institution_id, v_scenario1_id, 'GABARITO INSTRUTOR: A indicação principal é a falha do tratamento conservador por 6+ meses. Fatores-chave: grau da lesão, idade, IMC, expectativas do paciente. Exames obrigatórios: RX em carga, hemograma, coagulograma.'),
        (v_institution_id, v_scenario2_id, 'GABARITO INSTRUTOR: Protocolo recomendado: 3 aplicações com intervalo de 2 semanas. Critérios de sucesso: melhora VAS >50%, retorno às atividades em 8-12 semanas.');
    
    RAISE NOTICE 'Instructor references criados: 2';

    -- Decision Attempts (1 por student no scenario 1)
    INSERT INTO edu.decision_attempts (institution_id, scenario_id, user_id, attempt_no, answers) VALUES
        (v_institution_id, v_scenario1_id, v_student1_user_id, 1, '{"prompt_1": "Falha conservadora", "prompt_2": "Considerei idade e grau da lesão", "prompt_3": ["RX", "Hemograma"]}'::jsonb);
    
    RAISE NOTICE 'Decision attempts criados: 1';

    -- ========================================================================
    -- 3.10) ACTIVITY LOGS + PROGRESS (trigger auto-atualiza student_progress)
    -- ========================================================================
    -- Student 1 activities
    INSERT INTO edu.activity_logs (institution_id, cohort_id, module_id, user_id, event_type, entity_type, entity_id, metadata) VALUES
        (v_institution_id, v_cohort_id, v_module1_id, v_student1_user_id, 'view_case', 'case', v_case1_id, '{"duration_seconds": 320}'::jsonb),
        (v_institution_id, v_cohort_id, v_module1_id, v_student1_user_id, 'view_content', 'learning_object', v_lo1_id, '{"completed": true}'::jsonb),
        (v_institution_id, v_cohort_id, v_module1_id, v_student1_user_id, 'submit_decision', 'scenario', v_scenario1_id, '{"attempt": 1}'::jsonb),
        (v_institution_id, v_cohort_id, v_module1_id, v_student1_user_id, 'submit_checkpoint', 'checkpoint', v_checkpoint1_id, '{"score": 5}'::jsonb);
    
    -- Student 2 activities
    INSERT INTO edu.activity_logs (institution_id, cohort_id, module_id, user_id, event_type, entity_type, entity_id, metadata) VALUES
        (v_institution_id, v_cohort_id, v_module1_id, v_student2_user_id, 'view_case', 'case', v_case1_id, '{"duration_seconds": 180}'::jsonb),
        (v_institution_id, v_cohort_id, v_module1_id, v_student2_user_id, 'view_content', 'learning_object', v_lo2_id, '{"completed": true}'::jsonb);
    
    RAISE NOTICE 'Activity logs criados: 6';

    -- ========================================================================
    -- RESUMO FINAL
    -- ========================================================================
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SEEDS DEV CONCLUÍDOS COM SUCESSO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Instituição Orthoregen: %', v_institution_id;
    RAISE NOTICE 'Instituição Dummy (QA): %', v_dummy_inst_id;
    RAISE NOTICE 'Program: %', v_program_id;
    RAISE NOTICE 'Cohort: %', v_cohort_id;
    RAISE NOTICE 'Módulos: % e %', v_module1_id, v_module2_id;
    RAISE NOTICE 'Cases: %, %, %, %', v_case1_id, v_case2_id, v_case3_id, v_case4_id;
    RAISE NOTICE 'Checkpoints: % e %', v_checkpoint1_id, v_checkpoint2_id;
    RAISE NOTICE 'Scenarios: % e %', v_scenario1_id, v_scenario2_id;
    RAISE NOTICE '============================================';

END $$;
