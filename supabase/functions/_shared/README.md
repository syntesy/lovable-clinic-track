# _shared

## Objetivo
Módulos compartilhados entre as Edge Functions do projeto REGHEN.

## Arquivos

### rate-limiter.ts

Implementação de rate limiting em memória para Edge Functions.

#### Funções Exportadas

```typescript
// Verifica se requisição é permitida
checkRateLimit(identifier: string, config?: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// Configuração padrão
defaultConfig: {
  maxRequests: 60,    // 60 requisições
  windowMs: 60 * 1000 // por minuto
}

// Gera headers de rate limit para response
getRateLimitHeaders(result): Record<string, string>

// Cria response 429 formatada
createRateLimitResponse(resetAt: number): Response
```

#### Uso

```typescript
import { 
  checkRateLimit, 
  createRateLimitResponse, 
  getRateLimitHeaders 
} from "../_shared/rate-limiter.ts";

// Em uma Edge Function:
const identifier = authHeader || clientIP;
const result = checkRateLimit(identifier, {
  maxRequests: 30,
  windowMs: 60 * 1000
});

if (!result.allowed) {
  return createRateLimitResponse(result.resetAt);
}

// Na response de sucesso:
return new Response(body, {
  headers: {
    ...corsHeaders,
    ...getRateLimitHeaders(result),
    'Content-Type': 'application/json'
  }
});
```

## Notas

- Rate limiter usa armazenamento em memória (Map)
- Adequado para até ~500 usuários simultâneos
- Para escala maior, considerar Redis ou similar
- Limpeza automática de entradas expiradas (1% das requisições)
