/**
 * normalizeLabs — parses raw lab text into structured JSON
 * v2 — Fail-Closed Clinical Safety Mode
 */

// ══════════════════════════════════════
// Types
// ══════════════════════════════════════

export interface NormalizedLabItem {
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

export interface NormalizedLabResult {
  patient: {
    name: string | null;
    sex: string | null;
    age: string | null;
  };
  collection_date: string | null;
  labs: NormalizedLabItem[];
  unmapped_lines: string[];
  parser_version: number;
}

// ══════════════════════════════════════
// Unit Whitelist & Sanitization
// ══════════════════════════════════════

const UNIT_WHITELIST = new Set([
  "%", "mg/dL", "g/dL", "ng/mL", "pg/mL", "µg/dL", "µg/L",
  "mg/L", "mmol/L", "mEq/L", "U/L", "UI/L", "mUI/L",
  "10^3/µL", "10^6/µL", "mil/mm³", "mL/min/1.73m²",
  "fL", "pg", "g/L", "µUI/mL", "mUI/mL", "ng/dL",
  "µmol/L", "mm³", "/mm³", "cel/mm³", "x10³/µL",
  "milhões/mm³", "mil/µL", "10³/µL",
]);

// Normalize common unit variations to whitelist entries
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
  /^[a-f0-9]{24,}$/i,           // hex hash
  /^[0-9a-f]{8}-[0-9a-f]{4}/i,  // UUID prefix
  /[{}_]/,                       // structural chars (% is valid)
];

export function sanitizeUnit(unitRaw: string | null | undefined): { unit: string | null; warning?: string } {
  if (!unitRaw || unitRaw.trim().length === 0) return { unit: null };

  const trimmed = unitRaw.trim();

  // Length check
  if (trimmed.length > 20) return { unit: null, warning: "INVALID_UNIT_PATTERN" };

  // Pattern checks
  for (const pattern of INVALID_UNIT_PATTERNS) {
    if (pattern.test(trimmed)) return { unit: null, warning: "INVALID_UNIT_PATTERN" };
  }

  // Try normalization
  const lower = trimmed.toLowerCase();
  if (UNIT_NORMALIZATION[lower]) return { unit: UNIT_NORMALIZATION[lower] };

  // Whitelist check (case-insensitive)
  for (const allowed of UNIT_WHITELIST) {
    if (allowed.toLowerCase() === lower) return { unit: allowed };
  }

  // Special: plain "%" is common
  if (trimmed === "%") return { unit: "%" };

  return { unit: null, warning: "INVALID_UNIT" };
}

// ══════════════════════════════════════
// Critical Biomarkers (require unit + confidence)
// ══════════════════════════════════════

const CRITICAL_BIOMARKERS = new Set([
  "Sódio", "Potássio", "Glicose", "Creatinina", "HbA1c",
  "Triglicerídeos", "Hemoglobina", "Plaquetas", "Leucócitos",
]);

// ══════════════════════════════════════
// Default Reference Ranges (restricted use)
// ══════════════════════════════════════

export const DEFAULT_RANGES: Record<string, { range: string; sex_dependent: boolean }> = {
  "Glicose":            { range: "70-99", sex_dependent: false },
  "HbA1c":              { range: "4.0-5.6", sex_dependent: false },
  "Colesterol Total":   { range: "0-200", sex_dependent: false },
  "HDL":                { range: "40-60", sex_dependent: true },
  "LDL":                { range: "0-130", sex_dependent: false },
  "Triglicerídeos":     { range: "0-150", sex_dependent: false },
  "TSH":                { range: "0.4-4.0", sex_dependent: false },
  "T4 Livre":           { range: "0.8-1.8", sex_dependent: false },
  "PCR":                { range: "0-5", sex_dependent: false },
  "VCM":                { range: "80-100", sex_dependent: false },
  "Ferritina":          { range: "30-300", sex_dependent: true },
  "Vitamina D (25-OH)": { range: "30-100", sex_dependent: false },
  "Vitamina B12":       { range: "200-900", sex_dependent: false },
  "TGO (AST)":         { range: "10-40", sex_dependent: false },
  "TGP (ALT)":         { range: "7-56", sex_dependent: false },
  "GGT":               { range: "9-48", sex_dependent: true },
  "Creatinina":        { range: "0.6-1.2", sex_dependent: true },
  "Ureia":             { range: "15-45", sex_dependent: false },
  "Ácido Úrico":       { range: "3.5-7.2", sex_dependent: true },
  "Sódio":             { range: "136-145", sex_dependent: false },
  "Potássio":          { range: "3.5-5.1", sex_dependent: false },
  "Cálcio":            { range: "8.5-10.5", sex_dependent: false },
  "Magnésio":          { range: "1.7-2.2", sex_dependent: false },
  "Ferro Sérico":      { range: "60-170", sex_dependent: true },
  "Albumina":          { range: "3.5-5.0", sex_dependent: false },
  "Hemoglobina":       { range: "12-17", sex_dependent: true },
  "Hematócrito":       { range: "36-50", sex_dependent: true },
  "Leucócitos":        { range: "4000-11000", sex_dependent: false },
  "Plaquetas":         { range: "150000-400000", sex_dependent: false },
};

// ══════════════════════════════════════
// Biomarker Dictionary
// ══════════════════════════════════════

const BIOMARKER_ALIASES: Record<string, string> = {
  "pcr": "PCR", "crp": "PCR", "proteina c reativa": "PCR", "proteína c reativa": "PCR",
  "c-reactive protein": "PCR",
  "ferritina": "Ferritina", "ferritin": "Ferritina",
  "glicose": "Glicose", "glicemia": "Glicose", "glucose": "Glicose", "glicemia de jejum": "Glicose",
  "hba1c": "HbA1c", "hemoglobina glicada": "HbA1c", "hemoglobina glicosilada": "HbA1c",
  "creatinina": "Creatinina", "creatinine": "Creatinina",
  "rfg": "eGFR", "egfr": "eGFR", "taxa de filtração glomerular": "eGFR", "filtração glomerular": "eGFR",
  "colesterol total": "Colesterol Total", "total cholesterol": "Colesterol Total",
  "hdl": "HDL", "hdl-c": "HDL", "hdl colesterol": "HDL",
  "ldl": "LDL", "ldl-c": "LDL", "ldl colesterol": "LDL",
  "triglicerídeos": "Triglicerídeos", "triglicerideos": "Triglicerídeos",
  "triglicérides": "Triglicerídeos", "triglycerides": "Triglicerídeos",
  "vitamina d": "Vitamina D (25-OH)", "25-oh vitamina d": "Vitamina D (25-OH)",
  "25-hidroxivitamina d": "Vitamina D (25-OH)", "25 oh vitamina d": "Vitamina D (25-OH)",
  "tsh": "TSH",
  "t4 livre": "T4 Livre", "t4 free": "T4 Livre", "t4l": "T4 Livre",
  "hemoglobina": "Hemoglobina", "hemoglobin": "Hemoglobina", "hb": "Hemoglobina",
  "hematócrito": "Hematócrito", "hematocrito": "Hematócrito", "hematocrit": "Hematócrito", "ht": "Hematócrito",
  "vcm": "VCM", "mcv": "VCM", "volume corpuscular médio": "VCM",
  "leucócitos": "Leucócitos", "leucocitos": "Leucócitos", "white blood cells": "Leucócitos", "wbc": "Leucócitos",
  "plaquetas": "Plaquetas", "platelets": "Plaquetas", "contagem de plaquetas": "Plaquetas",
  "vitamina b12": "Vitamina B12", "b12": "Vitamina B12",
  "ácido úrico": "Ácido Úrico", "acido urico": "Ácido Úrico", "uric acid": "Ácido Úrico",
  "sódio": "Sódio", "sodium": "Sódio", "na": "Sódio",
  "potássio": "Potássio", "potassio": "Potássio", "potassium": "Potássio", "k": "Potássio",
  "cálcio": "Cálcio", "calcio": "Cálcio", "calcium": "Cálcio",
  "magnésio": "Magnésio", "magnesio": "Magnésio", "magnesium": "Magnésio",
  "ferro sérico": "Ferro Sérico", "ferro serico": "Ferro Sérico", "iron": "Ferro Sérico",
  "zinco": "Zinco", "zinc": "Zinco",
  "albumina": "Albumina", "albumin": "Albumina",
  "proteínas totais": "Proteínas Totais", "proteinas totais": "Proteínas Totais",
  "tgo": "TGO (AST)", "ast": "TGO (AST)",
  "tgp": "TGP (ALT)", "alt": "TGP (ALT)",
  "ggt": "GGT", "gama gt": "GGT",
  "fosfatase alcalina": "Fosfatase Alcalina",
  "bilirrubina total": "Bilirrubina Total",
  "ureia": "Ureia", "urea": "Ureia",
  "densidade urinária": "Urina - Densidade",
  "ph urinário": "Urina - pH",
  "proteína urinária": "Urina - Proteína",
  "glicose urinária": "Urina - Glicose",
  "leucócitos urinários": "Urina - Leucócitos",
  "nitrito": "Urina - Nitrito",
};

// ══════════════════════════════════════
// Parsing helpers
// ══════════════════════════════════════

const VALUE_PATTERN = /[:=]?\s*([\d]+[.,]?\d*)\s*([\w/%µμ^³²]+(?:\/[\w%µμ^³²]+)*)?/;
const REF_PATTERN = /(?:ref|referência|referencia|vr|v\.r\.|normal)[:\s]*([^\n]+)/i;
const RANGE_INLINE_PATTERN = /\(?\s*(\d+[.,]?\d*)\s*[-–a]\s*(\d+[.,]?\d*)\s*\)?/;

function cleanRefRange(raw: string): string {
  return raw.replace(/\)+\s*$/, "").replace(/^\s*\(/, "").trim();
}

function parseNumber(str: string): number | null {
  const cleaned = str.replace(",", ".");
  const num = parseFloat(cleaned);
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

// ══════════════════════════════════════
// Interpretability Engine (Fail-Closed)
// ══════════════════════════════════════

function computeInterpretability(
  item: Pick<NormalizedLabItem, "name" | "value" | "unit" | "reference_range" | "parser_confidence">,
  patientSex: string | null
): { is_interpretable: boolean; blocking_reasons: string[]; reference_range: string | null; flag: "low" | "normal" | "high" | "unknown" } {
  const reasons: string[] = [];
  let refRange = item.reference_range;
  const isCritical = CRITICAL_BIOMARKERS.has(item.name);

  // 1. Value is required
  if (item.value === null) reasons.push("MISSING_VALUE");

  // 2. Unit check for critical biomarkers
  if (isCritical && !item.unit) reasons.push("CRITICAL_MISSING_UNIT");

  // 3. Low confidence on critical
  if (isCritical && item.parser_confidence === "low") reasons.push("CRITICAL_LOW_CONFIDENCE");

  // 4. Unit required for non-critical biomarkers that have known units
  if (!isCritical && !item.unit && DEFAULT_RANGES[item.name]) {
    reasons.push("MISSING_UNIT");
  }

  // 5. Try default range if none parsed
  if (!refRange) {
    const defaultDef = DEFAULT_RANGES[item.name];
    if (defaultDef) {
      if (defaultDef.sex_dependent && !patientSex) {
        reasons.push("RANGE_REQUIRES_SEX");
      } else if (item.unit) {
        refRange = defaultDef.range;
      } else if (!isCritical && !reasons.includes("MISSING_UNIT")) {
        refRange = defaultDef.range;
      }
    } else {
      reasons.push("NO_REFERENCE_RANGE");
    }
  }

  const flag = determineFlagFromRange(item.value, refRange);

  return {
    is_interpretable: reasons.length === 0,
    blocking_reasons: reasons,
    reference_range: refRange,
    flag,
  };
}

// ══════════════════════════════════════
// Parser confidence heuristic
// ══════════════════════════════════════

function computeParserConfidence(
  valueMatch: boolean,
  unitValid: boolean,
  hasRefRange: boolean,
  isKnownBiomarker: boolean
): "high" | "medium" | "low" {
  let score = 0;
  if (valueMatch) score++;
  if (unitValid) score++;
  if (hasRefRange) score++;
  if (isKnownBiomarker) score++;

  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}

// ══════════════════════════════════════
// Main Parser
// ══════════════════════════════════════

export function normalizeLabs(rawText: string): NormalizedLabResult {
  const result: NormalizedLabResult = {
    patient: { name: null, sex: null, age: null },
    collection_date: null,
    labs: [],
    unmapped_lines: [],
    parser_version: 2,
  };

  if (!rawText || rawText.trim().length === 0) return result;

  const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Extract patient info from header lines
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

  // Process each line
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

          // Extract reference range
          let refRange: string | null = null;
          const refMatch = line.match(REF_PATTERN);
          if (refMatch) {
            refRange = cleanRefRange(refMatch[1]);
          } else {
            const inlineRange = afterAlias.match(RANGE_INLINE_PATTERN);
            if (inlineRange) refRange = `${inlineRange[1]}-${inlineRange[2]}`;
            if (!refRange && i + 1 < lines.length) {
              const nextRef = lines[i + 1].match(REF_PATTERN) || lines[i + 1].match(RANGE_INLINE_PATTERN);
              if (nextRef) refRange = cleanRefRange(nextRef[1]?.trim() || `${nextRef[1]}-${nextRef[2]}`);
            }
          }

          const confidence = computeParserConfidence(
            numValue !== null,
            sanitizedUnit !== null,
            refRange !== null,
            true
          );

          const blocking_reasons: string[] = [];
          if (unitWarning) blocking_reasons.push(unitWarning);

          const interp = computeInterpretability(
            { name: canonical, value: numValue, unit: sanitizedUnit, reference_range: refRange, parser_confidence: confidence },
            result.patient.sex
          );

          // Avoid duplicates
          if (!result.labs.some(l => l.name === canonical)) {
            result.labs.push({
              name: canonical,
              value: numValue,
              unit: sanitizedUnit,
              reference_range: interp.reference_range,
              flag: interp.flag,
              source_line: line,
              parser_confidence: confidence,
              is_interpretable: interp.is_interpretable && blocking_reasons.length === 0,
              blocking_reasons: [...blocking_reasons, ...interp.blocking_reasons],
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
        const numValue = parseNumber(genericMatch[2]);
        const rawUnit = genericMatch[3] || null;
        const { unit: sanitizedUnit, warning: unitWarning } = sanitizeUnit(rawUnit);

        let refRange: string | null = null;
        const refMatch = line.match(REF_PATTERN);
        if (refMatch) refRange = cleanRefRange(refMatch[1]);
        const inlineRange = line.match(RANGE_INLINE_PATTERN);
        if (!refRange && inlineRange) refRange = `${inlineRange[1]}-${inlineRange[2]}`;

        const confidence = computeParserConfidence(numValue !== null, sanitizedUnit !== null, refRange !== null, false);
        const blocking_reasons: string[] = [];
        if (unitWarning) blocking_reasons.push(unitWarning);

        const interp = computeInterpretability(
          { name, value: numValue, unit: sanitizedUnit, reference_range: refRange, parser_confidence: confidence },
          result.patient.sex
        );

        result.labs.push({
          name,
          value: numValue,
          unit: sanitizedUnit,
          reference_range: interp.reference_range,
          flag: interp.flag,
          source_line: line,
          parser_confidence: confidence,
          is_interpretable: interp.is_interpretable && blocking_reasons.length === 0,
          blocking_reasons: [...blocking_reasons, ...interp.blocking_reasons],
        });
      } else if (line.length > 5 && !line.match(/^[-=_]+$/) && !line.match(/^\d+$/)) {
        result.unmapped_lines.push(line);
      }
    }
  }

  return result;
}
