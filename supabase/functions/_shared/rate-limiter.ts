// Rate limiter em memória para edge functions
// Para 500 usuários, isso é suficiente. Para escala maior, usar Redis.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;     // Máximo de requisições
  windowMs: number;        // Janela de tempo em ms
}

export const defaultConfig: RateLimitConfig = {
  maxRequests: 60,         // 60 requisições
  windowMs: 60 * 1000,     // por minuto
};

export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = defaultConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  
  // Limpar entradas expiradas periodicamente
  if (Math.random() < 0.01) {
    cleanupExpired(now);
  }
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt <= now) {
    // Nova entrada ou expirada
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }
  
  // Verificar limite
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }
  
  // Incrementar contador
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

function cleanupExpired(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function getRateLimitHeaders(result: { remaining: number; resetAt: number }): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };
}

export function createRateLimitResponse(resetAt: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Limite de requisições excedido. Tente novamente em breve.',
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
      },
    }
  );
}
