/**
 * preFilterLabsText — removes non-clinical metadata lines before normalization
 * v2 — Expanded keyword/pattern coverage
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
  kept_lines: string[];
}

// ══════════════════════════════════════
// Exclusion patterns — NON_CLINICAL_METADATA_KEYWORD
// ══════════════════════════════════════

const NON_CLINICAL_KEYWORD_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Professional identifiers
  { pattern: /\bCNES\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCRBM\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCRM\s*[:\-]?\s*\d/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCRO\s*[:\-]?\s*\d/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bCOREN\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\brespons[aá]vel\s+t[eé]cnic/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },

  // Digital signatures
  { pattern: /\bassinado\s+digitalmente\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bassinatura\s+digital\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },

  // Method / formula references
  { pattern: /\bCKD[\s-]?EPI\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bcalculo\s+pela\s+f[oó]rmula\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*m[eé]todo\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*f[oó]rmula\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },

  // Print / layout metadata
  { pattern: /\bdata\s+impress[aã]o\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /%PRECISION/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bimpresso\s+por\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /\bresultado\s+impresso\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*layout\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },

  // Administrative codes
  { pattern: /^\s*c[oó]digo\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },

  // Administrative headers
  { pattern: /^\s*laborat[oó]rio\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*unidade\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*endere[cç]o\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*telefone\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*fone\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*site\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*e-?mail\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*cnpj\s*:/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
  { pattern: /^\s*inscri[cç][aã]o\b/i, reason: "NON_CLINICAL_METADATA_KEYWORD" },
];

// Lines that are just IDs / protocol numbers (no biomarker content)
const NON_CLINICAL_ID_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /^\s*protocolo\s*[:=]?\s*[\d\-]+\s*$/i, reason: "NON_CLINICAL_ID_NUMBER" },
  { pattern: /^\s*registro\s*[:=]?\s*[\d\-]+\s*$/i, reason: "NON_CLINICAL_ID_NUMBER" },
  // Lines that are purely long numeric IDs (6+ digits, no biomarker context)
  { pattern: /^\s*\d{6,}\s*$/, reason: "NON_CLINICAL_ID_NUMBER" },
];

// Hash / token patterns (digital signatures, UUIDs)
const NON_CLINICAL_TOKEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /[a-f0-9]{24,}/i, reason: "NON_CLINICAL_TOKEN_HASH" },
  { pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i, reason: "NON_CLINICAL_TOKEN_HASH" },
];

// Biomarker hint — if a line contains a known biomarker keyword, skip token pattern check
const BIOMARKER_HINT_PATTERN = /\b(hemoglobina|glicose|glicemia|ferritina|creatinina|colesterol|hdl|ldl|tsh|pot[aá]ssio|s[oó]dio|plaquetas|leuc[oó]citos|hemat[oó]crito|vitamina|triglice|hba1c|pcr|tgo|tgp|ggt|ureia|albumina|ferro|c[aá]lcio|magn[eé]sio|vcm|fosfatase|bilirrubina|[aá]cido\s+[uú]rico|t4\s*livre|zinco|nitrito|densidade\s+urin|ph\s+urin|prote[ií]na\s+urin)\b/i;

// ══════════════════════════════════════
// Main function
// ══════════════════════════════════════

export function preFilterLabsText(rawText: string): PreFilterResult {
  if (!rawText || rawText.trim().length === 0) {
    return { filtered_text: "", stats: { total: 0, kept: 0, excluded: 0 }, excluded_lines: [], kept_lines: [] };
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
      const hasBiomarkerHint = BIOMARKER_HINT_PATTERN.test(trimmed);
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
    kept_lines: kept,
  };
}
