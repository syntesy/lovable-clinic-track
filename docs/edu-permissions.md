# REGENAPP Education Academy — Matriz de Permissões

**Versão:** 1.0.0  
**Data:** 2025-01-06  
**Total de Policies RLS:** 118

---

## Sumário

1. [Papéis (Roles)](#1-papéis-roles)
2. [Matriz de Permissões por Tabela](#2-matriz-de-permissões-por-tabela)
3. [Regras Específicas do Student](#3-regras-específicas-do-student)
4. [Regras de Staff (Teacher/Director/Admin)](#4-regras-de-staff-teacherdirectoradmin)
5. [Regras Anti Self-Escalation](#5-regras-anti-self-escalation)
6. [Append-Only (Imutabilidade)](#6-append-only-imutabilidade)
7. [Storage Permissions](#7-storage-permissions)

---

## 1. Papéis (Roles)

O módulo Education define **4 papéis** no enum `edu.institution_role`:

| Role | Descrição | Hierarquia |
|------|-----------|------------|
| `student` | Aluno matriculado em cohort(s) | Nível 1 (mais restrito) |
| `teacher` | Professor/instrutor | Nível 2 |
| `director` | Coordenador/diretor | Nível 3 |
| `institution_admin` | Administrador da instituição | Nível 4 (mais privilegiado) |

### Grupos de Acesso

- **Member**: Qualquer role com `status = 'active'`
- **Staff**: `teacher`, `director`, `institution_admin`
- **Admin**: Apenas `institution_admin`

---

## 2. Matriz de Permissões por Tabela

### Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Permitido |
| ❌ | Bloqueado |
| 🔒 | Restrito (condições especiais) |
| 👤 | Apenas próprios dados |

---

### 2.1 Estrutura Institucional

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **institutions** | student | ✅ | ❌ | ❌ | ❌ |
| | teacher | ✅ | ❌ | ❌ | ❌ |
| | director | ✅ | ❌ | ❌ | ❌ |
| | admin | ✅ | ❌ | ✅ | ❌ |
| **institution_members** | student | 🔒¹ | ❌ | ❌ | ❌ |
| | teacher | ✅ | ❌ | ❌ | ❌ |
| | director | ✅ | ❌ | ❌ | ❌ |
| | admin | ✅ | ✅² | ✅² | ✅² |
| **programs** | student | 🔒³ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **cohorts** | student | 🔒³ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **enrollments** | student | 👤 | ❌ | ❌ | ❌ |
| | teacher/director | ✅ | ❌ | ❌ | ❌ |
| | admin | ✅ | ✅ | ✅ | ✅ |

**Notas:**
1. Student só vê próprio membership
2. Admin não pode alterar próprio role (anti self-escalation)
3. Student só vê `status = 'published'` ou `status = 'active'`

---

### 2.2 Conteúdo Pedagógico

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **modules** | student | 🔒³ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **cases** | student | 🔒³ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **case_versions** | student | 🔒⁴ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **case_assets** | student | 🔒³ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **case_consents** | student | ❌ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **case_instructor_notes** | student | ❌ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |

**Notas:**
3. Student só vê onde `status = 'published'`
4. Student só vê `version_number = cases.published_version_number`

---

### 2.3 Objetos de Aprendizagem

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **learning_objects** | student | 🔒³ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **learning_links** | student | 🔒⁵ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **concepts** | member | ✅ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **techniques** | member | ✅ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **evidence_links** | member | ✅ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |

**Notas:**
5. Student só vê links de learning_objects publicados

---

### 2.4 Avaliação

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **checkpoints** | student | 🔒³ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **checkpoint_items** | student | 🔒⁶ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **checkpoint_attempts** | student | 👤 | 👤 | ❌ | ❌ |
| | staff | ✅ | ❌ | ❌ | ❌ |

**Notas:**
6. Student só vê items de checkpoints publicados

---

### 2.5 Decision Reasoning Lab™

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **decision_scenarios** | student | 🔒³ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **decision_prompts** | student | 🔒⁷ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **decision_attempts** | student | 👤 | 👤 | ❌ | ❌ |
| | staff | ✅ | ❌ | ❌ | ❌ |
| **instructor_reference** | student | ❌ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |

**Notas:**
7. Student só vê prompts de scenarios publicados

---

### 2.6 Tracking e Progresso

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **activity_logs** | student | 👤 | 👤 | ❌ | ❌ |
| | staff | ✅ | ❌ | ❌ | ❌ |
| **student_progress** | student | 👤 | ❌ | ❌ | ❌ |
| | staff | ✅ | ❌ | ❌ | ❌ |

---

## 3. Regras Específicas do Student

### 3.1 Visibilidade Restrita

```sql
-- Student só vê conteúdo publicado
WHERE status = 'published'

-- Student só vê versão publicada do case
WHERE version_number = (SELECT published_version_number FROM edu.cases WHERE id = case_id)

-- Student só vê cohorts onde está matriculado
WHERE cohort_id IN (SELECT cohort_id FROM edu.enrollments WHERE user_id = auth.uid() AND status = 'active')
```

### 3.2 Ownership Estrito

```sql
-- Student só vê/cria próprios attempts
WHERE user_id = auth.uid()

-- Student só vê próprios logs
WHERE user_id = auth.uid()

-- Student só vê próprio progress
WHERE user_id = auth.uid()
```

### 3.3 Imutabilidade

- Student **não pode UPDATE** attempts após criação
- Student **não pode DELETE** nenhum registro
- Activity logs são **append-only**

### 3.4 Conteúdo Invisível

Student **nunca** vê:
- `case_instructor_notes`
- `instructor_reference`
- `case_consents` (dados de consentimento)
- Versões não-publicadas de cases
- Conteúdo em `draft`, `review` ou `archived`

---

## 4. Regras de Staff (Teacher/Director/Admin)

### 4.1 Teacher

| Pode | Não Pode |
|------|----------|
| CRUD em conteúdo pedagógico | Gerenciar membros |
| Ver todos os attempts | Alterar enrollments |
| Ver analytics agregados | Alterar configurações |
| Upload de arquivos | Deletar arquivos (só admin) |

### 4.2 Director

| Pode | Não Pode |
|------|----------|
| Tudo que teacher pode | Gerenciar membros |
| Ver KPIs e alertas | Alterar roles de outros |
| Aprovar publicações | Deletar instituição |

### 4.3 Institution Admin

| Pode | Não Pode |
|------|----------|
| Tudo que director pode | Auto-elevação de role |
| Gerenciar membros | Acessar outras instituições |
| Gerenciar enrollments | Modificar core clínico |
| Deletar arquivos | |
| Configurar instituição | |

---

## 5. Regras Anti Self-Escalation

### Proteção em `institution_members`

```sql
-- Admin não pode alterar próprio role
CREATE POLICY "institution_members_update_admin" ON edu.institution_members
FOR UPDATE USING (
    edu.has_role(institution_id, 'institution_admin')
    AND user_id != auth.uid()  -- ← Anti self-escalation
);

-- Admin não pode deletar próprio membership
CREATE POLICY "institution_members_delete_admin" ON edu.institution_members
FOR DELETE USING (
    edu.has_role(institution_id, 'institution_admin')
    AND user_id != auth.uid()  -- ← Anti self-escalation
);
```

### Regra Geral

> **Nenhum usuário pode modificar seu próprio role ou status de membership.**

---

## 6. Append-Only (Imutabilidade)

### Tabelas Imutáveis

| Tabela | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|
| `activity_logs` | ✅ (user_id = auth.uid()) | ❌ | ❌ |
| `checkpoint_attempts` | ✅ (user_id = auth.uid()) | ❌ | ❌ |
| `decision_attempts` | ✅ (user_id = auth.uid()) | ❌ | ❌ |

### Implementação

```sql
-- Trigger bloqueando UPDATE/DELETE
CREATE FUNCTION edu.trg_activity_logs_append_only() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'activity_logs is append-only: UPDATE and DELETE are not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_append_only
BEFORE UPDATE OR DELETE ON edu.activity_logs
FOR EACH ROW EXECUTE FUNCTION edu.trg_activity_logs_append_only();
```

### Justificativa

- **Auditoria**: Logs não podem ser alterados retroativamente
- **Integridade**: Tentativas de avaliação são imutáveis
- **Compliance**: Trilha de auditoria preservada

---

## 7. Storage Permissions

### Bucket: `edu-assets` (Privado)

| Operação | Role | Condição |
|----------|------|----------|
| **SELECT** | member | `edu.edu_storage_is_member(institution_id)` |
| **INSERT** | teacher+ | `edu.edu_storage_can_upload(institution_id)` |
| **UPDATE** | teacher+ | `edu.edu_storage_can_upload(institution_id)` |
| **DELETE** | admin | `edu.edu_storage_is_admin(institution_id)` |

### Isolamento por Path

```
Path: {institution_id}/learning_objects/{object_id}/file.pdf
       └──────┬─────┘
              │
              └─ Extraído por edu.edu_storage_get_institution_id()
                 Validado contra membership do usuário
```

### Signed URLs

- Arquivos são acessados via **signed URLs** gerados pelo backend
- URLs têm expiração configurável
- Nenhum acesso direto público

---

## Resumo de Contagem de Policies

| Tabela | SELECT | INSERT | UPDATE | DELETE | Total |
|--------|--------|--------|--------|--------|-------|
| activity_logs | 2 | 1 | 1 | 1 | 5 |
| case_assets | 2 | 1 | 1 | 1 | 5 |
| case_consents | 1 | 1 | 1 | 1 | 4 |
| case_instructor_notes | 1 | 1 | 1 | 1 | 4 |
| case_versions | 2 | 1 | 1 | 1 | 5 |
| cases | 2 | 1 | 1 | 1 | 5 |
| checkpoint_attempts | 2 | 1 | 1 | 1 | 5 |
| checkpoint_items | 2 | 1 | 1 | 1 | 5 |
| checkpoints | 2 | 1 | 1 | 1 | 5 |
| cohorts | 2 | 1 | 1 | 1 | 5 |
| concepts | 1 | 1 | 1 | 1 | 4 |
| decision_attempts | 2 | 1 | 1 | 1 | 5 |
| decision_prompts | 2 | 1 | 1 | 1 | 5 |
| decision_scenarios | 2 | 1 | 1 | 1 | 5 |
| enrollments | 2 | 1 | 1 | 1 | 5 |
| evidence_links | 2 | 1 | 1 | 1 | 5 |
| institution_members | 2 | 1 | 1 | 1 | 5 |
| institutions | 2 | 1 | 1 | 1 | 5 |
| instructor_reference | 1 | 1 | 1 | 1 | 4 |
| learning_links | 2 | 1 | 1 | 1 | 5 |
| learning_objects | 2 | 1 | 1 | 1 | 5 |
| modules | 2 | 1 | 1 | 1 | 5 |
| programs | 2 | 1 | 1 | 1 | 5 |
| student_progress | 2 | 1 | 1 | 1 | 5 |
| techniques | 1 | 1 | 1 | 1 | 4 |
| **TOTAL** | | | | | **118** |

---

*Documento gerado automaticamente pelo REGENAPP Academy*  
*Versão do schema: 1.0.0*
