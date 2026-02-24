import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const AI_MODEL = "google/gemini-2.5-flash";
const TOP_K = 10;
const MIN_SIMILARITY = 0.3;

// Rate limits per role (per day)
const RATE_LIMITS: Record<string, number> = {
  student: 20,
  teacher_candidate: 50,
  teacher_approved: 100,
  admin_academy: -1, // unlimited
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
[Lista numerada com título, ano e journal de cada artigo utilizado]

---
*⚕️ Esta síntese é baseada exclusivamente nos estudos disponíveis na biblioteca e não substitui avaliação clínica individual.*`;

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
    }),
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

    // Search chunks via RPC
    const { data: chunks, error: rpcErr } = await supabaseService.rpc("match_academy_chunks", {
      query_embedding: JSON.stringify(questionEmbedding),
      match_count: TOP_K,
      allowed_statuses: allowedStatuses,
    });

    if (rpcErr) throw new Error(`Erro na busca vetorial: ${rpcErr.message}`);

    const relevantChunks = (chunks || []).filter((c: any) => c.similarity >= MIN_SIMILARITY);

    // Build citations + evidence_snippets
    const paperMap = new Map<string, any>();
    const evidenceSnippets: any[] = [];

    for (const chunk of relevantChunks) {
      if (!paperMap.has(chunk.paper_id)) {
        paperMap.set(chunk.paper_id, {
          paper_id: chunk.paper_id,
          title: chunk.paper_title,
          year: chunk.paper_year,
          journal: chunk.paper_journal,
          doi: chunk.paper_doi,
          pmid: chunk.paper_pmid,
        });
      }
      // Add snippet (max ~200 chars for display)
      const snippet = chunk.content.length > 250
        ? chunk.content.slice(0, 247) + "…"
        : chunk.content;
      evidenceSnippets.push({
        paper_id: chunk.paper_id,
        chunk_id: chunk.id,
        snippet,
        similarity: parseFloat(chunk.similarity.toFixed(4)),
      });
    }
    const citations = Array.from(paperMap.values());

    // Insufficient evidence
    if (relevantChunks.length === 0) {
      const result = {
        answer_md: "## Evidência Insuficiente\n\nNão há evidência suficiente na biblioteca atual para responder com segurança a esta pergunta.\n\nConsidere reformular a pergunta ou verificar se existem artigos relevantes publicados na biblioteca.\n\n---\n*⚕️ Esta síntese é baseada exclusivamente nos estudos disponíveis na biblioteca e não substitui avaliação clínica individual.*",
        citations: [],
        evidence_snippets: [],
        suggested_terms: [],
      };

      await supabaseService.from("academy_ai_logs").insert({
        action: "rag_answer",
        user_id: userId,
        input: { question, filters, role: userRole, allowed_statuses: allowedStatuses },
        output: { answer_md: result.answer_md, citations: [], insufficient: true },
        status: "success",
        duration_ms: Date.now() - startTime,
        model_used: "none",
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context
    const contextParts = relevantChunks.map(
      (c: any, i: number) =>
        `[Trecho ${i + 1}] (${c.paper_title}, ${c.paper_year || "N/A"}, ${c.paper_journal || "N/A"}, similaridade: ${c.similarity.toFixed(3)})\n${c.content}`
    );

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
      input: { question, filters, role: userRole, allowed_statuses: allowedStatuses, chunks_found: relevantChunks.length },
      output: { answer_md: answerMd, citations, evidence_snippets: evidenceSnippets, chunks_used: relevantChunks.length },
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
