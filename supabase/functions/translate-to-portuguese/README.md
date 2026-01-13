# translate-to-portuguese

## Objetivo
Traduz textos científicos e médicos do inglês para português brasileiro, mantendo terminologia técnica adequada.

## Inputs

### Request Body (JSON)
```json
{
  "text": "Platelet-rich plasma (PRP) is an autologous blood product..."
}
```

## Outputs

### Response (JSON)
```json
{
  "translatedText": "O plasma rico em plaquetas (PRP) é um produto sanguíneo autólogo..."
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `LOVABLE_API_KEY` | Chave de API do Lovable AI Gateway (automática) |

## Modelo de IA

Utiliza `google/gemini-2.5-flash` via Lovable AI Gateway, configurado como tradutor especializado em textos científicos e médicos.

## Características

- Mantém terminologia técnica adequada
- Preserva siglas e acrônimos quando apropriado
- Adaptado para contexto de fisioterapia regenerativa
- Retorna apenas a tradução, sem explicações adicionais

## Tratamento de Erros

| Status | Descrição |
|--------|-----------|
| 400 | Texto não fornecido |
| 429 | Rate limit excedido |
| 402 | Créditos insuficientes |
| 500 | Erro interno |

## Exemplo de Payload

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The systematic review analyzed randomized controlled trials investigating the efficacy of PRP injections for knee osteoarthritis."
  }' \
  https://<project-ref>.supabase.co/functions/v1/translate-to-portuguese
```

### Resposta Esperada
```json
{
  "translatedText": "A revisão sistemática analisou ensaios clínicos randomizados controlados investigando a eficácia de injeções de PRP para osteoartrite de joelho."
}
```
