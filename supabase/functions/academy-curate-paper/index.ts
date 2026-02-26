import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_MODEL = "google/gemini-2.5-flash";
const MAX_CONTEXT_CHARS = 80_000;
const MIN_CHUNKS_FOR_CURATION = 5;

const CURATION_SCHEMA = {
  type: "object",
  properties: {
    tipo_estudo: { type: "string" },
    nivel_evidencia: { type: "string" },
    ano_publicacao: { type: "string" },
    tamanho_amostra_total: { type: "number" },
    intervencao: { type: "string" },
    comparador: { type: "string" },
    desfechos_primarios: { type: "array", items: { type: "string" } },
    desfechos_secundarios: { type: "array", items: { type: "string" } },
    follow_up_medio: { type: "string" },
    resultados_principais: { type: "string" },
    significancia_estatistica: { type: "string" },
    eventos_adversos: { type: "string" },
    risco_vies: { type: "string", enum: ["baixo", "moderado", "alto"] },
    justificativa_risco_vies: { type: "string" },
    score_metodologico: { type: "integer", minimum: 0, maximum: 10 },
    aplicabilidade_clinica: { type: "string" },
    conclusao_pratica: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    outcomes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          domain: { type: "string" },
          name: { type: "string" },
          direction: { type: "string" },
          timeframe: { type: "string" },
        },
        required: ["domain", "name", "direction", "timeframe"],
      },
    },
  },
  required: [
    "tipo_estudo", "nivel_evidencia", "ano_publicacao", "tamanho_amostra_total",
    "intervencao", "comparador", "desfechos_primarios", "desfechos_secundarios",
    "follow_up_medio", "resultados_principais", "significancia_estatistica",
    "eventos_adversos", "risco_vies", "justificativa_risco_vies",
    "score_metodologico", "aplicabilidade_clinica", "conclusao_pratica", "tags", "outcomes",
  ],
};

const SYSTEM_PROMPT = `Você é um curador científico especialista em fisioterapia regenerativa e medicina ortobiológica.

Analise o artigo científico fornecido e produza uma curadoria estruturada.

REGRAS:
1. NÃO invente dados. Se não encontrar no texto, use "" para strings, 0 para números, [] para arrays.
2. nivel_evidencia deve seguir Oxford Levels (Ia, Ib, IIa, IIb, III, IV, V).
3. risco_vies deve ser: baixo, moderado ou alto.
4. score_metodologico é inteiro de 0 a 10.
5. tags: termos normalizados em português (ex: ["PRP", "Tendinopatia", "ECR"]).
6. outcomes: OBRIGATÓRIO pelo menos 1 outcome com { domain, name, direction, timeframe }.
   - domain: "clinical", "functional", "imaging", "biological", "safety"
   - direction: "favorable", "neutral", "unfavorable", "unknown"
   - Se não identificar outcomes claros, use [{domain:"clinical", name:"Não identificado", direction:"unknown", timeframe:"unknown"}]
7. Seja objetivo e factual.

Responda APENAS usando a função fornecida.`;

function generateRequestId(): string {
  return `req_cur_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

type PaperTemplate = "CLINICAL_COMPARATIVE" | "REVIEW_CONSENSUS" | "TRANSLATIONAL_PRECLINICAL" | "OTHER";

function resolvePaperTemplateServer(curationJson: any): PaperTemplate {
  const studyType = (curationJson?.tipo_estudo || "").toLowerCase();
  const comparador = (curationJson?.comparador || "").trim();
  const sampleSize = Number(curationJson?.tamanho_amostra_total) || 0;
  const outcomes = Array.isArray(curationJson?.outcomes) ? curationJson.outcomes : [];
  const hasStructuredOutcomes = outcomes.some(
    (o: any) => o?.name && o.name !== "Não identificado" && o?.direction && o.direction !== "unknown"
  );

  // 1) REVIEW_CONSENSUS (check first — reviews may mention trials in text)
  const reviewPatterns = ["systematic review", "meta-analysis", "guideline", "consensus", "position statement",
    "revisão sistemática", "meta-análise", "diretriz", "consenso"];
  if (reviewPatterns.some((p) => studyType.includes(p))) {
    return "REVIEW_CONSENSUS";
  }

  // 2) CLINICAL_COMPARATIVE
  const clinicalPatterns = ["randomized", "randomised", "trial", "cohort", "case-control",
    "ensaio", "coorte", "caso-controle", "rct", "ecr"];
  const isClinicalType = clinicalPatterns.some((p) => studyType.includes(p));
  const hasComparator = comparador.length > 0 && comparador.toLowerCase() !== "nenhum" && comparador.toLowerCase() !== "none";
  if (isClinicalType && sampleSize > 0 && hasComparator && hasStructuredOutcomes) {
    return "CLINICAL_COMPARATIVE";
  }

  // 3) TRANSLATIONAL_PRECLINICAL
  const preclinicalPatterns = ["in vitro", "animal", "cells", "mechanism", "preclinical",
    "pré-clínico", "células", "mecanismo", "translacional"];
  if (preclinicalPatterns.some((p) => studyType.includes(p)) || (!hasComparator && !hasStructuredOutcomes)) {
    return "TRANSLATIONAL_PRECLINICAL";
  }

  // 4) OTHER fallback
  return "OTHER";
}

function validateCurationJson(data: any): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const required = CURATION_SCHEMA.required;

  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      if (field === "outcomes") {
        warnings.push("outcomes ausente — será preenchido com fallback");
      } else {
        errors.push(`Campo obrigatório ausente: ${field}`);
      }
    }
  }

  if (typeof data.score_metodologico === "number") {
    if (data.score_metodologico < 0 || data.score_metodologico > 10 || !Number.isInteger(data.score_metodologico)) {
      errors.push("score_metodologico deve ser inteiro entre 0 e 10");
    }
  }

  if (data.risco_vies && !["baixo", "moderado", "alto"].includes(data.risco_vies)) {
    errors.push("risco_vies deve ser: baixo, moderado ou alto");
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push("tags deve ser um array");
  }

  if (data.desfechos_primarios && !Array.isArray(data.desfechos_primarios)) {
    errors.push("desfechos_primarios deve ser um array");
  }

  if (data.outcomes && !Array.isArray(data.outcomes)) {
    warnings.push("outcomes não é um array — será convertido");
  }

  return { valid: errors.length === 0, errors, warnings };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const startTime = Date.now();
  let paperId: string | null = null;
  let userId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", request_id: requestId }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract user from auth (for logging)
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    userId = user?.id || null;

    const body = await req.json();
    paperId = body.paper_id;
    const force = body.force === true;
    const incomingRequestId = body.request_id || requestId;

    if (!paperId) {
      return new Response(JSON.stringify({ error: "paper_id é obrigatório", request_id: incomingRequestId }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════
    // PRE-CONDITIONS CHECK
    // ═══════════════════════════════════════════
    
    // Check file processing status
    const { data: fileData } = await supabaseService
      .from("academy_paper_files")
      .select("id, processing_status, processing_error")
      .eq("paper_id", paperId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fileData && fileData.processing_status !== "processed") {
      console.log(`[curate:skip] Paper ${paperId} file not processed yet (status: ${fileData.processing_status})`);
      return new Response(JSON.stringify({
        error: `PDF ainda não foi processado (status: ${fileData.processing_status}). Processe o PDF primeiro.`,
        processing_status: fileData.processing_status,
        processing_error: fileData.processing_error,
        request_id: incomingRequestId,
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check fulltext sufficiency
    const { data: fulltextData } = await supabaseService
      .from("academy_paper_fulltext")
      .select("has_sufficient_text, char_count, word_count, chunk_count")
      .eq("paper_id", paperId)
      .maybeSingle();

    if (!fulltextData) {
      return new Response(JSON.stringify({
        error: "Texto completo não encontrado. Processe o PDF primeiro.",
        request_id: incomingRequestId,
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fulltextData.has_sufficient_text) {
      console.log(`[curate:skip] Paper ${paperId} has insufficient text (chars=${fulltextData.char_count} words=${fulltextData.word_count} chunks=${fulltextData.chunk_count})`);
      return new Response(JSON.stringify({
        error: `Texto insuficiente para curadoria (${fulltextData.char_count} chars, ${fulltextData.word_count} words, ${fulltextData.chunk_count} chunks). PDF pode ser escaneado.`,
        request_id: incomingRequestId,
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((fulltextData.chunk_count || 0) < MIN_CHUNKS_FOR_CURATION) {
      return new Response(JSON.stringify({
        error: `Chunks insuficientes para curadoria (${fulltextData.chunk_count} < ${MIN_CHUNKS_FOR_CURATION}).`,
        request_id: incomingRequestId,
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: check if curation already exists
    const { data: existing } = await supabaseService
      .from("academy_paper_curation")
      .select("id")
      .eq("paper_id", paperId)
      .maybeSingle();

    if (existing && !force) {
      console.log(`[curate:skip] Paper ${paperId} already curated (use force=true to re-curate).`);
      return new Response(JSON.stringify({
        message: "Curadoria já existente para este paper.",
        curation_id: existing.id,
        request_id: incomingRequestId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If force mode, delete existing curation
    if (existing && force) {
      console.log(`[curate:force] Deleting existing curation for paper ${paperId}`);
      await supabaseService.from("academy_paper_curation").delete().eq("paper_id", paperId);
    }

    // Set curation_status to curating
    await supabaseService
      .from("academy_papers")
      .update({ curation_status: "curating" })
      .eq("id", paperId);

    // Fetch paper metadata
    const { data: paper, error: paperErr } = await supabaseService
      .from("academy_papers")
      .select("title, authors, year, journal, abstract_text, doi, pmid")
      .eq("id", paperId)
      .single();

    if (paperErr || !paper) {
      throw new Error("Paper não encontrado");
    }

    // Fetch chunks
    const { data: chunks, error: chunksErr } = await supabaseService
      .from("academy_chunks")
      .select("content, chunk_index")
      .eq("paper_id", paperId)
      .order("chunk_index", { ascending: true });

    if (chunksErr) {
      throw new Error(`Erro ao buscar chunks: ${chunksErr.message}`);
    }

    const chunksUsed = chunks?.length || 0;
    console.log(`[curate:context] paperId=${paperId} chunks=${chunksUsed} title="${paper.title?.slice(0, 80)}"`);

    // Consolidate text respecting token limit
    let consolidatedText = "";
    if (chunks && chunks.length > 0) {
      for (const chunk of chunks) {
        if (consolidatedText.length + chunk.content.length > MAX_CONTEXT_CHARS) break;
        consolidatedText += chunk.content + "\n";
      }
    }

    // Build prompt
    const userPrompt = `Analise o seguinte artigo científico e produza a curadoria estruturada:

TÍTULO: ${paper.title}
${paper.authors ? `AUTORES: ${paper.authors}` : ""}
${paper.year ? `ANO: ${paper.year}` : ""}
${paper.journal ? `JOURNAL: ${paper.journal}` : ""}
${paper.doi ? `DOI: ${paper.doi}` : ""}
${paper.pmid ? `PMID: ${paper.pmid}` : ""}
${paper.abstract_text ? `ABSTRACT: ${paper.abstract_text}` : ""}

${consolidatedText ? `TEXTO COMPLETO (extraído do PDF):\n${consolidatedText}` : "TEXTO COMPLETO: Não disponível (usar abstract)"}`;

    // Call AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              name: "generate_curation",
              description: "Gera curadoria científica estruturada do artigo",
              parameters: CURATION_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_curation" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);

      if (status === 429) {
        await supabaseService.from("academy_papers").update({ curation_status: "draft" }).eq("id", paperId);
        return new Response(
          JSON.stringify({ error: "Rate limit. Tente novamente em alguns minutos.", request_id: incomingRequestId }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Erro na API de IA (status ${status})`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "generate_curation") {
      throw new Error("Resposta inesperada da IA — tool call não encontrada");
    }

    const curationData = JSON.parse(toolCall.function.arguments);

    // Outcomes fallback: ensure at least one outcome exists
    if (!curationData.outcomes || !Array.isArray(curationData.outcomes) || curationData.outcomes.length === 0) {
      console.warn(`[curate:outcomes-fallback] No outcomes returned by AI, adding fallback`);
      curationData.outcomes = [{ domain: "clinical", name: "Não identificado", direction: "unknown", timeframe: "unknown" }];
    }

    // Validate JSON
    const validation = validateCurationJson(curationData);
    if (!validation.valid) {
      console.warn(`[curate:validation] Errors: ${validation.errors.join(", ")}`);
    }
    if (validation.warnings.length > 0) {
      console.warn(`[curate:validation:warnings] ${validation.warnings.join(", ")}`);
    }

    // Resolve template server-side
    const paperTemplate = resolvePaperTemplateServer(curationData);
    const schemaVersion = 2;

    // Inject into curation_json for consistency
    curationData.paper_template = paperTemplate;
    curationData.schema_version = schemaVersion;

    console.log(`[curate:template] paperId=${paperId} template=${paperTemplate} study_type="${curationData.tipo_estudo}"`);

    // Persist curation (upsert for idempotency)
    const { error: insertErr } = await supabaseService
      .from("academy_paper_curation")
      .upsert({
        paper_id: paperId,
        curation_json: curationData,
        nivel_evidencia: curationData.nivel_evidencia || null,
        score_metodologico: typeof curationData.score_metodologico === "number" ? curationData.score_metodologico : null,
        risco_vies: curationData.risco_vies || null,
        request_id: incomingRequestId,
        paper_template: paperTemplate,
        schema_version: schemaVersion,
        data_quality_warnings: validation.warnings.length > 0 ? validation.warnings : [],
      }, { onConflict: "paper_id" });

    if (insertErr) {
      throw new Error(`Erro ao salvar curadoria: ${insertErr.message}`);
    }

    // Update paper status to ready
    await supabaseService
      .from("academy_papers")
      .update({ curation_status: "ready" })
      .eq("id", paperId);

    const durationMs = Date.now() - startTime;
    console.log(`[curate:done] paperId=${paperId} requestId=${incomingRequestId} duration=${durationMs}ms template=${paperTemplate} nivel=${curationData.nivel_evidencia} score=${curationData.score_metodologico} risco=${curationData.risco_vies} outcomes=${curationData.outcomes?.length}`);

    // Log success
    await supabaseService.from("academy_ai_logs").insert({
      action: "auto_curation",
      paper_id: paperId,
      user_id: userId || "00000000-0000-0000-0000-000000000000",
      request_id: incomingRequestId,
      input: {
        paper_id: paperId,
        chunks_used: chunksUsed,
        context_chars: consolidatedText.length,
        has_abstract: !!paper.abstract_text,
        force,
      },
      output: {
        nivel_evidencia: curationData.nivel_evidencia,
        score_metodologico: curationData.score_metodologico,
        risco_vies: curationData.risco_vies,
        paper_template: paperTemplate,
        schema_version: schemaVersion,
        tags: curationData.tags,
        outcomes_count: curationData.outcomes?.length,
        validation_errors: validation.errors,
        validation_warnings: validation.warnings,
      },
      status: "success",
      duration_ms: durationMs,
      model_used: AI_MODEL,
    });

    return new Response(JSON.stringify({
      success: true,
      paper_id: paperId,
      nivel_evidencia: curationData.nivel_evidencia,
      score_metodologico: curationData.score_metodologico,
      risco_vies: curationData.risco_vies,
      outcomes_count: curationData.outcomes?.length,
      request_id: incomingRequestId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Curation error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    try {
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      if (paperId) {
        await supabaseService
          .from("academy_papers")
          .update({ curation_status: "failed" })
          .eq("id", paperId);
      }

      await supabaseService.from("academy_ai_logs").insert({
        action: "auto_curation",
        paper_id: paperId,
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        request_id: requestId,
        input: { paper_id: paperId },
        status: "fail",
        error_message: message,
        duration_ms: Date.now() - startTime,
        model_used: AI_MODEL,
      });
    } catch (logErr) {
      console.error("Failed to log curation error:", logErr);
    }

    return new Response(JSON.stringify({ error: message, request_id: requestId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
