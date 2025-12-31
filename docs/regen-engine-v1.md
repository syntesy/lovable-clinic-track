# REGEN Engine v1.0.0 - Documentação Técnica

**Versão:** regen_engine_v1.0.0  
**Ruleset:** regen_rules_v1  
**Status:** CONGELADO ❄️  
**Data de Congelamento:** 2025-01-01

---

## 1. Objetivo Clínico

O REGEN Engine é um motor de apoio à decisão clínica para avaliação de aptidão biológica em procedimentos regenerativos (PRP, PRF, BMAC).

### O que o sistema FAZ:
- Calcula scores de prontidão clínica (CRS) e biológica (BRS)
- Identifica contraindicações de segurança
- Avalia validade de exames laboratoriais
- Sugere orientações preparatórias não-prescritivas
- Informa elegibilidade potencial para procedimentos

### O que o sistema NUNCA FAZ:
- ❌ Prescreve tratamentos
- ❌ Escolhe procedimentos
- ❌ Substitui avaliação médica
- ❌ Toma decisões clínicas definitivas
- ❌ Recomenda dosagens ou frequências

---

## 2. Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    regen_canonical                          │
│                 (ÚNICA FONTE DE DADOS)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 1: SAFETY                                           │
│  - Verifica contraindicações absolutas                      │
│  - Se block=true → para execução                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 2: CRS (Clinical Readiness Score)                   │
│  - Score 0-100 baseado em queixa clínica                    │
│  - Classificação: Not Ready / Conditionally / Potentially   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 3: DIE (Diagnostic Intelligence Engine)             │
│  - Avalia validade de exames                                │
│  - Gera recomendações: USE / REPEAT / REQUEST               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 4: BRS (Biological Readiness Score)                 │
│  - Score 0-100 baseado em solo biológico                    │
│  - Considera labs válidos, medicações, comorbidades         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 5: TOG (Therapeutic Orientation Guidance)           │
│  - Converte reason_codes em orientações                     │
│  - Linguagem sugestiva, não-prescritiva                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 6: PEE (Procedure Eligibility Engine)               │
│  - Avalia elegibilidade por procedimento                    │
│  - Aplica gates de segurança                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  regen_engine_outputs                       │
│                  (SAÍDA PERSISTIDA)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Campos do Canonical por Camada

### CAMADA 1: SAFETY
| Campo Canonical | Uso |
|-----------------|-----|
| `safety.cancer_tx_now_or_last_12m` | block se "yes" |
| `safety.fever_last_7d` | block se "yes" |
| `safety.open_wound_or_skin_infection_at_pain_site` | block se "yes" |
| `safety.active_infection` | block se "yes" |
| `safety.autoimmune_disease_active` | block se "yes" |

### CAMADA 2: CRS
| Campo Canonical | Uso |
|-----------------|-----|
| `demographics.age_years` | Não penaliza atualmente |
| `complaint.pain_region` | Verifica preenchimento |
| `complaint.symptom_duration_bucket` | Penaliza acute/chronic extremos |
| `complaint.pain_nrs` | Penaliza <3 ou >8 |

### CAMADA 3: DIE
| Campo Canonical | Uso |
|-----------------|-----|
| `labs.hemoglobin.*` | Validade 90 dias |
| `labs.platelets.*` | Validade 90 dias |
| `labs.leukocytes.*` | Validade 90 dias |
| `labs.crp.*` | Validade 30 dias |
| `labs.ferritin.*` | Validade 90 dias |
| `labs.tsh.*` | Validade 180 dias |
| `labs.vitamin_d.*` | Validade 180 dias |
| `labs.hba1c.*` | Validade 90 dias |
| `labs.fasting_glucose.*` | Validade 30 dias |

### CAMADA 4: BRS
| Campo Canonical | Uso |
|-----------------|-----|
| `smoking.status` | Penaliza "current" |
| `smoking.quit_bucket` | Penaliza "lt_6m" |
| `medications.nsaid_recent_7d` | Penalidade + reason_code "NSAID_RECENT_7D" |
| `medications.corticoid_recent_30d` | Penalidade |
| `medications.anticoagulant_current` | Alerta |
| `medications.antiplatelet_current` | Alerta |
| `medications.immunosuppressor_current` | Penalidade severa |
| `comorbidities.diabetes_uncontrolled` | Penalidade |
| `comorbidities.renal_disease` | Penalidade |
| `comorbidities.hepatic_disease` | Penalidade |
| Labs válidos (via DIE) | Penalidades por valores anormais |

### CAMADA 5: TOG
| Entrada | Uso |
|---------|-----|
| `brs.reason_codes[]` | Mapeados para orientações |
| `brs.alerts[]` | Incluídos como alertas |

### CAMADA 6: PEE
| Campo Canonical | Uso |
|-----------------|-----|
| `diagnosis.tissue_type` | Contexto (não bloqueia) |
| BRS score | Classificação base |
| BRS confidence | Gate: Low → nunca "Recommended" |
| `medications.nsaid_recent_7d` | Gate: downgrade PRP/PRF |

---

## 4. Decisões do Sistema

### ✅ O sistema PODE:
- Calcular scores numéricos (CRS, BRS)
- Classificar prontidão (Not Ready, Conditionally Ready, Potentially Ready)
- Bloquear avaliação por contraindicações de segurança
- Indicar status de exames (válido, expirado, ausente)
- Sugerir orientações preparatórias genéricas
- Indicar elegibilidade potencial (Recommended, Possible, Not recommended)

### ❌ O sistema NUNCA:
- Prescreve medicamentos
- Escolhe o procedimento a ser realizado
- Define dosagem ou volume
- Determina frequência de sessões
- Substitui avaliação clínica presencial
- Garante resultado do procedimento

---

## 5. Reason Codes Definidos (v1)

| Código | Descrição | Camada |
|--------|-----------|--------|
| `SMOKING_CURRENT` | Tabagismo ativo | BRS |
| `SMOKING_RECENT_QUIT` | Ex-fumante <6 meses | BRS |
| `NSAID_RECENT_7D` | AINE nos últimos 7 dias | BRS |
| `CORTICOID_RECENT` | Corticoide nos últimos 30 dias | BRS |
| `IMMUNOSUPPRESSOR` | Uso de imunossupressor | BRS |
| `DIABETES_UNCONTROLLED` | Diabetes descontrolado | BRS |
| `RENAL_DISEASE` | Doença renal | BRS |
| `HEPATIC_DISEASE` | Doença hepática | BRS |
| `LOW_HEMOGLOBIN` | Hemoglobina baixa | BRS |
| `LOW_PLATELETS` | Plaquetas baixas | BRS |
| `HIGH_CRP` | PCR elevada | BRS |
| `LOW_FERRITIN` | Ferritina baixa | BRS |
| `HIGH_HBA1C` | HbA1c elevada | BRS |
| `LOW_VITAMIN_D` | Vitamina D baixa | BRS |

---

## 6. Limitações Conhecidas (v1)

1. **Idade não penaliza**: CRS não aplica penalidades por idade extrema
2. **Sem severidade de diagnóstico**: PEE não considera gravidade da lesão
3. **Labs fixos**: Não suporta exames personalizados
4. **Sem histórico**: Não considera procedimentos anteriores
5. **Sem região específica**: Validação de labs é genérica
6. **Sem integração BMAC-específica**: Mesmo critério para todos os ortobiológicos
7. **Quit bucket simplificado**: Apenas 3 faixas (lt_6m, m6_12, gt_12m)

---

## 7. Testes Críticos Obrigatórios

### Teste 1: Safety Block
```typescript
// Input
canonical.safety.cancer_tx_now_or_last_12m = "yes"

// Expected Output
output.safety.block === true
output.crs === null
output.die === null
output.brs === null
output.tog === null
output.pee === null
```

### Teste 2: NSAID Recent
```typescript
// Input
canonical.medications.nsaid_recent_7d = "yes"

// Expected Output
output.brs.reason_codes.includes("NSAID_RECENT_7D")
output.pee.eligibility.find(e => e.procedure_type === "PRP").eligibility !== "Recommended"
```

### Teste 3: Labs Expirados
```typescript
// Input
canonical.labs.hemoglobin.collected_date = "2024-06-01" // >90 dias

// Expected Output
output.die.lab_recommendations.find(l => l.lab_code === "hemoglobin").status === "REPEAT"
// BRS não usa valor de hemoglobina no cálculo
```

---

## 8. Versionamento

| Atributo | Valor |
|----------|-------|
| `engine_version` | `regen_engine_v1.0.0` |
| `ruleset_version` | `regen_rules_v1` |
| `schema_version` (canonical) | `regen_canonical_v1` |

---

## 9. Arquivos do Motor

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/types/regen-engine.ts` | Tipos de saída |
| `src/lib/regen-engine/orchestrator.ts` | Orquestração |
| `src/lib/regen-engine/safety-layer.ts` | Camada Safety |
| `src/lib/regen-engine/crs-layer.ts` | Camada CRS |
| `src/lib/regen-engine/die-layer.ts` | Camada DIE |
| `src/lib/regen-engine/brs-layer.ts` | Camada BRS |
| `src/lib/regen-engine/tog-layer.ts` | Camada TOG |
| `src/lib/regen-engine/pee-layer.ts` | Camada PEE |
| `src/lib/regen-engine/index.ts` | Exports públicos |

---

## 10. Integração UI — Resultado REGENAPP (Step 8)

### Localização
- **Componente principal:** `src/components/RegenResult/RegenResultView.tsx`
- **Step do wizard:** `src/components/FisioRegenScore/WizardSteps/WizardStep8.tsx`

### Fonte de Dados
- **Primária (obrigatória):** `questionnaire_responses.regen_engine_outputs`
- **Secundária (exibição):** `regen_canonical`
- ⚠️ A UI **nunca recalcula** automaticamente — somente via botão.

### Estados da UI
| Estado | Condição | Comportamento |
|--------|----------|---------------|
| `loading` | Carregando dados | Skeleton placeholders |
| `empty` | `regen_engine_outputs` inexistente | CTA "Gerar Resultado" |
| `error` | JSON inválido | Mensagem de erro + log |
| `outdated` | `canonicalUpdatedAt > computed_at` | Banner + botão "Recalcular" |
| `ready` | Output válido e atualizado | Cards completos |

### Stale Warning (Resultado Desatualizado)
O sistema detecta automaticamente quando os dados foram alterados após o último cálculo:

```typescript
// Lógica de detecção
const referenceTime = canonicalUpdatedAt || screeningUpdatedAt; // fallback
if (referenceTime > computed_at) {
  // Exibir banner: "Este resultado pode estar desatualizado"
}
```

### Botão "Gerar/Recalcular Resultado"
1. Constrói `regen_canonical` a partir do `formData` atual
2. Executa `runRegenEngine(canonical)` 
3. Faz **MERGE** com `questionnaire_responses` existente (não sobrescreve)
4. Salva em `prp_screenings.questionnaire_responses.regen_engine_outputs`
5. Atualiza `prp_screenings.updated_at`
6. Recarrega a tela

### Cards (Ordem Fixa)
| Card | Conteúdo |
|------|----------|
| A - Safety | Status block/alert, reasons |
| B - CRS | Score, classificação, confidence, fatores |
| C - DIE | USE/REPEAT/REQUEST por exame |
| D - BRS | Score, confidence, reason_codes |
| E - TOG | Orientações categorizadas |
| F - PEE | Elegibilidade por procedimento |
| G - Data Quality | Alerts, completeness % |

### Ações Disponíveis
- **Exportar PDF** — inclui versões do motor e disclaimer
- **Copiar para prontuário** — texto padronizado sem IA
- **Salvar nota clínica** — persiste em `patient_events`
- **Recalcular** — reexecuta o motor com dados atuais

### Comportamento com Safety Block
Se `safety.block = true`:
- Cards B-F exibem: "Não calculado devido a bloqueio de segurança"
- CTAs disponíveis: "Revisar triagem", "Encaminhar para avaliação"

---

## 11. Exemplo de Output

Ver arquivo completo: [`docs/examples/regen_engine_outputs.sample.json`](./examples/regen_engine_outputs.sample.json)

```json
{
  "engine_version": "regen_engine_v1.0.0",
  "ruleset_version": "regen_rules_v1",
  "computed_at": "2025-01-15T14:32:45.123Z",
  "safety": { "block": false, "alert": false, "reasons": [] },
  "crs": { "score": 72, "classification": "Conditionally Ready", ... },
  "die": { "labs_valid_count": 4, "labs_expired_count": 1, ... },
  "brs": { "score": 65, "confidence": "Medium", "reason_codes": ["NSAID_RECENT_7D"], ... },
  "tog": { "guidance": [...] },
  "pee": { "eligibility": [...] },
  "data_quality": { "completeness_percent": 71, "alerts": [...] }
}
```

---

## 12. Checklist de Validação Manual (Pós-Login)

### Pré-requisitos
- [ ] Usuário autenticado
- [ ] Paciente de teste criado
- [ ] Triagem iniciada (wizard até step 7)

### Cenário 1: NORMAL (Resultado Calculado com Sucesso)

**Setup:**
1. Preencher wizard steps 0-7 com dados válidos
2. Não marcar contraindicações de segurança
3. Informar exames laboratoriais recentes (<90 dias)

**Execução:**
1. [ ] Navegar até Step 8 (Resultado REGENAPP)
2. [ ] Verificar empty state com CTA "Gerar Resultado"
3. [ ] Clicar em "Gerar Resultado"
4. [ ] Aguardar loading

**Expected Outputs (Asserts):**
```
✅ Card Safety: status "OK" (verde), sem reasons
✅ Card CRS: score numérico (0-100), classificação visível
✅ Card DIE: tabela com exames categorizados (USE/REPEAT/REQUEST)
✅ Card BRS: score numérico, reason_codes listados
✅ Card TOG: orientações categorizadas
✅ Card PEE: tabela de elegibilidade por procedimento
✅ Card Data Quality: percentual de completude
✅ Header: engine_version = "regen_engine_v1.0.0"
✅ Header: ruleset_version = "regen_rules_v1"
✅ Header: computed_at = timestamp recente
✅ Botões: "Recalcular", "Exportar PDF", "Copiar", "Salvar nota" visíveis
```

---

### Cenário 2: SAFETY BLOCK (Contraindicação Absoluta)

**Setup:**
1. Preencher wizard steps 0-7
2. No step de Safety, marcar: "Tratamento oncológico atual ou últimos 12 meses" = SIM
3. OU marcar qualquer outra contraindicação absoluta

**Execução:**
1. [ ] Navegar até Step 8
2. [ ] Clicar em "Gerar Resultado"

**Expected Outputs (Asserts):**
```
✅ Card Safety: status "BLOQUEADO" (vermelho)
✅ Card Safety: reasons[] contém mensagem de bloqueio
✅ Card CRS: exibe "Não calculado devido a bloqueio de segurança"
✅ Card DIE: exibe "Não calculado devido a bloqueio de segurança"
✅ Card BRS: exibe "Não calculado devido a bloqueio de segurança"
✅ Card TOG: exibe "Não calculado devido a bloqueio de segurança"
✅ Card PEE: exibe "Não calculado devido a bloqueio de segurança"
✅ Card Data Quality: alerta "Avaliação bloqueada por contraindicação de segurança"
✅ CTAs alternativos: "Revisar triagem" e/ou "Encaminhar para avaliação"
❌ NÃO deve mostrar scores numéricos em CRS/BRS
❌ NÃO deve mostrar elegibilidade em PEE
```

---

### Cenário 3: STALE (Resultado Desatualizado)

**Setup:**
1. Ter resultado já calculado (cenário 1 executado)
2. Voltar para steps anteriores (1-7)
3. Alterar algum dado (ex: adicionar medicação, alterar dor)
4. Salvar alteração (o campo `updated_at` deve ser atualizado)

**Execução:**
1. [ ] Navegar novamente até Step 8

**Expected Outputs (Asserts):**
```
✅ Banner amarelo/amber visível no topo
✅ Texto do banner: "Este resultado pode estar desatualizado"
✅ Botão "Recalcular" visível no banner OU na barra de ações
✅ Cards anteriores ainda visíveis (dados antigos)
✅ Header computed_at: timestamp ANTERIOR à alteração

Após clicar "Recalcular":
✅ Banner desaparece
✅ computed_at atualizado para timestamp recente
✅ Dados refletem alterações feitas
```

---

### Cenário 3b: STALE com Fallback

**Condição especial:** `canonicalUpdatedAt` não existe no payload

**Expected Outputs:**
```
✅ Sistema usa `prp_screenings.updated_at` como fallback
✅ Lógica de stale funciona mesmo sem canonicalUpdatedAt
```

---

### Validação de Persistência (DB)

**Após qualquer cenário com "Gerar Resultado":**

1. [ ] Consultar `prp_screenings` no banco
2. [ ] Verificar `questionnaire_responses.regen_engine_outputs`

**Asserts:**
```sql
-- Verificar estrutura
SELECT 
  questionnaire_responses->'regen_engine_outputs'->>'engine_version' as engine_v,
  questionnaire_responses->'regen_engine_outputs'->>'ruleset_version' as ruleset_v,
  questionnaire_responses->'regen_engine_outputs'->>'computed_at' as computed_at,
  questionnaire_responses->'regen_engine_outputs'->'safety'->>'block' as safety_block
FROM prp_screenings 
WHERE id = '<screening_id>';

-- Expected:
-- engine_v = "regen_engine_v1.0.0"
-- ruleset_v = "regen_rules_v1"
-- computed_at = ISO timestamp (não vazio, não null)
-- safety_block = "true" ou "false" (string)
```

---

### Validação de Merge (Não Sobrescreve Dados)

**Setup:**
1. Ter screening com dados existentes em `questionnaire_responses`
2. Gerar resultado

**Assert:**
```
✅ Campos existentes em questionnaire_responses preservados
✅ regen_canonical adicionado/atualizado
✅ regen_engine_outputs adicionado/atualizado
❌ Campos anteriores NÃO foram deletados
```

---

## 13. Changelog

### v1.0.0 (2025-01-01) - CONGELADO
- Implementação inicial completa
- 6 camadas operacionais
- Leitura exclusiva de regen_canonical
- 14 reason_codes definidos
- 3 testes críticos obrigatórios

### v1.0.0-ui (2025-01-15)
- Integração com wizard (Step 8 — Resultado REGENAPP)
- UI read-only com 7 cards fixos
- Stale warning com fallback para `prp_screenings.updated_at`
- Merge seguro no update (preserva dados existentes)
- Exportação PDF auditável
- Botão recalcular (não auto-recalcula)

---

**⚠️ AVISO: Este motor está CONGELADO. Qualquer alteração em regras clínicas requer nova versão (v1.1.0+) com documentação de mudanças.**
