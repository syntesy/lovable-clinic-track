import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASSISTANT_ID = "asst_PrcAyGYeI0xIP0lxMXyy050";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, userId } = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: "Campos 'message' e 'userId' são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const client = new OpenAI({ 
      apiKey: openAIApiKey,
      defaultHeaders: {
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    let threadId: string;
    let conversationDbId: string;

    // Se já existe uma conversa, busca o thread_id
    if (conversationId) {
      console.log("Buscando conversa existente:", conversationId);
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .select('id, thread_id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (error || !conversation) {
        throw new Error("Conversa não encontrada");
      }

      threadId = conversation.thread_id;
      conversationDbId = conversation.id;
      console.log("Usando thread existente:", threadId);
    } else {
      // Cria uma nova thread e conversa
      console.log("Criando nova thread para mensagem:", message);
      const thread = await client.beta.threads.create();
      threadId = thread.id;
      console.log("Thread criada:", threadId);

      // Salva a nova conversa no banco
      const { data: newConversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          thread_id: threadId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select()
        .single();

      if (error || !newConversation) {
        throw new Error("Erro ao criar conversa no banco");
      }

      conversationDbId = newConversation.id;
      console.log("Conversa criada no banco:", conversationDbId);
    }

    // Salva a mensagem do usuário no banco
    await supabase.from('chat_messages').insert({
      conversation_id: conversationDbId,
      role: 'user',
      content: message
    });

    // Adiciona a mensagem do usuário à thread da OpenAI
    await client.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });
    console.log("Mensagem adicionada à thread");

    // Roda o assistente e espera terminar
    console.log("Executando Assistant MÉTODO MAC:", ASSISTANT_ID);
    let run = await client.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });

    // Polling até o run estar completo
    while (run.status === "queued" || run.status === "in_progress") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await client.beta.threads.runs.retrieve(threadId, run.id);
    }

    if (run.status !== "completed") {
      console.error("Assistant run falhou com status:", run.status);
      throw new Error(`Assistant run falhou com status: ${run.status}`);
    }

    console.log("Assistant executado com sucesso");

    // Pega a resposta mais recente
    const messages = await client.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];
    
    let answer = "";
    if (lastMessage.content[0].type === "text") {
      answer = lastMessage.content[0].text.value;
    }

    console.log("Resposta obtida, tamanho:", answer.length);

    // Salva a resposta do assistant no banco
    await supabase.from('chat_messages').insert({
      conversation_id: conversationDbId,
      role: 'assistant',
      content: answer
    });

    // Atualiza o timestamp da conversa
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationDbId);

    return new Response(
      JSON.stringify({ answer, conversationId: conversationDbId }),
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
