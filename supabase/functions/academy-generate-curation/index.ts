import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um sistema de interpretação científica especializado em fisioterapia regenerativa e medicina ortobiológica.

REGRAS ABSOLUTAS:
1. NÃO prescreva conduta clínica.
2. NÃO extrapole além do que está no abstract/metadados fornecidos.
3. NÃO invente números, percentuais ou estatísticas.
4. NÃO preencha campos cujos dados não estão disponíveis — deixe vazio.
5. NÃO crie meta-análise nem calcule estatísticas novas.
6. NÃO recomende tratamentos diretamente.

INSTRUÇÕES DE ANÁLISE:
- Analise SOMENTE com base no título, abstract e metadados fornecidos.
- Se o abstract não menciona follow-up, deixe follow_up vazio e adicione warning.
- Se o estudo for animal/in vitro, adicione warning: "Estudo pré-clínico (animal/in vitro). Cautela na extrapolação para humanos."
- Se houver biomarcador sem desfecho clínico, adicione warning: "Biomarcador sem desfecho clínico direto."
- Se a população não for musculoesquelética, adicione warning: "População não musculoesquelética."
- Se o abstract estiver ausente ou limitado, adicione warning: "Abstract não disponível ou limitado. Curadoria baseada apenas no título e metadados."

NORMALIZAÇÃO DE TAGS:
- Traduza termos para português padronizado (ex: "knee osteoarthritis" → "Artrose de joelho")
- "platelet-rich plasma" → "PRP"
- Remova duplicatas e termos vagos
- Mantenha padrão único por conceito

Responda SEMPRE usando a função fornecida.`;

const AI_MODEL = "google/gemini-2.5-flash";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let paperId: string | null = null;
  let userId: string | null = null;
  let supabaseAuth: any = null;

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = claims.claims.sub as string;

    // Get paper
    const { paper_id } = await req.json();
    paperId = paper_id;
    if (!paper_id) {
      return new Response(JSON.stringify({ error: "paper_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: paper, error: fetchErr } = await supabaseAuth
      .from("academy_papers")
      .select("*")
      .eq("id", paper_id)
      .single();

    if (fetchErr || !paper) {
      return new Response(JSON.stringify({ error: "Paper não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to curating
    await supabaseAuth
      .from("academy_papers")
      .update({ curation_status: "curating" })
      .eq("id", paper_id);

    // Build prompt
    const userPrompt = `Analise o seguinte artigo e gere curadoria estruturada:

TÍTULO: ${paper.title}
${paper.authors ? `AUTORES: ${paper.authors}` : ""}
${paper.year ? `ANO: ${paper.year}` : ""}
${paper.journal ? `JOURNAL: ${paper.journal}` : ""}
${paper.abstract_text ? `ABSTRACT: ${paper.abstract_text}` : "ABSTRACT: Não disponível"}
${paper.mesh_terms?.length ? `MeSH TERMS: ${paper.mesh_terms.join(", ")}` : ""}
${paper.doi ? `DOI: ${paper.doi}` : ""}
${paper.pmid ? `PMID: ${paper.pmid}` : ""}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_paper_curation",
              description: "Gera curadoria estruturada de artigo científico no formato PICO",
              parameters: {
                type: "object",
                properties: {
                  study_type: { type: "string", description: "Tipo de estudo (ECR, Revisão Sistemática, Coorte, etc.)" },
                  population: { type: "string", description: "População estudada" },
                  intervention: { type: "string", description: "Intervenção principal" },
                  comparison: { type: "string", description: "Grupo comparador" },
                  outcomes_principais: { type: "string", description: "Desfechos principais" },
                  summary_short: { type: "string", description: "Resumo curto (2-3 frases)" },
                  summary_full_md: { type: "string", description: "Resumo completo em markdown" },
                  effect_direction: { type: "string", description: "Direção do efeito (positivo/neutro/negativo/inconclusivo)" },
                  limitations: { type: "array", items: { type: "string" }, description: "Limitações do estudo" },
                  follow_up: { type: "string", description: "Período de seguimento" },
                  level_inference: { type: "string", description: "Nível de evidência inferido (Ia, Ib, IIa, IIb, III, IV, V)" },
                  keywords_norm: { type: "array", items: { type: "string" }, description: "Palavras-chave normalizadas em PT-BR" },
                  interventions_norm: { type: "array", items: { type: "string" }, description: "Intervenções normalizadas em PT-BR" },
                  pathologies_norm: { type: "array", items: { type: "string" }, description: "Patologias normalizadas em PT-BR" },
                  warnings: { type: "array", items: { type: "string" }, description: "Avisos e limitações da curadoria" },
                },
                required: ["study_type", "summary_short", "warnings"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_paper_curation" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);

      if (status === 429) {
        // Revert status before returning
        await supabaseAuth.from("academy_papers").update({ curation_status: "draft" }).eq("id", paper_id);
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        await supabaseAuth.from("academy_papers").update({ curation_status: "draft" }).eq("id", paper_id);
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Erro na API de IA (status ${status})`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_paper_curation") {
      throw new Error("Resposta inesperada da IA");
    }

    const curationData = JSON.parse(toolCall.function.arguments);

    // Merge warnings from import + curation
    const allWarnings = [
      ...(paper.warnings || []),
      ...(curationData.warnings || []),
    ];

    // FIX: Update paper with curation + curated_at + generated_by_ai
    const { error: updateErr } = await supabaseAuth
      .from("academy_papers")
      .update({
        curation_status: "ready",
        curation_data: curationData,
        warnings: allWarnings,
        curated_by: userId,
        curated_at: new Date().toISOString(),
        generated_by_ai: true,
      })
      .eq("id", paper_id);

    if (updateErr) throw new Error(`Erro ao salvar curadoria: ${updateErr.message}`);

    // Log audit — FIX: use action='admin_curation' + model_used
    const duration_ms = Date.now() - startTime;
    await supabaseAuth.from("academy_ai_logs").insert({
      action: "admin_curation",
      paper_id,
      user_id: userId,
      input: { title: paper.title, has_abstract: !!paper.abstract_text, abstract_length: paper.abstract_text?.length || 0 },
      output: curationData,
      status: "success",
      duration_ms,
      model_used: AI_MODEL,
    });

    return new Response(JSON.stringify({ curation: curationData, warnings: allWarnings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Curation error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    // FIX: Use authenticated client for error recovery (not anon)
    if (supabaseAuth && paperId) {
      try {
        await supabaseAuth.from("academy_papers")
          .update({ curation_status: "draft" })
          .eq("id", paperId);
      } catch (revertErr) {
        console.error("Failed to revert status:", revertErr);
      }
    }

    if (supabaseAuth && userId) {
      try {
        await supabaseAuth.from("academy_ai_logs").insert({
          action: "admin_curation",
          paper_id: paperId,
          user_id: userId,
          input: { paper_id: paperId },
          status: "fail",
          error_message: message,
          duration_ms: Date.now() - startTime,
          model_used: AI_MODEL,
        });
      } catch (logErr) {
        console.error("Failed to log error:", logErr);
      }
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
