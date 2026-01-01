# Sistema de Follow-ups v1.0.0

> Documentação do sistema de acompanhamento pós-procedimento

---

## 1. Visão Geral

O sistema de follow-ups permite agendar e gerenciar acompanhamentos de pacientes após procedimentos ortobiológicos, coletando dados de outcomes para análise clínica.

### Características

- ✅ Criação automática de 5 follow-ups por procedimento (D7, D30, D90, D180, D365)
- ✅ Painel centralizado para gestão de pendências
- ✅ Formulário estruturado de outcomes
- ✅ Integração com o Resultado REGENAPP (Step 8)
- ✅ Marcação automática de follow-ups atrasados
- ✅ RLS por clínico

---

## 2. Modelo de Dados

### Tabela: `procedure_followups`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `screening_id` | UUID | FK → prp_screenings |
| `patient_id` | UUID | FK → patients |
| `clinician_id` | UUID | ID do profissional |
| `timepoint` | TEXT | D7, D30, D90, D180, D365 |
| `scheduled_for` | DATE | Data agendada |
| `rescheduled_from` | DATE | Data original (se reagendado) |
| `status` | TEXT | pending, completed, missed, cancelled |
| `completed_at` | TIMESTAMPTZ | Quando foi completado |
| `pain_score` | INTEGER | 0-10 |
| `function_score` | INTEGER | 0-100 |
| `function_text` | TEXT | Descrição funcional alternativa |
| `global_change` | TEXT | much_better, better, same, worse, much_worse |
| `adverse_event` | BOOLEAN | Houve evento adverso? |
| `adverse_event_severity` | TEXT | mild, moderate, severe |
| `adverse_event_description` | TEXT | Descrição do evento |
| `notes` | TEXT | Observações |
| `created_at` | TIMESTAMPTZ | Timestamp de criação |
| `updated_at` | TIMESTAMPTZ | Timestamp de atualização |

### Índices

- `idx_followups_screening` - por screening_id
- `idx_followups_patient` - por patient_id
- `idx_followups_clinician` - por clinician_id
- `idx_followups_status` - por status
- `idx_followups_scheduled` - por scheduled_for
- `idx_followups_status_scheduled` - composto status + scheduled_for
- `idx_followups_unique_timepoint` - UNIQUE (screening_id, timepoint)

---

## 3. Funções SQL

### `create_followups_for_screening`

Cria automaticamente os 5 follow-ups após um procedimento.

```sql
SELECT * FROM create_followups_for_screening(
  p_screening_id := 'uuid',
  p_patient_id := 'uuid',
  p_clinician_id := 'uuid',
  p_procedure_date := CURRENT_DATE  -- opcional
);
```

### `mark_missed_followups`

Marca como "missed" todos os follow-ups pendentes com mais de 7 dias de atraso.

```sql
SELECT mark_missed_followups();
-- Retorna: quantidade de follow-ups atualizados
```

---

## 4. Políticas RLS

| Operação | Regra |
|----------|-------|
| SELECT | `clinician_id = auth.uid()` |
| INSERT | `clinician_id = auth.uid()` |
| UPDATE | `clinician_id = auth.uid()` |
| DELETE | `clinician_id = auth.uid()` |

---

## 5. Componentes React

### Hooks

| Hook | Descrição |
|------|-----------|
| `useFollowups(filters?)` | Lista follow-ups com filtros |
| `useFollowupsByScreening(screeningId)` | Lista follow-ups de um screening específico |
| `useFollowupActions()` | Ações: criar, completar, atualizar status, reagendar |

### Componentes

| Componente | Descrição |
|------------|-----------|
| `FollowupStatusBadge` | Badge colorido de status |
| `FollowupForm` | Formulário de outcomes |
| `FollowupList` | Lista de follow-ups |
| `FollowupFiltersComponent` | Filtros de status e período |
| `ScreeningFollowups` | Seção de follow-ups para Step 8 |

---

## 6. Páginas

### `/followups` - Painel de Follow-ups

- Cards de estatísticas (pendentes, hoje, atrasados, concluídos)
- Filtros por status e período
- Lista completa de follow-ups
- Modal para completar follow-up

### Integração no Step 8

No wizard de triagem (Step 8 - Resultado REGENAPP), há uma seção dedicada:

- Lista compacta de follow-ups do screening
- Botão "Criar Follow-ups" (se não existirem)
- Botão "Painel" para acessar `/followups`
- Modal para completar follow-up inline

---

## 7. Fluxos

### Criação de Follow-ups

```
1. Usuário acessa Step 8 do wizard
2. Clica em "Criar Follow-ups"
3. Sistema chama create_followups_for_screening()
4. 5 follow-ups são criados com datas calculadas
5. Lista atualiza mostrando os follow-ups
```

### Completar Follow-up

```
1. Usuário abre follow-up pendente
2. Preenche formulário:
   - Dor (0-10)
   - Função (0-100 ou texto)
   - Mudança global (5 opções)
   - Eventos adversos (sim/não + detalhes)
   - Observações
3. Clica em "Salvar como Concluído"
4. Status muda para "completed"
5. Lista atualiza
```

### Reagendamento

```
1. Usuário abre follow-up
2. Clica em "Reagendar"
3. Seleciona nova data
4. Confirma
5. rescheduled_from recebe data anterior
6. scheduled_for recebe nova data
7. status volta para "pending"
```

### Marcação Automática de Missed

```
1. Usuário acessa painel de follow-ups
2. Sistema executa mark_missed_followups() automaticamente
3. Follow-ups com scheduled_for < (hoje - 7 dias) são marcados como "missed"
```

---

## 8. Arquivos Criados/Alterados

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
| `src/pages/FollowupPanel.tsx` | Página principal |
| `docs/followups-v1.md` | Esta documentação |

### Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Adicionada rota `/followups` |
| `src/components/FisioRegenScore/WizardSteps/WizardStep8.tsx` | Integração com ScreeningFollowups |

---

## 9. Checklist de Validação Manual

### Pré-requisitos
- [ ] Usuário autenticado
- [ ] Paciente de teste com triagem (prp_screenings)

### Cenário 1: Criar Follow-ups

**Execução:**
1. [ ] Navegar até Step 8 do wizard
2. [ ] Verificar seção "Follow-ups" visível
3. [ ] Clicar em "Criar Follow-ups"

**Expected Outputs:**
```
✅ Toast: "Follow-ups criados - 5 follow-ups agendados automaticamente"
✅ Lista exibe 5 follow-ups com timepoints D7, D30, D90, D180, D365
✅ Todos com status "Pendente"
✅ Datas calculadas corretamente a partir de hoje
```

### Cenário 2: Completar Follow-up

**Execução:**
1. [ ] Clicar no botão de abrir um follow-up pendente
2. [ ] Preencher dor = 3
3. [ ] Preencher função = 80%
4. [ ] Selecionar "Melhor" em mudança global
5. [ ] Deixar "Eventos adversos" = Não
6. [ ] Clicar "Salvar como Concluído"

**Expected Outputs:**
```
✅ Modal fecha
✅ Toast: "Follow-up concluído"
✅ Status muda para "Concluído" (verde)
✅ Dados de outcome exibidos no card
```

### Cenário 3: Marcar como Perdido

**Execução:**
1. [ ] Abrir follow-up pendente
2. [ ] Clicar "Marcar como Perdido"

**Expected Outputs:**
```
✅ Modal fecha
✅ Toast: "Status atualizado"
✅ Status muda para "Perdido" (vermelho)
```

### Cenário 4: Reagendar

**Execução:**
1. [ ] Abrir follow-up pendente
2. [ ] Clicar "Reagendar"
3. [ ] Selecionar data futura
4. [ ] Confirmar

**Expected Outputs:**
```
✅ Modal fecha
✅ Toast: "Follow-up reagendado"
✅ Nova data exibida
✅ Badge "(reagendado)" visível
```

### Cenário 5: Painel de Follow-ups

**Execução:**
1. [ ] Navegar para `/followups`
2. [ ] Verificar cards de estatísticas
3. [ ] Aplicar filtros
4. [ ] Verificar lista

**Expected Outputs:**
```
✅ Cards mostram números corretos
✅ Filtro por status funciona
✅ Filtro por período funciona
✅ Lista atualiza conforme filtros
```

### Cenário 6: Missed Automático

**Setup:**
1. Criar follow-up com scheduled_for = hoje - 10 dias (via SQL)

**Execução:**
1. [ ] Acessar `/followups`

**Expected Outputs:**
```
✅ Follow-up aparece como "Perdido"
✅ Toast mostra quantidade de follow-ups atualizados (se houver)
```

---

## 10. Validação de Banco de Dados

```sql
-- Verificar follow-ups de um screening
SELECT 
  timepoint,
  scheduled_for,
  status,
  pain_score,
  function_score,
  global_change,
  adverse_event
FROM procedure_followups 
WHERE screening_id = '<screening_id>'
ORDER BY scheduled_for;

-- Expected: 5 linhas, uma para cada timepoint
```

---

## 11. Regras de Negócio

1. **Um follow-up por timepoint por screening** - Constraint unique garante
2. **Janela de missed = 7 dias** - Após 7 dias de atraso, marca como missed
3. **Motor clínico intocado** - Follow-ups NÃO recalculam o motor REGENAPP
4. **RLS por clínico** - Cada profissional vê apenas seus follow-ups
5. **Sem PII nos outcomes** - Apenas scores numéricos e categorias

---

## 12. Changelog

### v1.0.0 (2025-01-01)
- Implementação inicial
- Tabela procedure_followups
- Funções create_followups_for_screening e mark_missed_followups
- Componentes React completos
- Integração com Step 8
- Painel `/followups`
