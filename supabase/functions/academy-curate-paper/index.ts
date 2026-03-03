import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ═══════════════════════════════════════════════════════════
// academy-curate-paper — AI curation pipeline (Etapa 5)
// Hard validation, evidence anchors, auto-tagging, versioning
// ═══════════════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_MODEL = "google/gemini-2.5-flash";
const PROMPT_VERSION = "v3.0";
const SCHEMA_VERSION = 3;
const MAX_LLM_TEXT_CHARS = 250_000;
const MIN_CHUNKS_FOR_CURATION = 5;

// ── Schemas ──────────────────────────────────────────────

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
    evidence_anchors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string" },
          section: { type: "string" },
          snippet: { type: "string" },
        },
        required: ["field", "section", "snippet"],
      },
    },
    auto_tags: {
      type: "object",
      properties: {
        procedure: { type: "string" },
        tissue: { type: "string" },
        pathology: { type: "string" },
        study_design: { type: "string" },
        followup_class: { type: "string", enum: ["short", "medium", "long"] },
      },
      required: ["procedure", "tissue", "pathology", "study_design", "followup_class"],
    },
  },
  required: [
    "tipo_estudo", "nivel_evidencia", "ano_publicacao", "tamanho_amostra_total",
    "intervencao", "comparador", "desfechos_primarios", "desfechos_secundarios",
    "follow_up_medio", "resultados_principais", "significancia_estatistica",
    "eventos_adversos", "risco_vies", "justificativa_risco_vies",
    "score_metodologico", "aplicabilidade_clinica", "conclusao_pratica",
    "tags", "outcomes", "evidence_anchors", "auto_tags",
  ],
};

// ── System prompt ────────────────────────────────────────

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

EVIDENCE ANCHORS (anti-alucinação):
Forneça evidence_anchors obrigatórios para:
- study_design: trecho do texto que indica o design do estudo
- primary_outcome: trecho com o desfecho primário
- population: trecho com descrição da população/amostra
Cada anchor: { field, section (abstract|methods|results|discussion), snippet (máx 25 palavras) }

AUTO_TAGS (classificação estruturada):
- procedure: PRP | PRF | PPP | stem_cell | prolotherapy | other
- tissue: tendon | cartilage | muscle | nerve | spine | bone | other
- pathology: string normalizada (ex: "osteoartrite_joelho")
- study_design: RCT | cohort | case_series | case_report | review | meta_analysis | other
- followup_class: short (<3 meses) | medium (3-12 meses) | long (>12 meses)

Responda APENAS usando a função fornecida.`;

// ── Helpers ──────────────────────────────────────────────

function generateRequestId(): string {
  return `req_cur_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

type PaperTemplate = "CLINICAL_COMPARATIVE" | "REVIEW_CONSENSUS" | "TRANSLATIONAL_PRECLINICAL" | "OTHER";

function resolvePaperTemplate(curation: any): PaperTemplate {
  const studyType = (curation?.tipo_estudo || "").toLowerCase();
  const comparador = (curation?.comparador || "").trim();
  const sampleSize = Number(curation?.tamanho_amostra_total) || 0;
  const outcomes = Array.isArray(curation?.outcomes) ? curation.outcomes : [];
  const hasStructuredOutcomes = outcomes.some(
    (o: any) => o?.name && o.name !== "Não identificado" && o?.direction && o.direction !== "unknown"
  );
  const hasComparator = comparador.length > 0 && !["nenhum", "none", "n/a", "não aplicável", ""].includes(comparador.toLowerCase());

  if (sampleSize > 0 && hasComparator && hasStructuredOutcomes) return "CLINICAL_COMPARATIVE";

  const reviewPatterns = ["systematic review", "meta-analysis", "guideline", "consensus", "position statement",
    "revisão sistemática", "meta-análise", "diretriz", "consenso"];
  if (reviewPatterns.some((p) => studyType.includes(p))) return "REVIEW_CONSENSUS";

  const preclinicalPatterns = ["in vitro", "animal", "cells", "mechanism", "preclinical",
    "pré-clínico", "células", "mecanismo", "translacional"];
  if (preclinicalPatterns.some((p) => studyType.includes(p)) || (!hasComparator && !hasStructuredOutcomes)) return "TRANSLATIONAL_PRECLINICAL";

  return "OTHER";
}

async function computeHash(text: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Advanced Validation (Etapa 5) ────────────────────────

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  hardFails: string[];
}

const RCT_PATTERNS = /\b(randomized|randomised|rct|double[- ]blind|controlled trial|ensaio clínico randomizado|triplo[- ]cego)\b/i;
const STAT_PATTERNS = /\b(p\s*[<>=]\s*0?\.\d+|confidence interval|hazard ratio|odds ratio|risk ratio|relative risk|NNT|intervalo de confiança)\b/i;
const LOE_RCT_MIN = ["Ia", "Ib", "IIa"]; // acceptable for RCT

function validateCuration(data: any, paperTemplate: PaperTemplate, fulltextRaw: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const hardFails: string[] = [];

  // Required fields
  for (const field of CURATION_SCHEMA.required) {
    if (data[field] === undefined || data[field] === null) {
      if (field === "outcomes") warnings.push("outcomes ausente — fallback aplicado");
      else if (field === "evidence_anchors") warnings.push("evidence_anchors ausente");
      else if (field === "auto_tags") warnings.push("auto_tags ausente");
      else errors.push(`Campo obrigatório ausente: ${field}`);
    }
  }

  // Type checks
  if (typeof data.score_metodologico === "number") {
    if (data.score_metodologico < 0 || data.score_metodologico > 10 || !Number.isInteger(data.score_metodologico)) {
      errors.push("score_metodologico deve ser inteiro entre 0 e 10");
    }
  }
  if (data.risco_vies && !["baixo", "moderado", "alto"].includes(data.risco_vies)) {
    errors.push("risco_vies inválido");
  }
  if (data.tags && !Array.isArray(data.tags)) errors.push("tags deve ser array");
  if (data.desfechos_primarios && !Array.isArray(data.desfechos_primarios)) errors.push("desfechos_primarios deve ser array");

  // Outcomes must exist
  if (!data.outcomes || !Array.isArray(data.outcomes) || data.outcomes.length === 0) {
    hardFails.push("outcomes obrigatório (pelo menos 1)");
  }

  // HARD RULES for CLINICAL_COMPARATIVE
  if (paperTemplate === "CLINICAL_COMPARATIVE") {
    if (!data.intervencao || data.intervencao.trim() === "") {
      hardFails.push("PICO: intervencao obrigatória para estudos comparativos");
    }
    if (!data.comparador || data.comparador.trim() === "") {
      hardFails.push("PICO: comparador obrigatório para estudos comparativos");
    }
    if (data.tamanho_amostra_total === 0) {
      hardFails.push("Tamanho amostral não pode ser 0 em estudo comparativo");
    }
  }

  // ═══════════════════════════════════════════════
  // 1.1 Study type coherence (RCT detection)
  // ═══════════════════════════════════════════════
  const fulltextLower = fulltextRaw.toLowerCase();
  const textIndicatesRCT = RCT_PATTERNS.test(fulltextRaw);
  const nivelEv = (data.nivel_evidencia || "").trim();

  if (textIndicatesRCT) {
    // If text clearly mentions RCT patterns but LoE is too low
    const lowLevels = ["III", "IV", "V"];
    if (lowLevels.includes(nivelEv)) {
      hardFails.push(`Incoerência: texto indica RCT mas nível de evidência classificado como ${nivelEv}`);
    }
  }

  // ═══════════════════════════════════════════════
  // 1.2 Statistical coherence
  // ═══════════════════════════════════════════════
  const hasStatTerms = STAT_PATTERNS.test(fulltextRaw);
  const statDescription = (data.significancia_estatistica || "").trim();
  if (hasStatTerms && statDescription.length < 10) {
    warnings.push("STAT_METHOD_UNCLEAR: texto contém termos estatísticos mas curadoria não descreve análise");
  }

  // ═══════════════════════════════════════════════
  // 1.3 N não inventado
  // ═══════════════════════════════════════════════
  const sampleN = Number(data.tamanho_amostra_total);
  if (sampleN > 0) {
    const nStr = String(sampleN);
    // Check if the number appears in fulltext (anywhere)
    if (!fulltextRaw.includes(nStr)) {
      hardFails.push(`N inventado: tamanho_amostra_total (${sampleN}) não encontrado no texto`);
    }
  }

  // ═══════════════════════════════════════════════
  // 1.4 Clinical outcomes mandatory for clinical studies
  // ═══════════════════════════════════════════════
  if (paperTemplate === "CLINICAL_COMPARATIVE" && data.outcomes && Array.isArray(data.outcomes)) {
    const validOutcomes = data.outcomes.filter(
      (o: any) => o?.name && o.name !== "Não identificado" && o?.direction && o.direction !== "unknown" && o?.timeframe
    );
    if (validOutcomes.length === 0) {
      hardFails.push("Estudos clínicos comparativos requerem pelo menos 1 outcome com name, direction e timeframe");
    }
  }

  // ═══════════════════════════════════════════════
  // 2. Evidence anchors validation
  // ═══════════════════════════════════════════════
  const anchors = data.evidence_anchors;
  if (anchors && Array.isArray(anchors)) {
    const requiredAnchorFields = ["study_design", "primary_outcome", "population"];
    for (const field of requiredAnchorFields) {
      const found = anchors.find((a: any) => a.field === field);
      if (!found || !found.snippet || found.snippet.trim().length < 5) {
        warnings.push(`ANCHOR_MISSING: evidence_anchor para '${field}' ausente ou vazio`);
      } else if (found.snippet.split(/\s+/).length > 30) {
        warnings.push(`ANCHOR_TOO_LONG: snippet de '${field}' excede 25 palavras`);
      }
    }
  } else {
    warnings.push("ANCHORS_ABSENT: evidence_anchors não fornecido pelo LLM");
  }

  // ═══════════════════════════════════════════════
  // 6. Auto-tags validation
  // ═══════════════════════════════════════════════
  const autoTags = data.auto_tags;
  if (autoTags && typeof autoTags === "object") {
    if (!autoTags.tissue) warnings.push("AUTO_TAG_MISSING: tissue tag ausente");
    if (!autoTags.procedure) warnings.push("AUTO_TAG_MISSING: procedure tag ausente");
    const validFollowup = ["short", "medium", "long"];
    if (autoTags.followup_class && !validFollowup.includes(autoTags.followup_class)) {
      warnings.push(`AUTO_TAG_INVALID: followup_class '${autoTags.followup_class}' inválido`);
    }
  } else {
    warnings.push("AUTO_TAGS_ABSENT: auto_tags não fornecido pelo LLM");
  }

  return { valid: errors.length === 0 && hardFails.length === 0, errors, warnings, hardFails };
}

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════

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
    // PRE-CONDITIONS: Read from current_structured (source of truth)
    // ═══════════════════════════════════════════

    const { data: fulltextData } = await supabaseService
      .from("academy_paper_fulltext")
      .select("current_structured, has_sufficient_text, char_count, word_count, chunk_count, extracted_text, structured_version, structured_hash, source_route")
      .eq("paper_id", paperId)
      .maybeSingle();

    if (!fulltextData) {
      return new Response(JSON.stringify({ error: "Texto completo não encontrado.", request_id: incomingRequestId }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentStructured = fulltextData.current_structured as any;
    const hasStructured = currentStructured && (currentStructured.abstract || currentStructured.methods || currentStructured.results);

    if (!hasStructured && !fulltextData.has_sufficient_text) {
      return new Response(JSON.stringify({
        error: `Texto insuficiente para curadoria.`,
        request_id: incomingRequestId,
      }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!hasStructured && (fulltextData.chunk_count || 0) < MIN_CHUNKS_FOR_CURATION) {
      return new Response(JSON.stringify({
        error: `Chunks insuficientes (${fulltextData.chunk_count} < ${MIN_CHUNKS_FOR_CURATION}).`,
        request_id: incomingRequestId,
      }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Idempotency check
    const { data: existing } = await supabaseService
      .from("academy_paper_curation")
      .select("id")
      .eq("paper_id", paperId)
      .maybeSingle();

    if (existing && !force) {
      return new Response(JSON.stringify({
        message: "Curadoria já existente.", curation_id: existing.id, request_id: incomingRequestId,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (existing && force) {
      await supabaseService.from("academy_paper_curation").delete().eq("paper_id", paperId);
    }

    // Set status to curating
    await supabaseService.from("academy_papers").update({ curation_status: "curating" }).eq("id", paperId);

    // Fetch paper metadata
    const { data: paper, error: paperErr } = await supabaseService
      .from("academy_papers")
      .select("title, authors, year, journal, abstract_text, doi, pmid")
      .eq("id", paperId)
      .single();

    if (paperErr || !paper) throw new Error("Paper não encontrado");

    // ═══════════════════════════════════════════
    // BUILD LLM INPUT from current_structured (segmented)
    // ═══════════════════════════════════════════
    let llmInput = "";

    if (hasStructured) {
      const sections = [];
      if (currentStructured.abstract) sections.push(`ABSTRACT:\n${currentStructured.abstract}`);
      if (currentStructured.introduction) sections.push(`INTRODUCTION:\n${currentStructured.introduction}`);
      if (currentStructured.methods) sections.push(`METHODS:\n${currentStructured.methods}`);
      if (currentStructured.results) sections.push(`RESULTS:\n${currentStructured.results}`);
      if (currentStructured.discussion) sections.push(`DISCUSSION:\n${currentStructured.discussion}`);
      if (currentStructured.conclusion) sections.push(`CONCLUSION:\n${currentStructured.conclusion}`);
      llmInput = sections.join("\n\n");
    } else {
      const { data: chunks } = await supabaseService
        .from("academy_chunks")
        .select("content, chunk_index")
        .eq("paper_id", paperId)
        .order("chunk_index", { ascending: true });

      if (chunks && chunks.length > 0) {
        for (const chunk of chunks) {
          if (llmInput.length + chunk.content.length > MAX_LLM_TEXT_CHARS) break;
          llmInput += chunk.content + "\n";
        }
      }
    }

    if (llmInput.length > MAX_LLM_TEXT_CHARS) {
      llmInput = llmInput.slice(0, MAX_LLM_TEXT_CHARS);
    }

    const llmInputHash = await computeHash(llmInput);

    const userPrompt = `Analise o seguinte artigo científico e produza a curadoria estruturada:

TÍTULO: ${paper.title}
${paper.authors ? `AUTORES: ${paper.authors}` : ""}
${paper.year ? `ANO: ${paper.year}` : ""}
${paper.journal ? `JOURNAL: ${paper.journal}` : ""}
${paper.doi ? `DOI: ${paper.doi}` : ""}
${paper.pmid ? `PMID: ${paper.pmid}` : ""}
${paper.abstract_text ? `ABSTRACT (metadata): ${paper.abstract_text}` : ""}

TEXTO COMPLETO (estruturado):
${llmInput}`;

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
        tools: [{
          type: "function",
          function: { name: "generate_curation", description: "Gera curadoria científica estruturada", parameters: CURATION_SCHEMA },
        }],
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
          JSON.stringify({ error: "Rate limit. Tente novamente.", request_id: incomingRequestId }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Erro na API de IA (status ${status})`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "generate_curation") {
      throw new Error("Resposta inesperada da IA");
    }

    const curationData = JSON.parse(toolCall.function.arguments);
    const llmOutputHash = await computeHash(toolCall.function.arguments);

    // Outcomes fallback
    if (!curationData.outcomes || !Array.isArray(curationData.outcomes) || curationData.outcomes.length === 0) {
      curationData.outcomes = [{ domain: "clinical", name: "Não identificado", direction: "unknown", timeframe: "unknown" }];
    }

    // Resolve template
    const paperTemplate = resolvePaperTemplate(curationData);

    // ═══════════════════════════════════════════
    // VALIDATE with hard rules (Etapa 5)
    // ═══════════════════════════════════════════
    const validation = validateCuration(curationData, paperTemplate, llmInput);

    curationData.paper_template = paperTemplate;
    curationData.schema_version = SCHEMA_VERSION;

    let finalStatus: string;
    let nextAction: string;

    if (validation.hardFails.length > 0) {
      finalStatus = "needs_review";
      nextAction = "REVIEW";
      console.warn(`[curate:hard-fail] paperId=${paperId} fails=${validation.hardFails.join("; ")}`);

      await supabaseService.from("academy_review_task").insert({
        paper_id: paperId,
        reason: "qa_flag",
        status: "open",
        created_by: userId || "00000000-0000-0000-0000-000000000000",
      });
    } else {
      finalStatus = "published";
      nextAction = "NONE";
    }

    // Persist curation with new fields
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
        schema_version: SCHEMA_VERSION,
        data_quality_warnings: validation.warnings.length > 0 ? validation.warnings : [],
        validation_report: {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          hard_fails: validation.hardFails,
          validated_at: new Date().toISOString(),
        },
        llm_input_hash: llmInputHash,
        llm_output_hash: llmOutputHash,
        model: AI_MODEL,
        prompt_version: PROMPT_VERSION,
        // Etapa 5 new fields
        auto_tags: curationData.auto_tags || null,
        evidence_anchors: curationData.evidence_anchors || null,
        structured_version_used: fulltextData.structured_version || 1,
      }, { onConflict: "paper_id" });

    if (insertErr) throw new Error(`Erro ao salvar curadoria: ${insertErr.message}`);

    // Update paper status
    await supabaseService.from("academy_papers").update({ curation_status: finalStatus }).eq("id", paperId);

    const durationMs = Date.now() - startTime;
    console.log(`[curate:done] paperId=${paperId} status=${finalStatus} template=${paperTemplate} nivel=${curationData.nivel_evidencia} score=${curationData.score_metodologico} hardFails=${validation.hardFails.length} warnings=${validation.warnings.length} duration=${durationMs}ms`);

    // Log
    await supabaseService.from("academy_ai_logs").insert({
      action: "auto_curation",
      paper_id: paperId,
      user_id: userId || "00000000-0000-0000-0000-000000000000",
      request_id: incomingRequestId,
      input: {
        paper_id: paperId,
        context_chars: llmInput.length,
        has_structured: hasStructured,
        force,
        input_hash: llmInputHash,
        structured_version: fulltextData.structured_version,
      },
      output: {
        nivel_evidencia: curationData.nivel_evidencia,
        score_metodologico: curationData.score_metodologico,
        risco_vies: curationData.risco_vies,
        paper_template: paperTemplate,
        schema_version: SCHEMA_VERSION,
        tags: curationData.tags,
        outcomes_count: curationData.outcomes?.length,
        validation: validation,
        final_status: finalStatus,
        output_hash: llmOutputHash,
        auto_tags: curationData.auto_tags,
        evidence_anchors_count: curationData.evidence_anchors?.length,
      },
      status: "success",
      duration_ms: durationMs,
      model_used: AI_MODEL,
    });

    return new Response(JSON.stringify({
      success: true,
      paper_id: paperId,
      status: finalStatus,
      next_action: nextAction,
      paper_template: paperTemplate,
      schema_version: SCHEMA_VERSION,
      nivel_evidencia: curationData.nivel_evidencia,
      score_metodologico: curationData.score_metodologico,
      risco_vies: curationData.risco_vies,
      outcomes_count: curationData.outcomes?.length,
      auto_tags: curationData.auto_tags,
      evidence_anchors_count: curationData.evidence_anchors?.length,
      structured_version_used: fulltextData.structured_version,
      validation: {
        valid: validation.valid,
        hard_fails: validation.hardFails,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      request_id: incomingRequestId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Curation error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    try {
      const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      if (paperId) {
        await svc.from("academy_papers").update({ curation_status: "error" }).eq("id", paperId);
      }
      await svc.from("academy_ai_logs").insert({
        action: "auto_curation", paper_id: paperId,
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        request_id: requestId, input: { paper_id: paperId },
        status: "fail", error_message: message, duration_ms: Date.now() - startTime, model_used: AI_MODEL,
      });
    } catch {}

    return new Response(JSON.stringify({ error: message, request_id: requestId }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
