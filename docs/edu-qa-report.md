# REGENAPP Education Academy - Relatório QA

**Data:** 2025-01-06  
**Versão:** 1.0.0  
**Escopo:** Verificação de RLS, isolamento e integridade do schema `edu.*`

---

## Resumo Executivo

| Total | Pass | Fail | Pendente |
|-------|------|------|----------|
| 12    | -    | -    | 12       |

> **Status:** Aguardando execução dos seeds para rodar QA completo.

---

## Checklist de Verificações

### QA-01: Isolamento Cross-Tenant

**O que testa:** Student da Orthoregen NÃO deve acessar dados da instituição Dummy.

**Query de teste:**
```sql
-- Executar como student1_user_id
SET ROLE authenticated;
SET request.jwt.claim.sub = '<student1_user_id>';

SELECT * FROM edu.modules WHERE institution_id = '<dummy_inst_id>';
-- Esperado: 0 rows
```

**Resultado:** ⏳ Pendente

---

### QA-02: Published Gating

**O que testa:** Student não vê módulos/cases/learning_objects com status `draft`.

**Query de teste:**
```sql
-- Como student
SELECT id, title, status FROM edu.modules WHERE status = 'draft';
-- Esperado: 0 rows (o módulo draft da Dummy não aparece)

SELECT id, title, status FROM edu.cases WHERE status = 'draft';
-- Esperado: 0 rows
```

**Resultado:** ⏳ Pendente

---

### QA-03: Case Versions Gating

**O que testa:** Student só vê version_number = published_version_number.

**Query de teste:**
```sql
-- Como student
SELECT cv.id, cv.version_number, c.published_version_number
FROM edu.case_versions cv
JOIN edu.cases c ON c.id = cv.case_id
WHERE cv.version_number != c.published_version_number;
-- Esperado: 0 rows (versões anteriores invisíveis)
```

**Resultado:** ⏳ Pendente

---

### QA-04: Instructor Reference Invisível

**O que testa:** Student não acessa `instructor_reference`.

**Query de teste:**
```sql
-- Como student
SELECT * FROM edu.instructor_reference;
-- Esperado: 0 rows (RLS bloqueia)
```

**Resultado:** ⏳ Pendente

---

### QA-05: Case Instructor Notes Invisível

**O que testa:** Student não acessa `case_instructor_notes`.

**Query de teste:**
```sql
-- Como student
SELECT * FROM edu.case_instructor_notes;
-- Esperado: 0 rows (RLS bloqueia)
```

**Resultado:** ⏳ Pendente

---

### QA-06: Attempts User Ownership (WITH CHECK)

**O que testa:** Student não pode criar attempt com user_id diferente do seu.

**Query de teste:**
```sql
-- Como student1, tentar inserir com user_id de student2
INSERT INTO edu.checkpoint_attempts (institution_id, checkpoint_id, user_id, responses)
VALUES ('<inst_id>', '<checkpoint_id>', '<student2_id>', '{}');
-- Esperado: ERROR (violação de WITH CHECK)
```

**Resultado:** ⏳ Pendente

---

### QA-07: Attempts Immutability

**O que testa:** Student não pode UPDATE/DELETE attempts após criação.

**Query de teste:**
```sql
-- Como student
UPDATE edu.checkpoint_attempts SET responses = '{"hacked": true}' WHERE user_id = '<student1_id>';
-- Esperado: ERROR ou 0 rows affected

DELETE FROM edu.checkpoint_attempts WHERE user_id = '<student1_id>';
-- Esperado: ERROR ou 0 rows affected
```

**Resultado:** ⏳ Pendente

---

### QA-08: Activity Logs Append-Only

**O que testa:** activity_logs não permite UPDATE/DELETE.

**Query de teste:**
```sql
-- Como student
UPDATE edu.activity_logs SET metadata = '{"hacked": true}' WHERE user_id = '<student1_id>';
-- Esperado: ERROR (trigger trg_activity_logs_append_only)

DELETE FROM edu.activity_logs WHERE user_id = '<student1_id>';
-- Esperado: ERROR
```

**Resultado:** ⏳ Pendente

---

### QA-09: Trigger de Institution ID

**O que testa:** Inserir child com institution_id divergente do parent falha.

**Query de teste:**
```sql
-- Tentar criar módulo com institution_id diferente do cohort
INSERT INTO edu.modules (institution_id, cohort_id, title, status)
VALUES ('<dummy_inst_id>', '<orthoregen_cohort_id>', 'Hack Module', 'draft');
-- Esperado: ERROR (trigger trg_modules_institution_check)
```

**Resultado:** ⏳ Pendente

---

### QA-10: Guard de Publicação

**O que testa:** Publicar case sem published_version_number válido falha.

**Query de teste:**
```sql
-- Criar case sem versão e tentar publicar
INSERT INTO edu.cases (institution_id, module_id, title, case_type, status)
VALUES ('<inst_id>', '<module_id>', 'Case Sem Versão', 'simulated', 'draft')
RETURNING id;

UPDATE edu.cases SET status = 'published' WHERE title = 'Case Sem Versão';
-- Esperado: ERROR (trigger trg_cases_publish_guard)
```

**Resultado:** ⏳ Pendente

---

### QA-11: Progress Auto-Update

**O que testa:** Inserir activity_log atualiza student_progress automaticamente.

**Query de teste:**
```sql
-- Verificar progress após seeds
SELECT user_id, progress_json 
FROM edu.student_progress 
WHERE user_id IN ('<student1_id>', '<student2_id>');
-- Esperado: progress_json com contadores > 0
```

**Resultado:** ⏳ Pendente

---

### QA-12: Storage Path Isolation

**O que testa:** Usuário não acessa arquivo de outra instituição via storage path.

**Verificação:**
```sql
-- Policy de storage verifica edu.edu_storage_is_member(institution_id)
-- Path format: {institution_id}/learning_objects/...

-- Tentativa de acesso:
-- Student Orthoregen → path dummy_inst_id/... 
-- Esperado: DENIED
```

**Resultado:** ⏳ Pendente

---

## Confirmações Finais

- [ ] **(a)** Nenhum objeto fora de `edu.*` foi criado/alterado
- [ ] **(b)** Nenhuma tabela do core clínico foi tocada
- [ ] **(c)** RLS permanece HARD (nenhuma policy relaxada)
- [ ] **(d)** Nenhum vazamento cross-tenant
- [ ] **(e)** Nenhuma regressão clínica

---

## Próximos Passos

1. Executar `docs/edu-seeds-dev.sql` no ambiente DEV
2. Substituir UUIDs de usuários reais
3. Rodar queries de QA e atualizar status
4. Reportar resultados finais

---

*Gerado automaticamente pelo REGENAPP Academy QA System*
