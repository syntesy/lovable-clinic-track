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

serve(async (req) => {
  // CORS preflight
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
    const client = new OpenAI({ apiKey: openAIApiKey });
    const assistantId = "asst_PrcAyGYeI0xIP0lxMXyy050";

    let conversationDbId: string;
    let threadId: string;

    // Verifica ou cria conversa no banco
    if (conversationId) {
      console.log("Buscando conversa existente:", conversationId);
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .select('id, user_id, thread_id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (error || !conversation) {
        throw new Error("Conversa não encontrada");
      }

      conversationDbId = conversation.id;
      threadId = conversation.thread_id;
    } else {
      console.log("Criando nova thread e conversa");
      // Cria thread no OpenAI
      const thread = await client.beta.threads.create();
      threadId = thread.id;

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
        console.error('Erro ao criar conversa no banco:', error);
        throw new Error("Erro ao criar conversa no banco");
      }

      conversationDbId = newConversation.id;
      console.log("Conversa e thread criadas:", conversationDbId, threadId);
    }

    // Salva a mensagem do usuário
    await supabase.from('chat_messages').insert({
      conversation_id: conversationDbId,
      role: 'user',
      content: message,
    });

    console.log('Adicionando mensagem à thread:', threadId);
    
    // Adiciona mensagem à thread
    await client.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    console.log('Executando assistant:', assistantId);

    // Executa o assistant
    const run = await client.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    console.log('Run criado:', run.id);

    // Polling para aguardar conclusão
    let runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
    let attempts = 0;
    const maxAttempts = 60; // 60 segundos máximo

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Run falhou com status: ${runStatus.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;
      console.log('Status do run:', runStatus.status, 'Tentativa:', attempts);
    }

    if (runStatus.status !== 'completed') {
      throw new Error('Timeout aguardando resposta do assistant');
    }

    console.log('Run completado, buscando resposta');

    // Busca a resposta final
    const msgs = await client.beta.threads.messages.list(threadId);
    const latestMessage = msgs.data[0];
    
    let answer = "Erro ao gerar resposta do MAC.";
    
    if (latestMessage && latestMessage.content && latestMessage.content.length > 0) {
      const content = latestMessage.content[0];
      if (content.type === 'text') {
        answer = content.text.value;
      }
    }

    console.log('Resposta obtida, tamanho:', answer.length);

    // Salva a resposta do assistente no banco
    await supabase.from('chat_messages').insert({
      conversation_id: conversationDbId,
      role: 'assistant',
      content: answer,
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
      },
    );
  } catch (error) {
    console.error("Erro na função mac-agent:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao chamar o Agente MAC",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
