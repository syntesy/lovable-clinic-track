# Registry Analytics v1.1

## Visão Geral

Módulo READ-ONLY de analytics para análise descritiva de outcomes ortobiológicos.

**Versão:** v1.1  
**Status:** Produção  
**Data:** 2026-01-01

---

## Definição de Responder

### Thresholds Fixos (NÃO parametrizáveis)

| Status | Critério em D90 |
|--------|-----------------|
| **ROBUST_RESPONDER** | Δ Dor ≥ 4 **OU** Δ Função ≥ 30% |
| **MODERATE_RESPONDER** | Δ Dor ≥ 2 **OU** Δ Função ≥ 20% |
| **NON_RESPONDER** | Não atinge critérios **OU** piora (Δ ≤ -2 ou global_change = worse/much_worse) |
| **INCONCLUSIVE** | D90 ausente, baseline ausente, dados insuficientes |

### Reason Codes

| Código | Descrição |
|--------|-----------|
| `NO_D90` | Sem follow-up D90 completado |
| `MISSING_BASELINE_PAIN` | Baseline de dor ausente |
| `MISSING_BASELINE_FUNCTION` | Baseline de função ausente |
| `ROBUST_PAIN_D90` | Δ Dor ≥ 4 em D90 |
| `ROBUST_FUNCTION_D90` | Δ Função ≥ 30% em D90 |
| `MODERATE_PAIN_D90` | Δ Dor ≥ 2 em D90 |
| `MODERATE_FUNCTION_D90` | Δ Função ≥ 20% em D90 |
| `TRANSIENT_D30_ONLY` | Melhora D30 sem sustentação D90 |
| `WORSENED_D90` | Piora clinicamente relevante em D90 |
| `INSUFFICIENT_DATA` | Dados insuficientes para classificação |

---

## Campos Exportados (CSV Anonimizado)

| Campo | Descrição |
|-------|-----------|
| `registry_id` | UUID aleatório (não rastreável) |
| `clinician_id_hash` | Hash SHA-256 truncado + salt diário |
| `diagnosis` | Diagnóstico suspeito |
| `tissue_type` | Tipo de tecido |
| `procedure_type` | Tipo de procedimento |
| `timepoint_days` | Dia do follow-up (30/90/180/365) |
| `pain_nrs` | Dor NRS 0-10 |
| `function_score` | Score de função 0-100 |
| `global_change` | Mudança global percebida |
| `responder_status` | Classificação final |
| `responder_reason_code` | Código de justificativa |
| `adverse_event_present` | Evento adverso presente |
| `followup_status` | Status do follow-up |

---

## Arquivos Criados

### SQL
- `registry_case_summary_v1_1` - VIEW agregada
- `registry_exports_log` - Tabela de auditoria

### Types
- `src/types/registry-analytics.ts`

### Hooks
- `src/hooks/useRegistryAnalytics.ts`

### Components (src/components/registry/)
- `FiltersBar.tsx`
- `MetricsCards.tsx`
- `CurvesPanel.tsx`
- `ResponderBreakdown.tsx`
- `CasesTable.tsx`

### Pages (src/pages/Registry/)
- `RegistryDashboard.tsx` - Dashboard principal
- `RegistryExport.tsx` - Logs de exportação (admin)

---

## Checklist de Validação

- [x] Nenhum arquivo do motor alterado
- [x] Dashboard carrega com dados vazios
- [x] Thresholds respeitados (ROBUST ≥4/30%, MODERATE ≥2/20%)
- [x] Export sem PII + log criado
- [x] RLS via clinician_id
- [x] Rotas protegidas

---

## Exemplo CSV (sem PII)

```csv
registry_id,clinician_id_hash,diagnosis,tissue_type,procedure_type,timepoint_days,pain_nrs,function_score,global_change,responder_status,responder_reason_code,adverse_event_present,followup_status
a1b2c3d4-...,8f3a2b1c...,Tendinopatia,Tendão,PRP,90,3,75,better,ROBUST_RESPONDER,ROBUST_PAIN_D90,false,completed
```
