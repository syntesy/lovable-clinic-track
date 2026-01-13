# auth-rate-limit

## Objetivo
Gerencia rate limiting para tentativas de login, protegendo contra ataques de força bruta.

## Inputs

### Request Body (JSON)
```json
{
  "action": "check" | "record-failure" | "record-success",
  "email": "usuario@email.com"
}
```

### Ações Disponíveis
- **check:** Verifica se o usuário pode tentar login
- **record-failure:** Registra uma tentativa de login falha
- **record-success:** Registra login bem-sucedido (reseta contador)

## Outputs

### Response para `check` e `record-failure`
```json
{
  "allowed": true,
  "remainingAttempts": 4,
  "lockoutEndsAt": null,
  "message": "OK"
}
```

### Response quando bloqueado
```json
{
  "allowed": false,
  "remainingAttempts": 0,
  "lockoutEndsAt": 1705171200000,
  "message": "Conta bloqueada temporariamente. Tente novamente em 30 minutos."
}
```

## Variáveis de Ambiente

Nenhuma variável externa necessária. Usa armazenamento em memória.

## Configurações

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `MAX_ATTEMPTS` | 5 | Máximo de tentativas antes do bloqueio |
| `WINDOW_MS` | 15 min | Janela de tempo para contagem |
| `LOCKOUT_MS` | 30 min | Duração do bloqueio |

## Exemplo de Payload

### Verificar antes do login
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"action": "check", "email": "user@example.com"}' \
  https://<project-ref>.supabase.co/functions/v1/auth-rate-limit
```

### Registrar falha
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"action": "record-failure", "email": "user@example.com"}' \
  https://<project-ref>.supabase.co/functions/v1/auth-rate-limit
```
