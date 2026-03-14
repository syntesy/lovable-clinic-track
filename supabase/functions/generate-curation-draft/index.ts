
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { article } = await req.json();
    
    if (!article) {
      return new Response(
        JSON.stringify({ error: "Article data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em análise crítica de literatura científica na área de fisioterapia regenerativa e medicina ortobiológica. 
Sua tarefa é analisar artigos científicos e gerar uma curadoria estruturada seguindo o formato PICO (População, Intervenção, Comparação, Outcomes).

IMPORTANTE: Gere conteúdo factual baseado apenas nas informações fornecidas. Se alguma informação não estiver disponível, indique "Informação não disponível no resumo".

Responda SEMPRE usando a função fornecida com os campos estruturados.`;

    const userPrompt = `Analise o seguinte artigo científico e gere uma curadoria estruturada:

TÍTULO: ${article.title}
AUTORES: ${article.authors}
ANO: ${article.year}
JOURNAL: ${article.journal}
ÁREA DE INTERESSE: ${article.interest}
${article.doi ? `DOI: ${article.doi}` : ''}
${article.practice_change ? `MUDANÇA NA PRÁTICA (prévia): ${article.practice_change}` : ''}

Gere uma curadoria estruturada completa para este artigo, focando na aplicabilidade clínica para profissionais de fisioterapia regenerativa.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_structured_curation",
              description: "Gera uma curadoria estruturada de artigo científico",
              parameters: {
                type: "object",
                properties: {
                  objective: { 
                    type: "string", 
                    description: "Objetivo principal do estudo" 
                  },
                  design: { 
                    type: "string", 
                    description: "Desenho do estudo (ECR, coorte, revisão sistemática, etc.)" 
                  },
                  population: { 
                    type: "string", 
                    description: "Descrição da população estudada" 
                  },
                  sample_size: { 
                    type: "string", 
                    description: "Tamanho da amostra" 
                  },
                  intervention: { 
                    type: "string", 
                    description: "Intervenção estudada" 
                  },
                  comparator: { 
                    type: "string", 
                    description: "Grupo controle ou comparador" 
                  },
                  outcomes_primary: { 
                    type: "string", 
                    description: "Desfechos primários avaliados" 
                  },
                  outcomes_secondary: { 
                    type: "string", 
                    description: "Desfechos secundários avaliados" 
                  },
                  results_key: { 
                    type: "string", 
                    description: "Principais achados do estudo (resumo conciso)" 
                  },
                  adverse_events: { 
                    type: "string", 
                    description: "Eventos adversos relatados" 
                  },
                  limitations: { 
                    type: "string", 
                    description: "Limitações do estudo" 
                  },
                  authors_conclusion: { 
                    type: "string", 
                    description: "Conclusão dos autores" 
                  },
                  evidence_level: { 
                    type: "string", 
                    enum: ["ia", "ib", "iia", "iib", "iii", "iv", "v"],
                    description: "Nível de evidência" 
                  },
                  bias_risk: { 
                    type: "string", 
                    enum: ["baixo", "moderado", "alto", "muito_alto", "incerto"],
                    description: "Risco de viés" 
                  },
                  applicability: { 
                    type: "string", 
                    enum: ["alta", "moderada", "baixa", "muito_baixa", "nao_aplicavel"],
                    description: "Aplicabilidade clínica" 
                  },
                  clinical_takeaways: { 
                    type: "array",
                    items: { type: "string" },
                    description: "3 pontos-chave para a prática clínica" 
                  },
                  what_changes_in_practice: { 
                    type: "string", 
                    description: "O que este estudo muda na prática clínica" 
                  }
                },
                required: ["objective", "results_key", "clinical_takeaways", "what_changes_in_practice"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_structured_curation" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao gerar curadoria");
    }

    const data = await response.json();
    
    // Extract the function call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_structured_curation") {
      throw new Error("Resposta inesperada da IA");
    }

    const curationData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ curation: curationData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating curation draft:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
