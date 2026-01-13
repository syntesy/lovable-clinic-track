# export-registry-research

## Objetivo
Exporta dados do Clinical Registry™ para pesquisa, com suporte a filtros, preview e criação de snapshots reproduzíveis.

## Inputs

### Request Body (JSON)
```json
{
  "action": "export" | "preview" | "snapshot",
  "filters": {
    "startMonth": "2024-01",
    "endMonth": "2024-12",
    "therapyItemCode": "AUTO_PRP",
    "procedureType": "PRP"
  },
  "exportLogId": "uuid",
  "snapshotTitle": "Título do snapshot"
}
```

### Ações
- **export:** Gera CSV com dados filtrados
- **preview:** Retorna contagens agregadas sem dados individuais
- **snapshot:** Cria snapshot imutável de um export anterior

## Outputs

### Response para `export` (CSV)
Headers incluídos:
- `X-Export-Hash`: Hash SHA-256 do conteúdo
- `X-Row-Count`: Número de linhas
- `X-Export-Log-Id`: ID do log para snapshot

### Response para `preview` (JSON)
```json
{
  "totalRows": 150,
  "byProcedureType": { "PRP": 100, "PRF": 50 },
  "byMonth": { "2024-01": 20, "2024-02": 25 },
  "byRegion": { "Joelho": 80, "Ombro": 70 }
}
```

### Response para `snapshot` (JSON)
```json
{
  "success": true,
  "snapshot": {
    "id": "uuid",
    "code": "SNAP-2024-001",
    "hash": "abc123...",
    "rowCount": 150
  }
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase (automática) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (automática) |

## Restrições de Acesso

- Requer autenticação válida
- Requer role `admin` ou `research`

## Tabelas Utilizadas

- `registry_research_export_v1` (VIEW)
- `registry_exports_log`
- `research_export_snapshots`

## Exemplo de Payload

```bash
# Preview
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "preview", "filters": {"startMonth": "2024-01"}}' \
  https://<project-ref>.supabase.co/functions/v1/export-registry-research

# Export CSV
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "export", "filters": {}}' \
  https://<project-ref>.supabase.co/functions/v1/export-registry-research
```
