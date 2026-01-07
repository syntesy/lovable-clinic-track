/**
 * PEE LAYER - Camada 6 (Procedure Eligibility Engine)
 * 
 * Avalia elegibilidade para procedimentos específicos.
 * O sistema NUNCA escolhe tratamento, apenas indica viabilidade.
 * 
 * INTEGRAÇÃO TAXONOMIA v1.1:
 * - A elegibilidade agora é determinada pela categoria efetiva do item
 * - Itens com requires_score = true são avaliados
 * - Híbridos (HYB_*) herdam categoria via base_component_category_code
 */

import { RegenCanonical } from "@/types/regen-canonical";
import { BRSOutput, PEEOutput, ProcedureEligibility } from "@/types/regen-engine";
import { mapToLegacyProcedureType } from "@/lib/taxonomy/therapyTaxonomy";

// Tipos de procedimento suportados pelo motor (congelado)
// Novos itens da taxonomia são mapeados para estes tipos
const LEGACY_PROCEDURE_TYPES = ["PRP", "PRF", "BMAC"] as const;
type LegacyProcedureType = typeof LEGACY_PROCEDURE_TYPES[number];

// Categoria que requer avaliação de score
const SCORE_ELIGIBLE_CATEGORY = "autologous_biologic";

// Gates que afetam elegibilidade
interface EligibilityGate {
  trigger: (canonical: RegenCanonical, brs: BRSOutput) => boolean;
  effect: "block" | "downgrade";
  gate_code: string;
  rationale: string;
  affects: LegacyProcedureType[]; // Quais procedimentos são afetados
}

const ELIGIBILITY_GATES: EligibilityGate[] = [
  // AINE recente bloqueia "Recommended" para PRP
  {
    trigger: (c) => c.medications.nsaid_recent_14d === "yes",
    effect: "downgrade",
    gate_code: "NSAID_RECENT",
    rationale: "AINEs recentes podem afetar função plaquetária",
    affects: ["PRP", "PRF"],
  },
  // Corticoide local recente
  {
    trigger: (c) => c.medications.steroid_recent === "yes" && c.medications.steroid_route === "local_infiltration",
    effect: "downgrade",
    gate_code: "STEROID_LOCAL_RECENT",
    rationale: "Infiltração recente de corticoide pode afetar resposta local",
    affects: ["PRP", "PRF", "BMAC"],
  },
  // Trombocitopenia
  {
    trigger: (c, brs) => brs.reason_codes.includes("THROMBOCYTOPENIA"),
    effect: "block",
    gate_code: "THROMBOCYTOPENIA",
    rationale: "Plaquetopenia é contraindicação relativa para PRP",
    affects: ["PRP"],
  },
  // Anticoagulante
  {
    trigger: (c) => c.medications.anticoagulant,
    effect: "downgrade",
    gate_code: "ANTICOAGULANT",
    rationale: "Uso de anticoagulante requer avaliação de risco de sangramento",
    affects: ["PRP", "PRF", "BMAC"],
  },
  // Anemia severa
  {
    trigger: (c, brs) => brs.reason_codes.includes("SEVERE_ANEMIA"),
    effect: "block",
    gate_code: "SEVERE_ANEMIA",
    rationale: "Anemia severa compromete qualidade do concentrado",
    affects: ["PRP", "PRF"],
  },
  // Tabagismo ativo
  {
    trigger: (c) => c.smoking.status === "current",
    effect: "downgrade",
    gate_code: "CURRENT_SMOKER",
    rationale: "Tabagismo ativo reduz potencial regenerativo",
    affects: ["PRP", "PRF", "BMAC"],
  },
  // Inflamação alta
  {
    trigger: (c, brs) => brs.reason_codes.includes("HIGH_CRP"),
    effect: "downgrade",
    gate_code: "HIGH_INFLAMMATION",
    rationale: "Processo inflamatório ativo pode afetar resultados",
    affects: ["PRP", "PRF", "BMAC"],
  },
];

/**
 * Computa elegibilidade para procedimentos.
 * Usa os 3 tipos legados do motor (PRP, PRF, BMAC).
 */
export function computePEE(
  canonical: RegenCanonical, 
  brsOutput: BRSOutput
): PEEOutput {
  const eligibility: ProcedureEligibility[] = [];

  for (const procedureType of LEGACY_PROCEDURE_TYPES) {
    const result = evaluateProcedure(procedureType, canonical, brsOutput);
    eligibility.push(result);
  }

  return { eligibility };
}

/**
 * Verifica se um código de item da taxonomia é elegível para avaliação de score.
 * Usa mapToLegacyProcedureType para determinar se o item pode ser avaliado.
 * 
 * @param itemCode - Código do item da taxonomia (ex: AUTO_PRP, HYB_PRP_HA)
 * @returns true se o item requer e pode passar por avaliação de score
 */
export function isItemScoreEligible(itemCode: string): boolean {
  const legacyType = mapToLegacyProcedureType(itemCode);
  return legacyType !== null;
}

/**
 * Obtém o tipo legado para um item da taxonomia.
 * Usado para compatibilidade com motor congelado.
 */
export function getLegacyProcedureType(itemCode: string): LegacyProcedureType | null {
  return mapToLegacyProcedureType(itemCode);
}

/**
 * Retorna a categoria que requer score.
 */
export function getScoreEligibleCategory(): string {
  return SCORE_ELIGIBLE_CATEGORY;
}

function evaluateProcedure(
  procedureType: LegacyProcedureType,
  canonical: RegenCanonical,
  brs: BRSOutput
): ProcedureEligibility {
  const gates_triggered: string[] = [];
  let hasBlockingGate = false;
  let hasDowngradeGate = false;

  // Verificar gates
  for (const gate of ELIGIBILITY_GATES) {
    if (gate.affects.includes(procedureType) && gate.trigger(canonical, brs)) {
      gates_triggered.push(gate.gate_code);
      if (gate.effect === "block") {
        hasBlockingGate = true;
      } else {
        hasDowngradeGate = true;
      }
    }
  }

  // Determinar elegibilidade baseada no BRS e gates
  const eligibilityResult = determineEligibility(
    brs.score,
    brs.confidence,
    hasBlockingGate,
    hasDowngradeGate
  );

  return {
    procedure_type: procedureType,
    eligibility: eligibilityResult.eligibility,
    gates_triggered,
    rationale: eligibilityResult.rationale,
  };
}

function determineEligibility(
  brsScore: number,
  confidence: "High" | "Medium" | "Low",
  hasBlockingGate: boolean,
  hasDowngradeGate: boolean
): { eligibility: ProcedureEligibility["eligibility"]; rationale: string } {
  
  // Gate bloqueante → Not recommended
  if (hasBlockingGate) {
    return {
      eligibility: "Not recommended",
      rationale: "Presença de contraindicação relativa importante",
    };
  }

  // Confidence Low → nunca "Recommended"
  if (confidence === "Low") {
    if (brsScore < 40) {
      return {
        eligibility: "Cannot evaluate",
        rationale: "Dados insuficientes para avaliação completa",
      };
    }
    return {
      eligibility: "Possible with adjustments",
      rationale: "Dados incompletos - solicitar exames essenciais",
    };
  }

  // BRS < 40 → Not recommended
  if (brsScore < 40) {
    return {
      eligibility: "Not recommended",
      rationale: "Score biológico abaixo do limiar mínimo",
    };
  }

  // BRS 40-69 → Possible
  if (brsScore < 70) {
    return {
      eligibility: "Possible with adjustments",
      rationale: hasDowngradeGate
        ? "Viável com ajustes e otimização de fatores identificados"
        : "Score biológico moderado - considerar otimização",
    };
  }

  // BRS >= 70
  if (hasDowngradeGate) {
    // Gate de downgrade impede "Recommended"
    return {
      eligibility: "Possible with adjustments",
      rationale: "Bom potencial biológico, porém fatores modificáveis presentes",
    };
  }

  // BRS >= 70 sem gates → Recommended
  return {
    eligibility: "Recommended",
    rationale: "Perfil biológico favorável para procedimentos regenerativos",
  };
}
