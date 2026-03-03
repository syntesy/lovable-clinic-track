// =========================================================
// REGHEN ACADEMY — Pipeline Constants & Guardrails (Etapa 0)
// Single source of truth for ingestion pipeline enums/limits
// =========================================================

// ---------------------------------------------------------
// 1. Paper Status (mirrors DB enum paper_curation_status)
// ---------------------------------------------------------
export const PaperStatus = {
  INGESTING: 'ingesting',
  NEEDS_INPUT: 'needs_input',
  ERROR: 'error',
  DRAFT: 'draft',
  CURATING: 'curating',
  READY: 'ready',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const;

export type PaperStatus = (typeof PaperStatus)[keyof typeof PaperStatus];

// ---------------------------------------------------------
// 2. Source Type (mirrors DB enum paper_import_source)
// ---------------------------------------------------------
export const SourceType = {
  PMID: 'pmid',
  DOI: 'doi',
  MANUAL: 'manual',
  URL: 'url',
  PDF_UPLOAD: 'pdf_upload',
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];

// ---------------------------------------------------------
// 3. Route Used — which ingestion route was actually taken
//    Priority: PUBMED → PMC_XML → PUBLISHER_HTML → PDF_GROBID
// ---------------------------------------------------------
export const RouteUsed = {
  /** PubMed E-utilities (efetch/esummary) — preferred */
  PUBMED: 'pubmed',
  /** PMC full-text XML via OA service */
  PMC_XML: 'pmc_xml',
  /** Publisher HTML scraping (Crossref → DOI landing page) */
  PUBLISHER_HTML: 'publisher_html',
  /** PDF upload + GROBID/local extraction — last resort */
  PDF_GROBID: 'pdf_grobid',
} as const;

export type RouteUsed = (typeof RouteUsed)[keyof typeof RouteUsed];

/**
 * Ingestion priority order (index 0 = highest).
 * Rule: NEVER process PDF if PMC XML is available.
 */
export const INGESTION_PRIORITY: RouteUsed[] = [
  RouteUsed.PUBMED,
  RouteUsed.PMC_XML,
  RouteUsed.PUBLISHER_HTML,
  RouteUsed.PDF_GROBID,
];

// ---------------------------------------------------------
// 4. Review Reason — why a paper needs human review
// ---------------------------------------------------------
export const ReviewReason = {
  /** AI confidence below threshold */
  LOW_AI_CONFIDENCE: 'low_ai_confidence',
  /** Missing critical metadata (title, authors, year) */
  MISSING_METADATA: 'missing_metadata',
  /** Duplicate fingerprint detected */
  DUPLICATE_DETECTED: 'duplicate_detected',
  /** Text extraction quality too low */
  LOW_TEXT_QUALITY: 'low_text_quality',
  /** REM compliance check failed */
  REM_COMPLIANCE_FAIL: 'rem_compliance_fail',
  /** Evidence score below publication threshold */
  LOW_EVIDENCE_SCORE: 'low_evidence_score',
  /** Flagged by automated QA rules */
  QA_FLAG: 'qa_flag',
  /** Manual request by curator */
  CURATOR_REQUEST: 'curator_request',
} as const;

export type ReviewReason = (typeof ReviewReason)[keyof typeof ReviewReason];

// ---------------------------------------------------------
// 5. Data Separation — canonical layer names
// ---------------------------------------------------------
export const DataLayer = {
  /** Raw bibliographic metadata (title, authors, PMID, DOI, year, journal) */
  METADATA: 'metadata',
  /** Structured full-text (sections, paragraphs, tables) */
  FULLTEXT_STRUCTURED: 'fulltext_structured',
  /** AI-generated curation JSON (18-field schema) */
  CURATION_JSON: 'curation_json',
  /** Human review overlay (corrections, approvals) */
  REVIEW: 'review',
} as const;

export type DataLayer = (typeof DataLayer)[keyof typeof DataLayer];

// ---------------------------------------------------------
// 6. Pipeline Limits & Guardrails
// ---------------------------------------------------------
export const PIPELINE_LIMITS = {
  /**
   * Maximum timeout for external API calls (PubMed, Crossref, PMC).
   * In milliseconds.
   */
  EXTERNAL_API_TIMEOUT_MS: 15_000,

  /**
   * Maximum retries for transient external API failures.
   * Uses exponential backoff: delay = BASE_RETRY_DELAY_MS * 2^attempt.
   */
  MAX_RETRIES: 3,

  /**
   * Base delay between retries (ms). Actual = base * 2^attempt.
   */
  BASE_RETRY_DELAY_MS: 1_000,

  /**
   * Maximum characters of text sent to the LLM for curation.
   * Prevents cost blow-up and context-window overflow.
   * ~62,500 tokens at ~4 chars/token.
   */
  MAX_TEXT_FOR_LLM_CHARS: 250_000,

  /**
   * Maximum chunks per paper for vector indexing.
   */
  MAX_CHUNKS_PER_PAPER: 200,

  /**
   * Minimum characters for text to be considered "sufficient"
   * for AI curation (below this → LOW_TEXT_QUALITY review).
   */
  MIN_TEXT_FOR_CURATION_CHARS: 300,

  /**
   * Maximum PDF file size accepted (bytes). 20 MB.
   */
  MAX_PDF_SIZE_BYTES: 20 * 1024 * 1024,

  /**
   * RAG snippet limits (per paper).
   */
  MAX_RAG_SNIPPETS_PER_PAPER: 3,
  MAX_RAG_SNIPPET_CHARS: 400,
} as const;

// ---------------------------------------------------------
// 7. Helper: human-readable labels (PT-BR)
// ---------------------------------------------------------
export const PAPER_STATUS_LABELS: Record<PaperStatus, string> = {
  [PaperStatus.INGESTING]: 'Ingestão',
  [PaperStatus.DRAFT]: 'Rascunho',
  [PaperStatus.CURATING]: 'Em curadoria',
  [PaperStatus.READY]: 'Pronto',
  [PaperStatus.PUBLISHED]: 'Publicado',
  [PaperStatus.REJECTED]: 'Rejeitado',
  [PaperStatus.ARCHIVED]: 'Arquivado',
};

export const ROUTE_USED_LABELS: Record<RouteUsed, string> = {
  [RouteUsed.PUBMED]: 'PubMed E-utilities',
  [RouteUsed.PMC_XML]: 'PMC Open Access XML',
  [RouteUsed.PUBLISHER_HTML]: 'Publisher HTML (via DOI)',
  [RouteUsed.PDF_GROBID]: 'PDF Upload + Extração',
};

export const REVIEW_REASON_LABELS: Record<ReviewReason, string> = {
  [ReviewReason.LOW_AI_CONFIDENCE]: 'Baixa confiança da IA',
  [ReviewReason.MISSING_METADATA]: 'Metadados ausentes',
  [ReviewReason.DUPLICATE_DETECTED]: 'Duplicata detectada',
  [ReviewReason.LOW_TEXT_QUALITY]: 'Qualidade de texto insuficiente',
  [ReviewReason.REM_COMPLIANCE_FAIL]: 'Falha de conformidade REM™',
  [ReviewReason.LOW_EVIDENCE_SCORE]: 'Score de evidência baixo',
  [ReviewReason.QA_FLAG]: 'Flag de QA automatizado',
  [ReviewReason.CURATOR_REQUEST]: 'Solicitação do curador',
};
