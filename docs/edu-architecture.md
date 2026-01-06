# REGENAPP Education Academy — Arquitetura

**Versão:** 1.0.0  
**Data:** 2025-01-06  
**Schema:** `edu`  
**Status:** ✅ Produção

---

## Sumário

1. [Objetivo do Education / Academy](#1-objetivo-do-education--academy)
2. [Princípio de Isolamento](#2-princípio-de-isolamento)
3. [Enums](#3-enums)
4. [Tabelas](#4-tabelas)
5. [Triggers](#5-triggers)
6. [Funções Helper](#6-funções-helper)
7. [Storage](#7-storage)
8. [O que o Education NÃO faz](#8-o-que-o-education-não-faz)
9. [Estado Atual do Banco (Snapshot)](#9-estado-atual-do-banco-snapshot)

---

## 1. Objetivo do Education / Academy

O **REGENAPP Education Academy** é um módulo de ensino multi-tenant para instituições de saúde, projetado para:

- Capacitar profissionais em medicina regenerativa e ortobiológicos
- Oferecer casos clínicos simulados para treinamento de raciocínio
- Permitir autoavaliação de competências via checkpoints
- Treinar tomada de decisão clínica em ambiente seguro (Decision Reasoning Lab™)
- Rastrear progresso e engajamento dos estudantes

### Público-alvo

- Instituições de ensino em saúde
- Programas de especialização
- Treinamento corporativo de clínicas

---

## 2. Princípio de Isolamento

O Education Academy é **completamente isolado** do core clínico do REGENAPP.

### Regras de Isolamento

| Regra | Implementação |
|-------|---------------|
| **Schema dedicado** | Todos os objetos em `edu.*`, nenhum em `public.*` |
| **Zero FK externa** | Nenhuma foreign key de `edu.*` para `public.*` |
| **Zero FK reversa** | Nenhuma foreign key de `public.*` para `edu.*` |
| **Triggers isolados** | Nenhum trigger em `edu.*` modifica `public.*` |
| **Funções isoladas** | Nenhuma função em `edu.*` acessa `public.*` |

### Diagrama de Isolamento

```
┌─────────────────────────────────────────────────────────────┐
│                        REGENAPP                              │
├─────────────────────────────┬───────────────────────────────┤
│      CORE CLÍNICO           │      EDUCATION ACADEMY        │
│      (public.*)             │      (edu.*)                  │
│                             │                               │
│  • patients                 │  • institutions               │
│  • prp_screenings           │  • programs                   │
│  • clinical_records         │  • cohorts                    │
│  • registry_*               │  • modules                    │
│  • procedure_followups      │  • cases                      │
│  • regen_engine_v1.0.0      │  • learning_objects           │
│  • regen_rules_v1           │  • checkpoints                │
│                             │  • decision_scenarios         │
│       ❌ INTOCADO           │                               │
├─────────────────────────────┴───────────────────────────────┤
│              NENHUMA FK ENTRE OS SCHEMAS                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Enums

O schema `edu` define **16 enums**:

| Enum | Valores | Uso |
|------|---------|-----|
| `asset_type` | `image`, `pdf`, `video_link` | Tipo de asset em case_assets |
| `case_type` | `simulated`, `derived_real` | Origem do caso clínico |
| `cohort_status` | `planned`, `active`, `ended` | Ciclo de vida da turma |
| `consent_status` | `verified`, `pending`, `blocked` | Consentimento (derived_real) |
| `difficulty_level` | `intro`, `intermediate`, `advanced` | Dificuldade do caso |
| `enrollment_status` | `active`, `paused`, `ended` | Status da matrícula |
| `entity_type` | `case`, `learning_object`, `scenario`, `checkpoint` | Tipo em logs |
| `event_type` | `open_cohort`, `open_module`, `view_case`, `view_content`, `submit_decision`, `submit_checkpoint` | Ação do estudante |
| `evidence_source` | `regenapp_curated`, `external` | Origem da evidência |
| `institution_role` | `student`, `teacher`, `director`, `institution_admin` | Papel do membro |
| `institution_status` | `active`, `suspended` | Status da instituição |
| `learning_object_type` | `video`, `slides`, `pdf`, `checklist`, `reading`, `quiz` | Tipo de conteúdo |
| `link_target_type` | `case`, `technique`, `concept`, `evidence` | Destino do link |
| `member_status` | `active`, `inactive` | Status do vínculo |
| `prompt_type` | `multiple_choice`, `short_text`, `checklist` | Tipo de prompt |
| `publish_status` | `draft`, `review`, `published`, `archived` | Ciclo de publicação |

---

## 4. Tabelas

O schema `edu` contém **25 tabelas**:

### 4.1 Estrutura Institucional

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `institutions` | Instituições de ensino | `id`, `name`, `slug`, `status` |
| `institution_members` | Vínculo usuário ↔ instituição | `institution_id`, `user_id`, `role`, `status` |
| `programs` | Programas de ensino | `institution_id`, `title`, `status` |
| `cohorts` | Turmas | `institution_id`, `program_id`, `title`, `status` |
| `enrollments` | Matrículas | `institution_id`, `cohort_id`, `user_id`, `status` |

### 4.2 Módulos e Casos

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `modules` | Módulos de uma turma | `institution_id`, `cohort_id`, `title`, `status` |
| `cases` | Casos clínicos educacionais | `institution_id`, `module_id`, `case_type`, `difficulty`, `status`, `published_version_number` |
| `case_versions` | Versionamento de casos | `institution_id`, `case_id`, `version_number`, `content` (JSONB) |
| `case_assets` | Arquivos anexados | `institution_id`, `case_id`, `asset_type`, `storage_path`, `external_url` |
| `case_consents` | Consentimento (derived_real) | `institution_id`, `case_id`, `status` |
| `case_instructor_notes` | Notas do instrutor (staff-only) | `institution_id`, `case_id`, `note_text` |

### 4.3 Objetos de Aprendizagem

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `learning_objects` | Conteúdos educacionais | `institution_id`, `module_id`, `object_type`, `status` |
| `learning_links` | Ligações polimórficas | `institution_id`, `learning_object_id`, `target_type`, `target_id` |
| `concepts` | Conceitos teóricos | `institution_id`, `title` |
| `techniques` | Técnicas práticas | `institution_id`, `title` |
| `evidence_links` | Evidências científicas | `institution_id`, `module_id`, `case_id`, `source`, `citation` |

### 4.4 Avaliação

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `checkpoints` | Pontos de autoavaliação | `institution_id`, `module_id`, `title`, `status` |
| `checkpoint_items` | Itens do checkpoint | `institution_id`, `checkpoint_id`, `item_text`, `order_index` |
| `checkpoint_attempts` | Tentativas do estudante | `institution_id`, `checkpoint_id`, `user_id`, `attempt_no`, `responses` |

### 4.5 Decision Reasoning Lab™

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `decision_scenarios` | Cenários de decisão | `institution_id`, `case_id`, `title`, `status` |
| `decision_prompts` | Prompts do cenário | `institution_id`, `scenario_id`, `prompt_type`, `prompt_text`, `order_index` |
| `decision_attempts` | Respostas do estudante | `institution_id`, `scenario_id`, `user_id`, `attempt_no`, `answers` |
| `instructor_reference` | Gabarito (staff-only) | `institution_id`, `scenario_id`, `reference_text` |

### 4.6 Tracking e Progresso

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `activity_logs` | Log de atividades (append-only) | `institution_id`, `cohort_id`, `module_id`, `user_id`, `event_type`, `entity_type`, `entity_id` |
| `student_progress` | Progresso agregado (auto-update) | `institution_id`, `cohort_id`, `module_id`, `user_id`, `progress_json` |

---

## 5. Triggers

O schema `edu` possui **35 funções trigger**:

### 5.1 Consistência de institution_id (17 triggers)

Garantem que registros filhos herdem o `institution_id` do pai:

| Trigger | Tabela |
|---------|--------|
| `trg_cohorts_institution_check` | cohorts |
| `trg_modules_institution_check` | modules |
| `trg_cases_institution_check` | cases |
| `trg_case_versions_institution_check` | case_versions |
| `trg_case_assets_institution_check` | case_assets |
| `trg_case_consents_institution_check` | case_consents |
| `trg_case_instructor_notes_institution_check` | case_instructor_notes |
| `trg_learning_objects_institution_check` | learning_objects |
| `trg_learning_links_institution_check` | learning_links |
| `trg_checkpoints_institution_check` | checkpoints |
| `trg_checkpoint_items_institution_check` | checkpoint_items |
| `trg_checkpoint_attempts_institution_check` | checkpoint_attempts |
| `trg_decision_scenarios_institution_check` | decision_scenarios |
| `trg_decision_prompts_institution_check` | decision_prompts |
| `trg_decision_attempts_institution_check` | decision_attempts |
| `trg_instructor_reference_institution_check` | instructor_reference |
| `trg_enrollments_institution_check` | enrollments |
| `trg_evidence_links_institution_check` | evidence_links |
| `trg_student_progress_institution_check` | student_progress |

### 5.2 Guards de Publicação (3 triggers)

| Trigger | Tabela | Regra |
|---------|--------|-------|
| `trg_cases_publish_guard` | cases | Bloqueia publicação sem versão válida |
| `trg_checkpoints_publish_guard` | checkpoints | Bloqueia publicação sem itens |
| `trg_learning_objects_publish_guard` | learning_objects | Bloqueia publicação sem arquivo |

### 5.3 Validação de learning_links (1 trigger)

| Trigger | Tabela | Regra |
|---------|--------|-------|
| `trg_learning_links_target_validation` | learning_links | Valida target_id existe na tabela correta |

### 5.4 Activity Logs Append-Only (3 triggers)

| Trigger | Tabela | Regra |
|---------|--------|-------|
| `trg_activity_logs_append_only` | activity_logs | Bloqueia UPDATE e DELETE |
| `trg_activity_logs_validation` | activity_logs | Valida entity_id e user_id |
| `trg_activity_logs_update_progress` | activity_logs | Auto-incrementa student_progress |

### 5.5 Updated_at Automático (1 trigger)

| Trigger | Tabelas | Regra |
|---------|---------|-------|
| `set_updated_at` | (várias) | Atualiza `updated_at = now()` |

---

## 6. Funções Helper

O schema `edu` define **9 funções**:

### 6.1 Membership e Roles

| Função | Assinatura | Propósito |
|--------|------------|-----------|
| `is_member` | `(institution_id UUID) → BOOLEAN` | Verifica membership ativo |
| `has_role` | `(institution_id UUID, role) → BOOLEAN` | Verifica role específico |
| `has_any_role` | `(institution_id UUID, roles[]) → BOOLEAN` | Verifica qualquer role da lista |
| `is_enrolled` | `(cohort_id UUID) → BOOLEAN` | Verifica enrollment ativo |

### 6.2 Updated_at

| Função | Assinatura | Propósito |
|--------|------------|-----------|
| `set_updated_at` | `() → TRIGGER` | Trigger para atualizar timestamp |

### 6.3 Storage Helpers

| Função | Assinatura | Propósito |
|--------|------------|-----------|
| `edu_storage_is_member` | `(institution_id UUID) → BOOLEAN` | Wrapper para storage SELECT |
| `edu_storage_can_upload` | `(institution_id UUID) → BOOLEAN` | Verifica permissão INSERT |
| `edu_storage_is_admin` | `(institution_id UUID) → BOOLEAN` | Verifica permissão DELETE |
| `edu_storage_get_institution_id` | `(path TEXT) → UUID` | Extrai institution_id do path |

---

## 7. Storage

### Bucket: `edu-assets`

| Propriedade | Valor |
|-------------|-------|
| Nome | `edu-assets` |
| Público | ❌ **NÃO** (privado) |
| Acesso | Via RLS + signed URLs |

### Policies de Storage

| Operação | Quem pode | Função de validação |
|----------|-----------|---------------------|
| **SELECT** | Membros da instituição | `edu.edu_storage_is_member(institution_id)` |
| **INSERT** | Teacher, Director, Admin | `edu.edu_storage_can_upload(institution_id)` |
| **DELETE** | Apenas Admin | `edu.edu_storage_is_admin(institution_id)` |

### Regra Obrigatória de Path

```
{institution_id}/learning_objects/{object_id}/arquivo.pdf
└──────┬──────┘
       │
       └─ OBRIGATÓRIO: Primeiro segmento é institution_id
          Extraído por edu_storage_get_institution_id(path)
```

---

## 8. O que o Education NÃO faz

| ❌ NÃO FAZ | Justificativa |
|------------|---------------|
| **Não cria SCORE** | FisioRegen Score é exclusivo do core clínico |
| **Não gera decisão clínica real** | Decision Lab é apenas educacional |
| **Não emite recomendação de tratamento** | Nenhum output que sugira conduta médica |
| **Não acessa pacientes** | Nenhuma FK para `public.patients` |
| **Não acessa triagens** | Nenhuma FK para `public.prp_screenings` |
| **Não acessa registry** | Nenhuma FK para `public.registry_*` |
| **Não modifica core** | Nenhum trigger/função que toque `public.*` |
| **Não interfere no regen_engine** | Zero referência ao motor de decisão clínica |

### Banner Obrigatório no Decision Lab

> ⚠️ **Ambiente educacional. Não representa decisão clínica e não gera SCORE.**

---

## 9. Estado Atual do Banco (Snapshot)

📌 **Data do snapshot:** 2025-01-06

### Contagem de Objetos

| Objeto | Quantidade |
|--------|------------|
| **Tabelas em `edu`** | 25 |
| **Enums em `edu`** | 16 |
| **Funções** | 9 |
| **Triggers** | 26 |
| **Policies RLS** | 118 |

### Lista Nominal de Tabelas (ordenada A-Z)

```
 1. edu.activity_logs
 2. edu.case_assets
 3. edu.case_consents
 4. edu.case_instructor_notes
 5. edu.case_versions
 6. edu.cases
 7. edu.checkpoint_attempts
 8. edu.checkpoint_items
 9. edu.checkpoints
10. edu.cohorts
11. edu.concepts
12. edu.decision_attempts
13. edu.decision_prompts
14. edu.decision_scenarios
15. edu.enrollments
16. edu.evidence_links
17. edu.institution_members
18. edu.institutions
19. edu.instructor_reference
20. edu.learning_links
21. edu.learning_objects
22. edu.modules
23. edu.programs
24. edu.student_progress
25. edu.techniques
```

### Total de Policies RLS

```sql
SELECT COUNT(*) FROM pg_policies WHERE schemaname='edu';
-- Resultado: 118
```

### Confirmação de Bucket

| Bucket | Public | Status |
|--------|--------|--------|
| `edu-assets` | `false` (privado) | ✅ Configurado |

### Confirmação de RLS

```sql
SELECT COUNT(*) FROM pg_tables WHERE schemaname='edu' AND rowsecurity=true;
-- Resultado: 25 (100%)
```

---

*Documento oficial do REGENAPP Education Academy*  
*Schema: edu v1.0.0*  
*Gerado em: 2025-01-06*
