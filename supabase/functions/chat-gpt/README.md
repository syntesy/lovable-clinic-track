# chat-gpt

## Objetivo
Fornece interface de chat com modelo GPT para assistência em terapias regenerativas e fotobiomodulação.

## Inputs

### Request Body (JSON)
```json
{
  "messages": [
    { "role": "user", "content": "Qual a dosimetria recomendada para laser vermelho?" }
  ]
}
```

### Formato das Mensagens
- **role:** `"user"` ou `"assistant"`
- **content:** Texto da mensagem

## Outputs

### Response (Streaming)
Retorna stream de eventos SSE (Server-Sent Events) com a resposta do assistente.

```
data: {"choices":[{"delta":{"content":"A dosimetria..."}}]}
data: {"choices":[{"delta":{"content":" recomendada..."}}]}
data: [DONE]
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `OPENAI_API_KEY` | Chave de API da OpenAI |

## Rate Limiting

- **Limite:** 30 requisições por minuto
- **Janela:** 60 segundos
- **Identificador:** Token de autorização ou IP do cliente

## System Prompt

O assistente está configurado como "Agente Fisioterapia Regenerativa", especializado em:
- Terapias regenerativas
- Fotobiomodulação
- Protocolos clínicos
- Dúvidas sobre tratamentos

## Exemplo de Payload

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Quais são os parâmetros de PBM para tendinopatia?"}
    ]
  }' \
  https://<project-ref>.supabase.co/functions/v1/chat-gpt
```
