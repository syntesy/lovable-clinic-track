# REGENAPP Education Academy — Arquitetura

**Versão:** 1.0.0  
**Data:** 2025-01-06  
**Schema:** `edu`  
**Status:** ✅ Produção

---

## Sumário

1. [Objetivo e Princípio de Isolamento](#1-objetivo-e-princípio-de-isolamento)
2. [Enums](#2-enums)
3. [Tabelas](#3-tabelas)
4. [Triggers](#4-triggers)
5. [Funções Helper](#5-funções-helper)
6. [Storage](#6-storage)
7. [O que o Education NÃO faz](#7-o-que-o-education-não-faz)
8. [Estado Atual do Banco (Snapshot)](#8-estado-atual-do-banco-snapshot)

---

## 1. Objetivo e Princípio de Isolamento

O módulo **Education / Academy** do REGENAPP é um sistema de ensino multi-tenant para instituições de saúde, **completamente isolado do core clínico**.

### Princípios Fundamentais

| Princípio | Implementação |
|-----------|---------------|
| **Isolamento de Schema** | Todos os objetos residem em `edu.*`, sem nenhuma FK para `public.*` |
| **Multi-tenancy Rígido** | Todas as tabelas possuem `institution_id` obrigatório |
| **RLS FORCE** | 100% das tabelas com `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| **Triggers Paranoicos** | Validação de `institution_id` em cascata em todas as relações pai-filho |
| **Zero Contato Clínico** | Nenhuma referência a regen_engine, score, triagem ou pacientes |

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
│  • regen_engine_v1.0.0      │  • modules                    │
│  • registry_*               │  • cases                      │
│  • procedure_followups      │  • learning_objects           │
│                             │  • checkpoints                │
│  ❌ NÃO TOCA                │  • decision_scenarios         │
├─────────────────────────────┴───────────────────────────────┤
│                    NENHUMA FK ENTRE SCHEMAS                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Enums

O schema `edu` define **16 enums** para tipagem estrita:

| Enum | Valores | Uso |
|------|---------|-----|
| `asset_type` | `image`, `pdf`, `video_link` | Tipo de asset em case_assets |
| `case_type` | `simulated`, `derived_real` | Origem do caso clínico |
| `cohort_status` | `planned`, `active`, `ended` | Ciclo de vida da turma |
| `consent_status` | `verified`, `pending`, `blocked` | Status de consentimento (derived_real) |
| `difficulty_level` | `intro`, `intermediate`, `advanced` | Nível de dificuldade do caso |
| `enrollment_status` | `active`, `paused`, `ended` | Status da matrícula |
| `entity_type` | `case`, `learning_object`, `scenario`, `checkpoint` | Tipo de entidade em logs |
| `event_type` | `open_cohort`, `open_module`, `view_case`, `view_content`, `submit_decision`, `submit_checkpoint` | Ação do estudante |
| `evidence_source` | `regenapp_curated`, `external` | Origem da evidência científica |
| `institution_role` | `student`, `teacher`, `director`, `institution_admin` | Papel do membro |
| `institution_status` | `active`, `suspended` | Status da instituição |
| `learning_object_type` | `video`, `slides`, `pdf`, `checklist`, `reading`, `quiz` | Tipo de conteúdo |
| `link_target_type` | `case`, `technique`, `concept`, `evidence` | Destino do learning_link |
| `member_status` | `active`, `inactive` | Status do vínculo institucional |
| `prompt_type` | `multiple_choice`, `short_text`, `checklist` | Tipo de prompt no Decision Lab |
| `publish_status` | `draft`, `review`, `published`, `archived` | Ciclo de publicação |

---

## 3. Tabelas

O schema `edu` contém **25 tabelas**:

### 3.1 Estrutura Institucional

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `institutions` | Instituições de ensino | `id`, `name`, `slug`, `status` |
| `institution_members` | Vínculo usuário ↔ instituição | `institution_id`, `user_id`, `role`, `status` |
| `programs` | Programas de ensino | `institution_id`, `title`, `status` |
| `cohorts` | Turmas | `institution_id`, `program_id`, `title`, `status` |
| `enrollments` | Matrículas | `institution_id`, `cohort_id`, `user_id`, `status` |

### 3.2 Conteúdo Pedagógico

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `modules` | Módulos de uma turma | `institution_id`, `cohort_id`, `title`, `status` |
| `cases` | Casos clínicos educacionais | `institution_id`, `module_id`, `case_type`, `difficulty`, `status`, `published_version_number` |
| `case_versions` | Versionamento de casos | `institution_id`, `case_id`, `version_number`, `content` (JSONB) |
| `case_assets` | Arquivos anexados | `institution_id`, `case_id`, `asset_type`, `storage_path`, `external_url` |
| `case_consents` | Consentimento (derived_real) | `institution_id`, `case_id`, `status` |
| `case_instructor_notes` | Notas do instrutor (staff-only) | `institution_id`, `case_id`, `note_text` |

### 3.3 Objetos de Aprendizagem

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `learning_objects` | Conteúdos educacionais | `institution_id`, `module_id`, `object_type`, `status`, `storage_path`, `external_url` |
| `learning_links` | Ligações polimórficas | `institution_id`, `learning_object_id`, `target_type`, `target_id` |
| `concepts` | Conceitos teóricos | `institution_id`, `title` |
| `techniques` | Técnicas práticas | `institution_id`, `title` |
| `evidence_links` | Evidências científicas | `institution_id`, `module_id`, `case_id`, `source`, `citation` |

### 3.4 Avaliação

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `checkpoints` | Pontos de autoavaliação | `institution_id`, `module_id`, `title`, `status` |
| `checkpoint_items` | Itens do checkpoint | `institution_id`, `checkpoint_id`, `item_text`, `order_index` |
| `checkpoint_attempts` | Tentativas do estudante | `institution_id`, `checkpoint_id`, `user_id`, `attempt_no`, `responses` (JSONB) |

### 3.5 Decision Reasoning Lab™

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `decision_scenarios` | Cenários de decisão | `institution_id`, `case_id`, `title`, `status` |
| `decision_prompts` | Prompts do cenário | `institution_id`, `scenario_id`, `prompt_type`, `prompt_text`, `order_index` |
| `decision_attempts` | Respostas do estudante | `institution_id`, `scenario_id`, `user_id`, `attempt_no`, `answers` (JSONB) |
| `instructor_reference` | Gabarito (staff-only) | `institution_id`, `scenario_id`, `reference_text` |

### 3.6 Tracking e Progresso

| Tabela | Propósito | Colunas-Chave |
|--------|-----------|---------------|
| `activity_logs` | Log de atividades (append-only) | `institution_id`, `cohort_id`, `module_id`, `user_id`, `event_type`, `entity_type`, `entity_id`, `metadata` |
| `student_progress` | Progresso agregado (auto-update) | `institution_id`, `cohort_id`, `module_id`, `user_id`, `progress_json` |

---

## 4. Triggers

O schema `edu` possui **35 funções trigger** organizadas em categorias:

### 4.1 Consistência de institution_id (17 triggers)

Garantem que registros filhos herdem o mesmo `institution_id` do pai:

| Trigger | Tabela | Validação |
|---------|--------|-----------|
| `trg_cohorts_institution_check` | cohorts | cohort.institution_id = program.institution_id |
| `trg_modules_institution_check` | modules | module.institution_id = cohort.institution_id |
| `trg_cases_institution_check` | cases | case.institution_id = module.institution_id |
| `trg_case_versions_institution_check` | case_versions | version.institution_id = case.institution_id |
| `trg_case_assets_institution_check` | case_assets | asset.institution_id = case.institution_id |
| `trg_case_consents_institution_check` | case_consents | consent.institution_id = case.institution_id |
| `trg_case_instructor_notes_institution_check` | case_instructor_notes | note.institution_id = case.institution_id |
| `trg_learning_objects_institution_check` | learning_objects | lo.institution_id = module.institution_id |
| `trg_learning_links_institution_check` | learning_links | link.institution_id = lo.institution_id |
| `trg_checkpoints_institution_check` | checkpoints | cp.institution_id = module.institution_id |
| `trg_checkpoint_items_institution_check` | checkpoint_items | item.institution_id = cp.institution_id |
| `trg_checkpoint_attempts_institution_check` | checkpoint_attempts | attempt.institution_id = cp.institution_id |
| `trg_decision_scenarios_institution_check` | decision_scenarios | scenario.institution_id = case.institution_id |
| `trg_decision_prompts_institution_check` | decision_prompts | prompt.institution_id = scenario.institution_id |
| `trg_decision_attempts_institution_check` | decision_attempts | attempt.institution_id = scenario.institution_id |
| `trg_instructor_reference_institution_check` | instructor_reference | ref.institution_id = scenario.institution_id |
| `trg_enrollments_institution_check` | enrollments | enrollment.institution_id = cohort.institution_id |
| `trg_evidence_links_institution_check` | evidence_links | link.institution_id = module/case.institution_id |
| `trg_student_progress_institution_check` | student_progress | progress.institution_id = module.institution_id |

### 4.2 Publishing Guards (3 triggers)

Impedem publicação sem versão válida:

| Trigger | Tabela | Regra |
|---------|--------|-------|
| `trg_cases_publish_guard` | cases | Bloqueia `status='published'` se `published_version_number` não existe em case_versions |
| `trg_checkpoints_publish_guard` | checkpoints | Bloqueia publicação sem itens |
| `trg_learning_objects_publish_guard` | learning_objects | Bloqueia publicação sem storage_path ou external_url |

### 4.3 Learning Links Validation (1 trigger)

| Trigger | Tabela | Regra |
|---------|--------|-------|
| `trg_learning_links_target_validation` | learning_links | Valida que target_id existe na tabela correta conforme target_type |

### 4.4 Activity Logs (3 triggers)

| Trigger | Tabela | Regra |
|---------|--------|-------|
| `trg_activity_logs_append_only` | activity_logs | Bloqueia UPDATE e DELETE (imutabilidade) |
| `trg_activity_logs_validation` | activity_logs | Valida entity_id existe e user_id = auth.uid() |
| `trg_activity_logs_update_progress` | activity_logs | Auto-incrementa contadores em student_progress |

### 4.5 Utility (1 trigger)

| Trigger | Tabela | Regra |
|---------|--------|-------|
| `set_updated_at` | (várias) | Atualiza `updated_at = now()` em BEFORE UPDATE |

---

## 5. Funções Helper

O schema `edu` define **9 funções helper** para RLS e storage:

### 5.1 Membership & Roles

| Função | Assinatura | Propósito |
|--------|------------|-----------|
| `is_member` | `is_member(institution_id UUID) → BOOLEAN` | Verifica se auth.uid() tem membership ativo na instituição |
| `has_role` | `has_role(institution_id UUID, role institution_role) → BOOLEAN` | Verifica se auth.uid() tem role específico |
| `has_any_role` | `has_any_role(institution_id UUID, roles institution_role[]) → BOOLEAN` | Verifica se auth.uid() tem qualquer um dos roles listados |
| `is_enrolled` | `is_enrolled(cohort_id UUID) → BOOLEAN` | Verifica se auth.uid() tem enrollment ativo no cohort |

### 5.2 Storage Helpers

| Função | Assinatura | Propósito |
|--------|------------|-----------|
| `edu_storage_is_member` | `edu_storage_is_member(institution_id UUID) → BOOLEAN` | Wrapper para policies de storage |
| `edu_storage_is_admin` | `edu_storage_is_admin(institution_id UUID) → BOOLEAN` | Verifica se é admin para DELETE |
| `edu_storage_can_upload` | `edu_storage_can_upload(institution_id UUID) → BOOLEAN` | Verifica permissão de upload (teacher+) |
| `edu_storage_get_institution_id` | `edu_storage_get_institution_id(path TEXT) → UUID` | Extrai institution_id do path do arquivo |

### 5.3 Utility

| Função | Assinatura | Propósito |
|--------|------------|-----------|
| `set_updated_at` | `set_updated_at() → TRIGGER` | Função trigger para updated_at |

---

## 6. Storage

### Bucket: `edu-assets`

| Propriedade | Valor |
|-------------|-------|
| Nome | `edu-assets` |
| Público | ❌ **NÃO** (privado) |
| Acesso | Via RLS + signed URLs |

### Estrutura de Path

```
edu-assets/
└── {institution_id}/
    └── learning_objects/
        └── {learning_object_id}/
            └── arquivo.pdf
```

### Policies de Storage

| Operação | Quem pode | Condição |
|----------|-----------|----------|
| **SELECT** | Membros da instituição | `edu.edu_storage_is_member(institution_id)` |
| **INSERT** | Teacher, Director, Admin | `edu.edu_storage_can_upload(institution_id)` |
| **DELETE** | Apenas Admin | `edu.edu_storage_is_admin(institution_id)` |

### Regra de Isolamento

- O `institution_id` é extraído do **primeiro segmento do path**
- Função `edu_storage_get_institution_id(path)` faz o parse
- Nenhum usuário pode acessar arquivos de outra instituição

---

## 7. O que o Education NÃO faz

O módulo Education foi projetado com limites claros:

| ❌ NÃO FAZ | Motivo |
|------------|--------|
| **Score clínico** | O FisioRegen Score é exclusivo do core clínico |
| **Decisão clínica real** | Decision Lab é apenas educacional, sem impacto em pacientes |
| **Recomendação de tratamento** | Nenhum output que sugira conduta médica |
| **Acesso a pacientes** | Nenhuma FK para `public.patients` |
| **Acesso a screenings** | Nenhuma FK para `public.prp_screenings` |
| **Acesso ao registry** | Nenhuma FK para `public.registry_*` |
| **Alteração do core** | Nenhum trigger ou função que toque `public.*` |
| **Validação médica** | Casos são simulados ou derivados com consent |

### Banner Obrigatório no Decision Lab

Em toda interface do Decision Reasoning Lab™:

> ⚠️ **Ambiente educacional. Não representa decisão clínica e não gera SCORE.**

---

## 8. Estado Atual do Banco (Snapshot)

**Data do snapshot:** 2025-01-06

### Contagem de Objetos

| Objeto | Quantidade |
|--------|------------|
| **Tabelas em `edu`** | 25 |
| **Enums em `edu`** | 16 |
| **Funções/Triggers** | 35 |
| **Policies RLS** | 118 |

### Lista Nominal de Tabelas (ordenada)

```
1.  edu.activity_logs
2.  edu.case_assets
3.  edu.case_consents
4.  edu.case_instructor_notes
5.  edu.case_versions
6.  edu.cases
7.  edu.checkpoint_attempts
8.  edu.checkpoint_items
9.  edu.checkpoints
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

### Confirmação de Storage

| Bucket | Público | Status |
|--------|---------|--------|
| `edu-assets` | ❌ Privado | ✅ Configurado |

### RLS Status

```sql
SELECT COUNT(*) FROM pg_tables WHERE schemaname='edu' AND rowsecurity=true;
-- Resultado: 25 (100% das tabelas com RLS ativo)
```

---

*Documento gerado automaticamente pelo REGENAPP Academy*  
*Versão do schema: 1.0.0*
