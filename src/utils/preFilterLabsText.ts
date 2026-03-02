/**
 * preFilterLabsText — removes non-clinical metadata lines before normalization
 * v1 — Fail-Closed Clinical Safety Mode
 */

export interface ExcludedLine {
  line: string;
  reason: string;
}

export interface PreFilterResult {
  filtered_text: string;
  stats: {
    total: number;
    kept: number;
    excluded: number;
  };
  excluded_lines: ExcludedLine[];
}

// ══════════════════════════════════════
// Exclusion patterns
// ══════════════════════════════════════

const NON_CLINICAL_KEYWORD_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bCNES\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCRBM\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCRM\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\brespons[aá]vel\s+t[eé]cnic/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bassinado\s+digitalmente\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCKD[\s-]?EPI\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bdata\s+impress[aã]o\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /%PRECISION/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bimpresso\s+por\s+paciente\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bresultado\s+impresso\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
];

// Lines that are just IDs / protocol numbers (no biomarker content)
const NON_CLINICAL_ID_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /^\s*protocolo\s*[:=]?\s*\d+/i, reason: "NON_CLINICAL_ID_NUMBER" },
  { pattern: /^\s*registro\s*[:=]?\s*[\d\-]+\s*$/i, reason: "NON_CLINICAL_ID_NUMBER" },
];

// Hash / token patterns (digital signatures, UUIDs)
const NON_CLINICAL_TOKEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /[a-f0-9]{24,}/i, reason: "NON_CLINICAL_TOKEN_HASH" },
  { pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i, reason: "NON_CLINICAL_TOKEN_HASH" },
];

// ══════════════════════════════════════
// Main function
// ══════════════════════════════════════

export function preFilterLabsText(rawText: string): PreFilterResult {
  if (!rawText || rawText.trim().length === 0) {
    return { filtered_text: "", stats: { total: 0, kept: 0, excluded: 0 }, excluded_lines: [] };
  }

  const lines = rawText.split("\n");
  const kept: string[] = [];
  const excluded: ExcludedLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    let excludeReason: string | null = null;

    // Check keyword patterns
    for (const { pattern, reason } of NON_CLINICAL_KEYWORD_PATTERNS) {
      if (pattern.test(trimmed)) {
        excludeReason = reason;
        break;
      }
    }

    // Check ID patterns
    if (!excludeReason) {
      for (const { pattern, reason } of NON_CLINICAL_ID_PATTERNS) {
        if (pattern.test(trimmed)) {
          excludeReason = reason;
          break;
        }
      }
    }

    // Check token/hash patterns — only if line has NO biomarker-like content
    if (!excludeReason) {
      const hasBiomarkerHint = /\b(hemoglobina|glicose|ferritina|creatinina|colesterol|hdl|ldl|tsh|potássio|sódio|plaquetas|leucócitos|hematócrito|vitamina|triglicerídeos|hba1c|pcr|tgo|tgp|ggt|ureia|albumina|ferro|cálcio|magnésio|vcm)\b/i.test(trimmed);
      if (!hasBiomarkerHint) {
        for (const { pattern, reason } of NON_CLINICAL_TOKEN_PATTERNS) {
          if (pattern.test(trimmed)) {
            excludeReason = reason;
            break;
          }
        }
      }
    }

    if (excludeReason) {
      excluded.push({ line: trimmed, reason: excludeReason });
    } else {
      kept.push(trimmed);
    }
  }

  return {
    filtered_text: kept.join("\n"),
    stats: {
      total: lines.filter(l => l.trim().length > 0).length,
      kept: kept.length,
      excluded: excluded.length,
    },
    excluded_lines: excluded,
  };
}
