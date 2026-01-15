# QA: Telemetria & Índices — clinical_records + Relatório

Este documento descreve os eventos de telemetria e índices de performance implementados no fluxo Atendimento → Prontuário → Relatório.

---

## 1. Eventos de Telemetria

### 1.1 Regras de Segurança (PHI)

**❌ NUNCA logar:**
- Textos clínicos (`chief_complaint`, `anamnesis`, `physical_exam`, `clinical_diagnosis`)
- Nomes de pacientes
- Campos livres / notas
- Dados sensíveis de saúde

**✅ PERMITIDO logar:**
- IDs: `attendanceId`, `recordId`, `patientId` (UUIDs)
- Códigos de erro: `code` (ex: `23505`, `42501`)
- Flags booleanos: `hasExport`
- Métricas numéricas: `ms` (duração em milissegundos)

### 1.2 Eventos — `clinical_record.*`

| Evento | Nível | Payload | Descrição |
|--------|-------|---------|-----------|
| `clinical_record.ensure.start` | info | `{ attendanceId, patientId }` | Início do ensureClinicalRecordForAttendance |
| `clinical_record.ensure.found_existing` | info | `{ attendanceId, recordId }` | Prontuário existente encontrado via FK |
| `clinical_record.ensure.insert_attempt` | info | `{ attendanceId }` | Tentando inserir novo prontuário |
| `clinical_record.ensure.insert_success` | info | `{ attendanceId, recordId }` | Insert bem-sucedido |
| `clinical_record.ensure.unique_violation_handled` | info | `{ attendanceId }` | Erro 23505 tratado (clique duplo) |
| `clinical_record.ensure.permission_denied` | warn | `{ attendanceId, code }` | Erro de RLS/permissão |
| `clinical_record.ensure.error` | error | `{ attendanceId, code, message }` | Erro inesperado (message sanitizada) |
| `clinical_record.open_or_create.clicked` | info | `{ attendanceId }` | Usuário clicou em criar/abrir prontuário |
| `clinical_record.open_or_create.navigating` | info | `{ recordId, attendanceId }` | Navegando para o editor |
| `clinical_record.open_or_create.error` | error | `{ attendanceId, code }` | Erro ao criar/abrir |

### 1.3 Eventos — `report.generate.*`

| Evento | Nível | Payload | Descrição |
|--------|-------|---------|-----------|
| `report.generate.clicked` | info | `{ attendanceId }` | Usuário clicou em "Gerar Relatório" |
| `report.generate.blocked.no_record` | warn | `{ attendanceId }` | Bloqueado: sem prontuário |
| `report.generate.blocked.incomplete_record` | warn | `{ attendanceId, recordId }` | Bloqueado: prontuário incompleto |
| `report.generate.start` | info | `{ attendanceId, recordId }` | Iniciando geração/navegação para step report |
| `report.generate.export_start` | info | `{ attendanceId, recordId }` | Iniciando exportação PDF |
| `report.generate.success` | info | `{ attendanceId, recordId, hasExport, ms }` | Geração/exportação concluída |
| `report.generate.error` | error | `{ attendanceId, recordId, code, message }` | Erro na geração (message sanitizada) |

---

## 2. Índices de Performance

### 2.1 Índices Criados

```sql
-- Índice parcial para lookup por attendance_id (apenas valores não-nulos)
CREATE INDEX IF NOT EXISTS idx_clinical_records_attendance_id_perf
ON public.clinical_records (attendance_id)
WHERE attendance_id IS NOT NULL;

-- Índice para consultas por patient_id
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient_id
ON public.clinical_records (patient_id);

-- Índice composto para histórico do paciente ordenado por data
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient_created
ON public.clinical_records (patient_id, created_at DESC);
```

### 2.2 Verificação de Índices

Para verificar se os índices estão presentes:

```sql
-- Listar todos os índices da tabela
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'clinical_records';
```

Resultado esperado:
```
idx_clinical_records_attendance_id_perf
idx_clinical_records_patient_id
idx_clinical_records_patient_created
idx_clinical_records_attendance_unique (unique parcial)
```

### 2.3 Verificação de Uso do Índice

Para confirmar que a query usa o índice:

```sql
-- Substituir 'UUID_AQUI' por um attendance_id real
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, patient_id, status, created_at 
FROM public.clinical_records 
WHERE attendance_id = 'UUID_AQUI';
```

**Resultado esperado:** Deve mostrar `Index Scan using idx_clinical_records_attendance_id_perf` ou similar, e NÃO `Seq Scan`.

---

## 3. Exemplo de Payload Permitido

```json
{
  "attendanceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "recordId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "code": "23505",
  "ms": 142,
  "hasExport": true
}
```

---

## 4. Checklist de QA

- [ ] Criar atendimento → criar prontuário → verificar log `clinical_record.ensure.start` no console
- [ ] Clicar "Gerar Relatório" sem prontuário → log `report.generate.blocked.no_record`
- [ ] Clicar "Gerar Relatório" com prontuário incompleto → log `report.generate.blocked.incomplete_record`
- [ ] Gerar relatório com dados mínimos → logs `report.generate.start` e `report.generate.success`
- [ ] Verificar que nenhum log contém texto clínico (queixa, anamnese, diagnóstico)
- [ ] Rodar query EXPLAIN para confirmar uso de índice

---

*Última atualização: 2026-01-15*
