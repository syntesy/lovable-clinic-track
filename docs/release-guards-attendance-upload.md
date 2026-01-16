# Hardening: Fluxo Atendimento + Upload

**Data**: 2026-01-16  
**Versão**: 1.0.0

## Objetivo

Proteger o fluxo de atendimento e upload contra regressões futuras através de:
- Contratos de domínio (single source of truth)
- Guards de navegação
- Testes sentinela com Vitest

---

## 1. Fluxo de Steps do Atendimento

### Ordem dos Steps

```
Avaliação Clínica → Triagem (opcional) → Plano Terapêutico → Anexos → Relatório
```

### Regra da Triagem

| `involves_orthobiologics` | Triagem visível? |
|--------------------------|------------------|
| `true`                   | ✅ Sim           |
| `false`                  | ❌ Não           |
| `null/undefined`         | ❌ Não           |

### Step Inicial

Sempre `clinical` (Avaliação Clínica) — definido em `INITIAL_STEP`.

---

## 2. Upload de Arquivos

### Regra Principal

**Upload SOMENTE é permitido no step "Anexos".**

Tentativas de upload em outros steps devem ser bloqueadas com mensagem:
> "Abra a etapa Anexos para enviar arquivos."

### Payload do Upload

O payload aceita APENAS os seguintes campos:

```typescript
interface UploadAttendanceFileInput {
  attendanceId: string;
  patientId: string;
  file: File;
  fileType: 'exam' | 'report' | 'image' | 'photo' | 'other';
  description?: string; // Nome de exibição opcional
}
```

⚠️ **PROIBIDO**: `customFileName` — removido por causar bugs.

Use `description` para personalizar o nome exibido.

---

## 3. Arquivos de Domínio

| Arquivo | Propósito |
|---------|-----------|
| `src/domain/attendanceFlow.ts` | Contrato de steps, guards, validações |
| `src/domain/uploadContracts.ts` | Contrato de upload, guard de step |

---

## 4. Como Rodar os Testes

```bash
# Todos os testes
npm run test

# Ou via vitest
npx vitest

# Apenas testes do domínio
npx vitest run src/domain/__tests__/

# Testes específicos
npx vitest run src/domain/__tests__/attendanceFlow.test.ts
npx vitest run src/domain/__tests__/uploadContracts.test.ts
```

---

## 5. Checklist de Release

- [ ] ✅ Build passa sem erros: `npm run build`
- [ ] ✅ Testes Vitest passam: `npm run test`
- [ ] ✅ Step inicial é sempre `clinical`
- [ ] ✅ Triagem só aparece quando `involves_orthobiologics === true`
- [ ] ✅ Upload só funciona no step "Anexos"
- [ ] ✅ Payload de upload não aceita `customFileName`

---

## 6. Guards Implementados

### AttendanceStepper

```typescript
// Antes de navegar, valida:
if (!canAccessStep(stepId, attendance)) {
  toast.error("Esta etapa não está disponível...");
  return;
}
```

### AtendimentoDetail

```typescript
// Normaliza step ao carregar:
const validatedStep = validateStepForAttendance(currentStep, attendance);
if (validatedStep !== currentStep) {
  setCurrentStep(validatedStep);
}
```

### Upload

```typescript
// Antes de abrir modal:
if (!canUploadInStep(currentStep)) {
  toast.error(UPLOAD_BLOCKED_MESSAGE);
  return;
}
```

---

## 7. Motor Procedure-Locked (Ortobiológicos)

### Regra Máxima

**Qualquer conteúdo gerado (next_steps, exames, alertas, bloqueios) é derivado SOMENTE do(s) procedimento(s) selecionado(s).**

Se PRP é selecionado, é **PROIBIDO** aparecer termos de BMEC/BMA/medula.

### Arquivos Relevantes

| Arquivo | Propósito |
|---------|-----------|
| `src/domain/orthoBioProcedures.ts` | Catálogo de procedimentos, gerador `generateOrthoBioPlan` |
| `src/components/orthobio/NextStepCard.tsx` | Card "Próximo Passo" procedure-locked |
| `src/domain/__tests__/orthoBioPlan.test.ts` | Testes de isolamento por procedimento |

### Como usar

```typescript
import { 
  generateOrthoBioPlan, 
  mapTaxonomyToProcedureCode,
  PROCEDURE_CATALOG 
} from '@/domain/orthoBioProcedures';

// Gerar plano para PRP
const plan = generateOrthoBioPlan({
  procedure_codes: ["PRP"],
  patient_factors: { nsaid_recent: true }
});

// plan.next_steps_text → texto procedure-locked
// plan.required_exams → exames SOMENTE do PRP
// plan.alerts → alertas SOMENTE do PRP
```

### Testes do Motor

```bash
npx vitest run src/domain/__tests__/orthoBioPlan.test.ts
```

---

## 8. Referência Rápida

```typescript
import { 
  getStepsForAttendance,    // Retorna array de steps visíveis
  canAccessStep,            // Verifica se step é acessível
  validateStepForAttendance, // Valida e corrige step
  INITIAL_STEP,             // 'clinical'
} from '@/domain/attendanceFlow';

import {
  canUploadInStep,          // Verifica se upload é permitido
  UPLOAD_BLOCKED_MESSAGE,   // Mensagem de erro para upload bloqueado
} from '@/domain/uploadContracts';

import {
  generateOrthoBioPlan,     // Gera plano procedure-locked
  mapTaxonomyToProcedureCode, // Mapeia código de taxonomia para procedimento
  PROCEDURE_CATALOG,        // Catálogo de procedimentos
} from '@/domain/orthoBioProcedures';
```
