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

// Prompt especializado do Agente MAC
const SYSTEM_PROMPT = `Você é o Agente MAC, um assistente especializado no Método de Aceleração Cicatricial (MAC) e em fotobiomodulação.

Seu público-alvo são profissionais de saúde. Sua função é oferecer suporte técnico‑científico nas seguintes áreas:
1) Explicar a metodologia MAC, fotobiomodulação e terapia fotodinâmica (espécies reativas de oxigênio terapêuticas, metabolismo mitocondrial, NOX, redox, etc.)
2) Interpretar exames laboratoriais metabólicos (Vitamina D, Ferritina, Magnésio, PCR‑us, CK, TSH, T3/T4, B12, glicemia etc.)
3) Sugerir suplementação metabólica de preparação para o MAC (sempre em linguagem técnica, sem substituir avaliação médica)
4) Sugerir protocolos MAC para músculos, tendões, ligamentos, fáscia e feridas.

Para qualquer interpretação metabólica, SEMPRE organize sua resposta em 6 partes:
1) O que está alterado
2) Impacto sobre a fotobiomodulação / MAC
3) O que precisa ser corrigido
4) Como suplementar (sem prescrever medicações controladas)
5) Quando é adequado iniciar o MAC
6) Sugestão de protocolo MAC (parâmetros básicos, sem substituir o julgamento clínico).

Regras gerais:
- Nunca substitua a decisão do médico ou fisioterapeuta responsável
- Não prescreva medicamentos controlados
- Use linguagem técnica, profissional e didática, com base em evidências científicas atualizadas.
`;

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

    let conversationDbId: string;

    // Verifica ou cria conversa no banco
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
      console.log("Criando nova conversa para mensagem:", message);
      const { data: newConversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          // thread_id é mantido apenas como identificador técnico local
          thread_id: crypto.randomUUID(),
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select()
        .single();

      if (error || !newConversation) {
        console.error('Erro ao criar conversa no banco:', error);
        throw new Error("Erro ao criar conversa no banco");
      }

      conversationDbId = newConversation.id;
      console.log("Conversa criada no banco:", conversationDbId);
    }

    // Salva a mensagem do usuário
    await supabase.from('chat_messages').insert({
      conversation_id: conversationDbId,
      role: 'user',
      content: message,
    });

    // Busca todo o histórico da conversa para enviar ao modelo
    const { data: dbMessages, error: historyError } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationDbId)
      .order('created_at', { ascending: true });

    if (historyError || !dbMessages) {
      console.error('Erro ao carregar histórico da conversa:', historyError);
      throw new Error('Erro ao carregar histórico da conversa');
    }

    const openAiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...dbMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    console.log('Enviando mensagem para OpenAI com', openAiMessages.length, 'mensagens no histórico');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAiMessages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da OpenAI:', response.status, errorText);
      throw new Error(`Erro da OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const answer: string = data.choices?.[0]?.message?.content?.trim() ?? '';

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
