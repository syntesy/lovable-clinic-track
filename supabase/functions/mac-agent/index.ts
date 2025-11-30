import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Campo 'message' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    const client = new OpenAI({
      apiKey: openAIApiKey,
    });

    // TODO: Substitua essa string pelo assistant_id real do Método MAC
    const assistantId = "<COLE_AQUI_O_ASSISTANT_ID_DO_METODO_MAC>";

    console.log("Criando thread para mensagem:", message);

    // Cria uma thread
    const thread = await client.beta.threads.create();
    console.log("Thread criada:", thread.id);

    // Adiciona a mensagem do usuário
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });
    console.log("Mensagem adicionada à thread");

    // Roda o assistente e espera terminar
    console.log("Executando assistant:", assistantId);
    let run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Polling até o run estar completo
    while (run.status === "queued" || run.status === "in_progress") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await client.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (run.status !== "completed") {
      throw new Error(`Assistant run falhou com status: ${run.status}`);
    }

    console.log("Assistant executado com sucesso");

    // Pega a resposta mais recente
    const messages = await client.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];
    
    let answer = "";
    if (lastMessage.content[0].type === "text") {
      answer = lastMessage.content[0].text.value;
    }

    console.log("Resposta obtida, tamanho:", answer.length);

    return new Response(
      JSON.stringify({ answer }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Erro na função mac-agent:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erro ao chamar o Agente MAC", 
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
