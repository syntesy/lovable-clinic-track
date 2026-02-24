import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// D) PII patterns for LGPD guardrail
const PII_PATTERNS = [
  { name: "CPF", pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/ },
  { name: "telefone", pattern: /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/ },
  { name: "email", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ },
  // Full name + identifier (e.g. "João da Silva CPF", "Maria 123")
  { name: "nome_com_identificador", pattern: /\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+\s+(?:da|de|do|dos|das)?\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+\s+(?:cpf|rg|telefone|fone|cel|email|endereço)/i },
];

function detectPII(text: string): string | null {
  for (const { name, pattern } of PII_PATTERNS) {
    if (pattern.test(text)) {
      return name;
    }
  }
  return null;
}

// B) Snapshot hash generation
async function generateSnapshotHash(
  attendanceId: string,
  topicKey: string,
  retrievalMode: string,
  paperIds: string[],
  queryText: string | null
): Promise<string> {
  const sortedPaperIds = [...paperIds].sort().join(",");
  const normalizedQuery = (queryText || "").trim().toLowerCase().replace(/\s+/g, " ");
  const raw = `${attendanceId}|${topicKey}|${retrievalMode}|${sortedPaperIds}|${normalizedQuery}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userErr,
    } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { attendance_id, topic_key, question } = body;

    if (!attendance_id || !topic_key || !question) {
      return new Response(
        JSON.stringify({ error: "attendance_id, topic_key and question are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // D) LGPD PII guardrail
    const piiType = detectPII(question);
    if (piiType) {
      // Log blocked input
      await supabaseService.from("academy_ai_logs").insert({
        action: "reghen_blocked_input",
        user_id: user.id,
        input: { attendance_id, topic_key, pii_type: piiType },
        output: null,
        status: "blocked",
        duration_ms: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({
          error: "Dados pessoais detectados na pergunta. Por questões de privacidade (LGPD), não inclua CPF, telefone, e-mail ou nomes completos com identificadores. Reformule sua pergunta utilizando apenas termos clínicos.",
          blocked: true,
          pii_type: piiType,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate attendance ownership
    const { data: attendance, error: attErr } = await supabaseService
      .from("attendance_sessions")
      .select("id, user_id, patient_id")
      .eq("id", attendance_id)
      .single();

    if (attErr || !attendance) {
      return new Response(JSON.stringify({ error: "Atendimento não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (attendance.user_id !== user.id) {
      const { data: adminRole } = await supabaseService
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!adminRole) {
        return new Response(JSON.stringify({ error: "Sem permissão" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Rate limit: 50/day for professional
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabaseService
      .from("academy_ai_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "attendance_evidence_query")
      .gte("created_at", todayStart.toISOString());

    const isAdmin = !!(
      await supabaseService
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle()
    ).data;

    if (!isAdmin && (count ?? 0) >= 50) {
      return new Response(
        JSON.stringify({ error: "Limite diário de 50 consultas atingido." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse topic_key for filters
    const [intervention, pathology] = topic_key.split("|", 2);

    // Call academy-rag-answer
    const ragUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/academy-rag-answer`;
    const ragResponse = await fetch(ragUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify({
        question: `${question} (contexto: ${intervention} para ${pathology})`,
        filters: {
          intervention: intervention || undefined,
          pathology: pathology || undefined,
        },
      }),
    });

    if (!ragResponse.ok) {
      const errText = await ragResponse.text();
      throw new Error(`RAG error (${ragResponse.status}): ${errText}`);
    }

    const ragData = await ragResponse.json();

    // B) Generate snapshot hash for deduplication
    const paperIds = (ragData.citations || []).map((c: any) => c.paper_id).filter(Boolean);
    const snapshotHash = await generateSnapshotHash(
      attendance_id,
      topic_key,
      "manual_question",
      paperIds,
      question
    );

    // Try to save snapshot with hash — handle UNIQUE violation gracefully
    let deduplicated = false;
    const { error: snapError } = await supabaseService
      .from("reghen_evidence_snapshots")
      .insert({
        attendance_id,
        topic_key,
        query_text: question,
        retrieval_mode: "manual_question",
        papers: ragData.citations || [],
        evidence_profile: null,
        answer_md: ragData.answer_md || null,
        snippets: ragData.evidence_snippets || null,
        created_by: user.id,
        snapshot_hash: snapshotHash,
      });

    if (snapError) {
      if (snapError.code === "23505") {
        // Unique violation — deduplicated
        deduplicated = true;
      } else {
        console.error("Snapshot save error:", snapError);
      }
    }

    // Log
    await supabaseService.from("academy_ai_logs").insert({
      action: "attendance_evidence_query",
      user_id: user.id,
      input: { attendance_id, topic_key, question },
      output: {
        citations_count: ragData.citations?.length || 0,
        has_answer: !!ragData.answer_md,
        deduplicated,
      },
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ ...ragData, deduplicated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("reghen-evidence-answer error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
