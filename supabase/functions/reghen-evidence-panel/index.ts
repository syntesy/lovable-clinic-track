import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_MODEL = "claude-sonnet-4-6-20251101";

Deno.serve(async (req) => {
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
    const { attendance_id, topic_key } = body;

    if (!attendance_id || !topic_key) {
      return new Response(
        JSON.stringify({ error: "attendance_id and topic_key are required" }),
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

    // Parse topic_key: "INTERVENTION|pathology"
    const [intervention, pathology] = topic_key.split("|", 2);

    // Search published papers matching intervention + pathology via FTS
    const searchTerms = [intervention, pathology].filter(Boolean).join(" & ");

    const { data: papers, error: searchErr } = await supabaseService
      .from("academy_papers")
      .select(
        "id, title, year, journal, authors, abstract_text, evidence_score, evidence_label, curation_data, curation_status"
      )
      .eq("curation_status", "published")
      .is("deleted_at", null)
      .textSearch("tsv", searchTerms.replace(/\s+/g, " & "), { type: "websearch" })
      .order("evidence_score", { ascending: false, nullsFirst: false })
      .limit(10);

    if (searchErr) {
      console.error("Search error:", searchErr);
    }

    // Also try keyword fallback if FTS returns too few
    let allPapers = papers || [];
    if (allPapers.length < 5) {
      const keywords = [intervention, pathology].filter(Boolean);
      for (const kw of keywords) {
        if (allPapers.length >= 5) break;
        const { data: extra } = await supabaseService
          .from("academy_papers")
          .select(
            "id, title, year, journal, authors, abstract_text, evidence_score, evidence_label, curation_data, curation_status"
          )
          .eq("curation_status", "published")
          .is("deleted_at", null)
          .ilike("title", `%${kw}%`)
          .order("evidence_score", { ascending: false, nullsFirst: false })
          .limit(5);

        if (extra) {
          const existingIds = new Set(allPapers.map((p: any) => p.id));
          for (const p of extra) {
            if (!existingIds.has(p.id)) {
              allPapers.push(p);
              existingIds.add(p.id);
            }
          }
        }
      }
    }

    // Take top 5
    const topPapers = allPapers.slice(0, 5).map((p: any) => {
      const rem = p.curation_data?.reghen_evidence_method?.layers;
      return {
        paper_id: p.id,
        title: p.title,
        year: p.year,
        journal: p.journal,
        authors: p.authors,
        abstract_text: p.abstract_text || null,
        evidence_score: p.evidence_score,
        evidence_label: p.evidence_label,
        study_type: rem?.layer_2_methodology?.study_type || null,
        applicability: rem?.layer_4_applicability?.classification || null,
        applicability_justification: rem?.layer_4_applicability?.justification || null,
        is_human: rem?.layer_2_methodology?.is_human ?? null,
      };
    });

    // Build evidence profile summary
    const evidenceProfile = {
      topic_key,
      papers_count: topPapers.length,
      avg_score:
        topPapers.length > 0
          ? Math.round(
              topPapers.reduce((s: number, p: any) => s + (p.evidence_score || 0), 0) /
                topPapers.length
            )
          : null,
      study_types: [...new Set(topPapers.map((p: any) => p.study_type).filter(Boolean))],
    };

    // A) Generate short summary — 100% grounded on retrieved papers
    let shortSummary = "";
    let summaryStatus: "success" | "fail" | "insufficient" = "insufficient";

    if (topPapers.length > 0) {
      // Build grounding context from paper titles + abstracts + evidence profile
      const hasAbstracts = topPapers.some((p: any) => p.abstract_text);

      if (!hasAbstracts) {
        // Not enough content to synthesize
        shortSummary = "Evidência insuficiente na biblioteca para este tópico.";
        summaryStatus = "insufficient";
      } else {
        const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
        if (ANTHROPIC_API_KEY) {
          try {
            const paperDescriptions = topPapers
              .map(
                (p: any, i: number) =>
                  `${i + 1}. "${p.title}" (${p.year || "N/A"}, ${p.journal || "N/A"}) — Score: ${p.evidence_score || "N/A"}, Tipo: ${p.study_type || "N/A"}, Aplicabilidade: ${p.applicability || "N/A"}\nResumo: ${(p.abstract_text || "Não disponível").slice(0, 500)}`
              )
              .join("\n\n");

            const aiResponse = await fetch(
              "https://api.anthropic.com/v1/messages",
              {
                method: "POST",
                headers: {
                  "x-api-key": ANTHROPIC_API_KEY!,
                  "anthropic-version": "2023-06-01",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: AI_MODEL,
                  max_tokens: 4096,
                  system: `Você é um sistema de síntese científica do Reghen Evidence Method™.

REGRAS OBRIGATÓRIAS:
1. Gere uma síntese curta (2-5 linhas) EXCLUSIVAMENTE baseada nos títulos, resumos e perfis de evidência dos artigos listados abaixo.
2. NUNCA prescreva conduta (não use "indique", "faça", "deve", "recomenda-se").
3. NUNCA invente números, estatísticas ou dados não presentes nos resumos.
4. NUNCA extrapole para populações ou contextos não descritos nos estudos.
5. Use linguagem como "os estudos listados sugerem", "a evidência disponível aponta", "segundo os artigos recuperados".
6. Comece com "Com base nos estudos listados, " ou frase equivalente.
7. Responda em português.

Se os resumos não contiverem informação suficiente para uma síntese, responda EXATAMENTE: "Evidência insuficiente na biblioteca para este tópico."`,
                  messages: [
                    {
                      role: "user",
                      content: `Tópico: "${topic_key}"\n\nArtigos disponíveis:\n\n${paperDescriptions}\n\nGere a síntese grounded.`,
                    },
                  ],
                }),
              }
            );

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              shortSummary = aiData.content?.[0]?.text || "";
              summaryStatus = shortSummary ? "success" : "fail";
            } else {
              summaryStatus = "fail";
            }
          } catch (e) {
            console.error("AI summary error:", e);
            summaryStatus = "fail";
          }
        }
      }
    }

    // Fallback
    if (!shortSummary && topPapers.length > 0) {
      shortSummary = `Foram encontrados ${topPapers.length} artigo(s) publicado(s) sobre "${pathology}" com "${intervention}". Consulte os estudos listados para detalhes.`;
      summaryStatus = "success";
    } else if (topPapers.length === 0) {
      shortSummary = "Evidência insuficiente na biblioteca para este tópico.";
      summaryStatus = "insufficient";
    }

    // Remove abstract_text from response (only used for synthesis, not exposed to client)
    const responsePapers = topPapers.map(({ abstract_text, ...rest }: any) => rest);

    // Log panel summary
    await supabaseService.from("academy_ai_logs").insert({
      action: "reghen_panel_summary",
      user_id: user.id,
      input: { attendance_id, topic_key },
      output: {
        status: summaryStatus,
        paper_ids: topPapers.map((p: any) => p.paper_id),
        papers_count: topPapers.length,
        reason: summaryStatus === "insufficient" ? "no_abstracts_or_no_papers" : null,
      },
      status: summaryStatus === "fail" ? "error" : "success",
      duration_ms: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({
        papers: responsePapers,
        evidence_profile: evidenceProfile,
        short_summary: shortSummary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("reghen-evidence-panel error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
