# REGHEN — Documentação Técnica do Banco de Dados
## Auditoria e Mapeamento Científico

**Data da Auditoria:** 28 de Janeiro de 2025  
**Versão do Schema:** v2.0 (pós QA+ Phase)  
**Total de Tabelas:** 105 tabelas  
**Plataforma:** Lovable Cloud (Supabase)

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Domínios Funcionais](#domínios-funcionais)
3. [Tabelas por Categoria](#tabelas-por-categoria)
4. [Enums (Tipos Customizados)](#enums-tipos-customizados)
5. [Mapeamento Científico](#mapeamento-científico)

---

## Visão Geral

O banco de dados REGHEN suporta um sistema clínico completo de medicina regenerativa com foco em:
- Triagem biológica para procedimentos ortobiológicos (PRP)
- Padronização de protocolos clínicos
- Coleta de desfechos reportados por pacientes (PROMs)
- Registry observacional para pesquisa científica
- Sistema de evidência e curadoria científica
- Módulo educacional (EDU)
- Career Engine para profissionais

---

## Domínios Funcionais

| Domínio | Descrição | Tabelas Principais |
|---------|-----------|-------------------|
| **Pacientes** | Cadastro e dados demográficos | `patients`, `patient_portal_access` |
| **Atendimentos** | Sessões de atendimento clínico | `attendance_sessions`, `attendance_files` |
| **Prontuários** | Registros clínicos versionados | `clinical_records`, `clinical_record_versions` |
| **Triagem PRP** | Avaliação pré-procedimento | `prp_screenings`, `prp_lab_results` |
| **Procedimentos** | Protocolos padronizados | `procedure_standard_records`, `prp_protocol_core`, `co_interventions_core` |
| **Outcomes/Follow-ups** | Desfechos e acompanhamento | `patient_reported_outcomes`, `procedure_followups` |
| **Registry** | Dados observacionais para pesquisa | `registry_*` (20+ tabelas) |
| **Evidência** | Curadoria científica | `curations`, `curadoria_articles`, `evidence_dimensions` |
| **Auditoria** | Rastreabilidade e compliance | `audit_logs`, `diligence_*` |
| **Career** | Métricas de desempenho profissional | `career_*` (8 tabelas) |
| **Usuários** | Autenticação e perfis | `user_profiles`, `user_roles`, `subscriptions` |

---

## Tabelas por Categoria

### 1. PACIENTES E CADASTRO

#### `patients`
**Finalidade:** Cadastro principal de pacientes

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `full_name` | text | ✅ | - | Nome completo do paciente |
| `age` | integer | ❌ | - | Idade |
| `gender` | text | ❌ | - | Sexo/gênero |
| `email` | text | ❌ | - | Email de contato |
| `phone` | text | ❌ | - | Telefone |
| `cpf` | text | ❌ | - | CPF (documento) |
| `address` | text | ❌ | - | Endereço |
| `photo_url` | text | ❌ | - | URL da foto |
| `professional_id` | uuid | ✅ | FK → auth.users | Profissional responsável |
| `is_synthetic` | boolean | ❌ | - | Flag para dados de QA |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `patient_portal_access`
**Finalidade:** Controle de acesso dos pacientes ao portal

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `professional_id` | uuid | ✅ | FK → auth.users | Profissional que liberou |
| `login_surname` | text | ❌ | - | Sobrenome para login |
| `is_active` | boolean | ✅ | - | Acesso ativo |
| `last_login_at` | timestamptz | ❌ | - | Último login |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

### 2. ATENDIMENTOS (ATTENDANCE)

#### `attendance_sessions`
**Finalidade:** Container de atendimento clínico (UX wrapper)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `patient_id` | uuid | ✅ | FK → patients | Paciente atendido |
| `user_id` | uuid | ✅ | FK → auth.users | Profissional responsável |
| `involves_orthobiologics` | boolean | ✅ | - | Envolve ortobiológicos (determina fluxo) |
| `has_standardized_procedure` | boolean | ❌ | - | Possui procedimento padronizado |
| `title` | text | ❌ | - | Título do atendimento |
| `closed_at` | timestamptz | ❌ | - | Data de fechamento |
| `closed_by` | uuid | ❌ | FK → auth.users | Quem fechou |
| `last_report_generated_at` | timestamptz | ❌ | - | Último relatório gerado |
| `last_report_record_id` | uuid | ❌ | - | ID do último relatório |
| `last_report_type` | text | ❌ | - | Tipo: 'preview' ou 'pdf' |
| `last_report_duration_ms` | integer | ❌ | - | Tempo de geração em ms |
| `is_synthetic` | boolean | ❌ | - | Flag para dados de QA |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `attendance_files`
**Finalidade:** Arquivos anexados ao atendimento (exames, imagens)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `attendance_ref` | uuid | ✅ | FK → attendance_sessions | Atendimento |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `user_id` | uuid | ✅ | FK → auth.users | Quem fez upload |
| `file_path` | text | ✅ | - | Caminho no storage |
| `file_name` | text | ✅ | - | Nome do arquivo |
| `mime_type` | text | ❌ | - | Tipo MIME |
| `file_type` | text | ✅ | - | Categoria: exam, report, image, photo, other |
| `description` | text | ❌ | - | Descrição |
| `uploaded_at` | timestamptz | ✅ | - | Data de upload |

---

### 3. PRONTUÁRIOS CLÍNICOS

#### `clinical_records`
**Finalidade:** Registro clínico (prontuário) com anamnese e diagnóstico

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `attendance_id` | uuid | ❌ | FK → attendance_sessions | Atendimento vinculado |
| `chief_complaint` | text | ❌ | - | Queixa principal |
| `anamnesis` | text | ❌ | - | Anamnese completa |
| `physical_exam` | text | ❌ | - | Exame físico |
| `clinical_diagnosis` | text | ❌ | - | Diagnóstico clínico |
| `status` | text | ✅ | - | Status: 'draft' ou 'final' |
| `legacy_migrated_at` | timestamptz | ❌ | - | Data de migração (se legado) |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `clinical_record_versions`
**Finalidade:** Versionamento imutável dos prontuários (compliance)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `clinical_record_id` | uuid | ✅ | FK → clinical_records | Prontuário original |
| `version_number` | integer | ✅ | - | Número sequencial da versão |
| `data` | jsonb | ✅ | - | Snapshot completo dos dados |
| `hash_integrity` | text | ✅ | - | Hash SHA256 para integridade |
| `changed_by` | uuid | ❌ | FK → auth.users | Quem alterou |
| `change_reason` | text | ❌ | - | Motivo da alteração |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

### 4. TRIAGEM BIOLÓGICA (PRP SCREENING)

#### `prp_screenings` ⭐ TRIAGEM
**Finalidade:** Triagem clínica pré-procedimento ortobiológico

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `screening_date` | timestamptz | ✅ | - | Data da triagem |
| `questionnaire_responses` | jsonb | ✅ | - | Respostas do questionário |
| `classification` | text | ❌ | - | Classificação: green, yellow, red |
| `analysis_result` | text | ❌ | - | Resultado da análise (IA) |
| `recommended_exams` | jsonb | ❌ | - | Exames recomendados |
| `patient_orientations` | text | ❌ | - | Orientações ao paciente |
| `regen_case_status` | text | ❌ | - | Status: S0, S1, S2, S3 |
| `triage_completed_at` | timestamptz | ❌ | - | Triagem completada |
| `clinical_chief_complaint` | text | ❌ | - | Queixa (avaliação clínica) |
| `clinical_anamnesis` | text | ❌ | - | Anamnese (avaliação clínica) |
| `clinical_physical_exam` | text | ❌ | - | Exame físico |
| `clinical_diagnosis` | text | ❌ | - | Diagnóstico |
| `clinical_assessment_completed_at` | timestamptz | ❌ | - | Avaliação completada |
| `clinical_assessment_by` | text | ❌ | - | Quem avaliou |
| `labs_validated` | jsonb | ❌ | - | Labs validados |
| `labs_collected_date` | date | ❌ | - | Data coleta labs |
| `canonical_updated_at` | timestamptz | ❌ | - | Última atualização canônica |
| `engine_computed_at` | timestamptz | ❌ | - | Última computação do engine |
| `canonical_hash` | text | ❌ | - | Hash dos dados canônicos |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `prp_lab_results` ⭐ TRIAGEM
**Finalidade:** Resultados de exames laboratoriais para triagem

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `screening_id` | uuid | ✅ | FK → prp_screenings | Triagem vinculada |
| `lab_values` | jsonb | ❌ | - | Valores laboratoriais estruturados |
| `raw_text` | text | ❌ | - | Texto bruto do exame |
| `extracted_text` | text | ❌ | - | Texto extraído por OCR |
| `interpretation` | text | ❌ | - | Interpretação clínica |
| `updated_classification` | text | ❌ | - | Classificação atualizada pós-labs |
| `attached_files` | jsonb | ❌ | - | Arquivos anexados |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

### 5. PROCEDIMENTOS PADRONIZADOS

#### `procedure_standard_records` ⭐ PROCEDIMENTO
**Finalidade:** Registro padronizado de procedimento (Clinical Standard)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `attendance_id` | uuid | ✅ | FK → attendance_sessions | Atendimento |
| `procedure_type` | text | ✅ | - | Tipo: PRP, outras terapias |
| `pathology` | text | ✅ | - | Patologia tratada |
| `anatomic_region` | text | ✅ | - | Região anatômica |
| `specific_location` | text | ❌ | - | Localização específica |
| `severity_classification` | text | ✅ | - | Classificação de gravidade |
| `symptom_duration` | text | ❌ | - | Duração dos sintomas |
| `clinical_standard_status` | text | ✅ | - | Status: not_eligible, eligible, standard |
| `clinical_standard_notes` | text[] | ❌ | - | Notas de padronização |
| `is_comparable` | boolean | ✅ | - | Se é comparável no registry |
| `cluster_key` | text | ❌ | - | Chave do cluster (benchmark) |
| `protocol_signature` | text | ❌ | - | Assinatura do protocolo |
| `last_evaluated_at` | timestamptz | ❌ | - | Última avaliação |
| `is_synthetic` | boolean | ❌ | - | Flag para dados de QA |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `prp_protocol_core` ⭐ PROCEDIMENTO
**Finalidade:** Detalhes do protocolo PRP utilizado

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `procedure_standard_record_id` | uuid | ✅ | FK → procedure_standard_records | Procedimento |
| `sessions_count` | text | ✅ | - | Número de sessões |
| `sessions_interval` | text | ✅ | - | Intervalo entre sessões |
| `volume_per_session_range` | text | ✅ | - | Volume por sessão |
| `prp_type` | text | ✅ | - | Tipo de PRP |
| `prp_activation` | text | ✅ | - | Ativação do PRP |
| `activation_method` | text | ❌ | - | Método de ativação |
| `imaging_guidance` | text | ✅ | - | Guia de imagem (USG, etc) |
| `prp_with_hyaluronic_acid` | boolean | ✅ | - | Combinado com AH |
| `hyaluronic_acid_type` | text | ❌ | - | Tipo de AH |
| `recent_nsaid_use` | text | ✅ | - | Uso recente de AINE |
| `is_synthetic` | boolean | ❌ | - | Flag para dados de QA |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `co_interventions_core` ⭐ PROCEDIMENTO
**Finalidade:** Co-intervenções associadas ao procedimento

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `procedure_standard_record_id` | uuid | ✅ | FK → procedure_standard_records | Procedimento |
| `exercise_therapy` | boolean | ✅ | - | Cinesioterapia |
| `shockwave_therapy` | text | ✅ | - | Ondas de choque (none, focused, radial) |
| `epi_associated` | boolean | ✅ | - | EPI associado |
| `is_synthetic` | boolean | ❌ | - | Flag para dados de QA |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `patient_procedures`
**Finalidade:** Registro histórico de procedimentos realizados (legado)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `procedure_type` | text | ✅ | - | Tipo de procedimento |
| `procedure_name` | text | ✅ | - | Nome do procedimento |
| `procedure_date` | date | ✅ | - | Data de realização |
| `notes` | text | ❌ | - | Observações |
| `created_by` | uuid | ❌ | FK → auth.users | Profissional |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

### 6. OUTCOMES E FOLLOW-UPS

#### `patient_reported_outcomes` ⭐ DESFECHOS
**Finalidade:** Desfechos reportados pelo paciente (PROMs)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `attendance_id` | uuid | ✅ | FK → attendance_sessions | Atendimento |
| `procedure_standard_record_id` | uuid | ❌ | FK → procedure_standard_records | Procedimento |
| `timepoint` | text | ✅ | - | Momento: T0, M1, M3, M6, M12 |
| `pain_score` | integer | ❌ | - | Escala de dor (0-10) |
| `function_scale_type` | text | ❌ | - | Tipo de escala funcional |
| `function_score` | numeric | ❌ | - | Score funcional |
| `submitted_at` | timestamptz | ✅ | - | Data de submissão |
| `is_synthetic` | boolean | ❌ | - | Flag para dados de QA |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `procedure_followups` ⭐ DESFECHOS
**Finalidade:** Agendamento e registro de follow-ups

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `screening_id` | uuid | ✅ | FK → prp_screenings | Triagem |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `clinician_id` | uuid | ✅ | FK → auth.users | Profissional |
| `timepoint` | text | ✅ | - | Momento: D7, D30, D90, D180, D365 |
| `scheduled_for` | date | ✅ | - | Data agendada |
| `rescheduled_from` | date | ❌ | - | Reagendado de |
| `status` | text | ✅ | - | Status: pending, completed, missed, cancelled |
| `completed_at` | timestamptz | ❌ | - | Data de conclusão |
| `pain_score` | integer | ❌ | - | Dor no follow-up |
| `function_score` | integer | ❌ | - | Função no follow-up |
| `function_text` | text | ❌ | - | Descrição funcional |
| `global_change` | text | ❌ | - | Mudança global percebida |
| `adverse_event` | boolean | ❌ | - | Evento adverso |
| `adverse_event_severity` | text | ❌ | - | Gravidade: mild, moderate, severe |
| `adverse_event_description` | text | ❌ | - | Descrição do evento |
| `treatment_adherence` | text | ❌ | - | Aderência ao tratamento |
| `patient_self_declaration` | boolean | ❌ | - | Auto-declaração do paciente |
| `patient_self_declaration_at` | timestamptz | ❌ | - | Data da declaração |
| `notes` | text | ❌ | - | Observações |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

### 7. REGISTRY (PESQUISA OBSERVACIONAL)

#### `registry_cases` ⭐ SCORE/DECISÃO
**Finalidade:** Casos do registry observacional

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único (case_uid) |
| `registry_case_id` | uuid | ✅ | - | ID do caso |
| `screening_id` | uuid | ❌ | FK → prp_screenings | Triagem |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `professional_id` | uuid | ✅ | FK → auth.users | Profissional |
| `site_id` | text | ❌ | - | ID do site |
| `status` | text | ✅ | - | Status: included, withdrawn |
| `consented_at` | timestamptz | ❌ | - | Data do consentimento |
| `withdrawn_at` | timestamptz | ❌ | - | Data de retirada |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `registry_episodes`
**Finalidade:** Episódios clínicos do registry

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `clinician_id` | uuid | ✅ | FK → auth.users | Clínico |
| `status` | text | ✅ | - | Status: active, closed |
| `region_primary` | text | ❌ | - | Região principal |
| `suspected_diagnosis` | text | ❌ | - | Diagnóstico suspeito |
| `pain_duration` | text | ❌ | - | Duração da dor |
| `baseline_pain_0_10` | numeric | ❌ | - | Dor basal |
| `planned_procedure_type` | text | ❌ | - | Procedimento planejado |
| `registry_consent_status` | text | ✅ | - | Status consentimento |
| `registry_eligible` | boolean | ✅ | - | Elegível para registry |
| `registry_case_id` | text | ❌ | - | ID do caso |
| `registry_partner` | text | ❌ | - | Parceiro do registry |
| `safety_block` | boolean | ✅ | - | Bloqueio de segurança |
| `notes_internal` | text | ❌ | - | Notas internas |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `registry_procedures`
**Finalidade:** Procedimentos do registry

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `registry_case_id` | uuid | ✅ | FK → registry_cases | Caso |
| `procedure_type` | text | ✅ | - | Tipo de procedimento |
| `procedure_date` | date | ✅ | - | Data do procedimento |
| `image_guided` | boolean | ❌ | - | Guiado por imagem |
| `anatomical_site_detail` | text | ❌ | - | Detalhe anatômico |
| `application_count` | integer | ❌ | - | Número de aplicações |
| `immediate_adverse_event` | boolean | ❌ | - | Evento adverso imediato |
| `adverse_event_type` | text | ❌ | - | Tipo de evento adverso |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `registry_baseline`
**Finalidade:** Dados de baseline para pesquisa

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `registry_case_id` | uuid | ✅ | FK → registry_cases | Caso |
| `age_range` | text | ❌ | - | Faixa etária |
| `sex` | text | ❌ | - | Sexo |
| `primary_diagnosis` | text | ❌ | - | Diagnóstico primário |
| `anatomical_region` | text | ❌ | - | Região anatômica |
| `pain_duration_range` | text | ❌ | - | Faixa de duração da dor |
| `initial_pain_score` | integer | ❌ | - | Dor inicial |
| `comorbidities` | jsonb | ❌ | - | Comorbidades |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `registry_longitudinal_followups` ⭐ DESFECHOS
**Finalidade:** Follow-ups longitudinais do registry

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `registry_case_id` | uuid | ✅ | FK → registry_cases | Caso |
| `timepoint` | integer | ✅ | - | Dias pós-procedimento |
| `pain_score` | integer | ❌ | - | Score de dor |
| `perceived_improvement` | integer | ❌ | - | Melhora percebida |
| `return_to_activity` | boolean | ❌ | - | Retorno às atividades |
| `new_intervention` | boolean | ❌ | - | Nova intervenção necessária |
| `late_adverse_event` | boolean | ❌ | - | Evento adverso tardio |
| `adverse_event_description` | text | ❌ | - | Descrição do evento |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `registry_score_snapshots` ⭐ SCORE
**Finalidade:** Snapshots de scores para pesquisa

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `episode_id` | uuid | ✅ | FK → registry_episodes | Episódio |
| `score_version` | text | ✅ | - | Versão do score |
| `score_context` | text | ✅ | - | Contexto: triage_only, full |
| `score_value` | numeric | ❌ | - | Valor do score |
| `score_classification` | text | ❌ | - | Classificação |
| `reasoning_json` | jsonb | ❌ | - | Raciocínio em JSON |
| `recommendations_json` | jsonb | ❌ | - | Recomendações em JSON |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `registry_engine_snapshots` ⭐ SCORE/DECISÃO
**Finalidade:** Snapshots do Regen Engine

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `registry_case_id` | uuid | ✅ | FK → registry_cases | Caso |
| `final_state` | text | ❌ | - | Estado final |
| `engine_outputs` | jsonb | ✅ | - | Saídas do engine (BRS, CRS, DIE, etc) |
| `engine_computed_at` | timestamptz | ❌ | - | Data de computação |
| `canonical_hash` | text | ❌ | - | Hash canônico |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `registry_triage_snapshots` ⭐ TRIAGEM
**Finalidade:** Snapshots de triagem para pesquisa

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `episode_id` | uuid | ✅ | FK → registry_episodes | Episódio |
| `triage_version` | text | ✅ | - | Versão da triagem |
| `answers_json` | jsonb | ✅ | - | Respostas do questionário |
| `red_flags_present` | boolean | ✅ | - | Red flags presentes |
| `red_flags_list` | jsonb | ❌ | - | Lista de red flags |
| `medications_flags_json` | jsonb | ❌ | - | Flags de medicamentos |
| `biological_soil_flags_json` | jsonb | ❌ | - | Flags biológicos |
| `nutrition_flags_json` | jsonb | ❌ | - | Flags nutricionais |
| `lifestyle_flags_json` | jsonb | ❌ | - | Flags de estilo de vida |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `report_snapshots`
**Finalidade:** Snapshots imutáveis de relatórios gerados

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `evaluation_id` | uuid | ❌ | - | ID da avaliação |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `user_id` | uuid | ✅ | FK → auth.users | Usuário |
| `attendance_ref` | uuid | ❌ | FK → attendance_sessions | Atendimento |
| `generator_version` | text | ✅ | - | Versão do gerador |
| `report_hash` | text | ✅ | - | Hash do relatório |
| `report_json` | jsonb | ✅ | - | Dados do relatório |
| `generated_at` | timestamptz | ✅ | - | Data de geração |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

### 8. PESQUISA E EXPORTAÇÃO

#### `research_config`
**Finalidade:** Configurações de pesquisa (salt, etc)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `key` | text | ✅ | PK | Chave de configuração |
| `value` | text | ✅ | - | Valor |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `research_export_snapshots`
**Finalidade:** Snapshots de exportação para publicação científica

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `snapshot_code` | text | ✅ | - | Código: REGEN-YYYY-NNN |
| `created_by` | uuid | ✅ | FK → auth.users | Quem criou |
| `export_log_id` | uuid | ❌ | FK → registry_exports_log | Log de exportação |
| `export_hash` | text | ✅ | - | Hash da exportação |
| `view_name` | text | ✅ | - | Nome da view |
| `view_version` | text | ✅ | - | Versão da view |
| `filters_json` | jsonb | ❌ | - | Filtros aplicados |
| `row_count` | integer | ✅ | - | Número de linhas |
| `title` | text | ❌ | - | Título |
| `notes` | text | ❌ | - | Notas |
| `is_published` | boolean | ✅ | - | Se está publicado |
| `published_at` | timestamptz | ❌ | - | Data de publicação |
| `doi` | text | ❌ | - | DOI do artigo |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `registry_exports_log`
**Finalidade:** Log de exportações (append-only, imutável)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `exported_by` | uuid | ✅ | FK → auth.users | Quem exportou |
| `exported_at` | timestamptz | ✅ | - | Data de exportação |
| `export_name` | text | ✅ | - | Nome da exportação |
| `export_version` | text | ✅ | - | Versão |
| `view_version` | text | ✅ | - | Versão da view |
| `export_format` | text | ❌ | - | Formato: csv, json |
| `export_hash` | text | ❌ | - | Hash |
| `filters_json` | jsonb | ✅ | - | Filtros |
| `row_count` | integer | ✅ | - | Linhas exportadas |
| `status` | text | ✅ | - | Status: success, failed |
| `notes` | text | ❌ | - | Notas |
| `user_agent` | text | ❌ | - | User agent |
| `ip_address` | text | ❌ | - | IP |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `registry_research_data_dictionary`
**Finalidade:** Dicionário de dados para pesquisa

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `view_name` | text | ✅ | - | Nome da view |
| `view_version` | text | ✅ | - | Versão |
| `field_name` | text | ✅ | - | Nome do campo |
| `field_type` | text | ✅ | - | Tipo de dado |
| `definition` | text | ✅ | - | Definição |
| `possible_values` | text | ❌ | - | Valores possíveis |
| `source_table` | text | ❌ | - | Tabela fonte |
| `transformation_rules` | text | ❌ | - | Regras de transformação |
| `is_phi` | boolean | ✅ | - | Se contém PHI |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

### 9. AUDITORIA E COMPLIANCE

#### `audit_logs`
**Finalidade:** Log de auditoria de todas as ações do sistema

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `user_id` | uuid | ❌ | FK → auth.users | Usuário |
| `user_email` | text | ❌ | - | Email do usuário |
| `action` | text | ✅ | - | Ação realizada |
| `table_name` | text | ❌ | - | Tabela afetada |
| `record_id` | uuid | ❌ | - | ID do registro |
| `old_data` | jsonb | ❌ | - | Dados anteriores |
| `new_data` | jsonb | ❌ | - | Novos dados |
| `ip_address` | text | ❌ | - | IP |
| `user_agent` | text | ❌ | - | User agent |
| `session_id` | text | ❌ | - | ID da sessão |
| `additional_info` | jsonb | ❌ | - | Informações adicionais |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `diligence_checklists`
**Finalidade:** Checklists de diligência clínica

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `user_id` | uuid | ✅ | FK → auth.users | Usuário |
| `case_id` | uuid | ❌ | - | Caso vinculado |
| `checklist_type` | text | ✅ | - | Tipo de checklist |
| `checklist_items` | jsonb | ✅ | - | Itens do checklist |
| `completed_items` | jsonb | ✅ | - | Itens completados |
| `status` | text | ✅ | - | Status: pending, completed |
| `immutable` | boolean | ✅ | - | Se é imutável |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `patient_consents`
**Finalidade:** Consentimentos de pacientes (LGPD)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `patient_id` | uuid | ✅ | FK → patients | Paciente |
| `consent_type` | text | ✅ | - | Tipo de consentimento |
| `consent_text` | text | ✅ | - | Texto do consentimento |
| `accepted` | boolean | ✅ | - | Se foi aceito |
| `accepted_at` | timestamptz | ❌ | - | Data de aceitação |
| `ip_address` | text | ❌ | - | IP |
| `user_agent` | text | ❌ | - | User agent |
| `witness_user_id` | uuid | ❌ | FK → auth.users | Testemunha |
| `revoked_at` | timestamptz | ❌ | - | Data de revogação |
| `revocation_reason` | text | ❌ | - | Motivo da revogação |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

### 10. CAREER ENGINE

#### `career_metrics`
**Finalidade:** Métricas de desempenho profissional

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `user_id` | uuid | ✅ | FK → auth.users | Profissional |
| `period` | text | ✅ | - | Período: 2024-Q1, etc |
| `metric_type` | text | ✅ | - | Tipo de métrica |
| `value` | numeric | ✅ | - | Valor |
| `percentile` | numeric | ❌ | - | Percentil |
| `metadata` | jsonb | ❌ | - | Metadados |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `career_certifications`
**Finalidade:** Certificações conquistadas

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `user_id` | uuid | ✅ | FK → auth.users | Profissional |
| `certification_type` | text | ✅ | - | Tipo de certificação |
| `certification_level` | text | ✅ | - | Nível: bronze, silver, gold |
| `earned_at` | timestamptz | ✅ | - | Data de conquista |
| `valid_until` | timestamptz | ❌ | - | Válido até |
| `criteria_met` | jsonb | ❌ | - | Critérios atingidos |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `career_alerts`
**Finalidade:** Alertas e notificações de carreira

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `user_id` | uuid | ✅ | FK → auth.users | Profissional |
| `period` | text | ✅ | - | Período |
| `alert_type` | text | ✅ | - | Tipo de alerta |
| `severity` | text | ✅ | - | Severidade: info, warning, error |
| `title` | text | ✅ | - | Título |
| `message` | text | ✅ | - | Mensagem |
| `is_read` | boolean | ❌ | - | Se foi lido |
| `is_dismissed` | boolean | ❌ | - | Se foi dispensado |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

### 11. USUÁRIOS E SISTEMA

#### `user_profiles`
**Finalidade:** Perfil do profissional

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `user_id` | uuid | ✅ | FK → auth.users | Usuário |
| `full_name` | text | ✅ | - | Nome completo |
| `phone` | text | ❌ | - | Telefone |
| `cpf` | text | ❌ | - | CPF |
| `address` | text | ❌ | - | Endereço |
| `created_at` | timestamptz | ❌ | - | Data de criação |

---

#### `user_roles`
**Finalidade:** Papéis dos usuários

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `user_id` | uuid | ✅ | FK → auth.users | Usuário |
| `role` | app_role | ✅ | - | Papel: admin, professional, viewer, patient, research |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `subscriptions`
**Finalidade:** Assinaturas e planos

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `user_id` | uuid | ✅ | FK → auth.users | Usuário |
| `current_plan` | text | ✅ | - | Plano: basic, premium, pro |
| `status` | text | ✅ | - | Status: active, cancelled |
| `next_renewal_date` | timestamptz | ❌ | - | Próxima renovação |
| `scheduled_plan_change` | text | ❌ | - | Mudança de plano agendada |
| `scheduled_effective_date` | timestamptz | ❌ | - | Data efetiva da mudança |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `user_sessions`
**Finalidade:** Sessões ativas (limite de 3 por usuário)

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `user_id` | uuid | ✅ | FK → auth.users | Usuário |
| `session_token` | text | ✅ | - | Token da sessão |
| `ip_address` | text | ❌ | - | IP |
| `user_agent` | text | ❌ | - | User agent |
| `device_info` | jsonb | ❌ | - | Informações do dispositivo |
| `last_activity_at` | timestamptz | ✅ | - | Última atividade |
| `expires_at` | timestamptz | ✅ | - | Data de expiração |
| `is_active` | boolean | ✅ | - | Se está ativa |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

### 12. EVIDÊNCIA E CURADORIA

#### `curadoria_articles`
**Finalidade:** Artigos científicos para curadoria

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `title` | text | ✅ | - | Título do artigo |
| `authors` | text | ✅ | - | Autores |
| `year` | integer | ✅ | - | Ano de publicação |
| `journal` | text | ✅ | - | Periódico |
| `interest` | text | ✅ | - | Área de interesse |
| `tags` | text[] | ❌ | - | Tags |
| `doi` | text | ❌ | - | DOI |
| `pubmed_url` | text | ❌ | - | URL PubMed |
| `pdf_url` | text | ❌ | - | URL do PDF |
| `pdf_path` | text | ❌ | - | Caminho do PDF |
| `abstract` | text | ❌ | - | Resumo |
| `status` | curadoria_status | ✅ | - | Status de curadoria |
| `practice_change` | text | ❌ | - | Mudança na prática |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `curations`
**Finalidade:** Curadorias científicas estruturadas

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `article_id` | uuid | ✅ | FK → curadoria_articles | Artigo |
| `version` | integer | ✅ | - | Versão |
| `status` | curation_status | ✅ | - | Status |
| `created_by` | uuid | ❌ | FK → auth.users | Criador |
| `reviewed_by` | uuid | ❌ | FK → auth.users | Revisor |
| `reviewed_at` | timestamptz | ❌ | - | Data de revisão |
| `objective` | text | ❌ | - | Objetivo do estudo |
| `design` | text | ❌ | - | Desenho do estudo |
| `design_type` | study_design | ❌ | - | Tipo: RCT, cohort, etc |
| `population` | text | ❌ | - | População estudada |
| `sample_size` | text | ❌ | - | Tamanho da amostra |
| `intervention` | text | ❌ | - | Intervenção |
| `comparator` | text | ❌ | - | Comparador |
| `outcomes_primary` | text | ❌ | - | Desfechos primários |
| `outcomes_secondary` | text | ❌ | - | Desfechos secundários |
| `results_key` | text | ❌ | - | Resultados principais |
| `adverse_events` | text | ❌ | - | Eventos adversos |
| `limitations` | text | ❌ | - | Limitações |
| `authors_conclusion` | text | ❌ | - | Conclusão dos autores |
| `evidence_level` | evidence_level | ❌ | - | Nível de evidência |
| `bias_risk` | bias_risk | ❌ | - | Risco de viés |
| `applicability` | applicability | ❌ | - | Aplicabilidade |
| `clinical_takeaways` | text[] | ❌ | - | Conclusões clínicas |
| `what_changes_in_practice` | text | ❌ | - | O que muda na prática |
| `practice_impact` | text | ❌ | - | Impacto na prática |
| `generated_by` | text | ❌ | - | Gerado por (IA/humano) |
| `ai_coverage` | text | ❌ | - | Cobertura da IA |
| `ai_notes` | text | ❌ | - | Notas da IA |
| `category_code` | text | ❌ | FK → therapy_categories | Categoria de terapia |
| `therapy_item_code` | text | ❌ | FK → therapy_items | Item de terapia |
| `citations` | jsonb | ❌ | - | Citações |
| `approval_declaration` | boolean | ❌ | - | Declaração de aprovação |
| `rejection_reason` | text | ❌ | - | Motivo de rejeição |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

#### `evidence_dimensions`
**Finalidade:** Dimensões de evidência por tema

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `dimension_key` | text | ✅ | - | Chave da dimensão |
| `title` | text | ✅ | - | Título |
| `description` | text | ❌ | - | Descrição |
| `category` | text | ✅ | - | Categoria |
| `therapy_item_code` | text | ❌ | FK → therapy_items | Item de terapia |
| `evidence_tags` | text[] | ❌ | - | Tags de evidência |
| `is_active` | boolean | ✅ | - | Se está ativa |
| `created_at` | timestamptz | ✅ | - | Data de criação |
| `updated_at` | timestamptz | ✅ | - | Data de atualização |

---

### 13. TAXONOMIA DE TERAPIAS

#### `therapy_categories`
**Finalidade:** Categorias de terapias

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `code` | text | ✅ | PK | Código da categoria |
| `name` | text | ✅ | - | Nome |
| `risk_class` | text | ✅ | - | Classe de risco |
| `requires_score` | boolean | ✅ | - | Requer score |
| `requires_checklist` | boolean | ✅ | - | Requer checklist |
| `requires_curadoria` | boolean | ✅ | - | Requer curadoria |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `therapy_items`
**Finalidade:** Itens específicos de terapia

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `code` | text | ✅ | PK | Código do item |
| `name` | text | ✅ | - | Nome |
| `category_code` | text | ✅ | FK → therapy_categories | Categoria |
| `base_component_category_code` | text | ❌ | FK → therapy_categories | Categoria base |
| `created_at` | timestamptz | ✅ | - | Data de criação |

---

#### `clinical_taxonomies`
**Finalidade:** Taxonomias clínicas gerais

| Campo | Tipo | Obrigatório | Relação | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | uuid | ✅ | PK | Identificador único |
| `code` | text | ✅ | - | Código |
| `name` | text | ✅ | - | Nome |
| `description` | text | ❌ | - | Descrição |
| `is_active` | boolean | ❌ | - | Se está ativo |
| `display_order` | integer | ❌ | - | Ordem de exibição |
| `created_at` | timestamptz | ❌ | - | Data de criação |
| `updated_at` | timestamptz | ❌ | - | Data de atualização |

---

## Enums (Tipos Customizados)

| Enum | Valores | Uso |
|------|---------|-----|
| `app_role` | admin, professional, viewer, patient, research | Papéis de usuário |
| `curadoria_status` | sem_curadoria, solicitada, em_analise, em_producao, disponivel, indeferida | Status de curadoria de artigos |
| `curation_status` | rascunho, em_producao, em_revisao, aprovada, disponivel, rejeitada, arquivada | Status de curadorias |
| `evidence_level` | ia, ib, iia, iib, iii, iv, v | Níveis de evidência científica |
| `bias_risk` | baixo, moderado, alto, muito_alto, incerto | Risco de viés |
| `applicability` | alta, moderada, baixa, muito_baixa, nao_aplicavel | Aplicabilidade clínica |
| `study_design` | rct, cohort, case_control, case_series, review, meta_analysis, other | Tipo de desenho de estudo |
| `function_scale_type` | WOMAC, KOOS, ODI, NDI, DASH, VISA_A, OUTRA | Escalas funcionais |
| `consent_status` | verified, pending, blocked | Status de consentimento |
| `mentor_status` | pending_review, approved, rejected, suspended | Status de mentor |

---

## Mapeamento Científico

### Tabelas de TRIAGEM CLÍNICA ⚗️

| Tabela | Responsabilidade |
|--------|-----------------|
| `prp_screenings` | Questionário de triagem, classificação de risco, red flags |
| `prp_lab_results` | Resultados laboratoriais anexados à triagem |
| `registry_triage_snapshots` | Snapshots de triagem para pesquisa |

---

### Tabelas de PROCEDIMENTO 💉

| Tabela | Responsabilidade |
|--------|-----------------|
| `procedure_standard_records` | Registro padronizado do procedimento (patologia, região, gravidade) |
| `prp_protocol_core` | Detalhes do protocolo PRP (sessões, volume, tipo, ativação) |
| `co_interventions_core` | Co-intervenções (cinesioterapia, ondas de choque, EPI) |
| `patient_procedures` | Histórico de procedimentos (legado) |
| `registry_procedures` | Procedimentos no registry |
| `registry_procedures_performed` | Procedimentos realizados no registry |

---

### Tabelas de SCORE/DECISÃO 📊

| Tabela | Responsabilidade |
|--------|-----------------|
| `registry_score_snapshots` | Scores computados (FisioRegen Score) |
| `registry_engine_snapshots` | Saídas do Regen Engine (BRS, CRS, DIE, PEE, TOG) |
| `registry_cases` | Casos do registry com decisões |
| `report_snapshots` | Relatórios gerados com scores |

---

### Tabelas de FOLLOW-UP/DESFECHOS 📈

| Tabela | Responsabilidade |
|--------|-----------------|
| `patient_reported_outcomes` | PROMs (dor, função) por timepoint |
| `procedure_followups` | Agendamento e resultados de follow-ups |
| `registry_followups` | Follow-ups do registry |
| `registry_longitudinal_followups` | Follow-ups longitudinais para pesquisa |

---

## Diagrama de Relacionamentos Principais

```
┌─────────────────┐
│    patients     │
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│attendance_sessio│                   │  prp_screenings │
└────────┬────────┘                   └────────┬────────┘
         │                                     │
         ├───────────────┐                     ├──────────────┐
         │               │                     │              │
         ▼               ▼                     ▼              ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ ┌───────────────┐
│clinical_records │ │procedure_standa│ │prp_lab_resul│ │procedure_follo│
└─────────────────┘ └────────┬────────┘ └─────────────┘ └───────────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐
          │prp_protocol_core│ │co_interventions │
          └─────────────────┘ └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │patient_reported_│
          │    outcomes     │
          └─────────────────┘
```

---

## Notas de Segurança

1. **RLS Habilitado**: Todas as tabelas principais têm Row Level Security
2. **Dados Sintéticos**: Flag `is_synthetic` em tabelas principais para QA
3. **Imutabilidade**: Tabelas de audit/research são append-only
4. **Pseudonimização**: Funções para gerar UIDs pseudonimizados para pesquisa
5. **Consentimento**: Sistema completo de tracking de consentimentos (LGPD)

---

*Documento gerado automaticamente em 28/01/2025*
*Versão do Schema: v2.0 (pós QA+ Phase)*
