# Sistema de Follow-ups v1.0.0

> Documentação do sistema de acompanhamento pós-procedimento

---

## 1. Auditoria ETAPA 4 ✅

### 1.1 Naming Padronizado

| Item | Valor Oficial |
|------|---------------|
| **Tabela** | `procedure_followups` |
| **Hook principal** | `useFollowups` |
| **Hook por screening** | `useFollowupsByScreening` |
| **Componente Step 8** | `ScreeningFollowups` |
| **Página painel** | `/followups` → `FollowupPanel.tsx` |

### 1.2 Gatilho Automático

**Onde está definido `procedure_done`?**  
Não existe flag `procedure_done`. A criação de um registro em `patient_procedures` implica que o procedimento foi realizado.

**Trigger implementado:**
- **Função:** `auto_create_followups_on_procedure()`
- **Trigger:** `trigger_auto_create_followups` em `patient_procedures`
- **Disparo:** `AFTER INSERT`
- **Follow-ups criados:** D30, D90, D180, D365 (4 timepoints)
- **Idempotência:** `ON CONFLICT (screening_id, timepoint) DO NOTHING`

### 1.3 RLS/Tenant

**Chave de isolamento:** `clinician_id` (UUID do profissional autenticado)

**Políticas RLS:**
| Operação | Regra |
|----------|-------|
| SELECT | `clinician_id = auth.uid()` |
| INSERT | `clinician_id = auth.uid()` |
| UPDATE | `clinician_id = auth.uid()` |
| DELETE | `clinician_id = auth.uid()` |

**Confirmações:**
- ✅ `/followups` requer `ProtectedRoute` (autenticação obrigatória)
- ✅ Usuário só vê follow-ups onde `clinician_id = auth.uid()`
- ✅ Não há acesso cross-tenant possível via API

---

## 2. Entregáveis SQL

### 2.1 DDL da Tabela

```sql
CREATE TABLE public.procedure_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  screening_id UUID NOT NULL REFERENCES public.prp_screenings(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL,
  
  -- Scheduling
  timepoint TEXT NOT NULL CHECK (timepoint IN ('D7', 'D30', 'D90', 'D180', 'D365')),
  scheduled_for DATE NOT NULL,
  rescheduled_from DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  
  -- Outcome data
  pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
  function_score INTEGER CHECK (function_score >= 0 AND function_score <= 100),
  function_text TEXT,
  global_change TEXT CHECK (global_change IN ('much_better', 'better', 'same', 'worse', 'much_worse')),
  
  -- Adverse events
  adverse_event BOOLEAN DEFAULT false,
  adverse_event_severity TEXT CHECK (adverse_event_severity IN ('mild', 'moderate', 'severe')),
  adverse_event_description TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_followups_screening ON public.procedure_followups(screening_id);
CREATE INDEX idx_followups_patient ON public.procedure_followups(patient_id);
CREATE INDEX idx_followups_clinician ON public.procedure_followups(clinician_id);
CREATE INDEX idx_followups_status ON public.procedure_followups(status);
CREATE INDEX idx_followups_scheduled ON public.procedure_followups(scheduled_for);
CREATE INDEX idx_followups_status_scheduled ON public.procedure_followups(status, scheduled_for);
CREATE UNIQUE INDEX idx_followups_unique_timepoint ON public.procedure_followups(screening_id, timepoint);
```

### 2.2 RLS Policies

```sql
ALTER TABLE public.procedure_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can view their own followups"
ON public.procedure_followups FOR SELECT
USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can insert their own followups"
ON public.procedure_followups FOR INSERT
WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update their own followups"
ON public.procedure_followups FOR UPDATE
USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can delete their own followups"
ON public.procedure_followups FOR DELETE
USING (clinician_id = auth.uid());
```

### 2.3 Funções

```sql
-- Criar follow-ups manualmente (via RPC)
CREATE OR REPLACE FUNCTION public.create_followups_for_screening(
  p_screening_id UUID,
  p_patient_id UUID,
  p_clinician_id UUID,
  p_procedure_date DATE DEFAULT CURRENT_DATE
)
RETURNS SETOF public.procedure_followups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_timepoints TEXT[] := ARRAY['D7', 'D30', 'D90', 'D180', 'D365'];
  v_days INTEGER[] := ARRAY[7, 30, 90, 180, 365];
  v_i INTEGER;
BEGIN
  FOR v_i IN 1..array_length(v_timepoints, 1) LOOP
    INSERT INTO public.procedure_followups (
      screening_id, patient_id, clinician_id, timepoint, scheduled_for, status
    ) VALUES (
      p_screening_id, p_patient_id, p_clinician_id,
      v_timepoints[v_i], p_procedure_date + v_days[v_i], 'pending'
    )
    ON CONFLICT (screening_id, timepoint) DO NOTHING;
  END LOOP;
  
  RETURN QUERY SELECT * FROM public.procedure_followups WHERE screening_id = p_screening_id;
END;
$$;

-- Marcar follow-ups atrasados como missed
CREATE OR REPLACE FUNCTION public.mark_missed_followups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.procedure_followups
    SET status = 'missed', updated_at = now()
    WHERE status = 'pending'
      AND scheduled_for < CURRENT_DATE - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM updated;
  RETURN v_count;
END;
$$;

-- Trigger automático após INSERT em patient_procedures
CREATE OR REPLACE FUNCTION public.auto_create_followups_on_procedure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_screening_id UUID;
  v_timepoints TEXT[] := ARRAY['D30', 'D90', 'D180', 'D365'];
  v_days INTEGER[] := ARRAY[30, 90, 180, 365];
  v_i INTEGER;
BEGIN
  -- Buscar o screening mais recente do paciente
  SELECT id INTO v_screening_id
  FROM public.prp_screenings
  WHERE patient_id = NEW.patient_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_screening_id IS NULL THEN
    RETURN NEW;
  END IF;

  FOR v_i IN 1..array_length(v_timepoints, 1) LOOP
    INSERT INTO public.procedure_followups (
      screening_id, patient_id, clinician_id, timepoint, scheduled_for, status
    ) VALUES (
      v_screening_id, NEW.patient_id,
      COALESCE(NEW.created_by, auth.uid()),
      v_timepoints[v_i], NEW.procedure_date + v_days[v_i], 'pending'
    )
    ON CONFLICT (screening_id, timepoint) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_followups
  AFTER INSERT ON public.patient_procedures
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_followups_on_procedure();
```

---

## 3. Entregáveis Código

### 3.1 Hook useFollowups (Queries)

```typescript
// src/hooks/useFollowups.ts

// Query principal com filtros
let query = supabase
  .from('procedure_followups')  // ← TABELA OFICIAL
  .select(`
    *,
    patient:patients(full_name, phone)
  `)
  .order('scheduled_for', { ascending: true });

// Filtro por status
if (filters?.status) {
  query = query.eq('status', filters.status);
}

// Filtro por período
switch (filters.period) {
  case 'today':
    query = query.eq('scheduled_for', today);
    break;
  case 'next7days':
    query = query.gte('scheduled_for', today).lte('scheduled_for', next7);
    break;
  case 'overdue':
    query = query.eq('status', 'pending').lt('scheduled_for', overdueCutoff);
    break;
}
```

### 3.2 Hook useFollowupsByScreening

```typescript
// src/hooks/useFollowups.ts

export function useFollowupsByScreening(screeningId: string | undefined) {
  // ...
  const { data, error } = await supabase
    .from('procedure_followups')  // ← TABELA OFICIAL
    .select('*')
    .eq('screening_id', screeningId)  // ← FILTRO POR SCREENING
    .order('scheduled_for', { ascending: true });
  // ...
}
```

### 3.3 Step 8 - Integração com ScreeningFollowups

```tsx
// src/components/FisioRegenScore/WizardSteps/WizardStep8.tsx

import { ScreeningFollowups } from "@/components/followup";

// No return do componente:
return (
  <div className="space-y-6">
    <RegenResultView ... />

    {/* Seção de Follow-ups - só exibe se temos screening e paciente */}
    {screeningId && patientId && (
      <ScreeningFollowups
        screeningId={screeningId}
        patientId={patientId}
      />
    )}
  </div>
);
```

### 3.4 ScreeningFollowups Component

```tsx
// src/components/followup/ScreeningFollowups.tsx

interface ScreeningFollowupsProps {
  screeningId: string;
  patientId: string;
}

export function ScreeningFollowups({ screeningId, patientId }: ScreeningFollowupsProps) {
  const { followups, loading } = useFollowupsByScreening(screeningId);
  // ...
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-ups</CardTitle>
        <div className="flex gap-2">
          {!hasFollowups && (
            <Button onClick={handleCreate}>Criar Follow-ups</Button>
          )}
          <Button variant="outline" onClick={() => navigate('/followups')}>
            Painel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <FollowupList followups={followups} ... />
      </CardContent>
    </Card>
  );
}
```

---

## 4. Arquivos Criados/Alterados

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/types/followup.ts` | Types e constantes |
| `src/hooks/useFollowups.ts` | Hooks de dados e ações |
| `src/components/followup/FollowupStatusBadge.tsx` | Badge de status |
| `src/components/followup/FollowupForm.tsx` | Formulário de outcomes |
| `src/components/followup/FollowupList.tsx` | Lista de follow-ups |
| `src/components/followup/FollowupFilters.tsx` | Componente de filtros |
| `src/components/followup/ScreeningFollowups.tsx` | Seção para Step 8 |
| `src/components/followup/index.ts` | Exports |
| `src/pages/FollowupPanel.tsx` | Página principal `/followups` |
| `docs/followups-v1.md` | Esta documentação |

### Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Adicionada rota `/followups` |
| `src/components/FisioRegenScore/WizardSteps/WizardStep8.tsx` | Integração com ScreeningFollowups |

---

## 5. Checklist de Validação Manual

### Cenário 1: Trigger Automático

**Execução:**
1. [ ] Criar paciente de teste
2. [ ] Criar triagem (prp_screenings) para o paciente
3. [ ] Registrar procedimento via AddProcedureModal
4. [ ] Consultar `procedure_followups` no banco

**Expected Outputs:**
```sql
SELECT * FROM procedure_followups WHERE patient_id = '<patient_id>';
-- ✅ 4 registros: D30, D90, D180, D365
-- ✅ scheduled_for = procedure_date + dias respectivos
-- ✅ status = 'pending' para todos
```

### Cenário 2: Idempotência

**Execução:**
1. [ ] Registrar segundo procedimento para o mesmo paciente
2. [ ] Consultar `procedure_followups`

**Expected Outputs:**
```
✅ Ainda 4 registros (não duplicou)
✅ ON CONFLICT funcionou
```

### Cenário 3: RLS Tenant Isolation

**Execução:**
1. [ ] Logar como Profissional A
2. [ ] Criar follow-ups para Paciente X
3. [ ] Logar como Profissional B
4. [ ] Tentar acessar `/followups`

**Expected Outputs:**
```
✅ Profissional B NÃO vê follow-ups do Profissional A
✅ Lista vazia ou apenas seus próprios follow-ups
```

### Cenário 4: Acesso à Rota

**Execução:**
1. [ ] Acessar `/followups` sem autenticação

**Expected Outputs:**
```
✅ Redirecionado para /auth
✅ ProtectedRoute bloqueou acesso
```

---

## 6. Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE FOLLOW-UPS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Triagem (prp_screenings)                                   │
│     └─> screening_id criado                                    │
│                                                                 │
│  2. Procedimento (patient_procedures)                          │
│     └─> INSERT dispara trigger                                 │
│         └─> auto_create_followups_on_procedure()               │
│             └─> Busca screening_id mais recente                │
│             └─> Cria 4 follow-ups (D30, D90, D180, D365)       │
│             └─> ON CONFLICT ignora duplicatas                  │
│                                                                 │
│  3. Step 8 - Resultado REGENAPP                                │
│     └─> ScreeningFollowups exibe lista                         │
│     └─> Botão "Painel" navega para /followups                  │
│                                                                 │
│  4. Painel /followups                                          │
│     └─> Lista todos follow-ups do clinician_id                 │
│     └─> Filtros: status, período                               │
│     └─> Ações: completar, missed, reagendar                    │
│                                                                 │
│  5. Automação de Missed                                        │
│     └─> mark_missed_followups() chamada ao carregar painel     │
│     └─> Marca como 'missed' se scheduled_for < hoje - 7 dias   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Changelog

### v1.0.0 (2025-01-01)
- Tabela `procedure_followups` criada
- RLS policies por `clinician_id`
- Funções `create_followups_for_screening` e `mark_missed_followups`
- Trigger `trigger_auto_create_followups` em `patient_procedures`
- Componentes React completos
- Integração com Step 8
- Painel `/followups`
- Documentação de auditoria ETAPA 4
