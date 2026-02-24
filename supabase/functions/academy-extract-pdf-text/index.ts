import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const MIN_TEXT_LENGTH = 500;
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;

function chunkText(text: string): { content: string; char_start: number; char_end: number }[] {
  const len = text.length;
  if (len <= CHUNK_SIZE) {
    return [{ content: text, char_start: 0, char_end: len }];
  }

  const chunks: { content: string; char_start: number; char_end: number }[] = [];
  let start = 0;

  while (start < len) {
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

// Simple PDF text extraction using basic parsing
// Extracts text content from PDF binary data
function extractTextFromPdf(pdfBytes: Uint8Array): string {
  // Convert to string for text stream extraction
  const decoder = new TextDecoder("latin1");
  const rawStr = decoder.decode(pdfBytes);
  
  const textParts: string[] = [];
  
  // Extract text from PDF text streams (BT...ET blocks)
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  
  while ((match = btEtRegex.exec(rawStr)) !== null) {
    const block = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textParts.push(tjMatch[1]);
    }
    
    // TJ arrays
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrayMatch;
    while ((tjArrayMatch = tjArrayRegex.exec(block)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(arrayContent)) !== null) {
        textParts.push(strMatch[1]);
      }
    }
  }
  
  // Also try to extract from stream content
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  while ((match = streamRegex.exec(rawStr)) !== null) {
    const content = match[1];
    // Only process uncompressed streams that look like text
    if (content.includes("BT") && content.includes("ET")) {
      const innerBtEt = /BT\s([\s\S]*?)ET/g;
      let innerMatch;
      while ((innerMatch = innerBtEt.exec(content)) !== null) {
        const block = innerMatch[1];
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(block)) !== null) {
          textParts.push(tjMatch[1]);
        }
      }
    }
  }
  
  // Clean up extracted text
  let text = textParts.join(" ");
  
  // Decode PDF escape sequences
  text = text
    .replace(/\n/g, "\n")
    .replace(/\r/g, "\r")
    .replace(/\t/g, "\t")
    .replace(/\\(/g, "(")
    .replace(/\\)/g, ")")
    .replace(/\\\\/g, "\\");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let paperId: string | null = null;

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

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    const body = await req.json();
    paperId = body.paper_id;

    if (!paperId) {
      return new Response(JSON.stringify({ error: "paper_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get file record
    const { data: fileRecord, error: fileErr } = await supabaseService
      .from("academy_paper_files")
      .select("*")
      .eq("paper_id", paperId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fileErr || !fileRecord) {
      return new Response(JSON.stringify({ error: "Nenhum PDF encontrado para este paper." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download PDF from storage
    const { data: pdfData, error: dlErr } = await supabaseService.storage
      .from("academy-papers")
      .download(fileRecord.storage_path);

    if (dlErr || !pdfData) {
      throw new Error(`Erro ao baixar PDF: ${dlErr?.message || "arquivo não encontrado"}`);
    }

    const pdfBytes = new Uint8Array(await pdfData.arrayBuffer());

    // Extract text
    let extractedText = extractTextFromPdf(pdfBytes);

    // If basic extraction fails, try using Lovable AI for OCR/extraction
    if (extractedText.length < MIN_TEXT_LENGTH) {
      // Log warning but don't fail
      const warning = `PDF com baixo texto extraível (${extractedText.length} chars). Possível PDF digitalizado (scan).`;
      
      // Update paper warnings
      const { data: paper } = await supabaseService
        .from("academy_papers")
        .select("warnings")
        .eq("id", paperId)
        .single();

      const currentWarnings = (paper?.warnings as string[]) || [];
      if (!currentWarnings.includes(warning)) {
        await supabaseService
          .from("academy_papers")
          .update({ warnings: [...currentWarnings, warning] })
          .eq("id", paperId);
      }

      await supabaseService.from("academy_ai_logs").insert({
        action: "pdf_extract_index",
        paper_id: paperId,
        user_id: userId,
        input: { paper_id: paperId, file_id: fileRecord.id },
        output: { warning, extracted_length: extractedText.length },
        status: "success",
        duration_ms: Date.now() - startTime,
      });

      return new Response(JSON.stringify({
        extracted: false,
        warning,
        chars_extracted: extractedText.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save full text for audit
    await supabaseService
      .from("academy_paper_fulltext")
      .upsert({
        paper_id: paperId,
        extracted_text: extractedText,
        char_count: extractedText.length,
        extraction_method: "pdf-parse-basic",
        updated_at: new Date().toISOString(),
      }, { onConflict: "paper_id" });

    // Chunk the text
    const chunks = chunkText(extractedText);

    // Generate embeddings
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    // Process in batches of 20 to avoid API limits
    const batchSize = 20;
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await generateEmbeddings(batch.map(c => c.content), OPENAI_API_KEY);
      allEmbeddings.push(...embeddings);
    }

    // Delete old PDF chunks only (keep abstract chunks)
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

    if (insertErr) throw new Error(`Erro ao inserir chunks: ${insertErr.message}`);

    // Log success
    await supabaseService.from("academy_ai_logs").insert({
      action: "pdf_extract_index",
      paper_id: paperId,
      user_id: userId,
      input: { paper_id: paperId, file_id: fileRecord.id, text_length: extractedText.length },
      output: { chunks_created: chunks.length, model: OPENAI_EMBEDDING_MODEL },
      status: "success",
      duration_ms: Date.now() - startTime,
      model_used: OPENAI_EMBEDDING_MODEL,
    });

    return new Response(JSON.stringify({
      extracted: true,
      chars_extracted: extractedText.length,
      chunks_created: chunks.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PDF extract error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";

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
          input: { paper_id: paperId },
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
