/**
 * ORTHOBIOLOGIC PROCEDURE CATALOG - Single Source of Truth (v1)
 * 
 * REGRA MÁXIMA: Procedure-Locked Output
 * Todo conteúdo gerado (Próximo Passo, Exames, Alertas) é derivado SOMENTE
 * do(s) procedure_code(s) selecionado(s). Misturar = BUG.
 * 
 * Este arquivo é o catálogo canônico para geração de recomendações clínicas.
 */

// =============================================================================
// TYPES
// =============================================================================

export type ProcedureCode = "PRP" | "PRF" | "BMA" | "BMEC" | "NANOFAT";

export type AlertSeverity = "low" | "medium" | "high";

export type EligibilityStatus = "OK" | "ATTENTION" | "BLOCKED";

export interface RequiredExam {
  exam_code: string;
  label: string;
  required: boolean;
  reason?: string;
}

export interface HardBlock {
  code: string;
  title: string;
  detail?: string;
}

export interface Precaution {
  code: string;
  title: string;
  detail?: string;
  severity: AlertSeverity;
}

export interface DynamicRule {
  code: string;
  trigger: (factors: PatientFactors) => boolean;
  alert?: Precaution;
  nextStepAddition?: string;
  blocksProcedure?: boolean;
}

export interface ProcedureDefinition {
  procedure_code: ProcedureCode;
  label_ptbr: string;
  next_steps_template_ptbr: string;
  required_exams: RequiredExam[];
  hard_blocks: HardBlock[];
  precautions: Precaution[];
  dynamic_rules: DynamicRule[];
  forbidden_terms: string[]; // termos que NUNCA devem aparecer quando OUTRO procedimento está selecionado
}

export interface PatientFactors {
  nsaid_recent?: boolean;
  days_since_last_nsaid?: number | null;
  anticoagulant_use?: boolean;
  antiplatelet_use?: boolean;
  active_infection?: boolean;
  severe_anemia?: boolean;
  thrombocytopenia?: boolean;
  cancer_active_uncontrolled?: boolean;
  coagulation_disorder?: boolean;
}

export interface OrthoBioPlanInput {
  procedure_codes: ProcedureCode[];
  patient_factors: PatientFactors;
}

export interface GeneratedBlock {
  code: string;
  title: string;
  detail?: string;
}

export interface GeneratedAlert {
  code: string;
  title: string;
  detail?: string;
  severity: AlertSeverity;
}

export interface OrthoBioPlanOutput {
  eligibility_status: EligibilityStatus;
  blocks: GeneratedBlock[];
  alerts: GeneratedAlert[];
  required_exams: RequiredExam[];
  next_steps_text: string;
  meta: {
    procedures_used: ProcedureCode[];
    generated_at: string;
    catalog_version: string;
  };
}

// =============================================================================
// CATALOG VERSION
// =============================================================================

export const CATALOG_VERSION = "v1.0.0";

// =============================================================================
// PROCEDURE CATALOG
// =============================================================================

const NSAID_DYNAMIC_RULE: DynamicRule = {
  code: "NSAID_RECENT",
  trigger: (f) => f.nsaid_recent === true,
  alert: {
    code: "NSAID_RECENT_ALERT",
    title: "Uso recente de AINE",
    detail: "Uso recente de AINE pode reduzir agregação/atividade plaquetária e comprometer qualidade do concentrado.",
    severity: "high",
  },
  nextStepAddition: "Considerar reprogramar coleta conforme protocolo, preferindo coletar antes do uso de AINE quando possível.",
};

const ANTICOAGULANT_RULE: DynamicRule = {
  code: "ANTICOAGULANT_USE",
  trigger: (f) => f.anticoagulant_use === true,
  alert: {
    code: "ANTICOAGULANT_ALERT",
    title: "Uso de anticoagulante",
    detail: "Avaliar risco-benefício e necessidade de ajuste temporário antes de procedimentos invasivos.",
    severity: "medium",
  },
};

const ANTIPLATELET_RULE: DynamicRule = {
  code: "ANTIPLATELET_USE",
  trigger: (f) => f.antiplatelet_use === true,
  alert: {
    code: "ANTIPLATELET_ALERT",
    title: "Uso de antiplaquetário",
    detail: "Antiplaquetários afetam a agregação plaquetária. Considerar protocolo de suspensão se seguro.",
    severity: "medium",
  },
};

const SEVERE_ANEMIA_BLOCK: DynamicRule = {
  code: "SEVERE_ANEMIA",
  trigger: (f) => f.severe_anemia === true,
  alert: {
    code: "SEVERE_ANEMIA_BLOCK",
    title: "Anemia severa",
    detail: "Anemia severa compromete qualidade do concentrado. Investigar e tratar antes do procedimento.",
    severity: "high",
  },
  blocksProcedure: true,
};

const THROMBOCYTOPENIA_BLOCK: DynamicRule = {
  code: "THROMBOCYTOPENIA",
  trigger: (f) => f.thrombocytopenia === true,
  alert: {
    code: "THROMBOCYTOPENIA_BLOCK",
    title: "Trombocitopenia",
    detail: "Plaquetopenia é contraindicação relativa para procedimentos com concentrado plaquetário.",
    severity: "high",
  },
  blocksProcedure: true,
};

const ACTIVE_INFECTION_BLOCK: DynamicRule = {
  code: "ACTIVE_INFECTION",
  trigger: (f) => f.active_infection === true,
  alert: {
    code: "ACTIVE_INFECTION_BLOCK",
    title: "Infecção ativa",
    detail: "Infecção ativa é contraindicação absoluta. Tratar antes de prosseguir.",
    severity: "high",
  },
  blocksProcedure: true,
};

const COAGULATION_DISORDER_BLOCK: DynamicRule = {
  code: "COAGULATION_DISORDER",
  trigger: (f) => f.coagulation_disorder === true,
  alert: {
    code: "COAGULATION_DISORDER_BLOCK",
    title: "Distúrbio de coagulação",
    detail: "Distúrbio de coagulação requer avaliação hematológica antes de procedimentos invasivos.",
    severity: "high",
  },
  blocksProcedure: true,
};

export const PROCEDURE_CATALOG: Record<ProcedureCode, ProcedureDefinition> = {
  PRP: {
    procedure_code: "PRP",
    label_ptbr: "PRP (Plasma Rico em Plaquetas)",
    next_steps_template_ptbr: 
      "Revisar contraindicações e medicações, checar uso recente de AINEs, planejar coleta e preparo do PRP e orientar cuidados pré/pós.",
    required_exams: [], // PRP não exige hemograma obrigatório por padrão
    hard_blocks: [],
    precautions: [],
    dynamic_rules: [
      NSAID_DYNAMIC_RULE,
      ANTICOAGULANT_RULE,
      ANTIPLATELET_RULE,
      SEVERE_ANEMIA_BLOCK,
      THROMBOCYTOPENIA_BLOCK,
      ACTIVE_INFECTION_BLOCK,
    ],
    forbidden_terms: ["BMEC", "BMAC", "BMA", "medula", "aspirado medular", "elegibilidade medular"],
  },

  PRF: {
    procedure_code: "PRF",
    label_ptbr: "PRF (Fibrina Rica em Plaquetas)",
    next_steps_template_ptbr:
      "Confirmar contraindicações e medicações que afetem coagulação, garantir logística e execução rápida (coleta → centrifugação), orientar cuidados pré/pós.",
    required_exams: [],
    hard_blocks: [],
    precautions: [],
    dynamic_rules: [
      NSAID_DYNAMIC_RULE,
      ANTICOAGULANT_RULE,
      ANTIPLATELET_RULE,
      COAGULATION_DISORDER_BLOCK,
      ACTIVE_INFECTION_BLOCK,
    ],
    forbidden_terms: ["BMEC", "BMAC", "BMA", "medula", "aspirado medular"],
  },

  BMA: {
    procedure_code: "BMA",
    label_ptbr: "BMA (Aspirado de Medula Óssea)",
    next_steps_template_ptbr:
      "Solicitar hemograma e revisar segurança hematológica, checar medicações que aumentem sangramento, planejar local/volume/técnica e orientar cuidados pré/pós.",
    required_exams: [
      {
        exam_code: "CBC",
        label: "Hemograma completo",
        required: true,
        reason: "Avaliação hematológica pré-procedimento",
      },
    ],
    hard_blocks: [],
    precautions: [],
    dynamic_rules: [
      ANTICOAGULANT_RULE,
      ANTIPLATELET_RULE,
      SEVERE_ANEMIA_BLOCK,
      COAGULATION_DISORDER_BLOCK,
      ACTIVE_INFECTION_BLOCK,
    ],
    forbidden_terms: ["PRP", "plasma rico em plaquetas"],
  },

  BMEC: {
    procedure_code: "BMEC",
    label_ptbr: "BMEC/BMAC (Concentrado de Medula Óssea)",
    next_steps_template_ptbr:
      "Solicitar hemograma para avaliação hematológica e segurança do procedimento, revisar risco de sangramento, planejar aspiração + processamento e orientar cuidados pré/pós.",
    required_exams: [
      {
        exam_code: "CBC",
        label: "Hemograma completo",
        required: true,
        reason: "Elegibilidade para BMEC/BMAC",
      },
    ],
    hard_blocks: [],
    precautions: [],
    dynamic_rules: [
      ANTICOAGULANT_RULE,
      ANTIPLATELET_RULE,
      SEVERE_ANEMIA_BLOCK,
      COAGULATION_DISORDER_BLOCK,
      ACTIVE_INFECTION_BLOCK,
    ],
    forbidden_terms: ["PRP", "plasma rico em plaquetas"],
  },

  NANOFAT: {
    procedure_code: "NANOFAT",
    label_ptbr: "Nanofat/Microfat",
    next_steps_template_ptbr:
      "Revisar risco hemorrágico e medicações, planejar local/volume de coleta e técnica de processamento, orientar cuidados pré/pós e sinais de alerta.",
    required_exams: [],
    hard_blocks: [],
    precautions: [],
    dynamic_rules: [
      ANTICOAGULANT_RULE,
      ANTIPLATELET_RULE,
      ACTIVE_INFECTION_BLOCK,
    ],
    forbidden_terms: ["PRP", "plasma rico em plaquetas", "BMEC", "BMAC", "medula"],
  },
};

// =============================================================================
// VALID PROCEDURE CODES
// =============================================================================

export const VALID_PROCEDURE_CODES: ProcedureCode[] = ["PRP", "PRF", "BMA", "BMEC", "NANOFAT"];

export function isValidProcedureCode(code: string): code is ProcedureCode {
  return VALID_PROCEDURE_CODES.includes(code as ProcedureCode);
}

// =============================================================================
// LEGACY MAPPING (from taxonomy codes to procedure codes)
// =============================================================================

export function mapTaxonomyToProcedureCode(itemCode: string): ProcedureCode | null {
  const code = itemCode.toUpperCase();

  // PRP
  if (code === "AUTO_PRP" || code === "AUTO_LP_PRP" || code === "AUTO_LR_PRP" || code.includes("PRP")) {
    return "PRP";
  }

  // PRF
  if (code === "AUTO_PRF" || code === "AUTO_IPRF" || code === "AUTO_APRF" || code === "AUTO_LPRF" || code.includes("PRF")) {
    return "PRF";
  }

  // BMA
  if (code === "AUTO_BMA") {
    return "BMA";
  }

  // BMEC/BMAC
  if (code === "AUTO_BMAC" || code === "AUTO_BMEC" || code.includes("BMAC") || code.includes("BMEC")) {
    return "BMEC";
  }

  // Nanofat/Microfat
  if (code === "AUTO_NANOFAT" || code === "AUTO_MICROFAT" || code.includes("NANOFAT") || code.includes("MICROFAT")) {
    return "NANOFAT";
  }

  return null;
}

// =============================================================================
// GENERATOR: generateOrthoBioPlan
// =============================================================================

/**
 * Generates procedure-locked recommendations based ONLY on selected procedures.
 * 
 * REGRA MÁXIMA: Output NUNCA pode conter termos de procedimentos não selecionados.
 */
export function generateOrthoBioPlan(input: OrthoBioPlanInput): OrthoBioPlanOutput {
  const { procedure_codes, patient_factors } = input;

  // Validate at least one procedure
  if (!procedure_codes || procedure_codes.length === 0) {
    return {
      eligibility_status: "OK",
      blocks: [],
      alerts: [],
      required_exams: [],
      next_steps_text: "Selecione um procedimento ortobiológico para gerar o plano.",
      meta: {
        procedures_used: [],
        generated_at: new Date().toISOString(),
        catalog_version: CATALOG_VERSION,
      },
    };
  }

  // Filter only valid procedures
  const validProcedures = procedure_codes.filter(isValidProcedureCode);
  
  if (validProcedures.length === 0) {
    return {
      eligibility_status: "OK",
      blocks: [],
      alerts: [],
      required_exams: [],
      next_steps_text: "Procedimento não reconhecido. Selecione um procedimento ortobiológico válido.",
      meta: {
        procedures_used: [],
        generated_at: new Date().toISOString(),
        catalog_version: CATALOG_VERSION,
      },
    };
  }

  const blocks: GeneratedBlock[] = [];
  const alerts: GeneratedAlert[] = [];
  const requiredExams: RequiredExam[] = [];
  const nextStepsParts: string[] = [];
  const nextStepsAdditions: string[] = [];
  const usedExamCodes = new Set<string>();

  // Process each selected procedure
  for (const procCode of validProcedures) {
    const definition = PROCEDURE_CATALOG[procCode];
    
    // Add base next step
    if (validProcedures.length === 1) {
      nextStepsParts.push(definition.next_steps_template_ptbr);
    } else {
      // Multiple procedures: prefix with label
      nextStepsParts.push(`• ${definition.label_ptbr}: ${definition.next_steps_template_ptbr}`);
    }

    // Add required exams (dedupe)
    for (const exam of definition.required_exams) {
      if (!usedExamCodes.has(exam.exam_code)) {
        requiredExams.push(exam);
        usedExamCodes.add(exam.exam_code);
      }
    }

    // Process dynamic rules
    for (const rule of definition.dynamic_rules) {
      if (rule.trigger(patient_factors)) {
        // Add alert
        if (rule.alert) {
          // Avoid duplicate alerts
          if (!alerts.some(a => a.code === rule.alert!.code)) {
            alerts.push(rule.alert);
          }
        }

        // Add block if procedure is blocked
        if (rule.blocksProcedure) {
          blocks.push({
            code: rule.code,
            title: rule.alert?.title || rule.code,
            detail: rule.alert?.detail,
          });
        }

        // Add next step addition
        if (rule.nextStepAddition && !nextStepsAdditions.includes(rule.nextStepAddition)) {
          nextStepsAdditions.push(rule.nextStepAddition);
        }
      }
    }
  }

  // Build final next_steps_text
  let nextStepsText = nextStepsParts.join("\n");
  
  // Add dynamic additions
  if (nextStepsAdditions.length > 0) {
    nextStepsText += "\n\n⚠️ " + nextStepsAdditions.join(" ");
  }

  // PROCEDURE-LOCK GUARD: Validate no forbidden terms from non-selected procedures
  const selectedProcedureForbiddenTerms = new Set<string>();
  for (const procCode of validProcedures) {
    // Collect forbidden terms that ARE allowed (from selected procedures)
    // We need to check OTHER procedures' forbidden terms
  }

  // Collect all forbidden terms from NON-selected procedures
  const forbiddenTerms: string[] = [];
  for (const [code, definition] of Object.entries(PROCEDURE_CATALOG)) {
    if (!validProcedures.includes(code as ProcedureCode)) {
      forbiddenTerms.push(...definition.forbidden_terms);
    }
  }

  // Check and sanitize (in production, this would log an error)
  const lowerText = nextStepsText.toLowerCase();
  for (const term of forbiddenTerms) {
    if (lowerText.includes(term.toLowerCase())) {
      console.error(`[OrthoBioPlan] VIOLATION: Text contains forbidden term "${term}" for procedures: ${validProcedures.join(", ")}`);
      // In a strict implementation, we could strip or replace, but here we just flag
    }
  }

  // Determine eligibility status
  let eligibilityStatus: EligibilityStatus = "OK";
  if (blocks.length > 0) {
    eligibilityStatus = "BLOCKED";
  } else if (alerts.some(a => a.severity === "high")) {
    eligibilityStatus = "ATTENTION";
  }

  return {
    eligibility_status: eligibilityStatus,
    blocks,
    alerts,
    required_exams: requiredExams,
    next_steps_text: nextStepsText,
    meta: {
      procedures_used: validProcedures,
      generated_at: new Date().toISOString(),
      catalog_version: CATALOG_VERSION,
    },
  };
}

// =============================================================================
// HELPER: Check if text contains forbidden terms for given procedures
// =============================================================================

export function containsForbiddenTerms(
  text: string,
  selectedProcedures: ProcedureCode[]
): { hasForbidden: boolean; violations: string[] } {
  const forbiddenTerms: string[] = [];
  
  for (const [code, definition] of Object.entries(PROCEDURE_CATALOG)) {
    if (!selectedProcedures.includes(code as ProcedureCode)) {
      forbiddenTerms.push(...definition.forbidden_terms);
    }
  }

  const lowerText = text.toLowerCase();
  const violations: string[] = [];

  for (const term of forbiddenTerms) {
    if (lowerText.includes(term.toLowerCase())) {
      violations.push(term);
    }
  }

  return {
    hasForbidden: violations.length > 0,
    violations,
  };
}

// =============================================================================
// HELPER: Get procedure label
// =============================================================================

export function getProcedureLabel(code: ProcedureCode): string {
  return PROCEDURE_CATALOG[code]?.label_ptbr || code;
}
