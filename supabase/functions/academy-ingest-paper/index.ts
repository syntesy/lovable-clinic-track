import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ═══════════════════════════════════════════════════════════
// academy-ingest-paper — Pipeline ingestion motor (Etapa 3)
// Routes: PUBMED_ABSTRACT → PMC_XML → PDF_GROBID
// ═══════════════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Constants ────────────────────────────────────────────
const LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;
const EXTERNAL_API_TIMEOUT_MS = 15_000;
const MIN_TEXT_FOR_CURATION_CHARS = 300;

type RouteUsed = "pubmed" | "pmc_xml" | "publisher_html" | "pdf_grobid";
type NextAction = "CURATE" | "UPLOAD_PDF" | "REVIEW" | "NONE";

// ── Helpers ──────────────────────────────────────────────
function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, message: string, code: string, requestId?: string) {
  return new Response(
    JSON.stringify({ ok: false, error: message, code, request_id: requestId }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function jitter(base: number): number {
  return base + Math.random() * base * 0.3;
}

/** Fetch with timeout */
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = EXTERNAL_API_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Retry wrapper for external API calls */
async function withRetries<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = MAX_RETRIES,
): Promise<{ data: T; retryCount: number }> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn();
      return { data, retryCount: attempt };
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = jitter(BASE_RETRY_DELAY_MS * Math.pow(2, attempt));
        console.warn(`[${label}:retry] attempt=${attempt + 1}/${maxRetries} delay=${Math.round(delay)}ms error=${err.message}`);
        await sleep(delay);
      }
    }
  }
  throw lastError!;
}

// ── PubMed E-utilities ───────────────────────────────────
interface PubMedResult {
  pmid: string | null;
  doi: string | null;
  pmcid: string | null;
  title: string;
  authors: string | null;
  journal: string | null;
  year: number | null;
  abstract_text: string | null;
  mesh_terms: string[] | null;
  raw_xml_length: number;
}

async function fetchPubMedByPmid(pmid: string): Promise<PubMedResult> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=xml&retmode=xml`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`PubMed efetch error: ${res.status}`);
  const xml = await res.text();
  return parsePubMedXml(xml, pmid);
}

async function resolvePmidFromDoi(doi: string): Promise<string | null> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(doi)}[doi]&retmode=json`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const ids = data?.esearchresult?.idlist;
    return ids?.length > 0 ? ids[0] : null;
  } catch {
    return null;
  }
}

async function resolvePmcid(pmid: string): Promise<string | null> {
  const url = `https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids=${pmid}&format=json`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const record = data?.records?.[0];
    return record?.pmcid || null;
  } catch {
    return null;
  }
}

function parsePubMedXml(xml: string, pmid: string): PubMedResult {
  const extract = (tag: string) => {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return match ? match[1].replace(/<[^>]+>/g, "").trim() : null;
  };
  const extractAll = (tag: string) =>
    [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g"))].map((m) =>
      m[1].replace(/<[^>]+>/g, "").trim()
    );

  const title = extract("ArticleTitle") || "Título não disponível";
  const abstractTexts = extractAll("AbstractText");
  const abstract_text = abstractTexts.length > 0 ? abstractTexts.join(" ") : null;
  const lastNames = extractAll("LastName");
  const foreNames = extractAll("ForeName");
  const authors = lastNames.map((ln, i) => (foreNames[i] ? `${ln} ${foreNames[i]}` : ln)).join(", ");
  const journal = extract("Title") || extract("ISOAbbreviation");
  const yearMatch = xml.match(/<PubDate[^>]*>[\\s\\S]*?<Year>(\d{4})<\/Year>/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  const doiMatch = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
  const doi = doiMatch ? doiMatch[1].trim() : null;
  const pmcidMatch = xml.match(/<ArticleId IdType="pmc">([^<]+)<\/ArticleId>/);
  const pmcid = pmcidMatch ? pmcidMatch[1].trim() : null;
  const meshTerms = extractAll("DescriptorName");

  return {
    pmid,
    doi,
    pmcid,
    title,
    authors: authors || null,
    journal: journal || null,
    year,
    abstract_text,
    mesh_terms: meshTerms.length > 0 ? meshTerms : null,
    raw_xml_length: xml.length,
  };
}

// ── PMC Open Access XML ──────────────────────────────────
interface FulltextStructured {
  abstract: string | null;
  introduction: string | null;
  methods: string | null;
  results: string | null;
  discussion: string | null;
  conclusion: string | null;
  raw_text: string;
  quality_flags: string[];
  char_count: number;
  word_count: number;
}

async function fetchPmcFulltext(pmcid: string): Promise<FulltextStructured> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcid}&rettype=xml&retmode=xml`;
  const res = await fetchWithTimeout(url, {}, 20_000); // PMC can be slow
  if (!res.ok) throw new Error(`PMC efetch error: ${res.status}`);
  const xml = await res.text();
  return parsePmcXml(xml);
}

function parsePmcXml(xml: string): FulltextStructured {
  const qualityFlags: string[] = [];

  // Extract sections by <sec sec-type="..."> or <title>...</title>
  function extractSection(sectionTypes: string[], titlePatterns: RegExp[]): string | null {
    // Try sec-type first
    for (const st of sectionTypes) {
      const re = new RegExp(`<sec[^>]*sec-type="${st}"[^>]*>([\\s\\S]*?)</sec>`, "i");
      const m = xml.match(re);
      if (m) return stripXmlTags(m[1]);
    }
    // Try title match
    for (const tp of titlePatterns) {
      const re = new RegExp(`<sec[^>]*>\\s*<title[^>]*>(${tp.source})</title>([\\s\\S]*?)</sec>`, "i");
      const m = xml.match(re);
      if (m) return stripXmlTags(m[2]);
    }
    return null;
  }

  const abstract_text = extractXmlSection(xml, "abstract");
  const introduction = extractSection(["intro", "introduction"], [/introduction/i, /background/i]);
  const methods = extractSection(["methods", "materials"], [/methods?/i, /materials?\s+and\s+methods?/i, /experimental/i]);
  const results = extractSection(["results"], [/results?/i, /findings/i]);
  const discussion = extractSection(["discussion"], [/discussion/i]);
  const conclusion = extractSection(["conclusions"], [/conclusions?/i, /summary/i]);

  if (!methods) qualityFlags.push("missing_methods");
  if (!results) qualityFlags.push("missing_results");
  if (!abstract_text && !introduction && !methods && !results) qualityFlags.push("only_abstract");

  // Build full raw text from body
  const bodyMatch = xml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const rawBody = bodyMatch ? stripXmlTags(bodyMatch[1]) : "";
  const rawText = [abstract_text, introduction, methods, results, discussion, conclusion]
    .filter(Boolean)
    .join("\n\n") || rawBody;

  const words = rawText.split(/\s+/).filter((w) => w.length > 0);

  return {
    abstract: abstract_text,
    introduction,
    methods,
    results,
    discussion,
    conclusion,
    raw_text: rawText,
    quality_flags: qualityFlags,
    char_count: rawText.length,
    word_count: words.length,
  };
}

function extractXmlSection(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? stripXmlTags(m[1]).trim() : null;
}

function stripXmlTags(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Fingerprint ──────────────────────────────────────────
async function generateFingerprint(title: string, year: number | null, journal: string | null): Promise<string> {
  const raw = `${title.toLowerCase().trim()}|${year ?? ""}|${(journal ?? "").toLowerCase().trim()}`;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
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
  let supabase: any = null;
  let paperId: string | null = null;

  try {
    // ── Auth ──────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "Sessão expirada.", "UNAUTHORIZED", requestId);
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return errorResponse(401, "Sessão expirada.", "UNAUTHORIZED", requestId);
    }
    const userId = user.id;

    supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Role check ───────────────────────────────────
    const { data: roleData } = await supabase
      .from("academy_user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const academyRole = roleData?.role || "student";
    if (!["admin_academy", "teacher_approved", "teacher_candidate"].includes(academyRole)) {
      const { data: generalRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!generalRole) {
        return errorResponse(403, "Permissão insuficiente.", "FORBIDDEN", requestId);
      }
    }

    // ── Parse input ──────────────────────────────────
    const body = await req.json();
    paperId = body.paper_id;
    const force = body.force === true;

    if (!paperId) {
      return errorResponse(400, "paper_id é obrigatório.", "MISSING_PAPER_ID", requestId);
    }

    // ── Acquire lock (transactional) ─────────────────
    const now = new Date().toISOString();
    const staleCutoff = new Date(Date.now() - LOCK_TTL_MS).toISOString();

    // Allowed statuses for ingestion
    const allowedStatuses = ["ingesting", "needs_input", "error"];
    if (force) {
      allowedStatuses.push("draft", "curating", "ready", "rejected");
    }

    // Conditional UPDATE: acquire lock only if available or stale
    const { data: locked, error: lockErr } = await supabase
      .from("academy_papers")
      .update({
        locked_for_processing: true,
        processing_started_at: now,
      })
      .eq("id", paperId)
      .is("deleted_at", null)
      .or(
        `locked_for_processing.eq.false,processing_started_at.lt.${staleCutoff},processing_started_at.is.null`
      )
      .in("curation_status", allowedStatuses)
      .select("id, title, doi, pmid, import_source, import_payload, curation_status, abstract_text, authors, journal, year, mesh_terms, fingerprint, version")
      .maybeSingle();

    if (lockErr) throw new Error(`Lock error: ${lockErr.message}`);
    if (!locked) {
      return errorResponse(409, "Paper já está sendo processado ou não está em status permitido.", "ALREADY_PROCESSING", requestId);
    }

    const paper = locked;
    console.log(`[ingest:locked] paper=${paperId} status=${paper.curation_status} source=${paper.import_source}`);

    // ── State tracking ───────────────────────────────
    let routeUsed: RouteUsed = "pubmed";
    let nextAction: NextAction = "NONE";
    let summary = "";
    let ingestionAttemptId: string | null = null;
    let finalStatus = paper.curation_status;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // ═══════════════════════════════════════════════
      // ROUTE A — PubMed metadata (always runs first)
      // ═══════════════════════════════════════════════
      let pmid = paper.pmid;
      let doi = paper.doi;
      let pmcid: string | null = null;
      let pubmedResult: PubMedResult | null = null;

      // Resolve PMID from DOI if needed
      if (!pmid && doi) {
        try {
          const { data: resolvedPmid } = await withRetries(
            () => resolvePmidFromDoi(doi!),
            "resolve-pmid",
            2,
          );
          if (resolvedPmid) {
            pmid = resolvedPmid;
            console.log(`[ingest:resolve] DOI→PMID: ${doi} → ${pmid}`);
          }
        } catch (e: any) {
          console.warn(`[ingest:resolve] DOI→PMID failed: ${e.message}`);
          warnings.push(`Não foi possível resolver PMID a partir do DOI: ${e.message}`);
        }
      }

      // Fetch PubMed metadata
      if (pmid) {
        try {
          const { data: result, retryCount } = await withRetries(
            () => fetchPubMedByPmid(pmid!),
            "pubmed-fetch",
          );
          pubmedResult = result;
          routeUsed = "pubmed";

          // Update paper metadata
          const metadataUpdate: Record<string, unknown> = {
            title: result.title,
            authors: result.authors || paper.authors,
            journal: result.journal || paper.journal,
            year: result.year || paper.year,
            abstract_text: result.abstract_text || paper.abstract_text,
            mesh_terms: result.mesh_terms || paper.mesh_terms,
            pmid: result.pmid || pmid,
          };
          if (result.doi && !doi) {
            metadataUpdate.doi = result.doi;
            doi = result.doi;
          }

          // Generate fingerprint
          const fp = await generateFingerprint(result.title, result.year, result.journal);
          metadataUpdate.fingerprint = fp;

          await supabase.from("academy_papers").update(metadataUpdate).eq("id", paperId);

          // Log ingestion attempt
          const { data: attempt } = await supabase
            .from("academy_paper_ingestion")
            .insert({
              paper_id: paperId,
              route_used: "pubmed",
              source_identifier: pmid,
              status: "success",
              duration_ms: Date.now() - startTime,
              created_by: userId,
              retry_count: retryCount,
              raw_payload: { xml_length: result.raw_xml_length, fetched_at: new Date().toISOString() },
              parsed_fields: {
                title: result.title,
                authors: !!result.authors,
                abstract: !!result.abstract_text,
                year: result.year,
                doi: result.doi,
                pmcid: result.pmcid,
                mesh_terms_count: result.mesh_terms?.length || 0,
              },
            })
            .select("id")
            .single();

          ingestionAttemptId = attempt?.id || null;

          // Resolve PMCID
          pmcid = result.pmcid;
          if (!pmcid) {
            try {
              pmcid = await resolvePmcid(pmid);
              if (pmcid) console.log(`[ingest:pmcid] Resolved: ${pmcid}`);
            } catch {
              console.warn("[ingest:pmcid] Resolution failed (non-fatal)");
            }
          }

          summary = `PubMed metadata OK (PMID: ${pmid})`;
          console.log(`[ingest:pubmed:ok] title="${result.title}" abstract=${!!result.abstract_text} pmcid=${pmcid}`);
        } catch (e: any) {
          console.error(`[ingest:pubmed:fail] ${e.message}`);
          errors.push(`PubMed fetch failed: ${e.message}`);

          await supabase.from("academy_paper_ingestion").insert({
            paper_id: paperId,
            route_used: "pubmed",
            source_identifier: pmid,
            status: "fail",
            error_message: e.message,
            duration_ms: Date.now() - startTime,
            created_by: userId,
            retry_count: MAX_RETRIES,
          });
        }
      } else {
        summary = "Sem PMID — PubMed skipped";
        warnings.push("PMID não disponível. Metadata pode estar incompleta.");
      }

      // ═══════════════════════════════════════════════
      // ROUTE B — PMC XML (if PMCID exists)
      // GOLDEN RULE: If PMCID exists, do NOT fall through to PDF
      // ═══════════════════════════════════════════════
      let hasFulltext = false;

      // Check if fulltext already exists (unless force)
      if (!force) {
        const { data: existingFt } = await supabase
          .from("academy_paper_fulltext")
          .select("id, has_sufficient_text")
          .eq("paper_id", paperId)
          .maybeSingle();

        if (existingFt?.has_sufficient_text) {
          hasFulltext = true;
          summary += " | Fulltext já existente";
          console.log(`[ingest:fulltext] Already exists, skipping extraction`);
        }
      }

      if (!hasFulltext && pmcid) {
        console.log(`[ingest:pmc] Fetching full text for ${pmcid}...`);
        try {
          const { data: ftResult, retryCount } = await withRetries(
            () => fetchPmcFulltext(pmcid!),
            "pmc-fetch",
          );

          routeUsed = "pmc_xml";

          if (ftResult.char_count >= MIN_TEXT_FOR_CURATION_CHARS) {
            hasFulltext = true;

            // Upsert into academy_paper_fulltext
            await supabase
              .from("academy_paper_fulltext")
              .upsert({
                paper_id: paperId,
                extracted_text: ftResult.raw_text.slice(0, 250_000),
                char_count: ftResult.char_count,
                word_count: ftResult.word_count,
                extraction_method: "pmc_xml",
                has_sufficient_text: true,
                is_scanned: false,
                abstract: ftResult.abstract,
                abstract_source: "pmc_xml",
                abstract_char_count: ftResult.abstract?.length || 0,
              }, { onConflict: "paper_id" });

            // Log ingestion attempt
            const { data: pmcAttempt } = await supabase
              .from("academy_paper_ingestion")
              .insert({
                paper_id: paperId,
                route_used: "pmc_xml",
                source_identifier: pmcid,
                status: "success",
                duration_ms: Date.now() - startTime,
                created_by: userId,
                retry_count: retryCount,
                fulltext_structured: {
                  abstract: !!ftResult.abstract,
                  introduction: !!ftResult.introduction,
                  methods: !!ftResult.methods,
                  results: !!ftResult.results,
                  discussion: !!ftResult.discussion,
                  conclusion: !!ftResult.conclusion,
                  quality_flags: ftResult.quality_flags,
                },
                parsed_fields: {
                  char_count: ftResult.char_count,
                  word_count: ftResult.word_count,
                  quality_flags: ftResult.quality_flags,
                },
              })
              .select("id")
              .single();

            ingestionAttemptId = pmcAttempt?.id || ingestionAttemptId;
            summary += ` | PMC XML OK (${ftResult.char_count} chars, ${ftResult.word_count} words)`;

            if (ftResult.quality_flags.length > 0) {
              warnings.push(`PMC quality flags: ${ftResult.quality_flags.join(", ")}`);
            }
          } else {
            warnings.push(`PMC XML texto insuficiente (${ftResult.char_count} chars)`);
            summary += " | PMC XML: texto insuficiente";
          }

          console.log(`[ingest:pmc:ok] chars=${ftResult.char_count} words=${ftResult.word_count} flags=${ftResult.quality_flags.join(",")}`);
        } catch (e: any) {
          console.error(`[ingest:pmc:fail] ${e.message}`);
          errors.push(`PMC fetch failed: ${e.message}`);
          warnings.push(`Falha ao buscar full text do PMC: ${e.message}`);

          await supabase.from("academy_paper_ingestion").insert({
            paper_id: paperId,
            route_used: "pmc_xml",
            source_identifier: pmcid,
            status: "fail",
            error_message: e.message,
            duration_ms: Date.now() - startTime,
            created_by: userId,
            retry_count: MAX_RETRIES,
          });

          // PMC failed but PMCID exists → do NOT fall through to PDF (golden rule)
          // Create review task instead
          await supabase.from("academy_review_task").insert({
            paper_id: paperId,
            reason: "parser_error",
            status: "open",
            created_by: userId,
          });

          warnings.push("PMC XML falhou. Review task criada. PDF fallback bloqueado (PMCID existe).");
        }
      }

      // ═══════════════════════════════════════════════
      // ROUTE C — PDF + extraction (fallback final)
      // Only if: no PMCID AND no fulltext AND PDF exists
      // ═══════════════════════════════════════════════
      if (!hasFulltext && !pmcid) {
        // Check if PDF is available
        const storagePath = paper.import_payload?.storage_path;
        const { data: pdfFile } = await supabase
          .from("academy_paper_files")
          .select("id, storage_path, processing_status")
          .eq("paper_id", paperId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const pdfPath = pdfFile?.storage_path || storagePath;

        if (pdfPath) {
          console.log(`[ingest:pdf] Triggering PDF extraction for ${pdfPath}...`);
          routeUsed = "pdf_grobid";

          // Fire-and-forget: trigger existing academy-extract-pdf-text
          try {
            const processUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/academy-extract-pdf-text`;
            await fetch(processUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paper_id: paperId,
                file_id: pdfFile?.id,
                request_id: requestId,
                force,
              }),
            });

            // Log attempt
            await supabase.from("academy_paper_ingestion").insert({
              paper_id: paperId,
              route_used: "pdf_grobid",
              source_identifier: pdfPath,
              status: "pending",
              created_by: userId,
            });

            summary += " | PDF extraction triggered (async)";
            // Don't set hasFulltext=true since it's async
            // The extract function will update status when done
            nextAction = "NONE"; // Will be resolved async
          } catch (e: any) {
            console.error(`[ingest:pdf:trigger] ${e.message}`);
            errors.push(`PDF trigger failed: ${e.message}`);
          }
        } else {
          // No PDF available → needs input
          summary += " | Sem PMCID e sem PDF — necessário upload";
          nextAction = "UPLOAD_PDF";
        }
      }

      // ═══════════════════════════════════════════════
      // Determine final status and next action
      // ═══════════════════════════════════════════════
      if (hasFulltext) {
        finalStatus = "curating";
        nextAction = "CURATE";
        summary += " → Status: CURATING";
      } else if (nextAction === "UPLOAD_PDF") {
        finalStatus = "needs_input";
        summary += " → Status: NEEDS_INPUT";
      } else if (routeUsed === "pdf_grobid") {
        // Async PDF processing — keep as ingesting
        finalStatus = "ingesting";
        summary += " → Status: INGESTING (PDF async)";
      } else if (errors.length > 0 && !pubmedResult?.abstract_text && !paper.abstract_text) {
        // All routes failed, no abstract either
        finalStatus = "error";
        nextAction = "REVIEW";
        summary += " → Status: ERROR";

        // Create review task
        await supabase.from("academy_review_task").insert({
          paper_id: paperId,
          reason: "parser_error",
          status: "open",
          created_by: userId,
        }).onConflict("paper_id,reason").ignore();
      } else if (pubmedResult?.abstract_text || paper.abstract_text) {
        // We have abstract but no fulltext → can do limited curation
        finalStatus = "curating";
        nextAction = "CURATE";
        warnings.push("Curadoria será feita apenas com abstract (sem full text).");
        summary += " → Status: CURATING (abstract only)";
      } else {
        finalStatus = "needs_input";
        nextAction = "REVIEW";
      }

      // Update paper status
      await supabase.from("academy_papers").update({
        curation_status: finalStatus,
        warnings: [...(paper.warnings || []), ...warnings].slice(0, 20),
      }).eq("id", paperId);

    } finally {
      // ── ALWAYS release lock ────────────────────────
      if (supabase && paperId) {
        await supabase.from("academy_papers").update({
          locked_for_processing: false,
          processing_started_at: null,
        }).eq("id", paperId);
        console.log(`[ingest:unlock] paper=${paperId}`);
      }
    }

    // ── Log success ──────────────────────────────────
    await supabase.from("academy_ai_logs").insert({
      action: "ingest_paper",
      paper_id: paperId,
      user_id: user.id,
      request_id: requestId,
      input: { paper_id: paperId, force },
      output: {
        route_used: routeUsed,
        next_action: nextAction,
        final_status: finalStatus,
        ingestion_attempt_id: ingestionAttemptId,
        errors,
        warnings,
      },
      status: "success",
      duration_ms: Date.now() - startTime,
    });

    return jsonResponse({
      ok: true,
      paper_id: paperId,
      status: finalStatus,
      route_used: routeUsed,
      ingestion_attempt_id: ingestionAttemptId,
      next_action: nextAction,
      summary,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      request_id: requestId,
    });

  } catch (error) {
    console.error("[ingest:error]", error);
    const message = error instanceof Error ? error.message : "Erro interno na ingestão.";

    // Release lock on error
    if (supabase && paperId) {
      try {
        await supabase.from("academy_papers").update({
          locked_for_processing: false,
          processing_started_at: null,
          curation_status: "error",
          error_code: message.slice(0, 200),
        }).eq("id", paperId);
      } catch (_) { /* non-fatal */ }
    }

    // Log failure
    if (supabase) {
      try {
        await supabase.from("academy_ai_logs").insert({
          action: "ingest_paper",
          user_id: "00000000-0000-0000-0000-000000000000",
          request_id: requestId,
          input: { paper_id: paperId, error_context: "ingest_failed" },
          status: "fail",
          error_message: message,
          duration_ms: Date.now() - startTime,
        });
      } catch (_) { /* non-fatal */ }
    }

    return errorResponse(500, message, "INTERNAL_ERROR", requestId);
  }
});
