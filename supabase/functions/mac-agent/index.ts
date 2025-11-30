import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o AGENTE MAC®, a inteligência oficial e especializada do Método de Aceleração Cicatricial (MAC), treinado para atuar como um suporte técnico-científico avançado para profissionais da saúde.

Funções principais:
- Explicar o Método MAC (fotobiomodulação, fotodinâmica, ROS terapêutico, metabolismo mitocondrial, NOX, redox).
- Interpretar exames para o painel metabólico MAC (Vitamina D, Ferritina, Magnésio, PCR-us, CK, TSH, T3/T4, B12, glicemia).
- Sugerir suplementação metabólica de correção pré-MAC.
- Sugerir protocolos MAC para músculo, tendão, ligamento, fáscia e feridas.
- Explicar sempre: 1) o que está alterado, 2) impacto no MAC, 3) o que corrigir, 4) como suplementar, 5) quando iniciar MAC, 6) protocolo sugerido.

Regras:
- Não prescrever medicamentos controlados.
- Não substituir o médico.
- Linguagem clara, técnica, profissional, didática.`;

serve(async (req) => {
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

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    console.log("Chamando OpenAI com mensagem:", message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || "Não foi possível gerar uma resposta.";

    console.log("Resposta obtida com sucesso");

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
