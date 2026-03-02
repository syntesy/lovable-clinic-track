import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

// ══════════════════════════════════════
// Pipeline Version Constants
// ══════════════════════════════════════
const PIPELINE_VERSION = {
  parser: "normalizeLabs_v2",
  edge: "analyzeLabs_v5",
  prompt: "labs_prompt_v1.1.0",
  model: "google/gemini-2.5-flash",
};

// ══════════════════════════════════════
// Constants
// ══════════════════════════════════════
const MIN_TEXT_FOR_ANALYSIS = 200;
const MIN_INTERPRETABLE_LABS = 3;
const LLM_MAX_RETRIES = 3;
const LLM_RETRY_DELAYS = [1000, 3000, 7000];
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// ══════════════════════════════════════
// SHA-256 Hash (deterministic)
// ══════════════════════════════════════

function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(item => stableStringify(item)).join(',') + ']';
  if (typeof obj === 'object') {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = sortedKeys.map(key => {
      const value = (obj as Record<string, unknown>)[key];
      return JSON.stringify(key) + ':' + stableStringify(value);
    });
    return '{' + pairs.join(',') + '}';
  }
  return JSON.stringify(obj);
}

async function sha256Hash(data: unknown): Promise<string> {
  const jsonStr = stableStringify(data);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(jsonStr));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ══════════════════════════════════════
// Unit Whitelist & Sanitization (mirror of client)
// ══════════════════════════════════════

const UNIT_WHITELIST = new Set([
  "%", "mg/dL", "g/dL", "ng/mL", "pg/mL", "µg/dL", "µg/L",
  "mg/L", "mmol/L", "mEq/L", "U/L", "UI/L", "mUI/L",
  "10^3/µL", "10^6/µL", "mil/mm³", "mL/min/1.73m²",
  "fL", "pg", "g/L", "µUI/mL", "mUI/mL", "ng/dL",
  "µmol/L", "mm³", "/mm³", "cel/mm³", "x10³/µL",
  "milhões/mm³", "mil/µL", "10³/µL",
]);

const UNIT_NORMALIZATION: Record<string, string> = {
  "mg/dl": "mg/dL", "g/dl": "g/dL", "ng/ml": "ng/mL",
  "pg/ml": "pg/mL", "ug/dl": "µg/dL", "ug/l": "µg/L",
  "mg/l": "mg/L", "mmol/l": "mmol/L", "meq/l": "mEq/L",
  "u/l": "U/L", "ui/l": "UI/L", "mui/l": "mUI/L",
  "fl": "fL", "ml/min/1.73m2": "mL/min/1.73m²",
  "mui/ml": "mUI/mL", "uui/ml": "µUI/mL",
  "ng/dl": "ng/dL", "umol/l": "µmol/L",
};

const INVALID_UNIT_PATTERNS = [
  /^[a-f0-9]{24,}$/i,
  /^[0-9a-f]{8}-[0-9a-f]{4}/i,
  /[{}_%]/,
];

function sanitizeUnit(unitRaw: string | null | undefined): { unit: string | null; warning?: string } {
  if (!unitRaw || unitRaw.trim().length === 0) return { unit: null };
  const trimmed = unitRaw.trim();
  if (trimmed.length > 20) return { unit: null, warning: "INVALID_UNIT_PATTERN" };
  for (const pattern of INVALID_UNIT_PATTERNS) {
    if (pattern.test(trimmed)) return { unit: null, warning: "INVALID_UNIT_PATTERN" };
  }
  const lower = trimmed.toLowerCase();
  if (UNIT_NORMALIZATION[lower]) return { unit: UNIT_NORMALIZATION[lower] };
  for (const allowed of UNIT_WHITELIST) {
    if (allowed.toLowerCase() === lower) return { unit: allowed };
  }
  if (trimmed === "%") return { unit: "%" };
  return { unit: null, warning: "INVALID_UNIT" };
}

// ══════════════════════════════════════
// Critical Biomarkers & Default Ranges
// ══════════════════════════════════════

const CRITICAL_BIOMARKERS = new Set([
  "Sódio", "Potássio", "Glicose", "Creatinina", "HbA1c",
  "Triglicerídeos", "Hemoglobina", "Plaquetas", "Leucócitos",
]);

const DEFAULT_RANGES: Record<string, { range: string; sex_dependent: boolean }> = {
  "Glicose": { range: "70-99", sex_dependent: false },
  "HbA1c": { range: "4.0-5.6", sex_dependent: false },
  "Colesterol Total": { range: "0-200", sex_dependent: false },
  "HDL": { range: "40-60", sex_dependent: true },
  "LDL": { range: "0-130", sex_dependent: false },
  "Triglicerídeos": { range: "0-150", sex_dependent: false },
  "TSH": { range: "0.4-4.0", sex_dependent: false },
  "T4 Livre": { range: "0.8-1.8", sex_dependent: false },
  "PCR": { range: "0-5", sex_dependent: false },
  "VCM": { range: "80-100", sex_dependent: false },
  "Ferritina": { range: "30-300", sex_dependent: true },
  "Vitamina D (25-OH)": { range: "30-100", sex_dependent: false },
  "Vitamina B12": { range: "200-900", sex_dependent: false },
  "TGO (AST)": { range: "10-40", sex_dependent: false },
  "TGP (ALT)": { range: "7-56", sex_dependent: false },
  "GGT": { range: "9-48", sex_dependent: true },
  "Creatinina": { range: "0.6-1.2", sex_dependent: true },
  "Ureia": { range: "15-45", sex_dependent: false },
  "Ácido Úrico": { range: "3.5-7.2", sex_dependent: true },
  "Sódio": { range: "136-145", sex_dependent: false },
  "Potássio": { range: "3.5-5.1", sex_dependent: false },
  "Cálcio": { range: "8.5-10.5", sex_dependent: false },
  "Magnésio": { range: "1.7-2.2", sex_dependent: false },
  "Ferro Sérico": { range: "60-170", sex_dependent: true },
  "Albumina": { range: "3.5-5.0", sex_dependent: false },
  "Hemoglobina": { range: "12-17", sex_dependent: true },
  "Hematócrito": { range: "36-50", sex_dependent: true },
  "Leucócitos": { range: "4000-11000", sex_dependent: false },
  "Plaquetas": { range: "150000-400000", sex_dependent: false },
};

// ══════════════════════════════════════
// Pre-filter (deterministic metadata removal)
// ══════════════════════════════════════

const NON_CLINICAL_KEYWORD_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bCNES\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCRBM\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCRM\s*[:\-]?\s*\d/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCRO\s*[:\-]?\s*\d/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCOREN\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\brespons[aá]vel\s+t[eé]cnic/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bassinado\s+digitalmente\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bassinatura\s+digital\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCKD[\s-]?EPI\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bcalculo\s+pela\s+f[oó]rmula\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*m[eé]todo\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*f[oó]rmula\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bdata\s+impress[aã]o\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /%PRECISION/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bimpresso\s+por\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bresultado\s+impresso\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*layout\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*c[oó]digo\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*laborat[oó]rio\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*unidade\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*endere[cç]o\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*telefone\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*fone\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*site\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*e-?mail\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*cnpj\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
];

const NON_CLINICAL_ID_PATTERNS_FILTER: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /^\s*protocolo\s*[:=]?\s*[\d\-]+\s*$/i, reason: "NON_CLINICAL_ID_NUMBER" },
  { pattern: /^\s*registro\s*[:=]?\s*[\d\-]+\s*$/i, reason: "NON_CLINICAL_ID_NUMBER" },
  { pattern: /^\s*\d{6,}\s*$/, reason: "NON_CLINICAL_ID_NUMBER" },
];

const NON_CLINICAL_TOKEN_PATTERNS_FILTER: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /[a-f0-9]{24,}/i, reason: "NON_CLINICAL_TOKEN_HASH" },
  { pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i, reason: "NON_CLINICAL_TOKEN_HASH" },
];

const BIOMARKER_HINT = /\b(hemoglobina|glicose|glicemia|ferritina|creatinina|colesterol|hdl|ldl|tsh|pot[aá]ssio|s[oó]dio|plaquetas|leuc[oó]citos|hemat[oó]crito|vitamina|triglice|hba1c|pcr|tgo|tgp|ggt|ureia|albumina|ferro|c[aá]lcio|magn[eé]sio|vcm|fosfatase|bilirrubina|[aá]cido\s+[uú]rico|t4\s*livre|zinco|nitrito)\b/i;

interface PreFilterResult {
  filtered_text: string;
  stats: { total: number; kept: number; excluded: number };
  excluded_lines: Array<{ line: string; reason: string }>;
}

function preFilterLabsText(rawText: string): PreFilterResult {
  if (!rawText || rawText.trim().length === 0) {
    return { filtered_text: "", stats: { total: 0, kept: 0, excluded: 0 }, excluded_lines: [] };
  }
  const lines = rawText.split("\n");
  const kept: string[] = [];
  const excluded: Array<{ line: string; reason: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    let excludeReason: string | null = null;

    for (const { pattern, reason } of NON_CLINICAL_KEYWORD_PATTERNS) {
      if (pattern.test(trimmed)) { excludeReason = reason; break; }
    }
    if (!excludeReason) {
      for (const { pattern, reason } of NON_CLINICAL_ID_PATTERNS_FILTER) {
        if (pattern.test(trimmed)) { excludeReason = reason; break; }
      }
    }
    if (!excludeReason && !BIOMARKER_HINT.test(trimmed)) {
      for (const { pattern, reason } of NON_CLINICAL_TOKEN_PATTERNS_FILTER) {
        if (pattern.test(trimmed)) { excludeReason = reason; break; }
      }
    }

    if (excludeReason) excluded.push({ line: trimmed, reason: excludeReason });
    else kept.push(trimmed);
  }

  return {
    filtered_text: kept.join("\n"),
    stats: { total: lines.filter(l => l.trim().length > 0).length, kept: kept.length, excluded: excluded.length },
    excluded_lines: excluded,
  };
}

// ══════════════════════════════════════
// Anti-false-positive: generic label blocking
// ══════════════════════════════════════

const GENERIC_LABELS_SET = new Set([
  "resultado", "valor", "referência", "referencia", "material", "amostra",
  "observação", "observacao", "nota", "laudo", "exame",
]);
const NON_CLINICAL_LABEL_KW = [
  /\bcrbm\b/i, /\bcnes\b/i, /\brespons[aá]vel\b/i, /\bassinado\b/i,
  /\bprotocolo\b/i, /\bregistro\b/i, /\blayout\b/i, /\bc[oó]digo\b/i,
  /\bcrm\b/i, /\bcro\b/i, /\bcoren\b/i, /\bcnpj\b/i,
];

function isGenericOrNonClinicalLabel(name: string): boolean {
  const lower = name.toLowerCase().replace(/[:\s]+$/, "").trim();
  if (GENERIC_LABELS_SET.has(lower)) return true;
  for (const pat of NON_CLINICAL_LABEL_KW) { if (pat.test(lower)) return true; }
  if (/^\d+$/.test(lower)) return true;
  return false;
}

// ══════════════════════════════════════
// normalizeLabs — server-side (v2 fail-closed)
// ══════════════════════════════════════

interface NormalizedLabItem {
  name: string;
  value: number | null;
  unit: string | null;
  reference_range: string | null;
  flag: "low" | "normal" | "high" | "unknown";
  source_line: string;
  parser_confidence: "high" | "medium" | "low";
  is_interpretable: boolean;
  blocking_reasons: string[];
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

const VALUE_PATTERN = /[:=]?\s*([\d]+[.,]?\d*)\s*([\w/%µμ^³²]+(?:\/[\w%µμ^³²]+)*)?/;
const REF_PATTERN = /(?:ref|referência|referencia|vr|v\.r\.|normal)[:\s]*([^\n]+)/i;
const RANGE_INLINE_PATTERN = /\(?\s*(\d+[.,]?\d*)\s*[-–a]\s*(\d+[.,]?\d*)\s*\)?/;

function cleanRefRange(raw: string): string {
  return raw.replace(/\)+\s*$/, "").replace(/^\s*\(/, "").trim();
}

function parseNumber(str: string): number | null {
  const num = parseFloat(str.replace(",", "."));
  return isNaN(num) ? null : num;
}

function determineFlagFromRange(value: number | null, rangeStr: string | null): "low" | "normal" | "high" | "unknown" {
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

function computeParserConfidence(hasValue: boolean, hasUnit: boolean, hasRange: boolean, isKnown: boolean): "high" | "medium" | "low" {
  let s = 0;
  if (hasValue) s++;
  if (hasUnit) s++;
  if (hasRange) s++;
  if (isKnown) s++;
  return s >= 3 ? "high" : s >= 2 ? "medium" : "low";
}

function computeInterpretability(
  item: { name: string; value: number | null; unit: string | null; reference_range: string | null; parser_confidence: "high" | "medium" | "low" },
  patientSex: string | null
): { is_interpretable: boolean; blocking_reasons: string[]; reference_range: string | null; flag: "low" | "normal" | "high" | "unknown" } {
  const reasons: string[] = [];
  let refRange = item.reference_range;
  const isCritical = CRITICAL_BIOMARKERS.has(item.name);

  if (item.value === null) reasons.push("MISSING_VALUE");
  if (isCritical && !item.unit) reasons.push("CRITICAL_MISSING_UNIT");
  if (isCritical && item.parser_confidence === "low") reasons.push("CRITICAL_LOW_CONFIDENCE");

  if (!refRange) {
    const def = DEFAULT_RANGES[item.name];
    if (def) {
      if (def.sex_dependent && !patientSex) reasons.push("RANGE_REQUIRES_SEX");
      else if (item.unit || !isCritical) refRange = def.range;
    } else {
      reasons.push("NO_REFERENCE_RANGE");
    }
  }

  return { is_interpretable: reasons.length === 0, blocking_reasons: reasons, reference_range: refRange, flag: determineFlagFromRange(item.value, refRange) };
}

function normalizeLabs(rawText: string): NormalizedLabResult {
  const result: NormalizedLabResult = {
    patient: { name: null, sex: null, age: null },
    collection_date: null, labs: [], unmapped_lines: [], parser_version: 2,
  };
  if (!rawText || rawText.trim().length === 0) return result;

  const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

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
          const rawUnit = valueMatch[2] || null;
          const { unit: sanitizedUnit, warning: unitWarning } = sanitizeUnit(rawUnit);

          let refRange: string | null = null;
          const refMatch = line.match(REF_PATTERN);
          if (refMatch) refRange = cleanRefRange(refMatch[1]);
          else {
            const inlineRange = afterAlias.match(RANGE_INLINE_PATTERN);
            if (inlineRange) refRange = `${inlineRange[1]}-${inlineRange[2]}`;
            if (!refRange && i + 1 < lines.length) {
              const nextRef = lines[i + 1].match(REF_PATTERN) || lines[i + 1].match(RANGE_INLINE_PATTERN);
              if (nextRef) refRange = cleanRefRange(nextRef[1]?.trim() || `${nextRef[1]}-${nextRef[2]}`);
            }
          }

          const confidence = computeParserConfidence(numValue !== null, sanitizedUnit !== null, refRange !== null, true);
          const blockingReasons: string[] = [];
          if (unitWarning) blockingReasons.push(unitWarning);
          const interp = computeInterpretability({ name: canonical, value: numValue, unit: sanitizedUnit, reference_range: refRange, parser_confidence: confidence }, result.patient.sex);

          if (!result.labs.some((l) => l.name === canonical)) {
            result.labs.push({
              name: canonical, value: numValue, unit: sanitizedUnit,
              reference_range: interp.reference_range, flag: interp.flag,
              source_line: line, parser_confidence: confidence,
              is_interpretable: interp.is_interpretable && blockingReasons.length === 0,
              blocking_reasons: [...blockingReasons, ...interp.blocking_reasons],
            });
          }
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const genericMatch = line.match(/^(.+?)[:=]\s*([\d]+[.,]?\d*)\s*([\w/%µμ^³²]+(?:\/[\w%µμ^³²]+)*)?/);
      if (genericMatch) {
        const name = genericMatch[1].trim();
        if (isGenericOrNonClinicalLabel(name)) {
          result.unmapped_lines.push(line);
          continue;
        }
        const numValue = parseNumber(genericMatch[2]);
        const rawUnit = genericMatch[3] || null;
        const { unit: sanitizedUnit, warning: unitWarning } = sanitizeUnit(rawUnit);
        let refRange: string | null = null;
        const refMatch = line.match(REF_PATTERN);
        if (refMatch) refRange = cleanRefRange(refMatch[1]);
        const inlineRange = line.match(RANGE_INLINE_PATTERN);
        if (!refRange && inlineRange) refRange = `${inlineRange[1]}-${inlineRange[2]}`;
        const confidence = computeParserConfidence(numValue !== null, sanitizedUnit !== null, refRange !== null, false);
        const blockingReasons: string[] = [];
        if (unitWarning) blockingReasons.push(unitWarning);
        const interp = computeInterpretability({ name, value: numValue, unit: sanitizedUnit, reference_range: refRange, parser_confidence: confidence }, result.patient.sex);
        result.labs.push({
          name, value: numValue, unit: sanitizedUnit,
          reference_range: interp.reference_range, flag: interp.flag,
          source_line: line, parser_confidence: confidence,
          is_interpretable: interp.is_interpretable && blockingReasons.length === 0,
          blocking_reasons: [...blockingReasons, ...interp.blocking_reasons],
        });
      } else if (line.length > 5 && !line.match(/^[-=_]+$/) && !line.match(/^\d+$/)) {
        result.unmapped_lines.push(line);
      }
    }
  }
  return result;
}

// ══════════════════════════════════════
// Retry & LLM
// ══════════════════════════════════════

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeWithLLM(
  interpretableLabs: NormalizedLabItem[],
  blockedSummary: Array<{ name: string; reasons: string[] }>,
  clinicalContext: Record<string, unknown>,
  extractionMeta: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

  const labNames = interpretableLabs.map(l => `- ${l.name}: ${l.value} ${l.unit || ""} (ref: ${l.reference_range || "padrão"}, status: ${l.flag})`).join("\n");

  const systemPrompt = `Você é um assistente clínico especializado em medicina regenerativa e ortobiológicos.

TAREFA: Analise SOMENTE os biomarcadores INTERPRETÁVEIS fornecidos.

REGRAS ABSOLUTAS:
- NUNCA invente valores, unidades ou referências
- SOMENTE mencione biomarcadores da lista INTERPRETÁVEIS fornecida
- Se dados forem insuficientes: declare explicitamente
- NÃO emita diagnóstico definitivo
- SEMPRE recomende correlação clínica
- Respostas em português do Brasil

BIOMARCADORES INTERPRETÁVEIS (use SOMENTE estes):
${labNames}

${blockedSummary.length > 0 ? `BIOMARCADORES BLOQUEADOS (NÃO interpretar, apenas informar que existem dados incompletos):
${blockedSummary.map(b => `- ${b.name}: ${b.reasons.join(", ")}`).join("\n")}` : ""}

ESTRUTURA DE RESPOSTA (JSON estrito):
{
  "summary": "resumo curto (2-3 frases)",
  "by_system": [{ "system": "Nome do Sistema", "findings": ["achado"], "flags": ["flag"] }],
  "alerts": [{ "type": "safety|data_quality|clinical", "message": "descrição", "severity": "low|medium|high" }],
  "recommendations": ["recomendação condicional"],
  "regen_notes": ["nota para prática regenerativa"],
  "confidence_label": "HIGH|MODERATE|LOW",
  "disclaimer": "Este relatório não substitui avaliação médica. Correlacionar com dados clínicos."
}`;

  const userMessage = JSON.stringify({
    interpretable_labs: interpretableLabs,
    blocked_labs_summary: blockedSummary,
    clinical_context: clinicalContext,
    extraction_meta: extractionMeta,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < LLM_MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = LLM_RETRY_DELAYS[attempt - 1] || 7000;
        console.log(`[analyze:llm-retry] attempt=${attempt + 1} delay=${delay}ms`);
        await sleep(delay);
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: PIPELINE_VERSION.model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
          max_tokens: 4000, temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[analyze:llm-error] attempt=${attempt + 1} status=${response.status}`, errText);
        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < LLM_MAX_RETRIES - 1) {
          lastError = new Error(`LLM_RETRYABLE: status=${response.status}`);
          continue;
        }
        throw new Error(`LLM_ERROR: status=${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(cleaned); }
      catch { throw new Error("LLM_PARSE_ERROR: resposta não é JSON válido"); }

      if (!parsed.summary) parsed.summary = "Análise gerada com campos incompletos.";
      if (!parsed.disclaimer) parsed.disclaimer = "Este relatório não substitui avaliação médica.";
      if (!parsed.by_system) parsed.by_system = [];
      if (!parsed.alerts) parsed.alerts = [];
      if (!parsed.recommendations) parsed.recommendations = [];
      if (!parsed.regen_notes) parsed.regen_notes = [];

      return parsed;
    } catch (err: any) {
      lastError = err;
      if (!err.message?.includes("RETRYABLE") || attempt >= LLM_MAX_RETRIES - 1) throw err;
    }
  }
  throw lastError || new Error("LLM_ERROR: todas as tentativas falharam");
}

// ══════════════════════════════════════
// Validate LLM output vs interpretable labs
// ══════════════════════════════════════

function validateAnalysisVsInterpretable(
  analysis: Record<string, unknown>,
  interpretableLabs: NormalizedLabItem[]
): { cleaned: Record<string, unknown>; validationAlerts: Array<{ type: string; message: string; severity: string }> } {
  const knownNames = new Set(interpretableLabs.map(l => l.name.toLowerCase()));
  const validationAlerts: Array<{ type: string; message: string; severity: string }> = [];
  const allCanonical = new Set(Object.values(BIOMARKER_ALIASES));

  const bySystems = analysis.by_system as Array<{ system: string; findings: string[]; flags: string[] }> | undefined;
  if (Array.isArray(bySystems)) {
    for (const sys of bySystems) {
      if (Array.isArray(sys.findings)) {
        sys.findings = sys.findings.filter(f => {
          const textLower = f.toLowerCase();
          for (const canonical of allCanonical) {
            if (textLower.includes(canonical.toLowerCase()) && !knownNames.has(canonical.toLowerCase())) {
              validationAlerts.push({
                type: "data_quality", severity: "medium",
                message: `LLM_REFERENCED_UNKNOWN_LAB: "${canonical}" não está nos dados interpretáveis. Achado removido.`,
              });
              return false;
            }
          }
          return true;
        });
      }
    }
  }

  const existingAlerts = (analysis.alerts || []) as Array<{ type: string; message: string; severity: string }>;
  analysis.alerts = [...existingAlerts, ...validationAlerts];
  return { cleaned: analysis, validationAlerts };
}

// ══════════════════════════════════════
// Main handler
// ══════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== anonKey) {
        const userClient = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, { global: { headers: { Authorization: authHeader } } });
        const { data: userData } = await userClient.auth.getUser(token);
        if (userData?.user) userId = userData.user.id;
      }
    }

    const body = await req.json();
    const { attendance_id, patient_id, raw_text: providedRawText, bucket, storage_path, clinical_context, manual_corrections } = body;

    if (!attendance_id && !patient_id) {
      return new Response(JSON.stringify({ ok: false, error_code: "MISSING_PARAMS", message: "attendance_id ou patient_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let rawText = providedRawText || "";
    let extractionMethod = "MANUAL";
    let extractionConfidence: "high" | "medium" | "low" = "medium";
    let extractionWarnings: string[] = [];

    // File extraction
    if (storage_path && bucket && !providedRawText) {
      const extractResponse = await supabase.functions.invoke("extract-file-text", {
        body: { storage_path, bucket, mime_type: body.mime_type || "application/pdf", file_name: body.file_name || storage_path.split("/").pop() },
      });

      if (extractResponse.error || !extractResponse.data?.ok) {
        const errData = extractResponse.data || {};
        await persistRun(supabase, {
          attendance_id: attendance_id || null, patient_id: patient_id || null,
          user_id: userId, bucket, storage_path,
          extraction_method: errData.method || "UNKNOWN",
          status: "failed", error_code: errData.error_code || "EXTRACTION_FAIL",
          error_debug: errData.debug || {}, warnings: errData.warnings || [],
          pipeline_version: PIPELINE_VERSION,
        });
        return new Response(JSON.stringify({ ok: false, error_code: errData.error_code || "EXTRACTION_FAIL", message: errData.message || "Falha na extração" }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      rawText = extractResponse.data.raw_text;
      extractionMethod = extractResponse.data.method;
      extractionConfidence = extractResponse.data.confidence;
      extractionWarnings = extractResponse.data.warnings || [];
    }

    // Threshold check
    if (!rawText || rawText.trim().length < MIN_TEXT_FOR_ANALYSIS) {
      await persistRun(supabase, {
        attendance_id: attendance_id || null, patient_id: patient_id || null,
        user_id: userId, bucket, storage_path,
        extraction_method: extractionMethod, extraction_confidence: extractionConfidence,
        raw_text: rawText, status: "failed", error_code: "INSUFFICIENT_TEXT", warnings: extractionWarnings,
        pipeline_version: PIPELINE_VERSION,
      });
      return new Response(JSON.stringify({
        ok: false, error_code: "INSUFFICIENT_TEXT",
        message: `Texto insuficiente (${rawText?.trim().length || 0} < ${MIN_TEXT_FOR_ANALYSIS} chars).`,
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pre-filter (deterministic metadata removal)
    const prefilterResult = preFilterLabsText(rawText);
    console.log(`[analyze:prefilter] kept=${prefilterResult.stats.kept} excluded=${prefilterResult.stats.excluded}`);

    // Normalize (v2 fail-closed) — uses FILTERED text
    const normalized = normalizeLabs(prefilterResult.filtered_text);
    console.log(`[analyze:normalized] total=${normalized.labs.length}`);

    // Split interpretable vs blocked
    const interpretableLabs = normalized.labs.filter(l => l.is_interpretable);
    const blockedLabs = normalized.labs.filter(l => !l.is_interpretable);

    console.log(`[analyze:safety] interpretable=${interpretableLabs.length} blocked=${blockedLabs.length}`);

    // Minimum interpretable check
    if (interpretableLabs.length < MIN_INTERPRETABLE_LABS) {
      await persistRun(supabase, {
        attendance_id: attendance_id || null, patient_id: patient_id || null,
        user_id: userId, bucket, storage_path,
        extraction_method: extractionMethod, extraction_confidence: extractionConfidence,
        raw_text: rawText, normalized_json: normalized,
        status: "failed", error_code: "INSUFFICIENT_INTERPRETABLE_LABS",
        warnings: [...extractionWarnings, `Apenas ${interpretableLabs.length} biomarcadores interpretáveis (mín: ${MIN_INTERPRETABLE_LABS})`],
        pipeline_version: PIPELINE_VERSION,
      });
      return new Response(JSON.stringify({
        ok: false, error_code: "INSUFFICIENT_INTERPRETABLE_LABS",
        message: `Apenas ${interpretableLabs.length} biomarcador(es) interpretável(is) (mínimo: ${MIN_INTERPRETABLE_LABS}). Revise os dados bloqueados.`,
        normalized,
        blocked_labs: blockedLabs.map(l => ({ name: l.name, value: l.value, unit: l.unit, blocking_reasons: l.blocking_reasons, source_line: l.source_line })),
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // LLM analysis — only interpretable labs
    const blockedSummary = blockedLabs.map(l => ({ name: l.name, reasons: l.blocking_reasons }));
    const extractionMeta = {
      method: extractionMethod, confidence: extractionConfidence,
      warnings: extractionWarnings, interpretable_count: interpretableLabs.length,
      blocked_count: blockedLabs.length, total_count: normalized.labs.length,
    };

    // Compute input_hash BEFORE calling LLM
    const inputPayload = {
      interpretable_labs: interpretableLabs,
      blocked_labs_summary: blockedSummary,
      clinical_context: clinical_context || {},
      pipeline_version: PIPELINE_VERSION,
    };
    const inputHash = await sha256Hash(inputPayload);

    let analysis: Record<string, unknown>;
    try {
      analysis = await analyzeWithLLM(interpretableLabs, blockedSummary, clinical_context || {}, extractionMeta);
    } catch (llmErr: any) {
      console.error("[analyze:llm-final-fail]", llmErr.message);
      await persistRun(supabase, {
        attendance_id: attendance_id || null, patient_id: patient_id || null,
        user_id: userId, bucket, storage_path,
        extraction_method: extractionMethod, extraction_confidence: extractionConfidence,
        raw_text: rawText, normalized_json: normalized,
        status: "failed", error_code: llmErr.message?.startsWith("LLM_PARSE") ? "LLM_PARSE_ERROR" : "LLM_ERROR",
        error_debug: { error: llmErr.message, retries: LLM_MAX_RETRIES },
        warnings: extractionWarnings,
        pipeline_version: PIPELINE_VERSION,
        input_hash: inputHash,
      });
      return new Response(JSON.stringify({
        ok: false, error_code: "LLM_ERROR",
        message: `Falha na análise por IA após ${LLM_MAX_RETRIES} tentativas.`,
        normalized,
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate LLM output vs interpretable set
    const { cleaned: validatedAnalysis, validationAlerts } = validateAnalysisVsInterpretable(analysis, interpretableLabs);
    if (validationAlerts.length > 0) {
      console.log(`[analyze:validation] ${validationAlerts.length} phantom biomarkers removed`);
    }

    const durationMs = Date.now() - startTime;

    // Compute output_hash (content-only, no timestamps)
    const outputPayload = {
      normalized_json: normalized,
      analysis_json: validatedAnalysis,
      extraction_meta: extractionMeta,
      pipeline_version: PIPELINE_VERSION,
    };
    const outputHash = await sha256Hash(outputPayload);

    // Determine correction metadata
    const wasManuallyCorreced = Array.isArray(manual_corrections) && manual_corrections.length > 0;
    const correctionSummary = wasManuallyCorreced ? {
      count: manual_corrections.length,
      fields: [...new Set(manual_corrections.map((c: any) => c.field_name))],
    } : null;

    // Extract confidence label from LLM response
    const confidenceLabel = (validatedAnalysis.confidence_label as string) || null;

    // Persist the new run (always NEW, never overwrite)
    const { data: insertedRun, error: insertError } = await supabase.from("lab_analysis_runs").insert({
      attendance_id: attendance_id || null,
      patient_id: patient_id || null,
      user_id: userId, bucket, storage_path,
      extraction_method: extractionMethod,
      extraction_confidence: extractionConfidence,
      warnings: extractionWarnings,
      raw_text: rawText,
      normalized_json: normalized,
      analysis_json: validatedAnalysis,
      model_meta: { model: PIPELINE_VERSION.model, duration_ms: durationMs, prompt_version: PIPELINE_VERSION.prompt, prefilter_stats: prefilterResult.stats, excluded_lines_sample: prefilterResult.excluded_lines.slice(0, 20) },
      status: "success",
      pipeline_version: PIPELINE_VERSION,
      input_hash: inputHash,
      output_hash: outputHash,
      was_manually_corrected: wasManuallyCorreced,
      correction_summary: correctionSummary,
      analysis_confidence_label: confidenceLabel,
    }).select("id").single();

    if (insertError) {
      console.error("[analyze:persist-error]", insertError);
    } else {
      console.log(`[analyze:persisted] run_id=${insertedRun?.id} status=success`);

      // Persist correction audit records if any
      if (wasManuallyCorreced && insertedRun?.id && userId) {
        const correctionRows = manual_corrections.map((c: any) => ({
          run_id: insertedRun.id,
          created_by: userId,
          lab_name: c.lab_name,
          field_name: c.field_name,
          old_value: c.old_value ?? null,
          new_value: c.new_value ?? null,
          reason: c.reason ?? null,
        }));
        const { error: corrError } = await supabase.from("lab_analysis_corrections").insert(correctionRows);
        if (corrError) console.error("[analyze:corrections-persist-error]", corrError);
        else console.log(`[analyze:corrections-persisted] count=${correctionRows.length}`);
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      run_id: insertedRun?.id || null,
      extraction: { method: extractionMethod, confidence: extractionConfidence, warnings: extractionWarnings },
      normalized,
      analysis: validatedAnalysis,
      safety: { interpretable: interpretableLabs.length, blocked: blockedLabs.length },
      pipeline_version: PIPELINE_VERSION,
      hashes: { input: inputHash, output: outputHash },
      was_manually_corrected: wasManuallyCorreced,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("[analyze:fatal]", err);
    return new Response(JSON.stringify({ ok: false, error_code: "INTERNAL_ERROR", message: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// ══════════════════════════════════════
// Persist helper (for failure cases only)
// ══════════════════════════════════════

async function persistRun(supabase: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  try {
    if (!data.pipeline_version) data.pipeline_version = PIPELINE_VERSION;
    const { error } = await supabase.from("lab_analysis_runs").insert(data);
    if (error) console.error("[analyze:persist-error]", error);
    else console.log(`[analyze:persisted] status=${data.status}`);
  } catch (e: any) { console.error("[analyze:persist-fatal]", e.message); }
}
