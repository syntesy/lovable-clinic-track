import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;
const MAX_PDF_CHARS = 250000;
const MAX_CHUNKS_PER_PAPER = 200;

function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

/** Strip null bytes and other problematic Unicode sequences that PostgreSQL rejects. */
function sanitizeText(text: string): string {
  // Remove null bytes (\u0000) which PostgreSQL text columns cannot store
  // Also remove other C0/C1 control characters except common whitespace (tab, newline, CR)
  return text.replace(/\u0000/g, "").replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, "");
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

async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
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
    throw new Error(`OpenAI Embeddings error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.data.map((d: any) => d.embedding);
}

async function updateFileStatus(
  supabase: any,
  fileId: string,
  status: string,
  error?: string
) {
  const update: any = { processing_status: status };
  if (error) update.processing_error = error;
  await supabase
    .from("academy_paper_files")
    .update(update)
    .eq("id", fileId);
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
    userId = user.id;

    const body = await req.json();
    paperId = body.paper_id;
    const requestFileId = body.file_id || null;
    const incomingRequestId = body.request_id || requestId;

    if (!paperId) {
      return new Response(JSON.stringify({ error: "paper_id é obrigatório", request_id: incomingRequestId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    fileId = fileRecord.id;

    await updateFileStatus(supabaseService, fileId, "processing");
    console.log(`[process:start] requestId=${incomingRequestId} paperId=${paperId} fileId=${fileId}`);
    console.log(`[download:pre] storage_path="${fileRecord.storage_path}" bucket="academy-papers"`);

    // Download PDF from storage
    const { data: pdfData, error: dlErr } = await supabaseService.storage
      .from("academy-papers")
      .download(fileRecord.storage_path);

    if (dlErr || !pdfData) {
      const errMsg = `Erro ao baixar PDF: ${dlErr?.message || "arquivo não encontrado"}`;
      console.error(`[download:error] ${errMsg}`);
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      throw new Error(errMsg);
    }

    console.log(`[download:ok] blob_size=${pdfData.size} type=${pdfData.type}`);

    const arrayBuffer = await pdfData.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    console.log(`[buffer] byte_length=${pdfBytes.byteLength}`);

    if (pdfBytes.byteLength === 0) {
      const errMsg = "Buffer vazio após download — arquivo corrompido ou path inválido.";
      console.error(`[buffer:error] ${errMsg}`);
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      throw new Error(errMsg);
    }

    // Verify PDF magic bytes (%PDF)
    const magicBytes = String.fromCharCode(pdfBytes[0], pdfBytes[1], pdfBytes[2], pdfBytes[3]);
    console.log(`[buffer:magic] first_4_bytes="${magicBytes}" hex=${Array.from(pdfBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

    if (magicBytes !== "%PDF") {
      const errMsg = `Arquivo não é PDF válido. Magic bytes: "${magicBytes}"`;
      console.error(`[buffer:error] ${errMsg}`);
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      throw new Error(errMsg);
    }

    // === EXTRACT TEXT USING unpdf (handles compressed streams, CIDFonts, etc.) ===
    let extractedText = "";
    try {
      console.log(`[parse:start] Extracting text with unpdf...`);
      const result = await extractText(pdfBytes, { mergePages: true });
      extractedText = sanitizeText((result.text || "").replace(/\s+/g, " ").trim());
      console.log(`[parse:ok] chars=${extractedText.length} first_300="${extractedText.slice(0, 300)}"`);
    } catch (parseErr: any) {
      const errMsg = `Erro ao parsear PDF: ${parseErr.message || parseErr}`;
      console.error(`[parse:error] ${errMsg}`, parseErr.stack || "");
      await updateFileStatus(supabaseService, fileId, "failed", errMsg);
      throw new Error(errMsg);
    }

    const extractedWords = extractedText.split(/\s+/).filter(w => w.length > 0).length;
    const warnings: string[] = [];

    console.log(`[extract:result] chars=${extractedText.length} words=${extractedWords}`);

    // Cost cap: truncate text
    let truncated = false;
    if (extractedText.length > MAX_PDF_CHARS) {
      extractedText = extractedText.slice(0, MAX_PDF_CHARS);
      truncated = true;
      warnings.push(`PDF muito longo — indexação parcial aplicada (limite: ${MAX_PDF_CHARS} chars).`);
    }

    // Chunk the text
    const chunks = chunkText(extractedText, MAX_CHUNKS_PER_PAPER);
    if (chunks.length >= MAX_CHUNKS_PER_PAPER) {
      warnings.push(`Número de chunks limitado a ${MAX_CHUNKS_PER_PAPER} (limite de custo).`);
    }

    // === ABSTRACT EXTRACTION (robust multi-pattern) ===
    let abstractText = "";
    let abstractSource = "none";
    
    // Pattern 1: "Abstract" followed by content until Introduction/Methods/Materials/Background/Keywords
    const abstractMatch = extractedText.match(/\babstract\b[\s.:]*(.+?)(?=\b(?:introduction|key\s*words|keywords)\b)/is);
    // Pattern 2: "Abstract" followed by structured sections (OBJECTIVES/BACKGROUND/AIM)
    const structuredMatch = !abstractMatch ? extractedText.match(/\babstract\b[\s.:]*((OBJECTIVES?|BACKGROUND|AIM|PURPOSE)[\s:].+?)((?=\bintroduction\b)|(?=\bkey\s*words\b)|(?=\bK\s*nee\s+O))/is) : null;
    
    const matchedAbstract = abstractMatch?.[1] || structuredMatch?.[1] || "";
    
    if (matchedAbstract.trim().length > 100) {
      abstractText = matchedAbstract.trim().slice(0, 2000);
      abstractSource = "extracted";
      console.log(`[abstract:extracted] chars=${abstractText.length}`);
    } else {
      // Fallback: take first meaningful text (skip title/authors lines)
      const lines = extractedText.split(/[.\n]/).filter(l => l.trim().length > 20);
      const fallbackText = lines.slice(0, 30).join(". ").slice(0, 1800);
      if (fallbackText.length > 200) {
        abstractText = fallbackText;
        abstractSource = "fallback";
        console.log(`[abstract:fallback] chars=${abstractText.length}`);
      }
    }

    // === OBJECTIVE TEXT SUFFICIENCY CLASSIFICATION ===
    const hasSufficientText = extractedText.length >= SUFFICIENT_TEXT_MIN_CHARS
      && extractedWords >= SUFFICIENT_TEXT_MIN_WORDS
      && chunks.length >= SUFFICIENT_TEXT_MIN_CHUNKS;
    const isScanned = !hasSufficientText;

    console.log(`[classification] has_sufficient_text=${hasSufficientText} is_scanned=${isScanned} chars=${extractedText.length} words=${extractedWords} chunks=${chunks.length}`);

    if (isScanned) {
      warnings.push(`Texto insuficiente extraído (${extractedText.length} chars, ${extractedWords} palavras, ${chunks.length} chunks) — PDF pode ser escaneado.`);
    }

    // Update file scan flag
    await supabaseService
      .from("academy_paper_files")
      .update({ scan_suspected: isScanned })
      .eq("id", fileId);

    // Save full text with sufficiency fields + abstract (single source of truth)
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
        updated_at: new Date().toISOString(),
      }, { onConflict: "paper_id" });

    console.log(`[fulltext:saved] abstract_source=${abstractSource} abstract_chars=${abstractText.length}`);

    // Sync abstract to academy_papers as cache (always overwrite on reprocess)
    if (abstractText && abstractSource !== "none") {
      await supabaseService
        .from("academy_papers")
        .update({ abstract_text: abstractText })
        .eq("id", paperId);
      console.log(`[abstract:synced_to_papers] source=${abstractSource} chars=${abstractText.length}`);
    }

    // Update paper warnings: remove old scan warnings, add new ones
    {
      const { data: paper } = await supabaseService
        .from("academy_papers")
        .select("warnings")
        .eq("id", paperId)
        .single();
      const currentWarnings = (paper?.warnings as string[]) || [];
      // Remove old scan-related warnings
      const cleanedWarnings = currentWarnings.filter(w => !w.includes("escaneado") && !w.includes("scan") && !w.includes("Texto insuficiente"));
      const newWarnings = [...cleanedWarnings, ...warnings.filter(w => !cleanedWarnings.includes(w))];
      await supabaseService
        .from("academy_papers")
        .update({ warnings: newWarnings })
        .eq("id", paperId);
    }

    // Generate embeddings
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      await updateFileStatus(supabaseService, fileId, "failed", "OPENAI_API_KEY not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const batchSize = 20;
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await generateEmbeddings(batch.map(c => c.content), OPENAI_API_KEY);
      allEmbeddings.push(...embeddings);
    }

    // Delete old PDF chunks only
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
      content: chunk.content,
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
    console.log(`[process:done] requestId=${incomingRequestId} paperId=${paperId} chunks=${chunks.length} chars=${extractedText.length}`);

    // 🔗 Auto-trigger curation pipeline (fire-and-forget)
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
        }),
      }).catch(err => console.warn(`[auto-curate] Fire-and-forget failed: ${err.message}`));
      console.log(`[auto-curate] Triggered for paperId=${paperId}`);
    } catch (triggerErr) {
      console.warn(`[auto-curate] Trigger error (non-blocking):`, triggerErr);
    }

    await supabaseService.from("academy_ai_logs").insert({
      action: "pdf_extract_index",
      paper_id: paperId,
      user_id: userId,
      request_id: incomingRequestId,
      input: { paper_id: paperId, file_id: fileId, text_length: extractedText.length },
      output: {
        chunks_created: chunks.length,
        chars_indexed: extractedText.length,
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
      chunks_created: chunks.length,
      truncated,
      warnings,
      has_sufficient_text: hasSufficientText,
      is_scanned: isScanned,
      scan_suspected: isScanned,
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
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await updateFileStatus(supabaseService, fileId, "failed", message);
      } catch {}
    }

    if (userId) {
      try {
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
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
