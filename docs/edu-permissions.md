# REGENAPP Education Academy — Matriz de Permissões

**Versão:** 1.0.0  
**Data:** 2025-01-06  
**Total de Policies RLS:** 118

---

## Sumário

1. [Papéis (Roles)](#1-papéis-roles)
2. [Matriz de Permissões por Tabela](#2-matriz-de-permissões-por-tabela)
3. [Regras do Student](#3-regras-do-student)
4. [Regras do Teacher](#4-regras-do-teacher)
5. [Regras do Director](#5-regras-do-director)
6. [Regras do Institution Admin](#6-regras-do-institution-admin)
7. [Proteção Anti Self-Escalation](#7-proteção-anti-self-escalation)
8. [Tabelas Append-Only](#8-tabelas-append-only)

---

## 1. Papéis (Roles)

O módulo Education define **4 papéis** no enum `edu.institution_role`:

| Role | Descrição | Nível |
|------|-----------|-------|
| `student` | Aluno matriculado | 1 (mais restrito) |
| `teacher` | Professor/instrutor | 2 |
| `director` | Coordenador/diretor | 3 |
| `institution_admin` | Administrador | 4 (mais privilegiado) |

### Grupos de Acesso

| Grupo | Roles incluídos |
|-------|-----------------|
| **member** | Qualquer role com `status = 'active'` |
| **staff** | `teacher`, `director`, `institution_admin` |
| **admin** | Apenas `institution_admin` |

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
| **institution_members** | student | 👤 | ❌ | ❌ | ❌ |
| | teacher | ✅ | ❌ | ❌ | ❌ |
| | director | ✅ | ❌ | ❌ | ❌ |
| | admin | ✅ | ✅¹ | ✅¹ | ✅¹ |
| **programs** | student | 🔒² | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **cohorts** | student | 🔒² | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **enrollments** | student | 👤 | ❌ | ❌ | ❌ |
| | teacher | ✅ | ❌ | ❌ | ❌ |
| | director | ✅ | ❌ | ❌ | ❌ |
| | admin | ✅ | ✅ | ✅ | ✅ |

**Notas:**
1. Admin não pode modificar próprio registro (anti self-escalation)
2. Student só vê `status = 'published'` ou `status = 'active'`

---

### 2.2 Conteúdo Pedagógico

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **modules** | student | 🔒² | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **cases** | student | 🔒² | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **case_versions** | student | 🔒³ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **case_assets** | student | 🔒² | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **case_consents** | student | ❌ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **case_instructor_notes** | student | ❌ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |

**Notas:**
2. Student só vê `status = 'published'`
3. Student só vê `version_number = published_version_number`

---

### 2.3 Objetos de Aprendizagem

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **learning_objects** | student | 🔒² | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **learning_links** | student | 🔒⁴ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **concepts** | member | ✅ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **techniques** | member | ✅ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **evidence_links** | member | ✅ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |

**Notas:**
4. Student só vê links de learning_objects publicados

---

### 2.4 Avaliação

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **checkpoints** | student | 🔒² | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **checkpoint_items** | student | 🔒⁵ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **checkpoint_attempts** | student | 👤 | 👤 | ❌ | ❌ |
| | staff | ✅ | ❌ | ❌ | ❌ |

**Notas:**
5. Student só vê items de checkpoints publicados

---

### 2.5 Decision Reasoning Lab™

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **decision_scenarios** | student | 🔒² | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **decision_prompts** | student | 🔒⁶ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |
| **decision_attempts** | student | 👤 | 👤 | ❌ | ❌ |
| | staff | ✅ | ❌ | ❌ | ❌ |
| **instructor_reference** | student | ❌ | ❌ | ❌ | ❌ |
| | staff | ✅ | ✅ | ✅ | ✅ |

**Notas:**
6. Student só vê prompts de scenarios publicados

---

### 2.6 Tracking e Progresso

| Tabela | Role | SELECT | INSERT | UPDATE | DELETE |
|--------|------|--------|--------|--------|--------|
| **activity_logs** | student | 👤 | 👤 | ❌ | ❌ |
| | staff | ✅ | ❌ | ❌ | ❌ |
| **student_progress** | student | 👤 | ❌ | ❌ | ❌ |
| | staff | ✅ | ❌ | ❌ | ❌ |

---

## 3. Regras do Student

### 3.1 Visibilidade Restrita

O student **só vê conteúdo publicado**:

```sql
-- Filtragem automática via RLS
WHERE status = 'published'
```

### 3.2 Cohorts Matriculados

O student **só acessa cohorts onde está matriculado**:

```sql
WHERE cohort_id IN (
    SELECT cohort_id FROM edu.enrollments 
    WHERE user_id = auth.uid() AND status = 'active'
)
```

### 3.3 Apenas Próprios Dados

O student **só cria/vê suas próprias attempts e logs**:

```sql
-- INSERT
WITH CHECK (user_id = auth.uid())

-- SELECT
WHERE user_id = auth.uid()
```

### 3.4 Sem UPDATE/DELETE

O student **NÃO pode modificar ou deletar** nenhum registro:

- ❌ UPDATE em qualquer tabela
- ❌ DELETE em qualquer tabela

### 3.5 Progress Somente Leitura

O `student_progress` é atualizado **automaticamente por trigger**:

- ✅ SELECT próprio progresso
- ❌ INSERT (trigger cria automaticamente)
- ❌ UPDATE (trigger atualiza automaticamente)
- ❌ DELETE

### 3.6 Conteúdo Invisível

Student **nunca vê**:
- `case_instructor_notes`
- `instructor_reference`
- `case_consents`
- Versões não-publicadas
- Conteúdo em `draft`, `review` ou `archived`

---

## 4. Regras do Teacher

### 4.1 CRUD de Conteúdo Pedagógico

| Pode | Não Pode |
|------|----------|
| ✅ Criar/editar cases | ❌ Gerenciar members |
| ✅ Criar/editar modules | ❌ Gerenciar enrollments |
| ✅ Criar/editar learning_objects | ❌ Alterar configurações |
| ✅ Criar/editar checkpoints | ❌ Deletar arquivos |
| ✅ Criar/editar decision_scenarios | |
| ✅ Ver todos os attempts | |
| ✅ Upload de arquivos | |

### 4.2 Sem Acesso a Members/Enrollments

```sql
-- Teacher não pode INSERT/UPDATE/DELETE em:
- institution_members
- enrollments
```

---

## 5. Regras do Director

### 5.1 Publicação de Conteúdo

| Pode | Não Pode |
|------|----------|
| ✅ Tudo que teacher pode | ❌ Gerenciar members |
| ✅ Publicar conteúdo | ❌ Alterar roles |
| ✅ Ver KPIs agregados | ❌ Configurar instituição |
| ✅ Alertas de turma | |

### 5.2 Analytics Somente Leitura

Director vê analytics agregados mas **não pode modificar**:
- ✅ SELECT em activity_logs (todos da instituição)
- ✅ SELECT em student_progress (todos da instituição)
- ❌ INSERT/UPDATE/DELETE

### 5.3 Sem Gerenciar Members

```sql
-- Director não pode INSERT/UPDATE/DELETE em:
- institution_members
- enrollments (apenas SELECT)
```

---

## 6. Regras do Institution Admin

### 6.1 Gerencia Members e Enrollments

| Pode | Não Pode |
|------|----------|
| ✅ Tudo que director pode | ❌ Self-escalation |
| ✅ Adicionar/remover members | ❌ Acessar outras instituições |
| ✅ Criar/cancelar enrollments | ❌ Modificar core clínico |
| ✅ Alterar roles (exceto próprio) | |
| ✅ Deletar arquivos | |
| ✅ Configurar instituição | |

### 6.2 Acesso Total Dentro da Instituição

```sql
-- Admin tem acesso total a edu.* 
-- ONDE institution_id = sua instituição
WHERE edu.is_member(institution_id)
```

---

## 7. Proteção Anti Self-Escalation

### Regra em `institution_members`

**Nenhum usuário pode modificar seu próprio role ou status**:

```sql
-- UPDATE bloqueado para próprio registro
CREATE POLICY "members_update_admin" ON edu.institution_members
FOR UPDATE USING (
    edu.has_role(institution_id, 'institution_admin')
    AND user_id != auth.uid()  -- ← Anti self-escalation
);

-- DELETE bloqueado para próprio registro
CREATE POLICY "members_delete_admin" ON edu.institution_members
FOR DELETE USING (
    edu.has_role(institution_id, 'institution_admin')
    AND user_id != auth.uid()  -- ← Anti self-escalation
);
```

### Cenários Bloqueados

| Tentativa | Resultado |
|-----------|-----------|
| Admin tenta elevar próprio role | ❌ Bloqueado |
| Admin tenta remover próprio membership | ❌ Bloqueado |
| Admin tenta alterar próprio status | ❌ Bloqueado |

---

## 8. Tabelas Append-Only

### Definição

Tabelas **append-only** não permitem UPDATE nem DELETE após INSERT:

| Tabela | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|
| `activity_logs` | ✅ | ❌ | ❌ |
| `checkpoint_attempts` | ✅ | ❌ | ❌ |
| `decision_attempts` | ✅ | ❌ | ❌ |
| `student_progress` | ❌ (trigger) | ❌ | ❌ |

### Implementação

```sql
-- Trigger bloqueando UPDATE/DELETE
CREATE FUNCTION edu.trg_activity_logs_append_only() 
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'activity_logs is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_append_only
BEFORE UPDATE OR DELETE ON edu.activity_logs
FOR EACH ROW EXECUTE FUNCTION edu.trg_activity_logs_append_only();
```

### Justificativa

- **Auditoria**: Logs imutáveis para compliance
- **Integridade**: Attempts não podem ser alterados retroativamente
- **Trilha**: Histórico completo preservado

---

## Resumo de Policies por Operação

| Operação | Policies |
|----------|----------|
| SELECT | ~50 |
| INSERT | ~25 |
| UPDATE | ~25 |
| DELETE | ~18 |
| **TOTAL** | **118** |

---

*Documento oficial do REGENAPP Education Academy*  
*Schema: edu v1.0.0*  
*Gerado em: 2025-01-06*
