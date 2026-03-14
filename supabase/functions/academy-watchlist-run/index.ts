/**
 * academy-watchlist-run v2
 *
 * Pipeline de descoberta automática de artigos científicos para o REGHEN.
 *
 * Fluxo:
 *   1. Busca PMIDs no PubMed para cada watchlist ativa
 *   2. Deduplica contra academy_papers e academy_curation_queue
 *   3. Busca título + abstract via PubMed efetch (batch)
 *   4. Insere novos artigos na queue com status=pending
 *   5. Pre-filtra com Claude Haiku (em paralelo):
 *      score >= 6 → awaiting_review (Gate 1)
 *      score < 6  → auto_rejected
 *   6. Loga em academy_agent_logs
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RELEVANCE_THRESHOLD = 6.0;
const MAX_ARTICLES_PER_RUN = 10;
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

// ============================================================
// PubMed — search
// ============================================================

async function searchPubMed(query: string, daysBack: number): Promise<string[]> {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);

  const fmt = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

  const apiKey = Deno.env.get("NCBI_API_KEY") ?? "";
  const keyParam = apiKey ? `&api_key=${apiKey}` : "";

  const url =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` +
    `?db=pubmed&term=${encodeURIComponent(query)}&retmax=20` +
    `&datetype=pdat&mindate=${fmt(dateFrom)}&maxdate=${fmt(dateTo)}&retmode=json${keyParam}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`PubMed esearch error: ${res.status}`);
  const data = await res.json();
  return data.esearchresult?.idlist ?? [];
}

// ============================================================
// PubMed — fetch article details (title, abstract, authors…)
// ============================================================

interface PubMedArticle {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  published_date: string | null;
  doi: string | null;
  pmcid: string | null;
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
}

function extractAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const t = m[1].replace(/<[^>]+>/g, "").trim();
    if (t) out.push(t);
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

function parseMonthToNum(m: string): string {
  const map: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  return map[m] ?? m.padStart(2, "0");
}

async function fetchPubMedDetails(pmids: string[]): Promise<PubMedArticle[]> {
  if (!pmids.length) return [];

  const apiKey = Deno.env.get("NCBI_API_KEY") ?? "";
  const keyParam = apiKey ? `&api_key=${apiKey}` : "";

  const url =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi` +
    `?db=pubmed&id=${pmids.join(",")}&rettype=abstract&retmode=xml${keyParam}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`PubMed efetch error: ${res.status}`);
  const xml = await res.text();

  const blocks = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/gi) ?? [];

  return blocks.map((block) => {
    const pmid = extractTag(block, "PMID");
    const title = decodeEntities(extractTag(block, "ArticleTitle"));

    const abstractParts = extractAllTags(block, "AbstractText");
    const abstract = decodeEntities(abstractParts.join(" ").trim());

    const journalBlock = block.match(/<Journal>[\s\S]*?<\/Journal>/i)?.[0] ?? "";
    const journal =
      extractTag(journalBlock, "Title") || extractTag(journalBlock, "ISOAbbreviation");

    const pubDateBlock = block.match(/<PubDate>[\s\S]*?<\/PubDate>/i)?.[0] ?? "";
    const year = extractTag(pubDateBlock, "Year");
    const monthRaw = extractTag(pubDateBlock, "Month") || "01";
    const month = /^\d+$/.test(monthRaw) ? monthRaw.padStart(2, "0") : parseMonthToNum(monthRaw);
    const day = (extractTag(pubDateBlock, "Day") || "01").padStart(2, "0");
    const published_date = year ? `${year}-${month}-${day}` : null;

    const authorBlocks = block.match(/<Author[^>]*>[\s\S]*?<\/Author>/gi) ?? [];
    const authors = authorBlocks.slice(0, 6).map((ab) => {
      const last = extractTag(ab, "LastName");
      const fore = extractTag(ab, "ForeName");
      return fore ? `${last} ${fore}` : last;
    }).filter(Boolean);

    const doiMatch = block.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/i);
    const pmcMatch = block.match(/<ArticleId IdType="pmc">([^<]+)<\/ArticleId>/i);

    return {
      pmid,
      title,
      abstract,
      authors,
      journal,
      published_date,
      doi: doiMatch?.[1].trim() ?? null,
      pmcid: pmcMatch?.[1].trim() ?? null,
    };
  });
}

// ============================================================
// Claude Haiku — pre-filter de relevância
// ============================================================

interface PrefilterResult {
  relevance_score: number;
  relevance_reasoning: string;
  study_type_hint: string;
  is_human_hint: boolean;
  area_hint: string;
}

async function prefilterWithHaiku(
  title: string,
  abstract: string,
  apiKey: string,
): Promise<PrefilterResult> {
  const content = abstract
    ? `TITLE: ${title}\n\nABSTRACT: ${abstract.slice(0, 1500)}`
    : `TITLE: ${title}\n\nABSTRACT: [Not available — title-only evaluation]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 512,
      system:
        "You are a clinical relevance filter for REGHEN, a platform for orthobiological " +
        "regenerative medicine (PRP, PRF, PPP, BMAC, Nanofat) applied to musculoskeletal conditions. " +
        "Evaluate articles strictly for relevance to this domain.",
      messages: [
        {
          role: "user",
          content: `Evaluate this article for relevance to orthobiological regenerative medicine:\n\n${content}\n\nUse the filter_article tool.`,
        },
      ],
      tools: [
        {
          name: "filter_article",
          description: "Evaluate article relevance for the REGHEN orthobiologics platform",
          input_schema: {
            type: "object",
            properties: {
              relevance_score: {
                type: "number",
                description:
                  "0–10. 9–10: core orthobiologic RCT/meta in humans with clinical outcomes. " +
                  "7–8: relevant human study, good methodology. " +
                  "5–6: peripheral relevance or animal/in vitro with clear orthobiologic application. " +
                  "3–4: weakly related (adjacent technique or basic science). " +
                  "0–2: not relevant to orthobiologics.",
              },
              relevance_reasoning: {
                type: "string",
                description: "1–2 sentences explaining the score.",
              },
              study_type_hint: {
                type: "string",
                enum: [
                  "meta", "systematic_review", "rct", "cohort",
                  "case_control", "case_series", "animal", "in_vitro", "other",
                ],
              },
              is_human_hint: {
                type: "boolean",
                description: "True if the study was conducted in humans.",
              },
              area_hint: {
                type: "string",
                enum: ["PRP", "PRF", "PPP", "BMP", "Outro"],
                description: "Primary orthobiologic area. Use Outro if mixed or unclear.",
              },
            },
            required: [
              "relevance_score", "relevance_reasoning",
              "study_type_hint", "is_human_hint", "area_hint",
            ],
          },
        },
      ],
      tool_choice: { type: "tool", name: "filter_article" },
    }),
  });

  if (!res.ok) throw new Error(`Haiku pre-filter HTTP error: ${res.status}`);

  const data = await res.json();
  const toolUse = data.content?.find(
    (c: any) => c.type === "tool_use" && c.name === "filter_article",
  );
  if (!toolUse) throw new Error("Haiku response missing tool_use");

  return toolUse.input as PrefilterResult;
}

// ============================================================
// Main handler
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Admin check
    const [adminAcademy, adminGlobal] = await Promise.all([
      supabase.from("academy_user_roles").select("role")
        .eq("user_id", userId).eq("role", "admin_academy").maybeSingle(),
      supabase.from("user_roles").select("role")
        .eq("user_id", userId).eq("role", "admin").maybeSingle(),
    ]);
    if (!adminAcademy.data && !adminGlobal.data) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas administradores." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY não configurada");

    // Watchlists
    const body = await req.json().catch(() => ({}));
    const wlQuery = supabase.from("academy_pubmed_watchlists").select("*");
    if (body.watchlist_id) {
      wlQuery.eq("id", body.watchlist_id);
    } else {
      wlQuery.eq("active", true);
    }
    const { data: watchlists, error: wlErr } = await wlQuery;
    if (wlErr || !watchlists?.length) {
      return new Response(JSON.stringify({ error: "Nenhuma watchlist encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate counters
    let totalFound = 0, totalNew = 0, totalQueued = 0;
    let totalAwaitingReview = 0, totalAutoRejected = 0;
    const allErrors: any[] = [];

    for (const watchlist of watchlists) {
      const daysBack = watchlist.frequency === "daily" ? 2 : 8;

      // 1. Search PubMed
      const pmids = await searchPubMed(watchlist.query, daysBack);
      totalFound += pmids.length;

      // 2. Dedup: exclude PMIDs already in academy_papers OR academy_curation_queue
      const [existingPapers, existingQueue] = await Promise.all([
        supabase.from("academy_papers").select("pmid").in("pmid", pmids).is("deleted_at", null),
        supabase.from("academy_curation_queue").select("pmid").in("pmid", pmids),
      ]);
      const known = new Set([
        ...(existingPapers.data?.map((p: any) => p.pmid) ?? []),
        ...(existingQueue.data?.map((q: any) => q.pmid) ?? []),
      ]);
      const newPmids = pmids.filter((id) => !known.has(id)).slice(0, MAX_ARTICLES_PER_RUN);
      totalNew += newPmids.length;

      if (!newPmids.length) {
        await supabase
          .from("academy_pubmed_watchlists")
          .update({ last_run_at: new Date().toISOString() })
          .eq("id", watchlist.id);
        continue;
      }

      // 3. Fetch details from PubMed
      const articles = await fetchPubMedDetails(newPmids);

      // 4. Insert into queue as pending
      const payload = articles
        .filter((a) => a.pmid && a.title)
        .map((a) => ({
          pmid: a.pmid,
          doi: a.doi,
          pmcid: a.pmcid,
          title: a.title,
          abstract: a.abstract || null,
          authors: a.authors,
          journal: a.journal || null,
          published_date: a.published_date,
          source: "pubmed_auto",
          status: "pending",
          uploaded_by: userId,
          keywords: [],
        }));

      if (!payload.length) continue;

      const { data: inserted, error: insertErr } = await supabase
        .from("academy_curation_queue")
        .insert(payload)
        .select("id, title, abstract");

      if (insertErr || !inserted) {
        allErrors.push({ watchlist: watchlist.query, error: insertErr?.message });
        continue;
      }
      totalQueued += inserted.length;

      // 5. Pre-filter with Haiku (parallel)
      const results = await Promise.allSettled(
        inserted.map(async (item: any) => {
          // Mark as processing
          await supabase
            .from("academy_curation_queue")
            .update({ status: "processing", updated_at: new Date().toISOString() })
            .eq("id", item.id);

          const pf = await prefilterWithHaiku(
            item.title,
            item.abstract ?? "",
            ANTHROPIC_API_KEY,
          );

          const newStatus = pf.relevance_score >= RELEVANCE_THRESHOLD
            ? "awaiting_review"
            : "auto_rejected";

          await supabase
            .from("academy_curation_queue")
            .update({
              status: newStatus,
              relevance_score: pf.relevance_score,
              relevance_reasoning: pf.relevance_reasoning,
              study_type_hint: pf.study_type_hint,
              is_human_hint: pf.is_human_hint,
              area_hint: pf.area_hint,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          return { status: newStatus, score: pf.relevance_score };
        }),
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          r.value.status === "awaiting_review" ? totalAwaitingReview++ : totalAutoRejected++;
        } else {
          const errMsg = r.reason?.message ?? "prefilter error";
          allErrors.push({ error: errMsg });
          // Mark article as error (best-effort, don't await)
          supabase
            .from("academy_curation_queue")
            .update({ status: "error", error_message: errMsg, updated_at: new Date().toISOString() })
            .eq("uploaded_by", userId!).eq("status", "processing");
        }
      }

      // Update watchlist last_run
      await supabase
        .from("academy_pubmed_watchlists")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", watchlist.id);
    }

    const duration_ms = Date.now() - startTime;

    const summary = {
      ok: true,
      total_found: totalFound,
      total_new: totalNew,
      total_queued: totalQueued,
      awaiting_review: totalAwaitingReview,
      auto_rejected: totalAutoRejected,
      errors: allErrors.length,
      error_details: allErrors,
      duration_ms,
    };

    // Log
    await supabase.from("academy_agent_logs").insert({
      run_type: "pubmed_scan",
      status: allErrors.length === 0 ? "success" : totalQueued > 0 ? "partial" : "error",
      articles_found: totalNew,
      articles_curated: totalAwaitingReview,
      error_details: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
      duration_ms,
    });

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Watchlist run error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    if (userId) {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await sb.from("academy_agent_logs").insert({
        run_type: "pubmed_scan",
        status: "error",
        articles_found: 0,
        articles_curated: 0,
        error_details: message,
        duration_ms: Date.now() - startTime,
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
