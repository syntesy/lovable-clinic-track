import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { extractText } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const SUFFICIENT_TEXT_MIN_CHARS = 3000;
const SUFFICIENT_TEXT_MIN_WORDS = 500;
const SUFFICIENT_TEXT_MIN_CHUNKS = 5;
const CHUNK_SIZE = 1100;
const CHUNK_OVERLAP = 120;
const MAX_PDF_CHARS = 250000;
const MAX_CHUNKS_PER_PAPER = 200;
const MIN_VALID_FILE_SIZE = 10000;

function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function sanitizeText(text: string): string {
  return text.replace(/\u0000/g, "").replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, "").replace(/\uFFFD/g, "");
}

async function computeSha256(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function chunkText(text: string, maxChunks: number): { content: string; char_start: number; char_end: number }[] {
  const len = text.length;
  if (len <= CHUNK_SIZE) return [{ content: text, char_start: 0, char_end: len }];
  const chunks: { content: string; char_start: number; char_end: number }[] = [];
  let start = 0;
  while (start < len && chunks.length < maxChunks) {
    const end = Math.min(start + CHUNK_SIZE, len);
    chunks.push({ content: text.slice(start, end), char_start: start, char_end: end });
    if (end >= len) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function generateEmbeddingsWithRetry(texts: string[], apiKey: string, maxRetries = 3): Promise<number[][]> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input: texts }),
      });
      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429 && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new Error(`OpenAI Embeddings error (${response.status}): ${errText}`);
      }
      const data = await response.json();
      return data.data.map((d: any) => d.embedding);
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw lastError || new Error("Embeddings generation failed");
}

async function updateFileStatus(supabase: any, fileId: string, status: string, error?: string) {
  const update: any = { processing_status: status };
  if (error) update.processing_error = error;
  await supabase.from("academy_paper_files").update(update).eq("id", fileId);
}

const AFFILIATION_PATTERNS = /\b(department\s+of|university|institute|hospital|faculty|school\s+of|centro|universidade|departamento|instituto|address|correspondence|email|tel\b|fax\b)\b/i;
const EMAIL_PATTERN = /@/;
const COUNTRY_PATTERN = /\b(united states|brazil|brasil|uk|germany|france|italy|spain|japan|china|australia|canada|india|netherlands|switzerland|sweden|south korea|portugal|argentina|mexico)\b/i;
const STATE_ABBREV_PATTERN = /,\s*[A-Z]{2}\s*(\d{5})?$/;

function stripAffiliationLines(text: string): string {
  return text.split("\n").filter(line => {
    const trimmed = line.trim();
    if (trimmed.length < 5) return true;
    if (AFFILIATION_PATTERNS.test(trimmed)) return false;
    if (EMAIL_PATTERN.test(trimmed)) return false;
    if (COUNTRY_PATTERN.test(trimmed)) return false;
    if (STATE_ABBREV_PATTERN.test(trimmed)) return false;
    return true;
  }).join("\n");
}

function isAffiliationHeavy(text: string): boolean {
  const lines = text.split("\n").filter(l => l.trim().length > 5);
  if (lines.length === 0) return true;
  const affiliationLines = lines.filter(l =>
    AFFILIATION_PATTERNS.test(l) || EMAIL_PATTERN.test(l) || COUNTRY_PATTERN.test(l) || STATE_ABBREV_PATTERN.test(l.trim())
  );
  return (affiliationLines.length / lines.length) >= 0.30;
}

function extractAbstract(fulltext: string): { text: string; source: string } {
  const patterns = [
    /\babstract\b[\s.:]*(.+?)(?=\b(?:introduction|key\s*words|keywords|methods|materials?\s+and\s+methods|results|patients|conclusions?|background)\b)/is,
    /\b(objectives?|background|aim|purpose)\b[\s.:]*(.+?)(?=\b(?:introduction|methods|materials?\s+and\s+methods|results|patients|conclusions?)\b)/is,
  ];
  for (const pattern of patterns) {
    const match = fulltext.match(pattern);
    const captured = match?.[1] || match?.[2] || "";
    let cleaned = captured.replace(/\d+\s*$/gm, "").replace(/https?:\/\/\S+/g, "").replace(/doi:\s*\S+/gi, "").trim();
    cleaned = stripAffiliationLines(cleaned).trim();
    if (cleaned.length > 100 && !isAffiliationHeavy(cleaned)) return { text: cleaned.slice(0, 2000), source: "extracted" };
  }
  const lines = fulltext.split(/[.\n]/).filter(l => l.trim().length > 20);
  let fallbackText = lines.slice(2, 30).join(". ").slice(0, 1800).trim();
  fallbackText = stripAffiliationLines(fallbackText).trim();
  if (fallbackText.length >= 400 && !isAffiliationHeavy(fallbackText)) return { text: fallbackText, source: "fallback" };
  return { text: "", source: "none" };
}

/** Try to extract structured sections from PDF text heuristically */
function extractPdfSections(fulltext: string): Record<string, string | null> {
  const sections: Record<string, string | null> = {
    abstract: null, introduction: null, methods: null, results: null, discussion: null, conclusion: null,
  };
  const sectionPatterns: [string, RegExp][] = [
    ["abstract", /\babstract\b[\s.:]*(.+?)(?=\b(?:introduction|key\s*words|keywords|methods|background)\b)/is],
    ["introduction", /\b(?:introduction|background)\b[\s.:]*(.+?)(?=\b(?:methods?|materials?\s+and\s+methods?|experimental)\b)/is],
    ["methods", /\b(?:methods?|materials?\s+and\s+methods?|experimental)\b[\s.:]*(.+?)(?=\b(?:results?|findings)\b)/is],
    ["results", /\b(?:results?|findings)\b[\s.:]*(.+?)(?=\b(?:discussion|conclusions?)\b)/is],
    ["discussion", /\bdiscussion\b[\s.:]*(.+?)(?=\b(?:conclusions?|references?|acknowledgment|funding)\b)/is],
    ["conclusion", /\b(?:conclusions?|summary)\b[\s.:]*(.+?)(?=\b(?:references?|acknowledgment|funding|conflict)\b)/is],
  ];
  for (const [key, pattern] of sectionPatterns) {
    const m = fulltext.match(pattern);
    if (m?.[1] && m[1].trim().length > 50) sections[key] = m[1].trim().slice(0, 50_000);
  }
  return sections;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const startTime = Date.now();
  let userId: string | null = null;
  let paperId: string | null = null;
  let fileId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", request_id: requestId }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    const body = await req.json();
    paperId = body.paper_id;
    const requestFileId = body.file_id || null;
    const force = body.force === true;
    const jobId = body.job_id || null; // NEW: job tracking
    const incomingRequestId = body.request_id || requestId;

    if (!paperId) {
      return new Response(JSON.stringify({ error: "paper_id é obrigatório", request_id: incomingRequestId }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get file record
    let fileQuery = supabaseService
      .from("academy_paper_files")
      .select("*")
      .eq("paper_id", paperId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (requestFileId) {
      fileQuery = supabaseService.from("academy_paper_files").select("*").eq("id", requestFileId).limit(1);
    }

    const { data: fileRecord, error: fileErr } = await fileQuery.single();
    if (fileErr || !fileRecord) {
      // Update job tracking on failure
      if (jobId) {
        await supabaseService.from("academy_paper_ingestion")
          .update({ status: "fail", error_message: "PDF file not found", raw_payload: { job: { job_id: jobId, status: "failed", error: "file_not_found" } } })
          .eq("job_id", jobId);
        await supabaseService.from("academy_papers").update({ curation_status: "error", error_code: "PDF_NOT_FOUND" }).eq("id", paperId);
      }
      return new Response(JSON.stringify({ error: "Nenhum PDF encontrado.", request_id: incomingRequestId }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    fileId = fileRecord.id;

    if (force) {
      await supabaseService.from("academy_chunks").delete().eq("paper_id", paperId);
      await supabaseService.from("academy_paper_fulltext").delete().eq("paper_id", paperId);
      await supabaseService.from("academy_paper_curation").delete().eq("paper_id", paperId);
    }

    await updateFileStatus(supabaseService, fileId, "processing");
    console.log(`[process:start] paperId=${paperId} fileId=${fileId} jobId=${jobId} force=${force}`);

    // Download PDF
    const storagePath = fileRecord.storage_path;
    const { data: pdfData, error: dlErr } = await supabaseService.storage.from("academy-papers").download(storagePath);

    if (dlErr || !pdfData) {
      const errMsg = `Erro ao baixar PDF: ${dlErr?.message || "não encontrado"}`;
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      if (jobId) {
        await supabaseService.from("academy_paper_ingestion")
          .update({ status: "fail", error_message: errMsg, raw_payload: { job: { job_id: jobId, status: "failed", error: errMsg } } })
          .eq("job_id", jobId);
      }
      throw new Error(errMsg);
    }

    const arrayBuffer = await pdfData.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    const byteLength = pdfBytes.byteLength;
    const sha256 = await computeSha256(pdfBytes);
    const magicBytes = String.fromCharCode(pdfBytes[0], pdfBytes[1], pdfBytes[2], pdfBytes[3]);

    if (byteLength < MIN_VALID_FILE_SIZE) {
      const errMsg = `Arquivo inválido: ${byteLength} bytes`;
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      if (jobId) await supabaseService.from("academy_paper_ingestion").update({ status: "fail", error_message: errMsg }).eq("job_id", jobId);
      throw new Error(errMsg);
    }

    if (magicBytes !== "%PDF") {
      const errMsg = `Arquivo não é PDF válido.`;
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      if (jobId) await supabaseService.from("academy_paper_ingestion").update({ status: "fail", error_message: errMsg }).eq("job_id", jobId);
      throw new Error(errMsg);
    }

    // Extract text
    let extractedText = "";
    let pagesCount = 0;

    try {
      const result = await extractText(pdfBytes, { mergePages: false });
      const pages = result.pages || [];
      pagesCount = pages.length;

      const pageTexts = pages.map((p: any) => (typeof p === "string" ? p : p?.text || "").trim()).filter((t: string) => t.length > 0);

      if (pageTexts.length > 0) {
        if (pageTexts.length >= 5) {
          const firstLines = pageTexts.map((t: string) => t.split("\n")[0]?.trim()).filter(Boolean);
          const lastLines = pageTexts.map((t: string) => { const lines = t.split("\n"); return lines[lines.length - 1]?.trim(); }).filter(Boolean);
          const countOccurrences = (arr: string[]) => { const counts = new Map<string, number>(); arr.forEach(l => counts.set(l, (counts.get(l) || 0) + 1)); return counts; };
          const headerCounts = countOccurrences(firstLines);
          const footerCounts = countOccurrences(lastLines);
          const threshold = pageTexts.length * 0.6;
          const repeatedHeaders = new Set<string>();
          const repeatedFooters = new Set<string>();
          headerCounts.forEach((count, line) => { if (count >= threshold && line.length < 100) repeatedHeaders.add(line); });
          footerCounts.forEach((count, line) => { if (count >= threshold && line.length < 100) repeatedFooters.add(line); });

          extractedText = pageTexts.map((t: string) => {
            let lines = t.split("\n");
            if (lines.length > 0 && repeatedHeaders.has(lines[0]?.trim())) lines = lines.slice(1);
            if (lines.length > 0 && repeatedFooters.has(lines[lines.length - 1]?.trim())) lines = lines.slice(0, -1);
            return lines.join("\n");
          }).join("\n\n");
        } else {
          extractedText = pageTexts.join("\n\n");
        }
      } else {
        const mergedResult = await extractText(pdfBytes, { mergePages: true });
        extractedText = mergedResult.text || "";
        pagesCount = mergedResult.totalPages || 0;
      }

      extractedText = sanitizeText(extractedText.replace(/\s+/g, " ").trim());
    } catch (parseErr: any) {
      const errMsg = `Erro ao parsear PDF: ${parseErr.message}`;
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      if (jobId) {
        await supabaseService.from("academy_paper_ingestion").update({ status: "fail", error_message: errMsg }).eq("job_id", jobId);
        await supabaseService.from("academy_papers").update({ curation_status: "error", error_code: "PARSE_ERROR" }).eq("id", paperId);
        await supabaseService.from("academy_review_task").insert({ paper_id: paperId, reason: "parser_error", status: "open", created_by: userId });
      }
      throw new Error(errMsg);
    }

    const extractedWords = extractedText.split(/\s+/).filter(w => w.length > 0).length;
    const warnings: string[] = [];

    let truncated = false;
    if (extractedText.length > MAX_PDF_CHARS) {
      extractedText = extractedText.slice(0, MAX_PDF_CHARS);
      truncated = true;
      warnings.push(`PDF truncado (limite: ${MAX_PDF_CHARS} chars).`);
    }

    const chunks = chunkText(extractedText, MAX_CHUNKS_PER_PAPER);
    if (chunks.length >= MAX_CHUNKS_PER_PAPER) warnings.push(`Chunks limitados a ${MAX_CHUNKS_PER_PAPER}.`);

    const abstractResult = extractAbstract(extractedText);
    const abstractText = abstractResult.text;
    const abstractSource = abstractResult.source;

    const hasSufficientText = extractedText.length >= SUFFICIENT_TEXT_MIN_CHARS
      && extractedWords >= SUFFICIENT_TEXT_MIN_WORDS
      && chunks.length >= SUFFICIENT_TEXT_MIN_CHUNKS;
    const isScanned = !hasSufficientText;

    if (isScanned) warnings.push(`Texto insuficiente — PDF pode ser escaneado.`);

    await supabaseService.from("academy_paper_files").update({ scan_suspected: isScanned }).eq("id", fileId);

    // Extract structured sections from PDF text
    const pdfSections = extractPdfSections(extractedText);
    const currentStructured = {
      abstract: pdfSections.abstract || abstractText || null,
      introduction: pdfSections.introduction || null,
      methods: pdfSections.methods || null,
      results: pdfSections.results || null,
      discussion: pdfSections.discussion || null,
      conclusion: pdfSections.conclusion || null,
      quality_flags: [
        ...(pdfSections.methods ? [] : ["missing_methods"]),
        ...(pdfSections.results ? [] : ["missing_results"]),
        ...(isScanned ? ["scanned_pdf"] : []),
      ],
      char_count: extractedText.length,
      word_count: extractedWords,
      source: "pdf_parse",
      updated_at: new Date().toISOString(),
    };

    // Save fulltext with current_structured
    await supabaseService
      .from("academy_paper_fulltext")
      .upsert({
        paper_id: paperId,
        extracted_text: extractedText,
        char_count: extractedText.length,
        word_count: extractedWords,
        chunk_count: chunks.length,
        has_sufficient_text: hasSufficientText,
        is_scanned: isScanned,
        extraction_method: "unpdf",
        abstract: abstractText || null,
        abstract_source: abstractSource,
        abstract_char_count: abstractText.length,
        current_structured: currentStructured,
        updated_at: new Date().toISOString(),
      }, { onConflict: "paper_id" });

    // Sync abstract to papers
    if (abstractText && abstractSource !== "none") {
      await supabaseService.from("academy_papers").update({ abstract_text: abstractText }).eq("id", paperId);
    }

    // Embeddings
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      await updateFileStatus(supabaseService, fileId, "failed", "OPENAI_API_KEY not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const batchSize = 20;
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await generateEmbeddingsWithRetry(batch.map(c => c.content), OPENAI_API_KEY);
      allEmbeddings.push(...embeddings);
    }

    await supabaseService.from("academy_chunks").delete().eq("paper_id", paperId).eq("source_part", "pdf");

    const rows = chunks.map((chunk, i) => ({
      paper_id: paperId,
      source_part: "pdf",
      chunk_index: i,
      content: sanitizeText(chunk.content),
      embedding: JSON.stringify(allEmbeddings[i]),
      char_start: chunk.char_start,
      char_end: chunk.char_end,
    }));

    const { error: insertErr } = await supabaseService.from("academy_chunks").insert(rows);
    if (insertErr) {
      await updateFileStatus(supabaseService, fileId, "failed", `Chunks insert error: ${insertErr.message}`);
      throw new Error(`Chunks insert error: ${insertErr.message}`);
    }

    await updateFileStatus(supabaseService, fileId, "processed");

    // ═══════════════════════════════════════════════
    // JOB TRACKING: Update ingestion row + paper status
    // ═══════════════════════════════════════════════
    if (jobId) {
      const newStatus = hasSufficientText ? "curating" : "needs_input";
      
      await supabaseService.from("academy_paper_ingestion")
        .update({
          status: "success",
          duration_ms: Date.now() - startTime,
          fulltext_structured: currentStructured,
          raw_payload: { job: { job_id: jobId, status: "done", chars: extractedText.length, words: extractedWords, chunks: chunks.length } },
          parsed_fields: { char_count: extractedText.length, word_count: extractedWords, chunks: chunks.length, has_sufficient_text: hasSufficientText },
        })
        .eq("job_id", jobId);

      await supabaseService.from("academy_papers")
        .update({ curation_status: newStatus })
        .eq("id", paperId);

      console.log(`[job:done] jobId=${jobId} paperId=${paperId} status=${newStatus}`);

      // If insufficient text, create review task
      if (!hasSufficientText) {
        await supabaseService.from("academy_review_task").insert({
          paper_id: paperId, reason: "low_text_quality", status: "open", created_by: userId,
        });
      }
    } else {
      // Legacy path: auto-trigger curation
      if (hasSufficientText && chunks.length >= SUFFICIENT_TEXT_MIN_CHUNKS) {
        try {
          const curateUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/academy-curate-paper`;
          fetch(curateUrl, {
            method: "POST",
            headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
            body: JSON.stringify({ paper_id: paperId, request_id: incomingRequestId, force }),
          }).catch(err => console.warn(`[auto-curate] ${err.message}`));
        } catch {}
      }
    }

    // Log success
    await supabaseService.from("academy_ai_logs").insert({
      action: "pdf_extract_index", paper_id: paperId, user_id: userId, request_id: incomingRequestId,
      input: { paper_id: paperId, file_id: fileId, storage_path: storagePath, byte_length: byteLength, sha256, force, job_id: jobId },
      output: { chunks_created: chunks.length, chars_indexed: extractedText.length, words_indexed: extractedWords, pages_count: pagesCount, abstract_source: abstractSource, has_sufficient_text: hasSufficientText, is_scanned: isScanned, truncated, warnings, processing_status: "processed" },
      status: "success", duration_ms: Date.now() - startTime, model_used: OPENAI_EMBEDDING_MODEL,
    });

    return new Response(JSON.stringify({
      extracted: true, chars_extracted: extractedText.length, words_extracted: extractedWords,
      pages_count: pagesCount, chunks_created: chunks.length, truncated, warnings,
      has_sufficient_text: hasSufficientText, is_scanned: isScanned, abstract_source: abstractSource,
      sha256, processing_status: "processed", job_id: jobId, request_id: incomingRequestId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("PDF extract error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    if (fileId) {
      try {
        const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await updateFileStatus(svc, fileId, "failed", message);
      } catch {}
    }

    if (userId) {
      try {
        const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await svc.from("academy_ai_logs").insert({
          action: "pdf_extract_index", paper_id: paperId, user_id: userId, request_id: requestId,
          input: { paper_id: paperId, file_id: fileId }, status: "fail", error_message: message, duration_ms: Date.now() - startTime,
        });
      } catch {}
    }

    return new Response(JSON.stringify({ error: message, request_id: requestId }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
