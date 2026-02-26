import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const AI_MODEL = "google/gemini-2.5-flash";
const TOP_K_HYBRID = 30;
const TOP_K_FINAL = 10;
const MIN_SIMILARITY = 0.25;
const MAX_SNIPPETS_PER_PAPER = 3;
const MAX_SNIPPET_CHARS = 400;

const RATE_LIMITS: Record<string, number> = {
  student: 20,
  teacher_candidate: 50,
  teacher_approved: 100,
  admin_academy: -1,
};

const RAG_SYSTEM_PROMPT = `Você é um sistema de interpretação científica especializado em fisioterapia regenerativa e medicina ortobiológica.

REGRAS ABSOLUTAS:
1. Responda SOMENTE com base nos trechos de artigos fornecidos abaixo.
2. NÃO prescreva conduta clínica.
3. NÃO invente números, percentuais ou estatísticas não mencionados nos trechos.
4. NÃO extrapole além do que está nos trechos fornecidos.
5. NÃO crie meta-análise nem calcule estatísticas novas.
6. NÃO recomende tratamentos diretamente.
7. Se a evidência nos trechos for insuficiente, diga explicitamente.

FORMATO OBRIGATÓRIO DA RESPOSTA (em markdown):

## Síntese da Evidência
[Síntese dos achados dos estudos fornecidos]

## O que os Estudos Sugerem
[Interpretação sem prescrição — use linguagem como "os dados sugerem", "a evidência aponta"]

## Limitações e Lacunas
[Limitações metodológicas observadas nos estudos e lacunas da evidência]

## Artigos Citados
[Lista numerada com título, ano, journal, tipo de estudo, score de evidência e aplicabilidade clínica (quando disponíveis no Perfil de Evidência)]

---
*⚕️ Esta síntese é baseada exclusivamente nos estudos disponíveis na biblioteca e não substitui avaliação clínica individual.*`;

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input: text }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI Embeddings error (${response.status}): ${errText}`);
  }
  const data = await response.json();
  return data.data[0].embedding;
}

function getAllowedStatuses(role: string): string[] {
  switch (role) {
    case "admin_academy":
      return ["draft", "curating", "ready", "published"];
    case "teacher_approved":
    case "teacher_candidate":
      return ["ready", "published"];
    default:
      return ["published"];
  }
}

// Re-rank heuristic: boost/penalize based on filters, warnings, and source_part
function rerank(
  papers: any[],
  question: string,
  filters?: Record<string, any>
): any[] {
  const questionLower = question.toLowerCase();
  const questionTerms = questionLower.split(/\s+/).filter(t => t.length > 3);
  const isHumanClinical = !questionLower.includes("animal") && !questionLower.includes("in vitro");

  return papers.map(p => {
    let boost = 0;
    const titleLower = (p.paper_title || "").toLowerCase();
    const warnings = p.paper_warnings || [];
    const curationData = p.paper_curation_data || {};

    // Boost if title contains question terms
    for (const term of questionTerms) {
      if (titleLower.includes(term)) boost += 0.05;
    }

    // Boost if tags_norm match filters
    if (filters) {
      const tagsNorm = curationData.tags_norm || {};
      const interventionsNorm = curationData.interventions_norm || [];
      const pathologiesNorm = curationData.pathologies_norm || [];

      if (filters.pathology) {
        const pf = filters.pathology.toLowerCase();
        if (pathologiesNorm.some((t: string) => t.toLowerCase().includes(pf))) boost += 0.1;
      }
      if (filters.intervention) {
        const inf = filters.intervention.toLowerCase();
        if (interventionsNorm.some((t: string) => t.toLowerCase().includes(inf))) boost += 0.1;
      }
    }

    // Boost if paper has PDF chunks (richer content)
    const chunks = p.best_chunks || [];
    const hasPdfChunks = chunks.some((c: any) => c.source_part === "pdf");
    if (hasPdfChunks) boost += 0.05;

    // Penalize animal/in vitro warnings when human clinical question
    if (isHumanClinical) {
      for (const w of warnings) {
        const wl = (w || "").toLowerCase();
        if (wl.includes("animal") || wl.includes("in vitro") || wl.includes("pré-clínico")) {
          boost -= 0.15;
        }
      }
    }

    return { ...p, score_final: (p.score_final || 0) + boost };
  }).sort((a, b) => b.score_final - a.score_final);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let supabaseAuth: any = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    const body = await req.json();
    const { question, filters } = body;

    if (!question || typeof question !== "string" || question.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Pergunta deve ter pelo menos 5 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine user role
    const { data: roleData } = await supabaseService
      .from("academy_user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const userRole = roleData?.role || "student";
    const allowedStatuses = getAllowedStatuses(userRole);

    // Rate limiting
    const dailyLimit = RATE_LIMITS[userRole] ?? 20;
    if (dailyLimit !== -1) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count, error: countErr } = await supabaseService
        .from("academy_ai_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action", "rag_answer")
        .gte("created_at", todayStart.toISOString());

      if (!countErr && (count ?? 0) >= dailyLimit) {
        await supabaseService.from("academy_ai_logs").insert({
          action: "rag_answer",
          user_id: userId,
          input: { question, role: userRole, rate_limited: true },
          status: "fail",
          error_message: `Rate limit exceeded: ${count}/${dailyLimit} per day`,
          duration_ms: Date.now() - startTime,
        });

        return new Response(
          JSON.stringify({ error: `Limite diário de ${dailyLimit} consultas atingido. Tente novamente amanhã.` }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate question embedding
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const questionEmbedding = await generateEmbedding(question.trim(), OPENAI_API_KEY);

    // Hybrid retrieval: vector + FTS
    const { data: hybridResults, error: hybridErr } = await supabaseService.rpc("hybrid_match_papers", {
      query_text: question.trim(),
      query_embedding: JSON.stringify(questionEmbedding),
      match_count: TOP_K_HYBRID,
      allowed_statuses: allowedStatuses,
    });

    if (hybridErr) {
      console.error("Hybrid retrieval error:", hybridErr);
      throw new Error(`Erro na busca híbrida: ${hybridErr.message}`);
    }

    // Log retrieval stats
    const retrievalStats = {
      total_candidates: (hybridResults || []).length,
      vector_only: (hybridResults || []).filter((r: any) => r.source === "vector").length,
      fts_only: (hybridResults || []).filter((r: any) => r.source === "fts").length,
      both: (hybridResults || []).filter((r: any) => r.source === "both").length,
    };

    await supabaseService.from("academy_ai_logs").insert({
      action: "rag_retrieval",
      user_id: userId,
      input: { question, filters, role: userRole, allowed_statuses: allowedStatuses },
      output: { stats: retrievalStats, top_scores: (hybridResults || []).slice(0, 5).map((r: any) => ({ paper_id: r.paper_id, score: r.score_final, source: r.source })) },
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    const relevantResults = (hybridResults || []).filter((r: any) => r.score_final >= MIN_SIMILARITY);

    // Re-rank
    const preRerank = relevantResults.map((r: any) => r.paper_id);
    const reranked = rerank(relevantResults, question, filters);
    const topResults = reranked.slice(0, TOP_K_FINAL);
    const postRerank = topResults.map((r: any) => r.paper_id);

    // Log rerank
    await supabaseService.from("academy_ai_logs").insert({
      action: "rag_rerank",
      user_id: userId,
      input: { question, pre_rerank_count: preRerank.length, pre_rerank_ids: preRerank.slice(0, 15) },
      output: { post_rerank_count: postRerank.length, post_rerank_ids: postRerank },
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    // Fetch REM layers for top results
    const topPaperIds = topResults.map((r: any) => r.paper_id);
    const { data: remData } = topPaperIds.length > 0
      ? await supabaseService
          .from("academy_papers")
          .select("id, curation_data, evidence_score, evidence_label, evidence_score_breakdown")
          .in("id", topPaperIds)
      : { data: [] };
    const remMap = new Map<string, any>();
    for (const p of (remData || [])) {
      remMap.set(p.id, p);
    }

    // Build citations + evidence_snippets from hybrid results
    const paperMap = new Map<string, any>();
    const evidenceSnippets: any[] = [];

    for (const result of topResults) {
      const remInfo = remMap.get(result.paper_id);
      const remLayers = remInfo?.curation_data?.reghen_evidence_method?.layers;

      const citation: any = {
        paper_id: result.paper_id,
        title: result.paper_title,
        year: result.paper_year,
        journal: result.paper_journal,
        doi: result.paper_doi,
        pmid: result.paper_pmid,
      };

      // Enrich with REM data when available
      if (remLayers) {
        citation.study_type = remLayers.layer_2_methodology?.study_type || null;
        citation.applicability = remLayers.layer_4_applicability?.classification || null;
        citation.applicability_justification = remLayers.layer_4_applicability?.justification || null;
      }
      if (remInfo?.evidence_score != null) {
        citation.evidence_score = remInfo.evidence_score;
      }
      if (remInfo?.evidence_label) {
        citation.evidence_label = remInfo.evidence_label;
      }

      paperMap.set(result.paper_id, citation);

      // Extract snippets from best_chunks (safe: max 3 per paper, max 400 chars)
      const chunks = result.best_chunks || [];
      let paperSnippetCount = 0;
      for (const chunk of (Array.isArray(chunks) ? chunks : [])) {
        if (paperSnippetCount >= MAX_SNIPPETS_PER_PAPER) break;
        const rawContent = chunk.content || "";
        const snippet = rawContent.length > MAX_SNIPPET_CHARS
          ? rawContent.slice(0, MAX_SNIPPET_CHARS - 1) + "…"
          : rawContent;
        evidenceSnippets.push({
          paper_id: result.paper_id,
          chunk_id: chunk.chunk_id || null,
          snippet,
          similarity: parseFloat((chunk.similarity || 0).toFixed(4)),
        });
        paperSnippetCount++;
      }
    }
    const citations = Array.from(paperMap.values());

    // Insufficient evidence
    if (topResults.length === 0) {
      const insuffResult = {
        answer_md: "## Evidência Insuficiente\n\nNão há evidência suficiente na biblioteca atual para responder com segurança a esta pergunta.\n\nConsidere reformular a pergunta ou verificar se existem artigos relevantes publicados na biblioteca.\n\n---\n*⚕️ Esta síntese é baseada exclusivamente nos estudos disponíveis na biblioteca e não substitui avaliação clínica individual.*",
        citations: [],
        evidence_snippets: [],
        suggested_terms: [],
      };

      await supabaseService.from("academy_ai_logs").insert({
        action: "rag_answer",
        user_id: userId,
        input: { question, filters, role: userRole, allowed_statuses: allowedStatuses },
        output: { answer_md: insuffResult.answer_md, citations: [], insufficient: true },
        status: "success",
        duration_ms: Date.now() - startTime,
        model_used: "none",
      });

      return new Response(JSON.stringify(insuffResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context from best_chunks of top results (enriched with REM)
    const contextParts: string[] = [];
    let ctxIndex = 0;
    for (const result of topResults) {
      const remInfo = remMap.get(result.paper_id);
      const remLayers = remInfo?.curation_data?.reghen_evidence_method?.layers;

      // Build evidence profile header when REM exists
      let evidenceProfile = "";
      if (remLayers) {
        const parts: string[] = [];
        if (remLayers.layer_2_methodology?.study_type) parts.push(`Tipo: ${remLayers.layer_2_methodology.study_type}`);
        if (remLayers.layer_2_methodology?.is_human != null) parts.push(`Humano: ${remLayers.layer_2_methodology.is_human ? "sim" : "não"}`);
        if (remLayers.layer_4_applicability?.classification) parts.push(`Aplicabilidade: ${remLayers.layer_4_applicability.classification}`);
        if (remInfo?.evidence_score != null) parts.push(`Score: ${remInfo.evidence_score}/100`);
        if (parts.length > 0) evidenceProfile = `\n[Perfil de Evidência] ${parts.join(" | ")}`;
      }

      const chunks = result.best_chunks || [];
      for (const chunk of (Array.isArray(chunks) ? chunks.slice(0, 2) : [])) {
        ctxIndex++;
        contextParts.push(
          `[Trecho ${ctxIndex}] (${result.paper_title}, ${result.paper_year || "N/A"}, ${result.paper_journal || "N/A"}, score: ${(result.score_final || 0).toFixed(3)})${evidenceProfile}\n${chunk.content || ""}`
        );
      }
    }

    const userPrompt = `PERGUNTA DO USUÁRIO: ${question}

TRECHOS RECUPERADOS DA BIBLIOTECA (use SOMENTE estes para responder):

${contextParts.join("\n\n---\n\n")}

Responda seguindo o formato obrigatório. Se os trechos não contêm informação suficiente, diga explicitamente.`;

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
          { role: "system", content: RAG_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error (${status})`);
    }

    const aiData = await aiResponse.json();
    const answerMd = aiData.choices?.[0]?.message?.content || "Erro ao gerar resposta.";

    const result = {
      answer_md: answerMd,
      citations,
      evidence_snippets: evidenceSnippets,
      suggested_terms: [],
    };

    await supabaseService.from("academy_ai_logs").insert({
      action: "rag_answer",
      user_id: userId,
      input: { question, filters, role: userRole, allowed_statuses: allowedStatuses, hybrid_candidates: retrievalStats.total_candidates, reranked_count: topResults.length },
      output: { answer_md: answerMd, citations, evidence_snippets: evidenceSnippets, chunks_used: contextParts.length },
      status: "success",
      duration_ms: Date.now() - startTime,
      model_used: AI_MODEL,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("RAG error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    if (userId) {
      try {
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabaseService.from("academy_ai_logs").insert({
          action: "rag_answer",
          user_id: userId,
          input: { error_context: "rag_answer_failed" },
          status: "fail",
          error_message: message,
          duration_ms: Date.now() - startTime,
        });
      } catch (logErr) {
        console.error("Failed to log error:", logErr);
      }
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
