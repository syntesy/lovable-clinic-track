import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ========== PubMed E-utilities ==========
async function fetchFromPubMed(pmid: string) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=xml&retmode=xml`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PubMed API error: ${res.status}`);
  const xml = await res.text();
  return parsePubMedXml(xml, pmid);
}

function parsePubMedXml(xml: string, pmid: string) {
  const extract = (tag: string) => {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return match ? match[1].replace(/<[^>]+>/g, "").trim() : null;
  };

  const extractAll = (tag: string) => {
    const matches = [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g"))];
    return matches.map((m) => m[1].replace(/<[^>]+>/g, "").trim());
  };

  const title = extract("ArticleTitle") || "Título não disponível";
  const abstractTexts = extractAll("AbstractText");
  const abstract_text = abstractTexts.length > 0 ? abstractTexts.join(" ") : null;
  const lastNames = extractAll("LastName");
  const foreNames = extractAll("ForeName");
  const authors = lastNames
    .map((ln, i) => (foreNames[i] ? `${ln} ${foreNames[i]}` : ln))
    .join(", ");
  const journal = extract("Title") || extract("ISOAbbreviation");
  const yearMatch = xml.match(/<PubDate[^>]*>[\s\S]*?<Year>(\d{4})<\/Year>/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  const doiMatch = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
  const doi = doiMatch ? doiMatch[1].trim() : null;
  const meshTerms = extractAll("DescriptorName");

  return {
    pmid,
    doi,
    title,
    authors: authors || null,
    journal: journal || null,
    year,
    abstract_text,
    mesh_terms: meshTerms.length > 0 ? meshTerms : null,
    import_payload: { source: "pubmed", raw_xml_length: xml.length, fetched_at: new Date().toISOString() },
    warnings: abstract_text ? [] : ["Abstract não disponível. Curadoria limitada."],
  };
}

// ========== Crossref API ==========
async function fetchFromCrossref(doi: string) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "REGHEN-Academy/1.0 (mailto:contato@reghen.com)" },
  });
  if (!res.ok) throw new Error(`Crossref API error: ${res.status}`);
  const data = await res.json();
  const work = data.message;

  const title = work.title?.[0] || "Título não disponível";
  const authors = (work.author || [])
    .map((a: any) => `${a.family || ""} ${a.given || ""}`.trim())
    .join(", ");
  const journal = work["container-title"]?.[0] || null;
  const year = work.published?.["date-parts"]?.[0]?.[0] || work.created?.["date-parts"]?.[0]?.[0] || null;
  const abstract_text = work.abstract
    ? work.abstract.replace(/<[^>]+>/g, "").trim()
    : null;

  return {
    pmid: null,
    doi,
    title,
    authors: authors || null,
    journal,
    year,
    abstract_text,
    mesh_terms: null,
    import_payload: { source: "crossref", fetched_at: new Date().toISOString() },
    warnings: abstract_text ? [] : ["Abstract não disponível. Curadoria limitada."],
  };
}

// ========== Fingerprint for dedup without PMID/DOI ==========
async function generateFingerprint(title: string, year: number | null, journal: string | null): Promise<string> {
  const raw = `${title.toLowerCase().trim()}|${year ?? ""}|${(journal ?? "").toLowerCase().trim()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ========== Normalize DOI ==========
function normalizeDoi(doi: string): string {
  return doi.toLowerCase().trim().replace(/^https?:\/\/doi\.org\//i, "");
}

// ========== Input parsing ==========
function parseInput(input: string): { type: "pmid" | "doi"; value: string } {
  const trimmed = input.trim();

  const pmidMatch = trimmed.match(/(?:pubmed\.ncbi\.nlm\.nih\.gov\/|^)(\d{5,12})(?:\/|$)/);
  if (pmidMatch) return { type: "pmid", value: pmidMatch[1] };

  if (/^\d{5,12}$/.test(trimmed)) return { type: "pmid", value: trimmed };

  const doiMatch = trimmed.match(/(?:doi\.org\/|^)(10\.\d{4,}\/[^\s]+)/i);
  if (doiMatch) return { type: "doi", value: normalizeDoi(doiMatch[1]) };

  throw new Error("Entrada inválida. Forneça um PMID, URL do PubMed, DOI ou URL do DOI.");
}

Deno.serve(async (req) => {
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

    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = claims.claims.sub as string;

    const { identifier } = await req.json();
    if (!identifier || typeof identifier !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo 'identifier' é obrigatório (PMID, DOI ou URL)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = parseInput(identifier);

    // Normalize DOI for dedup
    const dupColumn = parsed.type === "pmid" ? "pmid" : "doi";
    const dupValue = parsed.type === "doi" ? normalizeDoi(parsed.value) : parsed.value;

    const { data: existing } = await supabaseAuth
      .from("academy_papers")
      .select("*")
      .eq(dupColumn, dupValue)
      .maybeSingle();

    if (existing) {
      await supabaseAuth.from("academy_ai_logs").insert({
        action: "admin_import",
        paper_id: existing.id,
        user_id: userId,
        input: { identifier, parsed_type: parsed.type, parsed_value: parsed.value, dedup: true },
        output: { paper_id: existing.id, title: existing.title, deduplicated: true },
        status: "success",
        duration_ms: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({
          paper: existing,
          warnings: existing.warnings || [],
          deduplicated: true,
          message: `Artigo já importado: "${existing.title}"`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch metadata
    const paperData =
      parsed.type === "pmid"
        ? await fetchFromPubMed(parsed.value)
        : await fetchFromCrossref(dupValue);

    // Generate fingerprint for dedup without PMID/DOI
    const fp = await generateFingerprint(paperData.title, paperData.year, paperData.journal);

    // Check fingerprint dedup
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: fpExisting } = await supabaseService
      .from("academy_papers")
      .select("*")
      .eq("fingerprint", fp)
      .maybeSingle();

    if (fpExisting) {
      await supabaseAuth.from("academy_ai_logs").insert({
        action: "admin_import",
        paper_id: fpExisting.id,
        user_id: userId,
        input: { identifier, fingerprint: fp, dedup: true },
        output: { paper_id: fpExisting.id, title: fpExisting.title, deduplicated: true, dedup_method: "fingerprint" },
        status: "success",
        duration_ms: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({
          paper: fpExisting,
          warnings: fpExisting.warnings || [],
          deduplicated: true,
          message: `Artigo já importado (fingerprint): "${fpExisting.title}"`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert paper with fingerprint
    const { data: paper, error: insertErr } = await supabaseAuth
      .from("academy_papers")
      .insert({
        ...paperData,
        doi: paperData.doi ? normalizeDoi(paperData.doi) : null,
        fingerprint: fp,
        import_source: parsed.type,
        curation_status: "draft",
        created_by: userId,
      })
      .select()
      .single();

    if (insertErr) throw new Error(`Erro ao salvar: ${insertErr.message}`);

    const duration_ms = Date.now() - startTime;
    await supabaseAuth.from("academy_ai_logs").insert({
      action: "admin_import",
      paper_id: paper.id,
      user_id: userId,
      input: { identifier, parsed_type: parsed.type, parsed_value: parsed.value },
      output: { paper_id: paper.id, title: paper.title, has_abstract: !!paper.abstract_text, fingerprint: fp },
      status: "success",
      duration_ms,
    });

    return new Response(JSON.stringify({ paper, warnings: paperData.warnings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    if (supabaseAuth && userId) {
      try {
        await supabaseAuth.from("academy_ai_logs").insert({
          action: "admin_import",
          user_id: userId,
          input: { error_context: "import_failed" },
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
