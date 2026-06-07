# REGHEN — Auditoria Fase 1: Motor Clínico (SCORE)

**Data:** 2026-06-05  
**Branch:** `auditoria/fase-1`  
**Auditor:** Claude Sonnet 4.6 (Claude Code)  
**Arquivos auditados:** `src/lib/regen-engine/*`, `src/lib/fisioregen-score-calculator.ts`, `src/domain/clinicalOutcomeClassification.ts`, `src/pages/FisioRegenScore.tsx`

---

## 1. Mapa de fluxo completo

```
Entrada: RegenCanonical { schema_version: "regen_canonical_v1", ... }
         │
         └─ GUARD: schema_version !== "regen_canonical_v1" → throw Error (fail-safe)
                   │
         ┌─────────▼──────────────────────────────────────────────────────────────┐
         │ runRegenEngine()   [orchestrator.ts]  engine_version: regen_engine_v1.0.0 │
         │ ruleset_version: regen_rules_v1                                          │
         └──────────────────────────────────────────────────────────────────────────┘
                   │
         ┌─────────▼─────────────────┐
         │  CAMADA 1: computeSafety() │  Lê: canonical.safety
         │  SafetyOutput              │  {block, alert, reasons}
         └─────────┬─────────────────┘
              block=true?
           ┌────YES─┤
           │        └─ computeDataQuality(blocked=true) → RETURN EARLY
           │           (crs/die/brs/tog/pee ficam null no output)
           NO
           │
         ┌─▼───────────────────────────┐
         │  CAMADA 2: computeCRS()      │  Lê: canonical.complaint
         │  CRSOutput                   │  Base 100; penalidades por duração e dor
         │  Score 0-100 + classification │  "Not Ready" / "Conditionally Ready" / "Potentially Ready"
         └─▼───────────────────────────┘
         ┌─▼───────────────────────────┐
         │  CAMADA 3: computeDIE()      │  Lê: canonical.labs (8 exames)
         │  DIEOutput                   │  Por exame: USE / REPEAT(EXPIRED) / REQUEST
         │  Validade per-exam (dias):    │  hgb/hct/leuc/plt/gluc=90, crp=30, ferr/hba1c=180
         │  Aviso CAUTION em >80% prazo │
         └─▼───────────────────────────┘
         ┌─▼───────────────────────────┐
         │  CAMADA 4: computeBRS()      │  Lê: canonical + DIEOutput.lab_recommendations
         │  BRSOutput                   │  Base 100; penalidades: smoking, meds, comorbidades, labs
         │  Score 0-100 + reason_codes  │  EXPIRED labs NUNCA entram (getValidLabsForBRS)
         └─▼───────────────────────────┘
         ┌─▼───────────────────────────┐
         │  CAMADA 5: computeTOG()      │  Lê: BRSOutput.reason_codes (+ CRS codes via TOG)
         │  TOGOutput                   │  Converte reason_codes → Guidance[]
         │  Sempre inclui DISCLAIMER    │  Ordenado por prioridade (high→medium→low)
         └─▼───────────────────────────┘
         ┌─▼───────────────────────────┐
         │  CAMADA 6: computePEE()      │  Lê: canonical + BRSOutput
         │  PEEOutput                   │  Avalia PRP / PRF / BMAC via ELIGIBILITY_GATES
         │  "Recommended" /             │  BRS≥70 + sem gates = Recommended
         │  "Possible with adjustments" │  BRS<40 = Not recommended
         │  "Not recommended" /         │  block gate → Not recommended
         │  "Cannot evaluate"           │  downgrade gate → Possible with adjustments
         └─▼───────────────────────────┘
         ┌─▼───────────────────────────┐
         │  computeDataQuality()        │  7 campos essenciais verificados
         │  DataQualityOutput           │  alerts[], completeness_percent
         └─▼───────────────────────────┘
         Saída: RegenEngineOutputs
               { engine_version, ruleset_version, computed_at,
                 safety, crs, die, brs, tog, pee, data_quality }

Armazenamento: questionnaire_responses (JSONB) → chave regen_engine_outputs
               Não existe coluna dedicada regen_engine_outputs na tabela.

Estados S0–S3 (NÃO são output do motor — são workflow states):
  S0: insert em prp_screenings (TriagemBiologica)
  S1: derivado de computeCaseStatus() [DEFINIDO MAS NUNCA CHAMADO]
  S2: escrito diretamente pelo frontend (LabsPanel, DynamicLabsPanel)
  S3: escrito diretamente pelo frontend (AvaliacaoRegenapp)
```

---

## 2. Blindagem de escrita

**`regen_engine_outputs` — não é coluna protegida.** O campo é uma chave JSON *dentro* de `questionnaire_responses` (JSONB). Não existe trigger ou RLS coluna-a-coluna sobre ela.

O PRD afirma: *"Escrita em `regen_engine_outputs` protegida (RLS/trigger) — tentativa via DevTools deve falhar."* A proteção real é apenas a RLS de linha da tabela `prp_screenings`: `clinician_id = auth.uid()`. Um profissional autenticado pode fazer `UPDATE prp_screenings SET questionnaire_responses = ...` via DevTools — nada bloqueia.

### Pontos no frontend que escrevem `regen_engine_outputs`

| Arquivo | Linha | Operação | Contexto |
|---------|-------|----------|---------|
| `src/components/RegenEvaluation/AvaliacaoRegenapp.tsx` | 243 | `UPDATE questionnaire_responses` | Score final — passa pelo gate S2 ✓ |
| `src/components/RegenEvaluation/AvaliacaoRegenapp.tsx` | 316 | `UPDATE questionnaire_responses` | Recalculate — **sem gate S2** |
| `src/components/FisioRegenScore/WizardSteps/WizardStep8.tsx` | 106 | `UPDATE questionnaire_responses` | Wizard FisioRegen — **sem gate S2, sem atualizar regen_case_status** |

### Pontos no frontend que escrevem `regen_case_status`

| Arquivo | Linha | Valor | Contexto |
|---------|-------|-------|---------|
| `src/pages/TriagemBiologica.tsx` | 343 | `"S0"` | INSERT inicial — aceitável |
| `src/components/RegenEvaluation/LabsPanel.tsx` | 222 | `"S2"` | UPDATE direto quando labs válidos |
| `src/components/RegenEvaluation/DynamicLabsPanel.tsx` | 391 | `"S2"` | UPDATE direto quando labs válidos |
| `src/components/RegenEvaluation/AvaliacaoRegenapp.tsx` | 250 | `"S3"` | Score definitivo (path principal) |
| `src/components/RegenEvaluation/AvaliacaoRegenapp.tsx` | 267 | `"S3"` | Score definitivo (path alternativo) |
| `src/components/RegenEvaluation/AvaliacaoRegenapp.tsx` | 339 | `"S3"` | Recalculate |

---

## 3. Fonte única de status

**`computeCaseStatus()` existe mas nunca é chamada para transições de estado.**

| Ponto | O que deveria fazer | O que faz |
|-------|---------------------|-----------|
| `src/types/regen-case-status.ts:156` | Função canônica que deriva status dos dados | **Definida, nunca chamada em código de produção** |
| `src/pages/admin/AdminScoreFluxoDoc.tsx:109` | Documentação admin | Apenas referenciada em texto de doc — não invocada |

A função `computeCaseStatus()` tem lógica correta: S3 se `regen_engine_outputs` existe → S2 se clínica + labs válidos → S1 se só clínica → S0 otherwise. O frontend ignora essa função e escreve o status diretamente.

**Consequência real:** `WizardStep8.tsx` salva `regen_engine_outputs` dentro de `questionnaire_responses` mas **não atualiza** `regen_case_status`. O campo na coluna fica em S1 ou S2 enquanto o output do motor já existe — estado inconsistente no banco.

---

## 4. Cobertura de testes por camada

| Camada | Arquivo de teste | Status |
|--------|-----------------|--------|
| `safety-layer.ts` | — | **SEM TESTE** |
| `crs-layer.ts` | — | **SEM TESTE** |
| `die-layer.ts` | — | **SEM TESTE** |
| `brs-layer.ts` | — | **SEM TESTE** |
| `tog-layer.ts` | `src/lib/__tests__/tog-layer.test.ts` | Coberto (GUIDANCE_MAP completo) |
| `pee-layer.ts` | — | **SEM TESTE** |
| `orchestrator.ts` | — | **SEM TESTE** (ponto de entrada sem teste end-to-end) |
| `regen-canonical-adapter` | `src/lib/__tests__/regen-canonical-adapter.test.ts` | Coberto (adapter, não camadas) |
| `fisioregen-score-calculator.ts` | — | **SEM TESTE** |

5 das 7 camadas do motor sem nenhum teste automatizado. O orchestrator — ponto de entrada de toda avaliação — também não tem cobertura.

---

## 5. Exames críticos e STALE — consistência

### Validade por exame: DIE layer vs triage-exams

| Exame | DIE layer (`die-layer.ts`) | triage-exams (`triage-exams.ts`) | Divergência? |
|-------|--------------------------|--------------------------------|-------------|
| hemoglobin | 90 dias | 90 dias (default) | Consistente |
| leukocytes | 90 dias | 90 dias (default) | Consistente |
| platelets | 90 dias | 90 dias (default) | Consistente |
| hematocrit | 90 dias | 90 dias (default) | Consistente |
| glucose | 90 dias | 90 dias (default) | Consistente |
| **crp** | **30 dias** | **90 dias (default)** | **⚠️ DIVERGÊNCIA 3×** |
| **ferritin** | **180 dias** | **90 dias (default)** | **⚠️ DIVERGÊNCIA 2×** |
| **hba1c** | **180 dias** | **90 dias (default)** | **⚠️ DIVERGÊNCIA 2×** |

**Impacto clínico das divergências:**

- **CRP 60 dias:** UI mostra "válido" (verde) → gate S2 liberado → motor marca `EXPIRED` → BRS não penaliza HIGH_CRP → PEE não dispara `HIGH_INFLAMMATION`. **Dado clínico ignorado silenciosamente sem erro visível.**
- **Ferritina 120 dias:** UI mostra "desatualizado" (bloqueia S2) → motor aceita como válido. Profissional vê conflito entre UI e output sem explicação.
- **HbA1c 120 dias:** mesma situação da ferritina.

### Exames críticos: discrepância DIE vs gate S2

| Definição | Exames |
|-----------|-------|
| `ESSENTIAL_LABS` em `die-layer.ts` | hemoglobin, platelets, leukocytes **(3)** |
| `REQUIRED_CRITICAL_LABS` em `regen-case-status.ts` | + crp, hba1c, ferritin **(6)** |
| PRD — "exames críticos" | hemoglobin, leukocytes, platelets, crp, hba1c, ferritin **(6)** |

O DIE emite `ESSENTIAL_LAB_MISSING` apenas para 3 exames. crp/hba1c/ferritin ausentes geram apenas `LAB_MISSING` — severidade diferente do esperado para exames que o PRD e o gate S2 consideram críticos.

---

## 6. Divergências PRD vs código

| # | O que o PRD diz | O que o código faz |
|---|-----------------|-------------------|
| 1 | "`regen_engine_outputs` protegida por RLS/trigger" | Não há coluna dedicada — é chave JSON dentro de `questionnaire_responses`. RLS protege só `clinician_id = auth.uid()`. Sem trigger de proteção no baseline. |
| 2 | "status derivado, nunca editável manualmente; fonte única `computeCaseStatus()`" | `computeCaseStatus()` **nunca chamada**. Frontend escreve `regen_case_status` diretamente em 5 pontos de UPDATE. |
| 3 | "motor calcula CRS e BRS" | Há **dois calculadores paralelos**: `regen-engine` (BRS+CRS+DIE+TOG+PEE via `runRegenEngine`) e `fisioregen-score-calculator.ts` (domínios A+B+C via `calculateFisioRegenScore`). O PRD menciona ambos sob o mesmo título mas não distingue suas relações. |
| 4 | "STALE = exame desatualizado" | Definição diverge entre camadas: DIE usa validade per-exam (30/90/180 dias); triage-exams usa 90 dias flat para todos. |
| 5 | Comentário no orchestrator: `"reason_code inclui NSAID_RECENT_7D"` | Não existe `NSAID_RECENT_7D` no código. BRS usa `NSAID_RECENT_14D`; PEE gate usa `NSAID_RECENT`. Documentação técnica inline incorreta. |

---

## Achados por severidade

### 🔴 CRÍTICO

#### C1 — `regen_case_status` escrito diretamente pelo frontend em 5 pontos, sem máquina de estados centralizada

- `LabsPanel.tsx:222` e `DynamicLabsPanel.tsx:391` escrevem `"S2"` de forma independente e redundante, sem validação centralizada
- `AvaliacaoRegenapp.tsx:250,267,339` escrevem `"S3"` sem trigger de proteção no banco
- `computeCaseStatus()` definida mas nunca chamada para guiar essas transições
- **Risco:** dois componentes de labs podem escrever S2 em paralelo; qualquer um pode escrever um status inconsistente com o estado real dos dados

#### C2 — `WizardStep8.tsx` salva `regen_engine_outputs` sem gate S2 e sem atualizar `regen_case_status`

- `WizardStep8.tsx:106–115`: executa `runRegenEngine` e grava resultado no banco sem verificar `regen_case_status === "S2"` (gate que `AvaliacaoRegenapp.tsx:211` verifica)
- Não atualiza `regen_case_status` para `"S3"` após gravar
- **Risco:** estado inconsistente — output do motor gravado mas status da coluna desatualizado; bypass do gate de segurança que impede geração de score fora de S2

#### C3 — Divergência de validade de CRP: 30 dias (engine) vs 90 dias (UI) — dado clínico ignorado silenciosamente

- CRP coletado há 31–90 dias: UI valida → S2 liberado → motor marca `EXPIRED` → BRS não penaliza PCR elevado → PEE não dispara gate de inflamação
- Ausência de erro visível: o profissional não sabe que o engine descartou o exame
- **Risco clínico:** inflamação ativa pode passar despercebida no score se CRP tiver 31–90 dias

---

### 🟡 MÉDIO

#### M1 — `regen_engine_outputs` sem proteção de escrita efetiva no banco

- Não há coluna dedicada: é chave JSON dentro de `questionnaire_responses`
- RLS da tabela `prp_screenings` protege apenas `clinician_id = auth.uid()`
- O próprio profissional pode sobrescrever `regen_engine_outputs` via DevTools sem nenhum bloqueio
- PRD afirma que "tentativa via DevTools deve falhar" — não é verdade com a RLS atual

#### M2 — Divergência ferritina/HbA1c: 180 dias (engine) vs 90 dias (UI)

- Ferritina ou HbA1c com 91–180 dias: UI bloqueia S2 (mostra "desatualizado") enquanto motor aceitaria o exame como válido
- Profissional vê conflito entre o estado do UI e o output do motor sem explicação

#### M3 — `ESSENTIAL_LABS` do DIE layer tem 3 exames, gate S2 exige 6

- crp, hba1c e ferritin ausentes recebem sinalização `LAB_MISSING` (genérico) no DIE, não `ESSENTIAL_LAB_MISSING`
- Sinal de severidade diferente do esperado para exames que o PRD e o gate S2 tratam como críticos

#### M4 — Comentário inline do orchestrator usa `NSAID_RECENT_7D` (não existe)

- `src/lib/regen-engine/orchestrator.ts:192`: comentário de teste interno diz `reason_code inclui "NSAID_RECENT_7D"`
- Não existe tal reason_code. BRS usa `NSAID_RECENT_14D`; PEE gate usa `NSAID_RECENT`
- Risco: confunde manutenção futura do motor

---

### 🔵 BAIXO

#### B1 — 5 das 7 camadas do motor sem testes automatizados

- Safety, CRS, DIE, BRS, PEE: zero cobertura
- Orchestrator (end-to-end): zero cobertura
- Qualquer regressão causada por mudança de dependência (ex: upgrade de biblioteca, refactor de tipo) passaria despercebida

#### B2 — Dois calculadores de score sem relação documentada no código

- `calculateFisioRegenScore` (domínios A+B+C, max 100, thresholds 49/64/79) produz `NAO_APTO` / `APTO_COM_ALTO_RISCO` / `APTO` / `EXCELENTE_CANDIDATO`
- `runRegenEngine` (BRS+CRS+DIE+TOG+PEE) produz `RegenEngineOutputs` estruturado
- Ambos coexistem no wizard `FisioRegenScoreWizard`, chamados sequencialmente, mas sem documentação no código sobre a relação entre os dois resultados

---

## Resumo executivo

| ID | Severidade | Descrição curta |
|----|-----------|----------------|
| C1 | 🔴 CRÍTICO | `regen_case_status` escrito diretamente em 5 pontos — sem máquina de estados |
| C2 | 🔴 CRÍTICO | `WizardStep8` bypassa gate S2 e não atualiza status para S3 |
| C3 | 🔴 CRÍTICO | CRP: validade 30d (engine) vs 90d (UI) — dado clínico descartado silenciosamente |
| M1 | 🟡 MÉDIO | `regen_engine_outputs` sem proteção real de escrita no banco |
| M2 | 🟡 MÉDIO | Ferritina/HbA1c: validade 180d (engine) vs 90d (UI) — conflito visível |
| M3 | 🟡 MÉDIO | `ESSENTIAL_LABS` DIE (3) diverge de `REQUIRED_CRITICAL_LABS` S2 (6) |
| M4 | 🟡 MÉDIO | Comentário `NSAID_RECENT_7D` no orchestrator — reason_code inexistente |
| B1 | 🔵 BAIXO | Safety, CRS, DIE, BRS, PEE, Orchestrator sem testes automatizados |
| B2 | 🔵 BAIXO | Dois calculadores de score sem relação documentada |

---

## O que NÃO foi alterado

- Nenhuma regra, threshold, cálculo ou estado das camadas do motor (`safety-layer.ts`, `crs-layer.ts`, `die-layer.ts`, `brs-layer.ts`, `tog-layer.ts`, `pee-layer.ts`, `orchestrator.ts`)
- `fisioregen-score-calculator.ts` — lido apenas, não modificado
- Nenhuma migration ou baseline de banco
- O comentário `NSAID_RECENT_7D` no orchestrator está no motor congelado — reportado, aguardando decisão do usuário

---

*Auditoria conduzida em modo read-only. Nenhuma correção aplicada. Aguardando autorização para Fase 2.*
