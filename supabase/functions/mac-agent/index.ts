import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import OpenAI from "https://esm.sh/openai@4.52.0";
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client to verify the JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting por usuário autenticado
    const rateLimitResult = checkRateLimit(`mac-agent:${user.id}`, {
      maxRequests: 20,  // 20 requisições por minuto para o agente
      windowMs: 60 * 1000,
    });
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetAt);
    }

    console.log("Authenticated user:", user.id);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const assistantId = Deno.env.get('ASSISTANT_ID');

    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!assistantId) {
      console.error("ASSISTANT_ID não configurado");
      return new Response(
        JSON.stringify({ error: "ASSISTANT_ID não configurado. Configure o ID do seu Assistant da OpenAI." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const { message, threadId: existingThreadId } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Campo 'message' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Mensagem recebida:", message);
    console.log("Thread existente:", existingThreadId || "nenhuma");

    // Create or use existing thread
    let threadId: string;
    if (existingThreadId) {
      threadId = existingThreadId;
      console.log("Usando thread existente:", threadId);
    } else {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      console.log("Nova thread criada:", threadId);
    }

    // Add user message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });
    console.log("Mensagem do usuário adicionada à thread");

    // Create run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
    console.log("Run criado:", run.id);

    // Poll for completion (max 30 seconds)
    const maxAttempts = 30;
    let attempts = 0;
    let runStatus = run.status;

    while (runStatus !== "completed" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
      runStatus = updatedRun.status;
      attempts++;
      console.log(`Polling run status: ${runStatus} (tentativa ${attempts})`);

      if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
        console.error("Run falhou com status:", runStatus);
        return new Response(
          JSON.stringify({ 
            error: `Run falhou com status: ${runStatus}`,
            details: updatedRun.last_error?.message || "Erro desconhecido"
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (runStatus !== "completed") {
      console.error("Timeout aguardando resposta do Assistant");
      return new Response(
        JSON.stringify({ error: "Timeout aguardando resposta do Assistant (30s)" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get messages from thread
    const messages = await openai.beta.threads.messages.list(threadId);
    console.log("Mensagens recuperadas:", messages.data.length);

    // Find the most recent assistant message
    const assistantMessage = messages.data.find((m) => m.role === "assistant");
    
    let reply = "Sem resposta do Assistant";
    if (assistantMessage && assistantMessage.content[0]?.type === "text") {
      reply = assistantMessage.content[0].text.value;
    }

    console.log("Resposta do Assistant obtida, tamanho:", reply.length);

    return new Response(
      JSON.stringify({ reply, threadId }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          ...getRateLimitHeaders(rateLimitResult),
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error("Erro na função mac-agent:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao chamar o Agente Fisioterapia Regenerativa",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
