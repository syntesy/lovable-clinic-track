import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

  // Extract title
  const title = extract("ArticleTitle") || "Título não disponível";

  // Extract abstract
  const abstractTexts = extractAll("AbstractText");
  const abstract_text = abstractTexts.length > 0 ? abstractTexts.join(" ") : null;

  // Extract authors
  const lastNames = extractAll("LastName");
  const foreNames = extractAll("ForeName");
  const authors = lastNames
    .map((ln, i) => (foreNames[i] ? `${ln} ${foreNames[i]}` : ln))
    .join(", ");

  // Extract journal
  const journal = extract("Title") || extract("ISOAbbreviation");

  // Extract year
  const yearMatch = xml.match(/<PubDate[^>]*>[\s\S]*?<Year>(\d{4})<\/Year>/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract DOI
  const doiMatch = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
  const doi = doiMatch ? doiMatch[1].trim() : null;

  // Extract MeSH terms
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

// ========== Input parsing ==========
function parseInput(input: string): { type: "pmid" | "doi"; value: string } {
  const trimmed = input.trim();

  // Check PMID (numeric or pubmed URL)
  const pmidMatch = trimmed.match(/(?:pubmed\.ncbi\.nlm\.nih\.gov\/|^)(\d{5,12})(?:\/|$)/);
  if (pmidMatch) return { type: "pmid", value: pmidMatch[1] };

  // Check if it's just a number
  if (/^\d{5,12}$/.test(trimmed)) return { type: "pmid", value: trimmed };

  // Check DOI (doi.org URL or raw DOI)
  const doiMatch = trimmed.match(/(?:doi\.org\/|^)(10\.\d{4,}\/[^\s]+)/i);
  if (doiMatch) return { type: "doi", value: doiMatch[1] };

  throw new Error("Entrada inválida. Forneça um PMID, URL do PubMed, DOI ou URL do DOI.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    // Parse input
    const { identifier } = await req.json();
    if (!identifier || typeof identifier !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo 'identifier' é obrigatório (PMID, DOI ou URL)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = parseInput(identifier);

    // Check duplicates
    if (parsed.type === "pmid") {
      const { data: existing } = await supabase
        .from("academy_papers")
        .select("id, title")
        .eq("pmid", parsed.value)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({ error: `Artigo já importado: "${existing.title}"`, existing_id: existing.id }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const { data: existing } = await supabase
        .from("academy_papers")
        .select("id, title")
        .eq("doi", parsed.value)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({ error: `Artigo já importado: "${existing.title}"`, existing_id: existing.id }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch metadata
    const paperData =
      parsed.type === "pmid"
        ? await fetchFromPubMed(parsed.value)
        : await fetchFromCrossref(parsed.value);

    // Insert paper
    const { data: paper, error: insertErr } = await supabase
      .from("academy_papers")
      .insert({
        ...paperData,
        import_source: parsed.type,
        curation_status: "draft",
        created_by: userId,
      })
      .select()
      .single();

    if (insertErr) throw new Error(`Erro ao salvar: ${insertErr.message}`);

    // Log audit
    const duration_ms = Date.now() - startTime;
    await supabase.from("academy_ai_logs").insert({
      action: "import",
      paper_id: paper.id,
      user_id: userId,
      input: { identifier, parsed_type: parsed.type, parsed_value: parsed.value },
      output: { paper_id: paper.id, title: paper.title, has_abstract: !!paper.abstract_text },
      status: "success",
      duration_ms,
    });

    return new Response(JSON.stringify({ paper, warnings: paperData.warnings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);

    // Try to log failure
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      // Best effort logging - may fail if no auth
    } catch {}

    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
