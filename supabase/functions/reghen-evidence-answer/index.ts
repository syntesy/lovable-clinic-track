import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Call academy-rag-answer internally by invoking the same pattern
    // But we call it directly via HTTP to reuse all its logic
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

    // Save snapshot automatically
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
      });

    if (snapError) {
      console.error("Snapshot save error:", snapError);
    }

    // Log
    await supabaseService.from("academy_ai_logs").insert({
      action: "attendance_evidence_query",
      user_id: user.id,
      input: { attendance_id, topic_key, question },
      output: {
        citations_count: ragData.citations?.length || 0,
        has_answer: !!ragData.answer_md,
      },
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify(ragData), {
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
