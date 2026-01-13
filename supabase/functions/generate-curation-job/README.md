# generate-curation-job

## Objetivo
Gerencia jobs assíncronos de geração de curadoria científica, com extração de PDF e análise via IA.

## Inputs

### Request Body (JSON)

#### Iniciar novo job
```json
{
  "articleId": "uuid-do-artigo",
  "userId": "uuid-do-usuario"
}
```

#### Verificar status
```json
{
  "articleId": "uuid-do-artigo",
  "action": "get-status"
}
```

## Outputs

### Response ao iniciar job
```json
{
  "message": "Job iniciado com sucesso",
  "job": {
    "id": "job-uuid",
    "article_id": "article-uuid",
    "status": "queued",
    "progress": 0
  },
  "curation": {
    "id": "curation-uuid",
    "version": 1,
    "status": "em_producao"
  }
}
```

### Response de status
```json
{
  "job": {
    "id": "job-uuid",
    "status": "running",
    "progress": 60
  },
  "curation": {
    "id": "curation-uuid",
    "status": "em_producao"
  }
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase (automática) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (automática) |
| `LOVABLE_API_KEY` | Chave de API do Lovable AI Gateway (automática) |

## Fluxo do Job

1. **Queued (0%):** Job criado
2. **Running (5-10%):** Iniciando processamento
3. **PDF Extraction (10-25%):** Extraindo texto do PDF (se disponível)
4. **AI Analysis (30-60%):** Gerando curadoria via IA
5. **Validation (70-80%):** Validando e normalizando dados
6. **Saving (80-90%):** Salvando no banco
7. **Done (100%):** Concluído

## Status do Job

- `queued`: Aguardando processamento
- `running`: Em execução
- `done`: Concluído com sucesso
- `error`: Falhou (ver `error_message`)

## AI Coverage

- `high`: PDF completo disponível
- `medium`: Apenas abstract disponível
- `low`: Apenas metadados

## Tabelas Utilizadas

- `curadoria_articles`
- `curations`
- `curation_jobs`

## Exemplo de Payload

```bash
# Iniciar job
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"articleId": "abc-123", "userId": "user-456"}' \
  https://<project-ref>.supabase.co/functions/v1/generate-curation-job

# Verificar status
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"articleId": "abc-123", "action": "get-status"}' \
  https://<project-ref>.supabase.co/functions/v1/generate-curation-job
```
