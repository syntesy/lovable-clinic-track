# mac-agent

## Objetivo
Interface com o Agente Fisioterapia Regenerativa via OpenAI Assistants API, mantendo contexto de conversação via threads.

## Inputs

### Request Body (JSON)
```json
{
  "message": "Qual protocolo de laser para tendinopatia patelar?",
  "threadId": "thread_abc123"
}
```

### Campos
- **message:** (obrigatório) Mensagem do usuário
- **threadId:** (opcional) ID de thread existente para continuar conversa

## Outputs

### Response (JSON)
```json
{
  "reply": "Para tendinopatia patelar, recomendo o protocolo...",
  "threadId": "thread_abc123"
}
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `OPENAI_API_KEY` | Chave de API da OpenAI |
| `ASSISTANT_ID` | ID do Assistant configurado na OpenAI |

## Rate Limiting

- **Limite:** 20 requisições por minuto (por usuário)
- **Janela:** 60 segundos
- **Identificador:** ID do usuário autenticado

## Autenticação

- Requer token JWT válido no header `Authorization`
- Valida usuário via Supabase Auth

## Funcionamento

1. Recebe mensagem do usuário
2. Cria ou reutiliza thread da OpenAI
3. Adiciona mensagem à thread
4. Executa o Assistant
5. Aguarda conclusão (polling, max 30s)
6. Retorna resposta do Assistant

## Configuração do Assistant

O Assistant deve ser criado no painel da OpenAI com:
- Instruções específicas para fisioterapia regenerativa
- Knowledge base com protocolos e literatura
- Ferramentas conforme necessário

## Exemplo de Payload

```bash
# Nova conversa
curl -X POST \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Quais são os parâmetros de PBM para osteoartrite?"}' \
  https://<project-ref>.supabase.co/functions/v1/mac-agent

# Continuar conversa
curl -X POST \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "E para joelho especificamente?", "threadId": "thread_abc123"}' \
  https://<project-ref>.supabase.co/functions/v1/mac-agent
```
