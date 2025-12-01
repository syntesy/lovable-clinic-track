import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_BASE = 'https://api.openai.com/v1';
const ASSISTANT_ID = 'asst_PrcAyGYeI0xIP0lxMXyy050';

async function openaiRequest(endpoint: string, method: string, body?: any) {
  const response = await fetch(`${OPENAI_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', response.status, error);
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

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

    let conversationDbId: string;
    let threadId: string;

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
      
      // Create thread with v2 API
      const thread = await openaiRequest('/threads', 'POST', {});
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

    // Save user message to DB
    await supabase.from('chat_messages').insert({
      conversation_id: conversationDbId,
      role: 'user',
      content: message,
    });

    console.log('Adicionando mensagem à thread:', threadId);
    
    // Add message to thread with v2 API
    await openaiRequest(`/threads/${threadId}/messages`, 'POST', {
      role: "user",
      content: message,
    });

    console.log('Executando assistant:', ASSISTANT_ID);

    // Create run with v2 API
    const run = await openaiRequest(`/threads/${threadId}/runs`, 'POST', {
      assistant_id: ASSISTANT_ID,
    });

    console.log('Run criado:', run.id);

    // Poll for completion
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 60;

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        console.error('Run failed:', runStatus);
        throw new Error(`Run falhou com status: ${runStatus.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openaiRequest(`/threads/${threadId}/runs/${run.id}`, 'GET');
      attempts++;
      console.log('Status do run:', runStatus.status, 'Tentativa:', attempts);
    }

    if (runStatus.status !== 'completed') {
      throw new Error('Timeout aguardando resposta do assistant');
    }

    console.log('Run completado, buscando resposta');

    // Get messages with v2 API
    const msgs = await openaiRequest(`/threads/${threadId}/messages`, 'GET');
    const latestMessage = msgs.data[0];
    
    let answer = "Erro ao gerar resposta do MAC.";
    
    if (latestMessage && latestMessage.content && latestMessage.content.length > 0) {
      const content = latestMessage.content[0];
      if (content.type === 'text') {
        answer = content.text.value;
      }
    }

    console.log('Resposta obtida, tamanho:', answer.length);

    // Save assistant response
    await supabase.from('chat_messages').insert({
      conversation_id: conversationDbId,
      role: 'assistant',
      content: answer,
    });

    // Update conversation timestamp
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
