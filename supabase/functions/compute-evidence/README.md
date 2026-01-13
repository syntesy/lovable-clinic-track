# compute-evidence

## Objetivo
Computa estatísticas agregadas do Clinical Registry™ para o Evidence Engine™, gerando snapshots de evidência por dimensão (patologia + técnica + região).

## Inputs

### Request
Requisição POST autenticada com role `admin`.

```bash
POST /functions/v1/compute-evidence
Authorization: Bearer <jwt-token>
```

Não requer body - processa todos os dados elegíveis automaticamente.

## Outputs

### Response (JSON)
```json
{
  "success": true,
  "dimensionsProcessed": 15,
  "snapshotsCreated": 30,
  "computedAt": "2025-01-13T10:00:00.000Z"
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase (automática) |
| `SUPABASE_ANON_KEY` | Chave anônima (automática) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço para operações admin (automática) |

## Lógica de Negócio

### K-Anonimato
- **Threshold:** K_MIN = 10 casos
- Métricas de dor só são calculadas se n_cases >= 10

### Time Windows
- `all_time`: Todos os casos
- `last_12_months`: Últimos 12 meses

### Métricas Calculadas
- `n_cases_total`: Total de casos
- `n_with_followup_30/90/180/365`: Casos com follow-up em cada timepoint
- `pain_baseline_mean/median`: Média/mediana de dor inicial
- `pain_followup_90_mean/median`: Média/mediana de dor em D90
- `pct_improved_90`: % de casos com melhora >= 2 pontos em D90

### Audit Log
Todas as operações são registradas em `evidence_audit_log`.

## Restrições de Acesso

- Requer autenticação válida
- Requer role `admin`
- READ-ONLY no registry, APPEND-ONLY em evidence_*

## Exemplo de Uso

```bash
curl -X POST \
  -H "Authorization: Bearer <admin-jwt-token>" \
  https://<project-ref>.supabase.co/functions/v1/compute-evidence
```
