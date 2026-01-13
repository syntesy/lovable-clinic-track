# REGHEN Database Baseline

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **Data do Baseline** | 2025-01-13 |
| **Ambiente** | Production |
| **Plataforma** | Lovable Cloud (Supabase) |
| **Project ID** | oedlipwpqkvhreqipoji |
| **Versão do Schema** | v1.0 (baseline inicial) |

---

## Resumo do Estado Atual

### Tabelas (Total: ~65 tabelas)

#### Domínio: Pacientes e Clínicos
- `patients` - Cadastro de pacientes
- `clinical_records` - Prontuários clínicos
- `clinical_record_versions` - Versionamento de prontuários
- `patient_consents` - Termos de consentimento
- `patient_documents` - Documentos de pacientes
- `patient_discharges` - Altas de pacientes
- `patient_procedures` - Procedimentos realizados
- `patient_prescriptions` - Prescrições
- `patient_portal_access` - Acesso ao portal do paciente
- `patient_events` - Eventos de pacientes

#### Domínio: PRP/Triagem Biológica
- `prp_screenings` - Triagens de PRP
- `prp_lab_results` - Resultados laboratoriais de PRP
- `blood_tests` - Exames de sangue
- `ultrasound_images` - Imagens de ultrassom

#### Domínio: Registry (Registro Observacional)
- `registry_cases` - Casos do registro
- `registry_episodes` - Episódios clínicos
- `registry_procedures` - Procedimentos do registro
- `registry_procedures_performed` - Procedimentos realizados
- `registry_followups` - Follow-ups do registry
- `registry_longitudinal_followups` - Follow-ups longitudinais
- `registry_labs` - Laboratórios do registry
- `registry_lab_orders` - Pedidos de exames
- `registry_lab_results` - Resultados laboratoriais
- `registry_consents` - Consentimentos do registry
- `registry_consent_audit` - Auditoria de consentimentos
- `registry_consent_logs` - Logs de consentimento
- `registry_snapshots` - Snapshots do registry
- `registry_score_snapshots` - Snapshots de scores
- `registry_triage_snapshots` - Snapshots de triagem
- `registry_engine_snapshots` - Snapshots do engine
- `registry_procedure_plans` - Planos de procedimento
- `registry_aggregated_metrics` - Métricas agregadas
- `registry_access_logs` - Logs de acesso
- `registry_audit_events` - Eventos de auditoria
- `registry_exports_log` - Log de exportações

#### Domínio: Pesquisa/Research
- `research_config` - Configurações de pesquisa
- `research_export_snapshots` - Snapshots de exportação
- `registry_research_data_dictionary` - Dicionário de dados
- `registry_research_export_v1` (VIEW) - View de exportação

#### Domínio: Follow-ups
- `procedure_followups` - Follow-ups de procedimentos

#### Domínio: Curadoria/Evidência
- `curadoria_articles` - Artigos científicos
- `curadoria_content` - Conteúdo de curadoria
- `curadoria_requests` - Solicitações de curadoria
- `curations` - Curadorias
- `curation_versions` - Versões de curadoria
- `curation_jobs` - Jobs de curadoria
- `curation_registry_links` - Links curadoria-registry
- `evidence_dimensions` - Dimensões de evidência
- `evidence_snapshots` - Snapshots de evidência
- `evidence_audit_log` - Log de auditoria de evidência

#### Domínio: Career Engine
- `career_metrics` - Métricas de carreira
- `career_alerts` - Alertas de carreira
- `career_certifications` - Certificações
- `career_narratives` - Narrativas de carreira
- `career_case_complexity` - Complexidade de casos
- `career_consistency_index` - Índice de consistência
- `career_opportunities` - Oportunidades

#### Domínio: Diligência
- `diligence_case_timelines` - Timelines de casos
- `diligence_checklists` - Checklists
- `diligence_compliance_logs` - Logs de compliance
- `diligence_risk_disclosures` - Divulgações de risco

#### Domínio: Terapias
- `therapy_categories` - Categorias de terapia
- `therapy_items` - Itens de terapia
- `ortobiologicos_protocols` - Protocolos ortobiológicos
- `treatment_sessions` - Sessões de tratamento

#### Domínio: Usuários e Sistema
- `user_profiles` - Perfis de usuários
- `user_roles` - Roles de usuários
- `user_sessions` - Sessões de usuários
- `subscriptions` - Assinaturas
- `audit_logs` - Logs de auditoria
- `app_events` - Eventos da aplicação
- `partners` - Parceiros
- `partner_events` - Eventos de parceiros

#### Domínio: Chat/AI
- `chat_conversations` - Conversas do chat
- `chat_messages` - Mensagens do chat

#### Domínio: Formulários/Consents
- `consent_forms` - Formulários de consentimento

#### Domínio: EDU (Views - módulo educacional)
- `edu_enrollments` (VIEW)
- `edu_cohorts` (VIEW)
- `edu_institution_members` (VIEW)

---

### Enums (Tipos Customizados)

| Enum | Valores |
|------|---------|
| `app_role` | admin, moderator, user, professional, research |
| `curadoria_status` | sem_curadoria, solicitada, em_curadoria, curada, rejeitada |
| `curation_status` | rascunho, em_revisao, disponivel, arquivado |
| `evidence_level` | 1a, 1b, 2a, 2b, 3a, 3b, 4, 5 |
| `bias_risk` | baixo, moderado, alto, critico |
| `applicability` | alta, moderada, baixa, nao_aplicavel |
| `design_type` | rct, cohort, case_control, case_series, review, meta_analysis, other |

---

### Functions (Total: ~30 funções)

#### Funções de Segurança
- `has_role()` - Verifica role do usuário (SECURITY DEFINER)
- `is_healthcare_professional()` - Verifica se é profissional de saúde
- `can_access_research_export()` - Verifica acesso a exportação de pesquisa

#### Funções de Usuário
- `handle_new_user()` - Cria perfil para novo usuário
- `assign_default_role()` - Atribui role padrão
- `handle_new_user_subscription()` - Cria subscription padrão
- `authenticate_patient()` - Autentica paciente no portal

#### Funções de Follow-up
- `create_followups_for_screening()` - Cria follow-ups
- `mark_missed_followups()` - Marca follow-ups como perdidos
- `auto_create_followups_on_procedure()` - Trigger para criar follow-ups

#### Funções de Timestamp
- `update_updated_at_column()` - Atualiza updated_at genérico
- `update_registry_episode_updated_at()` - Atualiza updated_at de episodes
- `career_update_updated_at()` - Atualiza updated_at de career

#### Funções de Auditoria
- `audit_consent_changes()` - Audita mudanças de consentimento
- `log_consent_change()` - Loga mudanças de consent status
- `log_audit_action()` - Helper para logs de auditoria

#### Funções de Proteção
- `prevent_update_immutable()` - Previne update em registros imutáveis
- `prevent_delete_diligence()` - Previne delete em diligence
- `prevent_export_log_update()` - Previne update em export logs
- `prevent_export_log_delete()` - Previne delete em export logs
- `prevent_snapshot_delete()` - Previne delete em snapshots

#### Funções de Pesquisa/Pseudonimização
- `pseudonymize_id()` - Pseudonimiza IDs
- `generate_case_uid()` - Gera UID pseudonimizado para casos
- `generate_procedure_uid()` - Gera UID para procedimentos
- `generate_clinician_uid()` - Gera UID para clínicos
- `generate_snapshot_code()` - Gera código de snapshot

#### Funções Utilitárias
- `generate_integrity_hash()` - Gera hash de integridade
- `normalize_evidence_tag()` - Normaliza tags de evidência
- `get_next_snapshot_version()` - Próxima versão de snapshot
- `check_patient_limit()` - Verifica limite de pacientes

---

### Storage Buckets

| Bucket | Público |
|--------|---------|
| `exam-files` | Não |
| `patient-photos` | Sim |
| `articles` | Sim |
| `edu-assets` | Não |

---

### Secrets Configurados

- `ASSISTANT_ID`
- `LOVABLE_API_KEY`
- `ASSISTANT_TRIAGEM_PRP_ID`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_PUBLISHABLE_KEY`

---

## Observações de Segurança

### RLS (Row Level Security)
- ✅ Todas as tabelas principais têm RLS habilitado
- ✅ Políticas baseadas em `auth.uid()` e roles
- ✅ Função `has_role()` com SECURITY DEFINER para evitar recursão
- ⚠️ Algumas tabelas de views (edu_*) não têm RLS (são views materializadas)

### Alertas do Linter
- ⚠️ **Leaked Password Protection Disabled** - Proteção contra senhas vazadas está desabilitada

---

## Arquivos do Baseline

| Arquivo | Descrição |
|---------|-----------|
| `schema.sql` | DDL completo (tabelas, colunas, tipos, enums, defaults) |
| `policies.sql` | Todas as RLS policies |
| `functions_triggers.sql` | Functions, triggers e procedures |
| `baseline_notes.md` | Este documento |

---

## Histórico de Mudanças

| Data | Versão | Descrição |
|------|--------|-----------|
| 2025-01-13 | v1.0 | Baseline inicial do projeto REGHEN |

---

## Próximos Passos Recomendados

1. **Habilitar proteção contra senhas vazadas** no Supabase Auth
2. **Revisar RLS policies** duplicadas em algumas tabelas
3. **Documentar views** do módulo EDU quando implementado
4. **Manter este baseline atualizado** a cada release major

---

*Documento gerado automaticamente pelo Lovable AI em 2025-01-13*
