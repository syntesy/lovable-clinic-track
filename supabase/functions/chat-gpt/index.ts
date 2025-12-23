import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders } from "../_shared/rate-limiter.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting baseado no IP ou token de auth
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const authHeader = req.headers.get('authorization') || '';
    const identifier = authHeader || clientIP;
    
    const rateLimitResult = checkRateLimit(identifier, {
      maxRequests: 30,  // 30 requisições por minuto para chat
      windowMs: 60 * 1000,
    });
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetAt);
    }

    const { messages } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é o Agente Fisioterapia Regenerativa, um assistente especializado em terapias regenerativas e fotobiomodulação. Você ajuda profissionais de saúde com informações sobre protocolos, tratamentos e dúvidas clínicas relacionadas à fisioterapia regenerativa. Responda de forma profissional, clara e baseada em evidências científicas.' 
          },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        ...getRateLimitHeaders(rateLimitResult),
        'Content-Type': 'text/event-stream',
      },
    });
  } catch (error) {
    console.error('Error in chat-gpt function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
