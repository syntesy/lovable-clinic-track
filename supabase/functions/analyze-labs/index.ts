import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

// ══════════════════════════════════════
// normalizeLabs — server-side copy
// ══════════════════════════════════════

interface NormalizedLabItem {
  name: string;
  value: number | null;
  unit: string;
  reference_range: string;
  flag: "low" | "normal" | "high" | "unknown";
}

interface NormalizedLabResult {
  patient: { name: string | null; sex: string | null; age: string | null };
  collection_date: string | null;
  labs: NormalizedLabItem[];
  unmapped_lines: string[];
  parser_version: number;
}

const BIOMARKER_ALIASES: Record<string, string> = {
  "pcr": "PCR", "crp": "PCR", "proteina c reativa": "PCR", "proteína c reativa": "PCR",
  "ferritina": "Ferritina", "ferritin": "Ferritina",
  "glicose": "Glicose", "glicemia": "Glicose", "glucose": "Glicose", "glicemia de jejum": "Glicose",
  "hba1c": "HbA1c", "hemoglobina glicada": "HbA1c", "hemoglobina glicosilada": "HbA1c",
  "creatinina": "Creatinina", "creatinine": "Creatinina",
  "rfg": "eGFR", "egfr": "eGFR", "taxa de filtração glomerular": "eGFR",
  "colesterol total": "Colesterol Total", "total cholesterol": "Colesterol Total",
  "hdl": "HDL", "hdl-c": "HDL", "hdl colesterol": "HDL",
  "ldl": "LDL", "ldl-c": "LDL", "ldl colesterol": "LDL",
  "triglicerídeos": "Triglicerídeos", "triglicerideos": "Triglicerídeos", "triglicérides": "Triglicerídeos",
  "vitamina d": "Vitamina D (25-OH)", "25-oh vitamina d": "Vitamina D (25-OH)",
  "tsh": "TSH",
  "t4 livre": "T4 Livre", "t4l": "T4 Livre",
  "hemoglobina": "Hemoglobina", "hb": "Hemoglobina",
  "hematócrito": "Hematócrito", "hematocrito": "Hematócrito", "ht": "Hematócrito",
  "vcm": "VCM", "mcv": "VCM",
  "leucócitos": "Leucócitos", "leucocitos": "Leucócitos", "wbc": "Leucócitos",
  "plaquetas": "Plaquetas", "platelets": "Plaquetas",
  "vitamina b12": "Vitamina B12", "b12": "Vitamina B12",
  "ácido úrico": "Ácido Úrico", "acido urico": "Ácido Úrico",
  "sódio": "Sódio", "sodium": "Sódio", "na": "Sódio",
  "potássio": "Potássio", "potassio": "Potássio", "k": "Potássio",
  "cálcio": "Cálcio", "calcio": "Cálcio", "calcium": "Cálcio",
  "magnésio": "Magnésio", "magnesio": "Magnésio", "magnesium": "Magnésio",
  "ferro sérico": "Ferro Sérico", "ferro serico": "Ferro Sérico", "iron": "Ferro Sérico",
  "zinco": "Zinco", "zinc": "Zinco",
  "albumina": "Albumina", "albumin": "Albumina",
  "tgo": "TGO (AST)", "ast": "TGO (AST)",
  "tgp": "TGP (ALT)", "alt": "TGP (ALT)",
  "ggt": "GGT", "gama gt": "GGT",
  "fosfatase alcalina": "Fosfatase Alcalina",
  "bilirrubina total": "Bilirrubina Total",
  "ureia": "Ureia", "urea": "Ureia",
};

const VALUE_PATTERN = /[:=]?\s*([\d]+[.,]?\d*)\s*([\w/%µμ]+(?:\/[\w%]+)?)?/;
const REF_PATTERN = /(?:ref|referência|referencia|vr|v\.r\.|normal)[:\s]*([^\n(]+)/i;
const RANGE_INLINE_PATTERN = /\(?\s*(\d+[.,]?\d*)\s*[-–a]\s*(\d+[.,]?\d*)\s*\)?/;

function parseNumber(str: string): number | null {
  const num = parseFloat(str.replace(",", "."));
  return isNaN(num) ? null : num;
}

function determineFlagFromRange(value: number | null, rangeStr: string): "low" | "normal" | "high" | "unknown" {
  if (value === null || !rangeStr) return "unknown";
  const rangeMatch = rangeStr.match(/(\d+[.,]?\d*)\s*[-–a]\s*(\d+[.,]?\d*)/);
  if (!rangeMatch) return "unknown";
  const low = parseNumber(rangeMatch[1]);
  const high = parseNumber(rangeMatch[2]);
  if (low === null || high === null) return "unknown";
  if (value < low) return "low";
  if (value > high) return "high";
  return "normal";
}

function normalizeLabs(rawText: string): NormalizedLabResult {
  const result: NormalizedLabResult = {
    patient: { name: null, sex: null, age: null },
    collection_date: null,
    labs: [],
    unmapped_lines: [],
    parser_version: 1,
  };
  if (!rawText || rawText.trim().length === 0) return result;

  const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // Patient info from header
  for (const line of lines.slice(0, 10)) {
    const lower = line.toLowerCase();
    if (!result.patient.name && (lower.includes("paciente") || lower.includes("nome"))) {
      const m = line.match(/(?:paciente|nome)[:\s]+(.+)/i);
      if (m) result.patient.name = m[1].trim();
    }
    if (!result.patient.sex && (lower.includes("sexo") || lower.includes("gênero"))) {
      const m = line.match(/(?:sexo|gênero|genero)[:\s]+(\w+)/i);
      if (m) result.patient.sex = m[1].trim();
    }
    if (!result.patient.age && lower.includes("idade")) {
      const m = line.match(/idade[:\s]+(.+)/i);
      if (m) result.patient.age = m[1].trim();
    }
    if (!result.collection_date && (lower.includes("coleta") || lower.includes("data"))) {
      const m = line.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
      if (m) result.collection_date = m[1];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase().replace(/[^a-záàãâéêíóôõúüç0-9\s.:,\-\/()]/gi, "").trim();
    if (lower.length < 3) continue;
    if (lower.startsWith("paciente") || lower.startsWith("nome") || lower.startsWith("data")) continue;

    let matched = false;
    for (const [alias, canonical] of Object.entries(BIOMARKER_ALIASES)) {
      if (lower.includes(alias)) {
        const afterAlias = line.substring(line.toLowerCase().indexOf(alias) + alias.length);
        const valueMatch = afterAlias.match(VALUE_PATTERN);
        if (valueMatch) {
          const numValue = parseNumber(valueMatch[1]);
          const unit = valueMatch[2] || "";
          let refRange = "";
          const refMatch = line.match(REF_PATTERN);
          if (refMatch) {
            refRange = refMatch[1].trim();
          } else {
            const inlineRange = afterAlias.match(RANGE_INLINE_PATTERN);
            if (inlineRange) refRange = `${inlineRange[1]}-${inlineRange[2]}`;
            if (!refRange && i + 1 < lines.length) {
              const nextRef = lines[i + 1].match(REF_PATTERN) || lines[i + 1].match(RANGE_INLINE_PATTERN);
              if (nextRef) refRange = nextRef[1]?.trim() || `${nextRef[1]}-${nextRef[2]}`;
            }
          }
          if (!result.labs.some((l) => l.name === canonical)) {
            result.labs.push({ name: canonical, value: numValue, unit: unit.trim(), reference_range: refRange, flag: determineFlagFromRange(numValue, refRange) });
          }
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const genericMatch = line.match(/^(.+?)[:=]\s*([\d]+[.,]?\d*)\s*([\w/%µμ]+(?:\/[\w%]+)?)?/);
      if (genericMatch) {
        const name = genericMatch[1].trim();
        const numValue = parseNumber(genericMatch[2]);
        const unit = genericMatch[3] || "";
        let refRange = "";
        const refMatch = line.match(REF_PATTERN);
        if (refMatch) refRange = refMatch[1].trim();
        const inlineRange = line.match(RANGE_INLINE_PATTERN);
        if (!refRange && inlineRange) refRange = `${inlineRange[1]}-${inlineRange[2]}`;
        result.labs.push({ name, value: numValue, unit: unit.trim(), reference_range: refRange, flag: determineFlagFromRange(numValue, refRange) });
      } else if (line.length > 5 && !line.match(/^[-=_]+$/) && !line.match(/^\d+$/)) {
        result.unmapped_lines.push(line);
      }
    }
  }
  return result;
}

// ══════════════════════════════════════
// LLM Analysis
// ══════════════════════════════════════

async function analyzWithLLM(
  normalized: NormalizedLabResult,
  clinicalContext: Record<string, unknown>,
  extractionMeta: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

  const systemPrompt = `Você é um assistente clínico especializado em medicina regenerativa e ortobiológicos (PRP, PRF, BMAC).

TAREFA: Analise os exames laboratoriais normalizados em JSON e o contexto clínico fornecido.

REGRAS ABSOLUTAS:
- NUNCA invente valores, números, p-values, tamanhos amostrais ou conclusões
- Se um dado não estiver presente nos exames: "não disponível nos exames fornecidos"
- Se unidade ou referência estiver ausente: sinalize como "unknown" no alerta
- Gere recomendações CONDICIONAIS (ex: "considerar dosar X se houver sintomas de Y")
- NÃO emita diagnóstico definitivo
- SEMPRE recomende correlação clínica
- Respostas em português do Brasil

ESTRUTURA DE RESPOSTA (JSON estrito, sem markdown):
{
  "summary": "resumo curto (2-3 frases)",
  "by_system": [
    { "system": "Nome do Sistema", "findings": ["achado 1"], "flags": ["flag relevante"] }
  ],
  "alerts": [
    { "type": "safety|data_quality|clinical", "message": "descrição", "severity": "low|medium|high" }
  ],
  "recommendations": ["recomendação condicional 1"],
  "regen_notes": ["nota relevante para prática regenerativa"],
  "disclaimer": "Este relatório não substitui avaliação médica. Correlacionar com dados clínicos."
}`;

  const userMessage = JSON.stringify({
    normalized_labs: normalized,
    clinical_context: clinicalContext,
    extraction_meta: extractionMeta,
  });

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[analyze:llm-error] status=${response.status}`, errText);
    throw new Error(`LLM_ERROR: status=${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  
  // Strip markdown fences if present
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("[analyze:parse-error] LLM returned non-JSON:", content.substring(0, 200));
    throw new Error("LLM_PARSE_ERROR: resposta não é JSON válido");
  }
}

// ══════════════════════════════════════
// Main handler
// ══════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Auth — use service role for DB operations, validate user token when available
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== anonKey) {
        const userClient = createClient(
          Deno.env.get("SUPABASE_URL")!, anonKey,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: userData } = await userClient.auth.getUser(token);
        if (userData?.user) userId = userData.user.id;
      }
    }
    console.log(`[analyze:request] userId=${userId || "anonymous"}`);

    const body = await req.json();
    const { attendance_id, raw_text: providedRawText, bucket, storage_path, clinical_context } = body;

    if (!attendance_id) {
      return new Response(
        JSON.stringify({ ok: false, error_code: "MISSING_PARAMS", message: "attendance_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let rawText = providedRawText || "";
    let extractionMethod = "MANUAL";
    let extractionConfidence: "high" | "medium" | "low" = "medium";
    let extractionWarnings: string[] = [];

    // If storage_path provided, call extract-file-text internally
    if (storage_path && bucket && !providedRawText) {
      console.log(`[analyze:extract] Calling extract-file-text for ${storage_path}`);
      
      const extractResponse = await supabase.functions.invoke("extract-file-text", {
        body: {
          storage_path,
          bucket,
          mime_type: body.mime_type || "application/pdf",
          file_name: body.file_name || storage_path.split("/").pop(),
        },
      });

      if (extractResponse.error || !extractResponse.data?.ok) {
        const errData = extractResponse.data || {};
        // Persist failed run
        await supabase.from("lab_analysis_runs").insert({
          attendance_id,
          user_id: userId,
          bucket,
          storage_path,
          extraction_method: errData.method || "UNKNOWN",
          status: "failed",
          error_code: errData.error_code || "EXTRACTION_FAIL",
          error_debug: errData.debug || {},
          warnings: errData.warnings || [],
        });

        return new Response(
          JSON.stringify({
            ok: false,
            error_code: errData.error_code || "EXTRACTION_FAIL",
            message: errData.message || "Falha na extração de texto",
            extraction: { method: errData.method, warnings: errData.warnings || [] },
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      rawText = extractResponse.data.raw_text;
      extractionMethod = extractResponse.data.method;
      extractionConfidence = extractResponse.data.confidence;
      extractionWarnings = extractResponse.data.warnings || [];
    }

    if (!rawText || rawText.trim().length < 50) {
      await supabase.from("lab_analysis_runs").insert({
        attendance_id,
        user_id: userId,
        bucket,
        storage_path,
        extraction_method: extractionMethod,
        extraction_confidence: extractionConfidence,
        raw_text: rawText,
        status: "failed",
        error_code: "INSUFFICIENT_TEXT",
        warnings: extractionWarnings,
      });

      return new Response(
        JSON.stringify({
          ok: false,
          error_code: "INSUFFICIENT_TEXT",
          message: "Texto extraído insuficiente para análise. Cole o texto manualmente.",
          extraction: { method: extractionMethod, confidence: extractionConfidence, warnings: extractionWarnings },
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize labs
    console.log(`[analyze:normalize] raw_text length=${rawText.length}`);
    const normalized = normalizeLabs(rawText);
    console.log(`[analyze:normalized] labs=${normalized.labs.length} unmapped=${normalized.unmapped_lines.length}`);

    if (normalized.labs.length === 0) {
      // Persist failed run
      await supabase.from("lab_analysis_runs").insert({
        attendance_id,
        user_id: userId,
        bucket,
        storage_path,
        extraction_method: extractionMethod,
        extraction_confidence: extractionConfidence,
        raw_text: rawText,
        normalized_json: normalized,
        status: "failed",
        error_code: "NO_BIOMARKERS",
        warnings: extractionWarnings,
      });

      return new Response(
        JSON.stringify({
          ok: false,
          error_code: "NO_BIOMARKERS",
          message: "Não foi possível identificar biomarcadores no texto. Verifique o conteúdo ou cole manualmente.",
          extraction: { method: extractionMethod, confidence: extractionConfidence, warnings: extractionWarnings },
          normalized,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call LLM with JSON only
    const extractionMeta = {
      method: extractionMethod,
      confidence: extractionConfidence,
      warnings: extractionWarnings,
      labs_count: normalized.labs.length,
      unmapped_count: normalized.unmapped_lines.length,
    };

    const context = clinical_context || {};
    
    console.log(`[analyze:llm] Sending ${normalized.labs.length} labs to LLM`);
    const analysis = await analyzWithLLM(normalized, context, extractionMeta);
    const durationMs = Date.now() - startTime;

    // Persist successful run
    const { error: insertErr } = await supabase.from("lab_analysis_runs").insert({
      attendance_id,
      user_id: userId,
      bucket,
      storage_path,
      extraction_method: extractionMethod,
      extraction_confidence: extractionConfidence,
      warnings: extractionWarnings,
      raw_text: rawText,
      normalized_json: normalized,
      analysis_json: analysis,
      model_meta: { model: "google/gemini-2.5-flash", duration_ms: durationMs, prompt_version: 1 },
      status: "success",
    });

    if (insertErr) {
      console.error("[analyze:persist-error]", insertErr);
      // Don't fail the request, analysis was successful
    }

    console.log(`[analyze:done] duration=${durationMs}ms`);

    return new Response(
      JSON.stringify({
        ok: true,
        extraction: { method: extractionMethod, confidence: extractionConfidence, warnings: extractionWarnings },
        normalized,
        analysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[analyze:fatal]", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error_code: err.message?.startsWith("LLM_") ? "LLM_ERROR" : "INTERNAL_ERROR",
        message: err.message || "Erro interno na análise",
        debug: { duration_ms: Date.now() - startTime },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
