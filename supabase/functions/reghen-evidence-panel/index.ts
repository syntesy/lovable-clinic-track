import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_MODEL = "google/gemini-2.5-flash";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
      // Check admin
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
        "id, title, year, journal, authors, evidence_score, evidence_label, curation_data, curation_status"
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
            "id, title, year, journal, authors, evidence_score, evidence_label, curation_data, curation_status"
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

    // Generate short summary via AI
    let shortSummary = "";
    if (topPapers.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const paperDescriptions = topPapers
            .map(
              (p: any, i: number) =>
                `${i + 1}. "${p.title}" (${p.year || "N/A"}, ${p.journal || "N/A"}) — Score: ${p.evidence_score || "N/A"}, Tipo: ${p.study_type || "N/A"}`
            )
            .join("\n");

          const aiResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                  {
                    role: "system",
                    content: `Você é um sistema de síntese científica. Gere uma síntese curta (2-5 linhas) sobre o tópico "${topic_key}" baseando-se EXCLUSIVAMENTE nos artigos listados. NÃO prescreva conduta. NÃO invente dados. Use linguagem como "a evidência sugere", "os estudos apontam". Responda em português.`,
                  },
                  {
                    role: "user",
                    content: `Artigos disponíveis sobre "${topic_key}":\n\n${paperDescriptions}\n\nGere uma síntese curta e grounded.`,
                  },
                ],
              }),
            }
          );

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            shortSummary = aiData.choices?.[0]?.message?.content || "";
          }
        } catch (e) {
          console.error("AI summary error:", e);
        }
      }
    }

    if (!shortSummary && topPapers.length > 0) {
      shortSummary = `Foram encontrados ${topPapers.length} artigo(s) publicado(s) sobre "${pathology}" com "${intervention}".`;
    } else if (topPapers.length === 0) {
      shortSummary = `Nenhum artigo publicado encontrado para o tópico "${topic_key}" na biblioteca atual.`;
    }

    return new Response(
      JSON.stringify({
        papers: topPapers,
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
