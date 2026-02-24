import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um sistema de interpretação científica especializado em fisioterapia regenerativa e medicina ortobiológica.
Aplique o Reghen Evidence Method™ com 7 camadas obrigatórias.

REGRAS ABSOLUTAS:
1. NÃO prescreva conduta clínica.
2. NÃO extrapole além do que está no abstract/metadados fornecidos.
3. NÃO invente números, percentuais ou estatísticas.
4. NÃO preencha campos cujos dados não estão disponíveis — use null.
5. NÃO crie meta-análise nem calcule estatísticas novas.
6. NÃO recomende tratamentos diretamente.
7. Biomarcadores NUNCA entram em outcomes.clinical — use outcomes.biological.
8. Se informação não estiver no abstract → usar null.
9. Não inferir follow_up se não mencionado explicitamente.
10. is_human deve ser false se detectar animal/in vitro.

NORMALIZAÇÃO DE TAGS:
- Traduza termos para português padronizado (ex: "knee osteoarthritis" → "Artrose de joelho")
- "platelet-rich plasma" → "PRP"
- Remova duplicatas e termos vagos
- Mantenha padrão único por conceito

Responda SEMPRE usando a função fornecida.`;

const AI_MODEL = "google/gemini-2.5-flash";

// Compute evidence score from structured layers
function computeScoreFromLayers(layers: any): { score: number; breakdown: any } {
  const l2 = layers.layer_2_methodology || {};
  const l3 = layers.layer_3_reliability || {};
  const l5 = layers.layer_5_limitations || [];

  // Base score from study type
  const studyType = (l2.study_type || "other").toLowerCase();
  let baseScore = 50;
  const scoreMap: Record<string, number> = {
    meta: 90, systematic_review: 85, rct: 80, cohort: 65,
    case_control: 55, case_series: 40, animal: 25, in_vitro: 15, other: 50,
  };
  for (const [key, val] of Object.entries(scoreMap)) {
    if (studyType.includes(key)) { baseScore = val; break; }
  }

  // Reliability bonuses
  let reliabilityWeight = 0;
  if (l3.randomized === true) reliabilityWeight += 5;
  if (l3.control_group === true) reliabilityWeight += 5;
  if (l3.blinded === true) reliabilityWeight += 3;

  // Follow-up bonus
  let followUpWeight = 0;
  const fuMonths = l2.follow_up_months;
  if (typeof fuMonths === "number") {
    if (fuMonths >= 24) followUpWeight = 8;
    else if (fuMonths >= 12) followUpWeight = 5;
    else if (fuMonths >= 6) followUpWeight = 3;
  }

  // Limitation penalty
  let limitationPenalty = 0;
  if (Array.isArray(l5)) {
    const methodological = l5.filter((l: any) => l.category === "methodological").length;
    limitationPenalty = Math.min(methodological * 5, 15);
  }

  // Non-human penalty
  if (l2.is_human === false) {
    baseScore = Math.min(baseScore, 25);
  }

  const finalScore = Math.max(0, Math.min(100, baseScore + reliabilityWeight + followUpWeight - limitationPenalty));

  return {
    score: finalScore,
    breakdown: {
      methodology_weight: baseScore,
      reliability_weight: reliabilityWeight,
      follow_up_weight: followUpWeight,
      limitation_penalty: limitationPenalty,
      final_score: finalScore,
    },
  };
}

// Validate all 7 layers are present
function validateLayers(layers: any): string[] {
  const missing: string[] = [];
  const required = [
    "layer_1_structure", "layer_2_methodology", "layer_3_reliability",
    "layer_4_applicability", "layer_5_limitations", "layer_6_consistency",
    "layer_7_educational",
  ];
  for (const key of required) {
    if (layers[key] === undefined || layers[key] === null) missing.push(key);
  }
  return missing;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let paperId: string | null = null;
  let userId: string | null = null;
  let supabaseAuth: any = null;

  try {
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

    await supabaseAuth
      .from("academy_papers")
      .update({ curation_status: "curating" })
      .eq("id", paper_id);

    const userPrompt = `Analise o seguinte artigo e gere curadoria estruturada usando o Reghen Evidence Method™ com 7 camadas:

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
              description: "Gera curadoria estruturada usando Reghen Evidence Method™ com 7 camadas obrigatórias",
              parameters: {
                type: "object",
                properties: {
                  // Legacy fields (kept for backward compatibility)
                  study_type: { type: "string", description: "Tipo de estudo (ECR, Revisão Sistemática, Coorte, etc.)" },
                  population: { type: "string", description: "População estudada" },
                  intervention: { type: "string", description: "Intervenção principal" },
                  comparison: { type: "string", description: "Grupo comparador" },
                  outcomes_principais: { type: "string", description: "Desfechos principais" },
                  summary_short: { type: "string", description: "Resumo curto (2-3 frases)" },
                  summary_full_md: { type: "string", description: "Resumo completo em markdown" },
                  effect_direction: { type: "string", description: "Direção do efeito (positivo/neutro/negativo/inconclusivo)" },
                  limitations: { type: "array", items: { type: "string" }, description: "Limitações do estudo (texto livre)" },
                  follow_up: { type: "string", description: "Período de seguimento" },
                  level_inference: { type: "string", description: "Nível de evidência inferido" },
                  keywords_norm: { type: "array", items: { type: "string" } },
                  interventions_norm: { type: "array", items: { type: "string" } },
                  pathologies_norm: { type: "array", items: { type: "string" } },
                  warnings: { type: "array", items: { type: "string" } },

                  // Reghen Evidence Method™ 7 layers
                  layer_1_structure: {
                    type: "object",
                    description: "Camada 1 — Estrutura Clínica (PICO estendido)",
                    properties: {
                      population: { type: ["string", "null"] },
                      intervention: { type: ["string", "null"] },
                      comparison: { type: ["string", "null"] },
                      outcomes: {
                        type: "object",
                        properties: {
                          clinical: { type: "array", items: { type: "string" }, description: "Desfechos clínicos (dor, função, etc.)" },
                          functional: { type: "array", items: { type: "string" }, description: "Desfechos funcionais (ADM, força, etc.)" },
                          biological: { type: "array", items: { type: "string" }, description: "Biomarcadores (IL-6, VEGF, etc.)" },
                        },
                      },
                    },
                  },
                  layer_2_methodology: {
                    type: "object",
                    description: "Camada 2 — Metodologia",
                    properties: {
                      study_type: { type: "string", enum: ["meta", "systematic_review", "rct", "cohort", "case_control", "case_series", "animal", "in_vitro", "other"] },
                      is_human: { type: ["boolean", "null"] },
                      follow_up_months: { type: ["number", "null"] },
                      sample_size: { type: ["number", "null"] },
                    },
                  },
                  layer_3_reliability: {
                    type: "object",
                    description: "Camada 3 — Confiabilidade",
                    properties: {
                      randomized: { type: ["boolean", "null"] },
                      control_group: { type: ["boolean", "null"] },
                      blinded: { type: ["boolean", "null"] },
                      follow_up_adequate: { type: ["boolean", "null"] },
                      methodology_clarity: { type: ["string", "null"], enum: ["high", "moderate", "low", "unclear", null] },
                    },
                  },
                  layer_4_applicability: {
                    type: "object",
                    description: "Camada 4 — Aplicabilidade Clínica",
                    properties: {
                      classification: { type: ["string", "null"], enum: ["high", "moderate", "limited", "experimental", null] },
                      justification: { type: ["string", "null"] },
                    },
                  },
                  layer_5_limitations: {
                    type: "array",
                    description: "Camada 5 — Limitações Estruturadas",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["methodological", "statistical", "sample", "follow_up", "generalization", "surrogate"] },
                        description: { type: "string" },
                      },
                      required: ["category", "description"],
                    },
                  },
                  layer_6_consistency: {
                    type: "object",
                    description: "Camada 6 — Consistência com Literatura",
                    properties: {
                      classification: { type: ["string", "null"], enum: ["confirmatory", "complementary", "divergent", "isolated", null] },
                      notes: { type: ["string", "null"] },
                    },
                  },
                  layer_7_educational: {
                    type: "object",
                    description: "Camada 7 — Aplicação Educacional",
                    properties: {
                      didactic_summary: { type: ["string", "null"] },
                      guided_reading: { type: ["string", "null"] },
                      trail_level: { type: ["string", "null"], enum: ["meta", "rct", "observational", null] },
                    },
                  },
                },
                required: ["study_type", "summary_short", "warnings", "layer_1_structure", "layer_2_methodology", "layer_3_reliability", "layer_4_applicability", "layer_5_limitations", "layer_6_consistency", "layer_7_educational"],
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

    // Build reghen_evidence_method structure
    const layers = {
      layer_1_structure: curationData.layer_1_structure || null,
      layer_2_methodology: curationData.layer_2_methodology || null,
      layer_3_reliability: curationData.layer_3_reliability || null,
      layer_4_applicability: curationData.layer_4_applicability || null,
      layer_5_limitations: curationData.layer_5_limitations || null,
      layer_6_consistency: curationData.layer_6_consistency || null,
      layer_7_educational: curationData.layer_7_educational || null,
    };

    // Validate layers
    const missingLayers = validateLayers(layers);
    const layerWarnings: string[] = [];
    if (missingLayers.length > 0) {
      layerWarnings.push(`Camadas ausentes no Reghen Evidence Method™: ${missingLayers.join(", ")}`);
    }

    // Compute score from layers
    const { score, breakdown } = computeScoreFromLayers(layers);

    // Determine evidence label
    const l2StudyType = layers.layer_2_methodology?.study_type || "other";
    const labelMap: Record<string, string> = {
      meta: "Meta-análise", systematic_review: "Revisão Sistemática", rct: "ECR",
      cohort: "Coorte", case_control: "Caso-Controle", case_series: "Série de Casos",
      animal: "Pré-clínico (animal)", in_vitro: "Pré-clínico (in vitro)", other: "Outro",
    };
    const evidenceLabel = labelMap[l2StudyType] || labelMap.other;

    // Build final curation_data (preserving legacy fields + adding method structure)
    const finalCurationData = {
      // Legacy fields
      study_type: curationData.study_type,
      population: curationData.population,
      intervention: curationData.intervention,
      comparison: curationData.comparison,
      outcomes_principais: curationData.outcomes_principais,
      summary_short: curationData.summary_short,
      summary_full_md: curationData.summary_full_md,
      effect_direction: curationData.effect_direction,
      limitations: curationData.limitations,
      follow_up: curationData.follow_up,
      level_inference: curationData.level_inference,
      keywords_norm: curationData.keywords_norm,
      interventions_norm: curationData.interventions_norm,
      pathologies_norm: curationData.pathologies_norm,
      warnings: curationData.warnings,

      // Reghen Evidence Method™
      reghen_evidence_method: {
        version: "1.0",
        layers,
      },
    };

    // Merge warnings
    const allWarnings = [
      ...(paper.warnings || []),
      ...(curationData.warnings || []),
      ...layerWarnings,
    ];

    // Determine new status — block "ready" if layers are missing
    const newStatus = missingLayers.length > 0 ? "draft" : "ready";

    const { error: updateErr } = await supabaseAuth
      .from("academy_papers")
      .update({
        curation_status: newStatus,
        curation_data: finalCurationData,
        warnings: allWarnings,
        curated_by: userId,
        curated_at: new Date().toISOString(),
        generated_by_ai: true,
        evidence_score: score,
        evidence_label: evidenceLabel,
        evidence_score_breakdown: breakdown,
      })
      .eq("id", paper_id);

    if (updateErr) throw new Error(`Erro ao salvar curadoria: ${updateErr.message}`);

    const duration_ms = Date.now() - startTime;
    await supabaseAuth.from("academy_ai_logs").insert({
      action: "admin_curation",
      paper_id,
      user_id: userId,
      input: { title: paper.title, has_abstract: !!paper.abstract_text, abstract_length: paper.abstract_text?.length || 0 },
      output: { ...finalCurationData, evidence_score: score, evidence_score_breakdown: breakdown, missing_layers: missingLayers },
      status: "success",
      duration_ms,
      model_used: AI_MODEL,
    });

    return new Response(JSON.stringify({ curation: finalCurationData, warnings: allWarnings, evidence_score: score, evidence_score_breakdown: breakdown }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Curation error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

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
