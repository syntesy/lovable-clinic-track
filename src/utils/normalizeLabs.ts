/**
 * normalizeLabs — parses raw lab text into structured JSON
 */

export interface NormalizedLabItem {
  name: string;
  value: number | null;
  unit: string;
  reference_range: string;
  flag: "low" | "normal" | "high" | "unknown";
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

// Biomarker dictionary with common aliases
const BIOMARKER_ALIASES: Record<string, string> = {
  "pcr": "PCR",
  "crp": "PCR",
  "proteina c reativa": "PCR",
  "proteína c reativa": "PCR",
  "c-reactive protein": "PCR",
  "ferritina": "Ferritina",
  "ferritin": "Ferritina",
  "glicose": "Glicose",
  "glicemia": "Glicose",
  "glucose": "Glicose",
  "glicemia de jejum": "Glicose",
  "hba1c": "HbA1c",
  "hemoglobina glicada": "HbA1c",
  "hemoglobina glicosilada": "HbA1c",
  "creatinina": "Creatinina",
  "creatinine": "Creatinina",
  "rfg": "eGFR",
  "egfr": "eGFR",
  "taxa de filtração glomerular": "eGFR",
  "filtração glomerular": "eGFR",
  "colesterol total": "Colesterol Total",
  "total cholesterol": "Colesterol Total",
  "hdl": "HDL",
  "hdl-c": "HDL",
  "hdl colesterol": "HDL",
  "ldl": "LDL",
  "ldl-c": "LDL",
  "ldl colesterol": "LDL",
  "triglicerídeos": "Triglicerídeos",
  "triglicerideos": "Triglicerídeos",
  "triglicérides": "Triglicerídeos",
  "triglycerides": "Triglicerídeos",
  "vitamina d": "Vitamina D (25-OH)",
  "25-oh vitamina d": "Vitamina D (25-OH)",
  "25-hidroxivitamina d": "Vitamina D (25-OH)",
  "25 oh vitamina d": "Vitamina D (25-OH)",
  "tsh": "TSH",
  "t4 livre": "T4 Livre",
  "t4 free": "T4 Livre",
  "t4l": "T4 Livre",
  "hemoglobina": "Hemoglobina",
  "hemoglobin": "Hemoglobina",
  "hb": "Hemoglobina",
  "hematócrito": "Hematócrito",
  "hematocrito": "Hematócrito",
  "hematocrit": "Hematócrito",
  "ht": "Hematócrito",
  "vcm": "VCM",
  "mcv": "VCM",
  "volume corpuscular médio": "VCM",
  "leucócitos": "Leucócitos",
  "leucocitos": "Leucócitos",
  "white blood cells": "Leucócitos",
  "wbc": "Leucócitos",
  "plaquetas": "Plaquetas",
  "platelets": "Plaquetas",
  "contagem de plaquetas": "Plaquetas",
  "vitamina b12": "Vitamina B12",
  "b12": "Vitamina B12",
  "ácido úrico": "Ácido Úrico",
  "acido urico": "Ácido Úrico",
  "uric acid": "Ácido Úrico",
  "sódio": "Sódio",
  "sodium": "Sódio",
  "na": "Sódio",
  "potássio": "Potássio",
  "potassio": "Potássio",
  "potassium": "Potássio",
  "k": "Potássio",
  "cálcio": "Cálcio",
  "calcio": "Cálcio",
  "calcium": "Cálcio",
  "magnésio": "Magnésio",
  "magnesio": "Magnésio",
  "magnesium": "Magnésio",
  "ferro sérico": "Ferro Sérico",
  "ferro serico": "Ferro Sérico",
  "iron": "Ferro Sérico",
  "zinco": "Zinco",
  "zinc": "Zinco",
  "albumina": "Albumina",
  "albumin": "Albumina",
  "proteínas totais": "Proteínas Totais",
  "proteinas totais": "Proteínas Totais",
  "tgo": "TGO (AST)",
  "ast": "TGO (AST)",
  "tgp": "TGP (ALT)",
  "alt": "TGP (ALT)",
  "ggt": "GGT",
  "gama gt": "GGT",
  "fosfatase alcalina": "Fosfatase Alcalina",
  "bilirrubina total": "Bilirrubina Total",
  "ureia": "Ureia",
  "urea": "Ureia",
  // Urine
  "densidade urinária": "Urina - Densidade",
  "ph urinário": "Urina - pH",
  "proteína urinária": "Urina - Proteína",
  "glicose urinária": "Urina - Glicose",
  "leucócitos urinários": "Urina - Leucócitos",
  "nitrito": "Urina - Nitrito",
};

// Value extraction pattern: captures number (with comma or dot decimal)
const VALUE_PATTERN = /[:=]?\s*([\d]+[.,]?\d*)\s*([\w/%µμ]+(?:\/[\w%]+)?)?/;

// Reference range pattern
const REF_PATTERN = /(?:ref|referência|referencia|vr|v\.r\.|normal)[:\s]*([^\n(]+)/i;
const RANGE_INLINE_PATTERN = /\(?\s*(\d+[.,]?\d*)\s*[-–a]\s*(\d+[.,]?\d*)\s*\)?/;

function parseNumber(str: string): number | null {
  const cleaned = str.replace(",", ".");
  const num = parseFloat(cleaned);
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

export function normalizeLabs(rawText: string): NormalizedLabResult {
  const result: NormalizedLabResult = {
    patient: { name: null, sex: null, age: null },
    collection_date: null,
    labs: [],
    unmapped_lines: [],
    parser_version: 1,
  };

  if (!rawText || rawText.trim().length === 0) return result;

  const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Try to extract patient info from header lines
  for (const line of lines.slice(0, 10)) {
    const lower = line.toLowerCase();
    if (!result.patient.name && (lower.includes("paciente") || lower.includes("nome"))) {
      const nameMatch = line.match(/(?:paciente|nome)[:\s]+(.+)/i);
      if (nameMatch) result.patient.name = nameMatch[1].trim();
    }
    if (!result.patient.sex && (lower.includes("sexo") || lower.includes("gênero"))) {
      const sexMatch = line.match(/(?:sexo|gênero|genero)[:\s]+(\w+)/i);
      if (sexMatch) result.patient.sex = sexMatch[1].trim();
    }
    if (!result.patient.age && lower.includes("idade")) {
      const ageMatch = line.match(/idade[:\s]+(.+)/i);
      if (ageMatch) result.patient.age = ageMatch[1].trim();
    }
    if (!result.collection_date && (lower.includes("coleta") || lower.includes("data"))) {
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
      if (dateMatch) result.collection_date = dateMatch[1];
    }
  }

  // Process each line looking for lab values
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase().replace(/[^a-záàãâéêíóôõúüç0-9\s.:,\-\/()]/gi, "").trim();

    // Skip header/info lines
    if (lower.length < 3) continue;
    if (lower.startsWith("paciente") || lower.startsWith("nome") || lower.startsWith("data")) continue;

    // Try to match against known biomarkers
    let matched = false;
    for (const [alias, canonical] of Object.entries(BIOMARKER_ALIASES)) {
      if (lower.includes(alias)) {
        // Extract value from this line
        const afterAlias = line.substring(line.toLowerCase().indexOf(alias) + alias.length);
        const valueMatch = afterAlias.match(VALUE_PATTERN);
        
        if (valueMatch) {
          const numValue = parseNumber(valueMatch[1]);
          const unit = valueMatch[2] || "";

          // Look for reference range
          let refRange = "";
          const refMatch = line.match(REF_PATTERN);
          if (refMatch) {
            refRange = refMatch[1].trim();
          } else {
            const inlineRange = afterAlias.match(RANGE_INLINE_PATTERN);
            if (inlineRange) {
              refRange = `${inlineRange[1]}-${inlineRange[2]}`;
            }
            // Check next line for reference
            if (!refRange && i + 1 < lines.length) {
              const nextLine = lines[i + 1];
              const nextRef = nextLine.match(REF_PATTERN) || nextLine.match(RANGE_INLINE_PATTERN);
              if (nextRef) {
                refRange = nextRef[1]?.trim() || `${nextRef[1]}-${nextRef[2]}`;
              }
            }
          }

          const flag = determineFlagFromRange(numValue, refRange);

          // Avoid duplicates
          if (!result.labs.some(l => l.name === canonical)) {
            result.labs.push({
              name: canonical,
              value: numValue,
              unit: unit.trim(),
              reference_range: refRange,
              flag,
            });
          }
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Check if line looks like a lab value (has number with unit)
      const genericMatch = line.match(/^(.+?)[:=]\s*([\d]+[.,]?\d*)\s*([\w/%µμ]+(?:\/[\w%]+)?)?/);
      if (genericMatch) {
        const name = genericMatch[1].trim();
        const numValue = parseNumber(genericMatch[2]);
        const unit = genericMatch[3] || "";
        
        // Look for reference in same line
        let refRange = "";
        const refMatch = line.match(REF_PATTERN);
        if (refMatch) refRange = refMatch[1].trim();
        const inlineRange = line.match(RANGE_INLINE_PATTERN);
        if (!refRange && inlineRange) refRange = `${inlineRange[1]}-${inlineRange[2]}`;

        result.labs.push({
          name,
          value: numValue,
          unit: unit.trim(),
          reference_range: refRange,
          flag: determineFlagFromRange(numValue, refRange),
        });
      } else if (line.length > 5 && !line.match(/^[-=_]+$/) && !line.match(/^\d+$/)) {
        // Only add meaningful lines as unmapped
        result.unmapped_lines.push(line);
      }
    }
  }

  return result;
}
