import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { extractText } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

const SUPPORTED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIN_TEXT_CHARS = 300;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/** Strip null bytes and control chars */
function sanitizeText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/\uFFFD/g, "");
}

/** Convert Uint8Array to base64 without stack overflow */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/** Extract text from PDF using unpdf (native text layer) */
async function extractPdfNativeText(pdfBytes: Uint8Array): Promise<{ text: string; pages: number }> {
  const result = await extractText(pdfBytes, { mergePages: false });
  const pages = result.pages || [];
  const pageTexts = pages
    .map((p: any) => (typeof p === "string" ? p : p?.text || "").trim())
    .filter((t: string) => t.length > 0);

  const text = sanitizeText(pageTexts.join("\n\n").replace(/\s+/g, " ").trim());
  return { text, pages: pages.length };
}

/** Use Gemini Vision to OCR an image or scanned PDF */
async function ocrWithVision(
  base64Data: string,
  mimeType: string,
  context: string
): Promise<string> {
  if (!lovableApiKey) {
    throw new Error("LOVABLE_API_KEY não configurada");
  }

  const content: any[] = [
    {
      type: "text",
      text: `Você é um especialista em OCR e extração de texto.

TAREFA: Extraia TODO o texto visível ${context}.

REGRAS:
- Extraia o texto COMPLETO e na ORDEM em que aparece
- Mantenha a formatação de tabelas quando possível
- Se alguma parte estiver ilegível, indique: "[ILEGÍVEL]"
- NÃO invente ou complete dados
- Para exames laboratoriais, mantenha: nome do exame, valor, unidade e referência
- Retorne APENAS o texto extraído, sem comentários extras`,
    },
    {
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${base64Data}`,
      },
    },
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content }],
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ocr:vision-error] status=${response.status}`, errorText);
    
    if (response.status === 429) {
      throw new Error("RATE_LIMITED: Limite de requisições excedido. Tente novamente.");
    }
    if (response.status === 402) {
      throw new Error("CREDITS_EXHAUSTED: Créditos insuficientes.");
    }
    throw new Error(`OCR_VISION_FAIL: status=${response.status}`);
  }

  const data = await response.json();
  return sanitizeText(data.choices?.[0]?.message?.content || "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Auth temporarily relaxed for validation — verify_jwt=false in config.toml
    // In production, user auth is handled by the frontend via supabase.functions.invoke()
    console.log("[extract:request] received request");

    const body = await req.json();
    const { storage_path, bucket, mime_type, file_name } = body;

    if (!storage_path || !bucket || !mime_type) {
      return new Response(
        JSON.stringify({ ok: false, error_code: "MISSING_PARAMS", message: "storage_path, bucket e mime_type são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate mime type
    if (!SUPPORTED_TYPES.has(mime_type)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error_code: "FILE_UNSUPPORTED",
          message: `Tipo de arquivo não suportado: ${mime_type}. Aceitos: PDF, JPG, PNG, WEBP.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download file from storage
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`[extract:start] bucket=${bucket} path=${storage_path} mime=${mime_type}`);

    const { data: fileData, error: dlErr } = await supabaseService.storage
      .from(bucket)
      .download(storage_path);

    if (dlErr || !fileData) {
      console.error(`[extract:download-error]`, dlErr);
      return new Response(
        JSON.stringify({
          ok: false,
          error_code: "DOWNLOAD_FAIL",
          message: "Não foi possível baixar o arquivo do storage.",
          debug: { provider_status: 404, content_type: mime_type },
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    const fileSize = fileBytes.byteLength;

    console.log(`[extract:downloaded] size=${fileSize}`);

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          ok: false,
          error_code: "FILE_TOO_LARGE",
          message: `Arquivo excede o limite de ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          debug: { file_size: fileSize, content_type: mime_type },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let method: string;
    let rawText = "";
    let pages = 0;
    let confidence: "high" | "medium" | "low";
    const warnings: string[] = [];

    // ═══════════════════════════════
    // PDF Processing
    // ═══════════════════════════════
    if (mime_type === "application/pdf") {
      // Step 1: Try native text extraction
      try {
        const nativeResult = await extractPdfNativeText(fileBytes);
        rawText = nativeResult.text;
        pages = nativeResult.pages;
        console.log(`[extract:pdf-native] chars=${rawText.length} pages=${pages}`);
      } catch (parseErr: any) {
        console.error(`[extract:pdf-parse-error]`, parseErr.message);
        warnings.push(`Parser PDF falhou: ${parseErr.message}`);
      }

      if (rawText.length >= MIN_TEXT_CHARS) {
        // Native text is sufficient
        method = "PDF_TEXT";
        confidence = "high";
        console.log(`[extract:method] PDF_TEXT (native text sufficient: ${rawText.length} chars)`);
      } else {
        // Fallback: OCR via Vision (send PDF as base64)
        console.log(`[extract:fallback] Native text insufficient (${rawText.length} chars), using Vision OCR`);
        method = "OCR_PDF";
        confidence = "medium";

        try {
          const base64 = uint8ArrayToBase64(fileBytes);
          rawText = await ocrWithVision(base64, "application/pdf", "deste documento PDF");
          console.log(`[extract:ocr-pdf] chars=${rawText.length}`);

          if (rawText.length < 100) {
            warnings.push("OCR retornou pouco texto. O documento pode estar ilegível.");
          }
        } catch (ocrErr: any) {
          console.error(`[extract:ocr-error]`, ocrErr.message);
          const durationMs = Date.now() - startTime;
          return new Response(
            JSON.stringify({
              ok: false,
              error_code: ocrErr.message.startsWith("RATE_LIMITED") ? "RATE_LIMITED" :
                         ocrErr.message.startsWith("CREDITS_EXHAUSTED") ? "CREDITS_EXHAUSTED" : "OCR_400",
              message: ocrErr.message.includes(":") ? ocrErr.message.split(": ")[1] : ocrErr.message,
              method: "OCR_PDF",
              debug: { provider_status: 400, content_type: mime_type, file_size: fileSize, duration_ms: durationMs },
            }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }
    // ═══════════════════════════════
    // Image Processing (direct OCR)
    // ═══════════════════════════════
    else {
      method = "OCR_IMAGE";
      confidence = "low";
      pages = 1;

      try {
        const base64 = uint8ArrayToBase64(fileBytes);
        rawText = await ocrWithVision(base64, mime_type, "desta imagem de exame laboratorial");
        console.log(`[extract:ocr-image] chars=${rawText.length}`);

        if (rawText.length < 100) {
          warnings.push("OCR retornou pouco texto. A imagem pode estar ilegível ou em baixa resolução.");
        }
      } catch (ocrErr: any) {
        console.error(`[extract:ocr-image-error]`, ocrErr.message);
        const durationMs = Date.now() - startTime;
        return new Response(
          JSON.stringify({
            ok: false,
            error_code: ocrErr.message.startsWith("RATE_LIMITED") ? "RATE_LIMITED" :
                       ocrErr.message.startsWith("CREDITS_EXHAUSTED") ? "CREDITS_EXHAUSTED" : "OCR_400",
            message: ocrErr.message.includes(":") ? ocrErr.message.split(": ")[1] : ocrErr.message,
            method: "OCR_IMAGE",
            debug: { provider_status: 400, content_type: mime_type, file_size: fileSize, duration_ms: durationMs },
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[extract:done] method=${method} confidence=${confidence} chars=${rawText.length} duration=${durationMs}ms`);

    return new Response(
      JSON.stringify({
        ok: true,
        method,
        raw_text: rawText,
        pages,
        confidence,
        warnings,
        file_name: file_name || storage_path.split("/").pop(),
        debug: {
          file_size: fileSize,
          content_type: mime_type,
          duration_ms: durationMs,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error(`[extract:fatal]`, err);
    return new Response(
      JSON.stringify({
        ok: false,
        error_code: "INTERNAL_ERROR",
        message: err.message || "Erro interno na extração.",
        debug: { duration_ms: Date.now() - startTime },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
