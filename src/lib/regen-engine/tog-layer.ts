/**
 * TOG LAYER - Camada 5 (Therapeutic Orientation Guidance)
 * 
 * Converte reason_codes em orientações não prescritivas.
 * Linguagem sugestiva, sempre incluindo disclaimer.
 */

import { BRSOutput, TOGOutput, Guidance } from "@/types/regen-engine";

// Mapeamento de reason_codes para orientações
const GUIDANCE_MAP: Record<string, Omit<Guidance, "code">> = {
  // Tabagismo
  CURRENT_SMOKER: {
    category: "lifestyle",
    title: "Considerar cessação do tabagismo",
    description: "O tabagismo ativo pode reduzir significativamente o potencial regenerativo dos tecidos. Orientar sobre programas de cessação pode ser benéfico.",
    priority: "high",
  },
  FORMER_SMOKER_LT_6M: {
    category: "lifestyle",
    title: "Ex-fumante recente",
    description: "A recuperação biológica após cessação do tabagismo está em andamento. Considerar aguardar mais tempo para resultados otimizados.",
    priority: "medium",
  },
  FORMER_SMOKER_6_12M: {
    category: "lifestyle",
    title: "Recuperação de ex-fumante",
    description: "Boa evolução após cessação do tabagismo. O organismo está em processo de recuperação.",
    priority: "low",
  },

  // Medicações
  NSAID_RECENT_14D: {
    category: "medication",
    title: "Uso recente de anti-inflamatório",
    description: "AINEs podem afetar a função plaquetária. Considerar orientar suspensão prévia ao procedimento, se clinicamente apropriado.",
    priority: "high",
  },
  STEROID_LOCAL_RECENT: {
    category: "medication",
    title: "Infiltração de corticoide recente",
    description: "Corticoides locais podem impactar a regeneração tecidual. Considerar intervalo adequado antes de procedimentos regenerativos.",
    priority: "high",
  },
  STEROID_SYSTEMIC_RECENT: {
    category: "medication",
    title: "Uso de corticoide sistêmico",
    description: "Corticoides sistêmicos podem afetar a resposta regenerativa. Avaliar necessidade e possibilidade de ajuste.",
    priority: "medium",
  },
  ANTICOAGULANT_USE: {
    category: "medication",
    title: "Uso de anticoagulante",
    description: "Avaliar risco-benefício e necessidade de ajuste temporário antes de procedimentos invasivos.",
    priority: "medium",
  },
  ANTIPLATELET_USE: {
    category: "medication",
    title: "Uso de antiplaquetário",
    description: "Antiplaquetários afetam a agregação plaquetária. Considerar protocolo de suspensão se seguro.",
    priority: "medium",
  },
  IMMUNOSUPPRESSOR_USE: {
    category: "medication",
    title: "Uso de imunossupressor",
    description: "Imunossupressores podem afetar a resposta regenerativa. Coordenar com especialista responsável.",
    priority: "high",
  },

  // Comorbidades
  DIABETES_UNCONTROLLED: {
    category: "preparation",
    title: "Otimizar controle glicêmico",
    description: "Diabetes descompensado compromete cicatrização e regeneração. Considerar controle prévio ao procedimento.",
    priority: "high",
  },
  DIABETES_CONTROLLED: {
    category: "preparation",
    title: "Manter controle glicêmico",
    description: "Manter bom controle glicêmico para otimizar resultados regenerativos.",
    priority: "low",
  },
  RENAL_HEPATIC_DISEASE: {
    category: "preparation",
    title: "Avaliar função renal/hepática",
    description: "Disfunção renal ou hepática pode afetar metabolismo de fatores de crescimento. Considerar avaliação específica.",
    priority: "medium",
  },

  // Labs
  SEVERE_ANEMIA: {
    category: "preparation",
    title: "Investigar e tratar anemia",
    description: "Anemia severa pode comprometer resultados. Considerar investigação etiológica e tratamento antes do procedimento.",
    priority: "high",
  },
  MILD_ANEMIA: {
    category: "nutrition",
    title: "Avaliar anemia",
    description: "Anemia leve a moderada pode afetar regeneração. Considerar suplementação se indicado.",
    priority: "medium",
  },
  THROMBOCYTOPENIA: {
    category: "preparation",
    title: "Avaliar trombocitopenia",
    description: "Plaquetopenia é contraindicação relativa para PRP. Investigar causa e considerar alternativas.",
    priority: "high",
  },
  LOW_PLATELETS: {
    category: "preparation",
    title: "Monitorar plaquetas",
    description: "Contagem de plaquetas no limite inferior. Considerar repetir exame.",
    priority: "medium",
  },
  HIGH_CRP: {
    category: "preparation",
    title: "Avaliar processo inflamatório",
    description: "PCR elevado indica inflamação ativa. Considerar identificar e tratar causa antes do procedimento.",
    priority: "high",
  },
  ELEVATED_CRP: {
    category: "preparation",
    title: "Monitorar inflamação",
    description: "PCR levemente elevado. Considerar repetir exame ou aguardar resolução.",
    priority: "medium",
  },
  LOW_FERRITIN: {
    category: "nutrition",
    title: "Considerar reposição de ferro",
    description: "Ferritina baixa pode indicar deficiência de ferro. Avaliar necessidade de suplementação.",
    priority: "high",
  },
  BORDERLINE_FERRITIN: {
    category: "nutrition",
    title: "Otimizar reservas de ferro",
    description: "Ferritina limítrofe. Considerar suplementação para otimizar resultados.",
    priority: "low",
  },
  VERY_HIGH_HBA1C: {
    category: "preparation",
    title: "Melhorar controle glicêmico",
    description: "HbA1c muito elevada indica controle glicêmico inadequado. Priorizar controle antes de procedimentos.",
    priority: "high",
  },
  HIGH_HBA1C: {
    category: "preparation",
    title: "Otimizar controle glicêmico",
    description: "HbA1c acima do ideal. Considerar ajustes para otimizar resultados regenerativos.",
    priority: "medium",
  },

  // Sintomas
  ACUTE_SYMPTOMS_LT_3M: {
    category: "general",
    title: "Sintomas em fase aguda",
    description: "Sintomas recentes podem indicar fase inflamatória. Considerar aguardar estabilização.",
    priority: "medium",
  },
  CHRONIC_SYMPTOMS_GT_6M: {
    category: "general",
    title: "Sintomas crônicos",
    description: "Sintomas de longa duração podem indicar alterações estruturais estabelecidas.",
    priority: "low",
  },
  SEVERE_PAIN_GTE_9: {
    category: "general",
    title: "Dor intensa",
    description: "Dor muito intensa pode indicar fase aguda. Considerar controle da dor e reavaliação.",
    priority: "high",
  },
};

// Disclaimer obrigatório
const DISCLAIMER_GUIDANCE: Guidance = {
  code: "DISCLAIMER",
  category: "general",
  title: "Decisão clínica",
  description: "Estas orientações são sugestões baseadas nos dados informados. A decisão final sobre conduta terapêutica é de responsabilidade exclusiva do profissional de saúde.",
  priority: "low",
};

export function computeTOG(brsOutput: BRSOutput): TOGOutput {
  const guidance: Guidance[] = [];

  // Converter reason_codes em orientações
  for (const code of brsOutput.reason_codes) {
    const guidanceData = GUIDANCE_MAP[code];
    if (guidanceData) {
      guidance.push({
        code,
        ...guidanceData,
      });
    }
  }

  // Ordenar por prioridade
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  guidance.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Sempre adicionar disclaimer ao final
  guidance.push(DISCLAIMER_GUIDANCE);

  return { guidance };
}
