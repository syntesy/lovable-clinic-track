import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit store em memória
interface RateLimitEntry {
  attempts: number;
  lockUntil: number | null;
  firstAttempt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutos de bloqueio

function getClientIdentifier(req: Request): string {
  // Usar IP do cliente ou fallback para header
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

function checkLoginRateLimit(identifier: string): { 
  allowed: boolean; 
  remainingAttempts: number;
  lockoutEndsAt: number | null;
  message: string;
} {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  // Limpar entradas expiradas periodicamente
  if (Math.random() < 0.05) {
    for (const [key, e] of loginAttempts.entries()) {
      if (e.lockUntil && e.lockUntil < now) {
        loginAttempts.delete(key);
      } else if (now - e.firstAttempt > WINDOW_MS && !e.lockUntil) {
        loginAttempts.delete(key);
      }
    }
  }

  // Se não existe entrada, permitir
  if (!entry) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockoutEndsAt: null,
      message: "OK"
    };
  }

  // Verificar se está bloqueado
  if (entry.lockUntil) {
    if (now < entry.lockUntil) {
      const remainingSeconds = Math.ceil((entry.lockUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutEndsAt: entry.lockUntil,
        message: `Conta bloqueada temporariamente. Tente novamente em ${remainingMinutes} minutos.`
      };
    } else {
      // Bloqueio expirou, resetar
      loginAttempts.delete(identifier);
      return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS,
        lockoutEndsAt: null,
        message: "OK"
      };
    }
  }

  // Verificar janela de tempo
  if (now - entry.firstAttempt > WINDOW_MS) {
    // Janela expirou, resetar
    loginAttempts.delete(identifier);
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockoutEndsAt: null,
      message: "OK"
    };
  }

  // Verificar número de tentativas
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - entry.attempts);
  return {
    allowed: true,
    remainingAttempts,
    lockoutEndsAt: null,
    message: remainingAttempts <= 2 
      ? `Atenção: ${remainingAttempts} tentativa(s) restante(s) antes do bloqueio.`
      : "OK"
  };
}

function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry) {
    loginAttempts.set(identifier, {
      attempts: 1,
      lockUntil: null,
      firstAttempt: now
    });
    return;
  }

  entry.attempts++;
  
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockUntil = now + LOCKOUT_MS;
    console.log(`[SECURITY] IP ${identifier} bloqueado por ${LOCKOUT_MS / 1000 / 60} minutos após ${entry.attempts} tentativas falhas`);
  }
  
  loginAttempts.set(identifier, entry);
}

function recordSuccessfulLogin(identifier: string): void {
  // Limpar tentativas após login bem-sucedido
  loginAttempts.delete(identifier);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email } = await req.json();
    const clientIp = getClientIdentifier(req);
    
    // Usar combinação de IP + email para rate limiting mais preciso
    const identifier = email ? `${clientIp}:${email.toLowerCase()}` : clientIp;

    console.log(`[AUTH-RATE-LIMIT] Action: ${action}, IP: ${clientIp}, Email: ${email || 'N/A'}`);

    if (action === "check") {
      const result = checkLoginRateLimit(identifier);
      
      return new Response(
        JSON.stringify({
          allowed: result.allowed,
          remainingAttempts: result.remainingAttempts,
          lockoutEndsAt: result.lockoutEndsAt,
          message: result.message
        }),
        {
          status: result.allowed ? 200 : 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (action === "record-failure") {
      recordFailedAttempt(identifier);
      const result = checkLoginRateLimit(identifier);
      
      console.log(`[AUTH-RATE-LIMIT] Falha registrada para ${identifier}. Tentativas restantes: ${result.remainingAttempts}`);
      
      return new Response(
        JSON.stringify({
          recorded: true,
          remainingAttempts: result.remainingAttempts,
          lockoutEndsAt: result.lockoutEndsAt,
          message: result.message
        }),
        {
          status: result.allowed ? 200 : 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (action === "record-success") {
      recordSuccessfulLogin(identifier);
      console.log(`[AUTH-RATE-LIMIT] Login bem-sucedido para ${identifier}. Tentativas resetadas.`);
      
      return new Response(
        JSON.stringify({ recorded: true, message: "OK" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("[AUTH-RATE-LIMIT] Erro:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", allowed: true }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
