import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { extractText, getDocumentProperties } from "https://esm.sh/unpdf@0.12.1";

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

/** Strip null bytes and other problematic Unicode sequences that PostgreSQL rejects. */
function sanitizeText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/\uFFFD/g, ""); // replacement char
}

async function computeSha256(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function chunkText(text: string, maxChunks: number): { content: string; char_start: number; char_end: number }[] {
  const len = text.length;
  if (len <= CHUNK_SIZE) {
    return [{ content: text, char_start: 0, char_end: len }];
  }

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
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input: texts }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[embeddings:retry] 429 rate limit, waiting ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(`OpenAI Embeddings error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return data.data.map((d: any) => d.embedding);
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[embeddings:retry] Error: ${err.message}, waiting ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error("Embeddings generation failed after retries");
}

async function updateFileStatus(supabase: any, fileId: string, status: string, error?: string) {
  const update: any = { processing_status: status };
  if (error) update.processing_error = error;
  await supabase.from("academy_paper_files").update(update).eq("id", fileId);
}

/** Affiliation / author line patterns */
const AFFILIATION_PATTERNS = /\b(department\s+of|university|institute|hospital|faculty|school\s+of|centro|universidade|departamento|instituto|address|correspondence|email|tel\b|fax\b)\b/i;
const EMAIL_PATTERN = /@/;
const COUNTRY_PATTERN = /\b(united states|brazil|brasil|uk|germany|france|italy|spain|japan|china|australia|canada|india|netherlands|switzerland|sweden|south korea|portugal|argentina|mexico)\b/i;
const STATE_ABBREV_PATTERN = /,\s*[A-Z]{2}\s*(\d{5})?$/;

/** Remove affiliation-heavy lines from text */
function stripAffiliationLines(text: string): string {
  const lines = text.split("\n");
  return lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.length < 5) return true; // keep short/empty lines
    if (AFFILIATION_PATTERNS.test(trimmed)) return false;
    if (EMAIL_PATTERN.test(trimmed)) return false;
    if (COUNTRY_PATTERN.test(trimmed)) return false;
    if (STATE_ABBREV_PATTERN.test(trimmed)) return false;
    return true;
  }).join("\n");
}

/** Check if text is majority affiliations (>=30% of lines) */
function isAffiliationHeavy(text: string): boolean {
  const lines = text.split("\n").filter(l => l.trim().length > 5);
  if (lines.length === 0) return true;
  const affiliationLines = lines.filter(l =>
    AFFILIATION_PATTERNS.test(l) || EMAIL_PATTERN.test(l) || COUNTRY_PATTERN.test(l) || STATE_ABBREV_PATTERN.test(l.trim())
  );
  return (affiliationLines.length / lines.length) >= 0.30;
}

/** Extract abstract using multi-pattern matching */
function extractAbstract(fulltext: string): { text: string; source: string } {
  // Pattern: "Abstract" section
  const patterns = [
    /\babstract\b[\s.:]*(.+?)(?=\b(?:introduction|key\s*words|keywords|methods|materials?\s+and\s+methods|results|patients|conclusions?|background)\b)/is,
    /\b(objectives?|background|aim|purpose)\b[\s.:]*(.+?)(?=\b(?:introduction|methods|materials?\s+and\s+methods|results|patients|conclusions?)\b)/is,
  ];

  for (const pattern of patterns) {
    const match = fulltext.match(pattern);
    const captured = match?.[1] || match?.[2] || "";
    let cleaned = captured
      .replace(/\d+\s*$/gm, "") // page numbers
      .replace(/https?:\/\/\S+/g, "") // URLs
      .replace(/doi:\s*\S+/gi, "") // DOI refs
      .trim();
    // Strip any affiliation lines that leaked into the abstract
    cleaned = stripAffiliationLines(cleaned).trim();
    if (cleaned.length > 100 && !isAffiliationHeavy(cleaned)) {
      return { text: cleaned.slice(0, 2000), source: "extracted" };
    }
  }

  // Fallback: skip first 200 chars (likely title/authors), take meaningful text
  const lines = fulltext.split(/[.\n]/).filter(l => l.trim().length > 20);
  let fallbackText = lines.slice(2, 30).join(". ").slice(0, 1800).trim();

  // Clean affiliation lines from fallback
  fallbackText = stripAffiliationLines(fallbackText).trim();

  // Validate fallback
  if (fallbackText.length >= 400 && !isAffiliationHeavy(fallbackText)) {
    return { text: fallbackText, source: "fallback" };
  }

  return { text: "", source: "none" };
}

serve(async (req) => {
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
      fileQuery = supabaseService
        .from("academy_paper_files")
        .select("*")
        .eq("id", requestFileId)
        .limit(1);
    }

    const { data: fileRecord, error: fileErr } = await fileQuery.single();
    if (fileErr || !fileRecord) {
      return new Response(JSON.stringify({ error: "Nenhum PDF encontrado para este paper.", request_id: incomingRequestId }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    fileId = fileRecord.id;

    // If force mode, clear previous fulltext and chunks
    if (force) {
      console.log(`[force:cleanup] Clearing fulltext and chunks for paperId=${paperId}`);
      await supabaseService.from("academy_chunks").delete().eq("paper_id", paperId);
      await supabaseService.from("academy_paper_fulltext").delete().eq("paper_id", paperId);
      await supabaseService.from("academy_paper_curation").delete().eq("paper_id", paperId);
      await supabaseService.from("academy_papers").update({ curation_status: "draft" }).eq("id", paperId);
    }

    await updateFileStatus(supabaseService, fileId, "processing");
    console.log(`[process:start] requestId=${incomingRequestId} paperId=${paperId} fileId=${fileId} force=${force}`);

    // ═══════════════════════════════════════════
    // PHASE 1.2: Download + Diagnostics
    // ═══════════════════════════════════════════
    const storagePath = fileRecord.storage_path;
    console.log(`[download:pre] storage_path="${storagePath}" bucket="academy-papers" file_size_db=${fileRecord.size_bytes}`);

    const { data: pdfData, error: dlErr } = await supabaseService.storage
      .from("academy-papers")
      .download(storagePath);

    if (dlErr || !pdfData) {
      const errMsg = `Erro ao baixar PDF: ${dlErr?.message || "arquivo não encontrado"}`;
      console.error(`[download:error] ${errMsg}`);
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      throw new Error(errMsg);
    }

    const arrayBuffer = await pdfData.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    const byteLength = pdfBytes.byteLength;

    // Compute SHA-256 server-side
    const sha256 = await computeSha256(pdfBytes);
    const magicBytes = String.fromCharCode(pdfBytes[0], pdfBytes[1], pdfBytes[2], pdfBytes[3]);
    const magicHex = Array.from(pdfBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, "0")).join(" ");

    console.log(`[download:ok] byte_length=${byteLength} sha256=${sha256} magic_bytes="${magicBytes}" magic_hex=${magicHex} content_type=${pdfData.type}`);

    // Validate file
    if (byteLength < MIN_VALID_FILE_SIZE) {
      const errMsg = `Arquivo inválido/truncado: ${byteLength} bytes (mínimo: ${MIN_VALID_FILE_SIZE})`;
      console.error(`[download:failed] ${errMsg}`);
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      throw new Error(errMsg);
    }

    if (magicBytes !== "%PDF") {
      const errMsg = `Arquivo não é PDF válido. Magic bytes: "${magicBytes}" (hex: ${magicHex})`;
      console.error(`[download:failed] ${errMsg}`);
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      throw new Error(errMsg);
    }

    // ═══════════════════════════════════════════
    // PHASE 1.3: Text Extraction (unpdf primary)
    // ═══════════════════════════════════════════
    let extractedText = "";
    let extractionMethod = "unpdf";
    let pagesCount = 0;

    try {
      console.log(`[parse:start] Extracting text with unpdf (page-by-page)...`);
      
      // Try page-by-page extraction for better quality
      const result = await extractText(pdfBytes, { mergePages: false });
      const pages = result.pages || [];
      pagesCount = pages.length;
      
      // Concatenate pages with separator, removing repeated headers/footers
      const pageTexts = pages.map((p: any) => (typeof p === "string" ? p : p?.text || "").trim()).filter((t: string) => t.length > 0);
      
      if (pageTexts.length > 0) {
        // Detect repeated headers/footers (appear in >60% of pages)
        if (pageTexts.length >= 5) {
          const firstLines = pageTexts.map((t: string) => t.split("\n")[0]?.trim()).filter(Boolean);
          const lastLines = pageTexts.map((t: string) => { const lines = t.split("\n"); return lines[lines.length - 1]?.trim(); }).filter(Boolean);
          
          const countOccurrences = (arr: string[]) => {
            const counts = new Map<string, number>();
            arr.forEach(l => counts.set(l, (counts.get(l) || 0) + 1));
            return counts;
          };
          
          const headerCounts = countOccurrences(firstLines);
          const footerCounts = countOccurrences(lastLines);
          const threshold = pageTexts.length * 0.6;
          
          const repeatedHeaders = new Set<string>();
          const repeatedFooters = new Set<string>();
          headerCounts.forEach((count, line) => { if (count >= threshold && line.length < 100) repeatedHeaders.add(line); });
          footerCounts.forEach((count, line) => { if (count >= threshold && line.length < 100) repeatedFooters.add(line); });
          
          if (repeatedHeaders.size > 0 || repeatedFooters.size > 0) {
            console.log(`[parse:cleanup] Removing ${repeatedHeaders.size} repeated headers, ${repeatedFooters.size} repeated footers`);
          }
          
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
        // Fallback: try merged extraction
        const mergedResult = await extractText(pdfBytes, { mergePages: true });
        extractedText = mergedResult.text || "";
        pagesCount = mergedResult.totalPages || 0;
      }
      
      extractedText = sanitizeText(extractedText.replace(/\s+/g, " ").trim());
      console.log(`[parse:ok] pages=${pagesCount} chars=${extractedText.length} first_300="${extractedText.slice(0, 300)}"`);
    } catch (parseErr: any) {
      const errMsg = `Erro ao parsear PDF com unpdf: ${parseErr.message || parseErr}`;
      console.error(`[parse:error] ${errMsg}`, parseErr.stack || "");
      
      // No fallback parser available in Deno - mark as failed
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      throw new Error(errMsg);
    }

    const extractedWords = extractedText.split(/\s+/).filter(w => w.length > 0).length;
    const warnings: string[] = [];

    console.log(`[extract:result] chars=${extractedText.length} words=${extractedWords} pages=${pagesCount}`);

    // Cost cap: truncate text
    let truncated = false;
    if (extractedText.length > MAX_PDF_CHARS) {
      extractedText = extractedText.slice(0, MAX_PDF_CHARS);
      truncated = true;
      warnings.push(`PDF muito longo — indexação parcial (limite: ${MAX_PDF_CHARS} chars).`);
    }

    // Chunk the text
    const chunks = chunkText(extractedText, MAX_CHUNKS_PER_PAPER);
    if (chunks.length >= MAX_CHUNKS_PER_PAPER) {
      warnings.push(`Número de chunks limitado a ${MAX_CHUNKS_PER_PAPER}.`);
    }

    // ═══════════════════════════════════════════
    // PHASE 2: Abstract Extraction
    // ═══════════════════════════════════════════
    const abstractResult = extractAbstract(extractedText);
    let abstractText = abstractResult.text;
    let abstractSource = abstractResult.source;
    console.log(`[abstract:${abstractSource}] chars=${abstractText.length}`);

    // ═══════════════════════════════════════════
    // PHASE 1.5: Sufficiency Classification
    // ═══════════════════════════════════════════
    const hasSufficientText = extractedText.length >= SUFFICIENT_TEXT_MIN_CHARS
      && extractedWords >= SUFFICIENT_TEXT_MIN_WORDS
      && chunks.length >= SUFFICIENT_TEXT_MIN_CHUNKS;
    const isScanned = !hasSufficientText;

    console.log(`[classification] has_sufficient_text=${hasSufficientText} is_scanned=${isScanned} chars=${extractedText.length} words=${extractedWords} chunks=${chunks.length}`);

    if (isScanned) {
      warnings.push(`Texto insuficiente (${extractedText.length} chars, ${extractedWords} palavras, ${chunks.length} chunks) — PDF pode ser escaneado.`);
    }

    // Update file scan flag
    await supabaseService
      .from("academy_paper_files")
      .update({ scan_suspected: isScanned })
      .eq("id", fileId);

    // ═══════════════════════════════════════════
    // Save fulltext (single source of truth)
    // ═══════════════════════════════════════════
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
        extraction_method: extractionMethod,
        abstract: abstractText || null,
        abstract_source: abstractSource,
        abstract_char_count: abstractText.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: "paper_id" });

    console.log(`[fulltext:saved] abstract_source=${abstractSource} abstract_chars=${abstractText.length}`);

    // Sync abstract to academy_papers cache
    if (abstractText && abstractSource !== "none") {
      await supabaseService
        .from("academy_papers")
        .update({ abstract_text: abstractText })
        .eq("id", paperId);
      console.log(`[abstract:synced_to_papers] source=${abstractSource} chars=${abstractText.length}`);
    }

    // Update paper warnings
    {
      const { data: paper } = await supabaseService
        .from("academy_papers")
        .select("warnings")
        .eq("id", paperId)
        .single();
      const currentWarnings = (paper?.warnings as string[]) || [];
      const cleanedWarnings = currentWarnings.filter(w => !w.includes("escaneado") && !w.includes("scan") && !w.includes("Texto insuficiente"));
      const newWarnings = [...cleanedWarnings, ...warnings.filter(w => !cleanedWarnings.includes(w))];
      await supabaseService.from("academy_papers").update({ warnings: newWarnings }).eq("id", paperId);
    }

    // ═══════════════════════════════════════════
    // PHASE 3: Embeddings (with retry + backoff)
    // ═══════════════════════════════════════════
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

    // Delete old PDF chunks (idempotent)
    await supabaseService
      .from("academy_chunks")
      .delete()
      .eq("paper_id", paperId)
      .eq("source_part", "pdf");

    // Insert new PDF chunks
    const rows = chunks.map((chunk, i) => ({
      paper_id: paperId,
      source_part: "pdf",
      chunk_index: i,
      content: sanitizeText(chunk.content),
      embedding: JSON.stringify(allEmbeddings[i]),
      char_start: chunk.char_start,
      char_end: chunk.char_end,
    }));

    const { error: insertErr } = await supabaseService
      .from("academy_chunks")
      .insert(rows);

    if (insertErr) {
      await updateFileStatus(supabaseService, fileId, "failed", `Erro ao inserir chunks: ${insertErr.message}`);
      throw new Error(`Erro ao inserir chunks: ${insertErr.message}`);
    }

    // ✅ Mark as processed
    await updateFileStatus(supabaseService, fileId, "processed");
    console.log(`[process:done] requestId=${incomingRequestId} paperId=${paperId} chunks=${chunks.length} chars=${extractedText.length} sha256=${sha256}`);

    // Auto-trigger curation (fire-and-forget) — only if sufficient text
    if (hasSufficientText && chunks.length >= SUFFICIENT_TEXT_MIN_CHUNKS) {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const curateUrl = `${SUPABASE_URL}/functions/v1/academy-curate-paper`;
        fetch(curateUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paper_id: paperId,
            request_id: incomingRequestId,
            force: force,
          }),
        }).catch(err => console.warn(`[auto-curate] Fire-and-forget failed: ${err.message}`));
        console.log(`[auto-curate] Triggered for paperId=${paperId}`);
      } catch (triggerErr) {
        console.warn(`[auto-curate] Trigger error (non-blocking):`, triggerErr);
      }
    } else {
      console.log(`[auto-curate:skip] Insufficient text for curation (chars=${extractedText.length} words=${extractedWords} chunks=${chunks.length})`);
    }

    // Log success
    await supabaseService.from("academy_ai_logs").insert({
      action: "pdf_extract_index",
      paper_id: paperId,
      user_id: userId,
      request_id: incomingRequestId,
      input: { paper_id: paperId, file_id: fileId, storage_path: storagePath, byte_length: byteLength, sha256, force },
      output: {
        chunks_created: chunks.length,
        chars_indexed: extractedText.length,
        words_indexed: extractedWords,
        pages_count: pagesCount,
        abstract_source: abstractSource,
        abstract_chars: abstractText.length,
        has_sufficient_text: hasSufficientText,
        is_scanned: isScanned,
        model: OPENAI_EMBEDDING_MODEL,
        truncated,
        warnings,
        processing_status: "processed",
      },
      status: "success",
      duration_ms: Date.now() - startTime,
      model_used: OPENAI_EMBEDDING_MODEL,
    });

    return new Response(JSON.stringify({
      extracted: true,
      chars_extracted: extractedText.length,
      words_extracted: extractedWords,
      pages_count: pagesCount,
      chunks_created: chunks.length,
      truncated,
      warnings,
      has_sufficient_text: hasSufficientText,
      is_scanned: isScanned,
      scan_suspected: isScanned,
      abstract_source: abstractSource,
      abstract_chars: abstractText.length,
      sha256,
      processing_status: "processed",
      request_id: incomingRequestId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PDF extract error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    if (fileId) {
      try {
        const supabaseService = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await updateFileStatus(supabaseService, fileId, "failed", message);
      } catch {}
    }

    if (userId) {
      try {
        const supabaseService = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabaseService.from("academy_ai_logs").insert({
          action: "pdf_extract_index",
          paper_id: paperId,
          user_id: userId,
          request_id: requestId,
          input: { paper_id: paperId, file_id: fileId },
          status: "fail",
          error_message: message,
          duration_ms: Date.now() - startTime,
        });
      } catch (logErr) {
        console.error("Failed to log error:", logErr);
      }
    }

    return new Response(JSON.stringify({ error: message, request_id: requestId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
