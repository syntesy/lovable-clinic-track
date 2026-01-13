# Arquitetura de Prontuários Clínicos

> **Versão:** 1.0  
> **Data:** 2026-01-13  
> **Status:** Estável

---

## 1. Conceitos Fundamentais

### Paciente (`patientId`) vs Prontuário (`recordId`)

| Entidade | Identificador | Descrição |
|----------|---------------|-----------|
| **Paciente** | `patient_id` (UUID) | Pessoa física cadastrada no sistema. Um paciente pode ter **múltiplos prontuários**. |
| **Prontuário** | `id` (UUID) | Registro clínico específico. Cada prontuário pertence a um único paciente. |

**Relação:** `patients 1:N clinical_records`

---

## 2. Regras de Carregamento de Dados

### Tipo A — Visão Geral / Status

**Quando usar:** Checklists, dashboards, status de completude.

```typescript
import { getLatestClinicalRecord } from "@/lib/clinical-record-helpers";

const record = await getLatestClinicalRecord(patientId);
```

**Obrigatório exibir badge de transparência:**
```
📋 Baseado no ÚLTIMO prontuário: dd/mm/aaaa
[Link: Ver histórico de prontuários]
```

**Componentes Tipo A:**
- `ClinicalAssessmentChecklist.tsx`
- `AvaliacaoRegenapp.tsx` (seção de status)
- `useClinicalRecordMigration.ts` (migração de legados)

---

### Tipo B — Edição / Impressão / Relatório

**Quando usar:** Qualquer ação que exibe ou edita um prontuário específico.

```typescript
import { getClinicalRecordById } from "@/lib/clinical-record-helpers";

const record = await getClinicalRecordById(patientId, recordId);
```

**Regra:** O `recordId` DEVE vir de:
- Parâmetro de rota (`/patients/:patientId/records/:recordId`)
- Query string (`?recordId=...`)
- State de navegação (clique em "Abrir" no histórico)

**Componentes Tipo B:**
- `ClinicalRecordEditor.tsx`
- `ClinicalRecordPrint.tsx`
- `VisualizarRelatorio.tsx`

---

## 3. Rotas Oficiais

| Rota | Descrição |
|------|-----------|
| `/patients/:patientId/records` | Lista de prontuários do paciente |
| `/patients/:patientId/records/:recordId` | Editor de prontuário específico |
| `/patients/:patientId/records/:recordId/print` | Impressão de prontuário específico |
| `/relatorio/:patientId?recordId=...` | Relatório de prontuário específico |

### Rotas Legadas (Redirecionadas)

| Rota Legada | Redirecionamento |
|-------------|------------------|
| `/prontuario/:id` | → `/patients/:id/records` |
| `/pacientes/:id/prontuario` | → `/patients/:id/records` |

---

## 4. Guardrails

### 4.1 Redirecionamento Automático

**Editor sem `recordId`:**
```typescript
// ClinicalRecordEditor.tsx
useEffect(() => {
  if (!recordId && patientId) {
    navigate(`/patients/${patientId}/records`, { replace: true });
  }
}, [recordId, patientId]);
```

**Relatório sem `recordId`:**
```typescript
// VisualizarRelatorio.tsx
// Mostra seletor de prontuários com dropdown
if (!recordIdFromQuery) {
  return <RecordSelector patientId={id} />;
}
```

### 4.2 Prontuário Não Encontrado

Quando `recordId` inválido:
- Exibir: "Prontuário não encontrado"
- Botão: "Voltar ao Histórico"
- **NÃO criar prontuário automaticamente**

---

## 5. Integridade de Dados

### 5.1 Status do Prontuário

| Status | Descrição | Editável |
|--------|-----------|----------|
| `draft` | Rascunho | ✅ Sim |
| `final` | Finalizado | ❌ Não |

**Valores aceitos:** `'draft' | 'final'`  
**Default:** `'draft'`

### 5.2 Trigger de Bloqueio (Backend)

```sql
CREATE TRIGGER prevent_final_record_update_trigger
BEFORE UPDATE ON public.clinical_records
FOR EACH ROW
EXECUTE FUNCTION public.prevent_final_record_update();
```

**Comportamento:**
- Se `OLD.status = 'final'` → `RAISE EXCEPTION`
- Permite transição `draft → final` (finalização)
- Bloqueia qualquer edição após finalização

### 5.3 Tratamento de Erro no Frontend

```typescript
if (recordError.message?.includes("finalizado")) {
  toast.error("Prontuário finalizado", {
    description: "Este prontuário está finalizado e não pode mais ser editado."
  });
}
```

---

## 6. Fluxo de Criação

```
1. Clique em "Novo Prontuário"
2. INSERT com patient_id + campos vazios
3. SELECT id do novo registro
4. navigate(`/patients/${patientId}/records/${newId}`)
5. Toast: "Prontuário criado"
```

**Regra:** PROIBIDO navegar para editor sem ter feito INSERT.

---

## 7. Helpers Centralizados

Arquivo: `src/lib/clinical-record-helpers.ts`

| Função | Uso Permitido |
|--------|---------------|
| `getClinicalRecordById(patientId, recordId)` | Tipo B: editor, print, relatório |
| `getLatestClinicalRecord(patientId)` | Tipo A: visão geral, checklist |
| `listClinicalRecords(patientId)` | Lista completa para histórico |

**Regra:** Chamadas diretas ao Supabase para `clinical_records` são PROIBIDAS fora deste arquivo.

---

## 8. Checklist de Validação

- [ ] Nenhuma ocorrência de `.order().limit(1).single()` em código Tipo B
- [ ] Nenhum `.upsert({ patient_id: ... })` sem `id`
- [ ] Editor sempre redireciona sem `recordId`
- [ ] Relatório mostra seletor sem `recordId`
- [ ] Badge "ÚLTIMO prontuário" em telas Tipo A
- [ ] Trigger `prevent_final_record_update` ativo
- [ ] Toast específico para erro de prontuário finalizado

---

## 9. Diagrama de Fluxo

```
┌─────────────────┐
│   Histórico     │
│ (RecordsList)   │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Abrir   │──────────────────────┐
    │ record  │                      │
    └────┬────┘                      │
         │ recordId                  │
    ┌────▼────────────┐         ┌────▼────────────┐
    │     Editor      │         │     Print       │
    │ (Tipo B)        │         │ (Tipo B)        │
    └────┬────────────┘         └─────────────────┘
         │
    ┌────▼────┐
    │ Salvar  │
    └────┬────┘
         │
    ┌────▼────────────┐
    │  status=final?  │
    │    BLOQUEADO    │
    └─────────────────┘
```

---

## 10. Changelog

| Data | Versão | Alteração |
|------|--------|-----------|
| 2026-01-13 | 1.0 | Criação do documento |
