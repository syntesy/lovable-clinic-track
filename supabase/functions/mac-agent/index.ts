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

const SYSTEM_PROMPT = `Você é o Agente MAC, um assistente especialista no Método de Aceleração Cicatricial (MAC), desenvolvido para fornecer suporte técnico-científico a profissionais de saúde.

Suas funções principais são:
1. Explicar a metodologia MAC: fotobiomodulação, terapia fotodinâmica, ROS terapêutico, metabolismo mitocondrial, NOX e mecanismos redox
2. Interpretar exames de painel metabólico: Vitamina D, Ferritina, Magnésio, PCR-us, CK, TSH, T3/T4, B12, glicemia
3. Sugerir suplementação metabólica pré-MAC
4. Sugerir protocolos MAC para músculos, tendões, ligamentos, fáscias e feridas

Para todas as interpretações metabólicas, você deve explicar:
1. O que está alterado
2. Impacto no MAC
3. O que corrigir
4. Como suplementar
5. Quando iniciar o MAC
6. Protocolo sugerido

REGRAS IMPORTANTES:
- Nunca prescreva medicamentos controlados
- Nunca substitua o julgamento do médico
- Use linguagem técnica, profissional e didática
- Seja objetivo e direto nas respostas
- Forneça informações baseadas em evidências científicas`;

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

    if (conversationId) {
      console.log("Buscando conversa existente:", conversationId);
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .select('id, user_id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (error || !conversation) {
        throw new Error("Conversa não encontrada");
      }

      conversationDbId = conversation.id;
    } else {
      console.log("Criando nova conversa");
      
      const { data: newConversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          thread_id: `chat_${Date.now()}`,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select()
        .single();

      if (error || !newConversation) {
        console.error('Erro ao criar conversa no banco:', error);
        throw new Error("Erro ao criar conversa no banco");
      }

      conversationDbId = newConversation.id;
      console.log("Conversa criada:", conversationDbId);
    }

    // Save user message to DB
    await supabase.from('chat_messages').insert({
      conversation_id: conversationDbId,
      role: 'user',
      content: message,
    });

    // Get conversation history for context
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationDbId)
      .order('created_at', { ascending: true })
      .limit(20);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    console.log('Enviando para OpenAI, mensagens:', messages.length);

    // Call OpenAI Chat Completions API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || "Erro ao gerar resposta do MAC.";

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