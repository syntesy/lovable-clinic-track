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

  const requestId = `req_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", request_id: requestId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", request_id: requestId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin/teacher role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await supabaseService
      .from("academy_user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin_academy", "teacher_approved"])
      .limit(1);

    const { data: globalRole } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1);

    const isAdmin = (roleData && roleData.length > 0) || (globalRole && globalRole.length > 0);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Permissão negada. Apenas admin/teacher.", request_id: requestId }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const paperId = body.paper_id;
    if (!paperId) {
      return new Response(JSON.stringify({ error: "paper_id é obrigatório", request_id: requestId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get paper title
    const { data: paper } = await supabaseService
      .from("academy_papers")
      .select("title")
      .eq("id", paperId)
      .single();

    // Get fulltext or chunks
    const { data: fulltext } = await supabaseService
      .from("academy_paper_fulltext")
      .select("extracted_text")
      .eq("paper_id", paperId)
      .maybeSingle();

    let sourceText = fulltext?.extracted_text || "";

    // If no fulltext, try chunks
    if (!sourceText) {
      const { data: chunks } = await supabaseService
        .from("academy_chunks")
        .select("content")
        .eq("paper_id", paperId)
        .order("chunk_index", { ascending: true })
        .limit(10);

      if (chunks && chunks.length > 0) {
        sourceText = chunks.map((c: any) => c.content).join(" ");
      }
    }

    if (!sourceText || sourceText.length < 200) {
      return new Response(JSON.stringify({ error: "Texto insuficiente para gerar abstract.", request_id: requestId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Truncate source for prompt
    const truncatedSource = sourceText.slice(0, 8000);
    const title = paper?.title || "Artigo científico";

    // Call Gemini via Lovable AI proxy
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada.", request_id: requestId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a scientific abstract writer. Generate a neutral, objective abstract (120-180 words) for the following scientific paper.

Rules:
- Write in English
- Be objective and neutral — do NOT invent numbers, statistics, or conclusions not present in the text
- Summarize: objective, methods, key findings, and conclusion
- Do NOT include author names, affiliations, or references
- Output ONLY the abstract text, nothing else

Paper title: ${title}

Source text (excerpt):
${truncatedSource}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedAbstract = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!generatedAbstract || generatedAbstract.length < 50) {
      throw new Error("Abstract gerado é muito curto ou vazio.");
    }

    // Persist to academy_paper_fulltext
    await supabaseService
      .from("academy_paper_fulltext")
      .update({
        abstract: generatedAbstract,
        abstract_source: "generated",
        abstract_char_count: generatedAbstract.length,
        updated_at: new Date().toISOString(),
      })
      .eq("paper_id", paperId);

    // Sync to academy_papers cache
    await supabaseService
      .from("academy_papers")
      .update({ abstract_text: generatedAbstract })
      .eq("id", paperId);

    // Log
    await supabaseService.from("academy_ai_logs").insert({
      user_id: user.id,
      paper_id: paperId,
      action: "generate_abstract",
      input: { paper_id: paperId, source_chars: truncatedSource.length },
      output: { abstract_chars: generatedAbstract.length },
      status: "success",
      request_id: requestId,
      model_used: "gemini-2.0-flash",
    });

    console.log(`[abstract:generated] paperId=${paperId} chars=${generatedAbstract.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        abstract: generatedAbstract,
        abstract_source: "generated",
        request_id: requestId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error(`[error] ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message, request_id: requestId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
