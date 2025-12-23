import { fisioRegenScoreSettings } from "@/lib/fisioregen-score-settings";
import {
  FisioRegenFormData,
  ComputedResult,
  BlockType,
  FlagType,
  ScoreStatus,
} from "@/types/fisioregen-score";

// Função auxiliar: dias desde uma data
function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function calculateFisioRegenScore(data: FisioRegenFormData): ComputedResult {
  const settings = fisioRegenScoreSettings;
  const triggered_blocks: BlockType[] = [];
  const triggered_flags: FlagType[] = [];

  // ==================== BLOQUEIOS ====================
  
  // Infecção ou pele
  if (data.has_active_infection || data.has_skin_compromise_at_site) {
    triggered_blocks.push("BLOCK_INF_OR_SKIN");
  }
  
  // Câncer ativo em tratamento
  if (data.has_active_cancer_on_treatment) {
    triggered_blocks.push("BLOCK_CANCER_ACTIVE_TX");
  }
  
  // Plaquetas muito baixas
  if (data.platelets_value !== null && data.platelets_value < settings.thresholds.platelets.block_below) {
    triggered_blocks.push("BLOCK_PLATELETS_LOW");
  }
  
  // Bloqueios estruturais
  if (data.structural_block_complete_rupture_or_avulsion) {
    triggered_blocks.push("BLOCK_COMPLETE_RUPTURE");
  }
  if (data.structural_block_bone_collapse_or_osteonecrosis) {
    triggered_blocks.push("BLOCK_BONE_COLLAPSE");
  }
  
  // Janelas críticas de medicações
  if (data.use_aspirin) {
    const days = daysSince(data.last_aspirin_date);
    if (days !== null && days <= settings.windows_days.aspirin_critical) {
      triggered_blocks.push("BLOCK_ASPIRIN_WINDOW");
    }
  }
  
  if (data.use_nsaid_nonselective) {
    const days = daysSince(data.last_nsaid_nonselective_date);
    if (days !== null && days <= settings.windows_days.nsaid_nonselective_critical) {
      triggered_blocks.push("BLOCK_NSAID_WINDOW");
    }
  }
  
  if (data.use_p2y12) {
    const days = daysSince(data.last_p2y12_date);
    if (days !== null && days <= settings.windows_days.p2y12_critical) {
      triggered_blocks.push("BLOCK_P2Y12_WINDOW");
    }
  }
  
  if (data.use_systemic_corticosteroid) {
    const days = daysSince(data.last_systemic_corticosteroid_date);
    if (days !== null && days <= settings.windows_days.systemic_corticosteroid_critical) {
      triggered_blocks.push("BLOCK_SYS_STEROID_WINDOW");
    }
  }
  
  if (data.use_local_corticosteroid_target) {
    const days = daysSince(data.last_local_corticosteroid_target_date);
    if (days !== null && days <= settings.windows_days.local_corticosteroid_target_critical) {
      triggered_blocks.push("BLOCK_LOCAL_STEROID_WINDOW");
    }
  }

  // ==================== DOMÍNIO A (0-35) ====================
  
  // A1: HbA1c (0-10)
  let A1 = 0;
  if (!data.diabetes_known) {
    if (data.hba1c_value === null) {
      A1 = 10;
    } else if (data.hba1c_value <= settings.thresholds.hba1c.good_max) {
      A1 = 10;
    } else if (data.hba1c_value <= settings.thresholds.hba1c.borderline_max) {
      A1 = 5;
      triggered_flags.push("A_GLYCEMIA_BORDERLINE");
    } else {
      A1 = 0;
      triggered_flags.push("A_GLYCEMIA_HIGH");
    }
  } else {
    // Diabético conhecido
    if (data.hba1c_value === null) {
      A1 = 5;
      triggered_flags.push("A_HBA1C_REQUESTED");
    } else if (data.hba1c_value <= settings.thresholds.hba1c.good_max) {
      A1 = 10;
    } else if (data.hba1c_value <= settings.thresholds.hba1c.borderline_max) {
      A1 = 5;
      triggered_flags.push("A_GLYCEMIA_BORDERLINE");
    } else {
      A1 = 0;
      triggered_flags.push("A_GLYCEMIA_HIGH");
    }
  }
  
  // A2: Tabagismo (0-5)
  let A2 = 0;
  switch (data.smoking_status) {
    case "non_smoker":
      A2 = 5;
      break;
    case "light_moderate":
      A2 = 2;
      triggered_flags.push("A_SMOKING");
      break;
    case "heavy":
      A2 = 0;
      triggered_flags.push("A_SMOKING_HEAVY");
      break;
  }
  
  // A3: Plaquetas (0-10)
  let A3 = 0;
  if (data.platelets_value === null) {
    A3 = 5;
    triggered_flags.push("A_PLATELETS_REQUESTED");
  } else if (data.platelets_value >= settings.thresholds.platelets.good_below) {
    A3 = 10;
  } else if (data.platelets_value >= settings.thresholds.platelets.borderline_below) {
    A3 = 5;
    triggered_flags.push("A_PLATELETS_BORDERLINE");
  } else {
    A3 = 0; // Já bloqueou antes se muito baixo
  }
  
  // A4: PCR status (0-5)
  let A4 = 0;
  switch (data.crp_status) {
    case "not_available":
      A4 = 3;
      triggered_flags.push("A_CRP_NOT_AVAILABLE");
      break;
    case "normal":
      A4 = 5;
      break;
    case "mild":
      A4 = 2;
      triggered_flags.push("A_CRP_MILD");
      break;
    case "high":
      A4 = 0;
      triggered_flags.push("A_CRP_HIGH");
      break;
  }
  
  // A5: Medicações janela cinzenta (0-5)
  let A5 = 5;
  let hasGrayWindow = false;
  
  const checkGrayWindow = (usesMed: boolean, dateStr: string | null, criticalDays: number) => {
    if (usesMed) {
      const days = daysSince(dateStr);
      if (days !== null && days > criticalDays && days <= criticalDays * 2) {
        return true;
      }
    }
    return false;
  };
  
  if (checkGrayWindow(data.use_aspirin, data.last_aspirin_date, settings.windows_days.aspirin_critical) ||
      checkGrayWindow(data.use_nsaid_nonselective, data.last_nsaid_nonselective_date, settings.windows_days.nsaid_nonselective_critical) ||
      checkGrayWindow(data.use_p2y12, data.last_p2y12_date, settings.windows_days.p2y12_critical) ||
      checkGrayWindow(data.use_systemic_corticosteroid, data.last_systemic_corticosteroid_date, settings.windows_days.systemic_corticosteroid_critical) ||
      checkGrayWindow(data.use_local_corticosteroid_target, data.last_local_corticosteroid_target_date, settings.windows_days.local_corticosteroid_target_critical)) {
    hasGrayWindow = true;
  }
  
  if (hasGrayWindow) {
    A5 = 2;
    triggered_flags.push("A_MEDS_GRAY_WINDOW");
  }
  
  const A = Math.min(A1 + A2 + A3 + A4 + A5, 35);

  // ==================== DOMÍNIO B (0-45) ====================
  
  // B1: Integridade (0-15)
  let B1 = 0;
  switch (data.tissue_integrity_grade) {
    case "preserved":
      B1 = 15;
      break;
    case "moderate":
      B1 = 10;
      break;
    case "severe":
      B1 = 4;
      break;
    case "complete_rupture":
      B1 = 0;
      triggered_flags.push("B_COMPLETE_RUPTURE");
      break;
  }
  
  // B2: Substrato (0-15)
  let B2 = 0;
  switch (data.tissue_substrate_viability_grade) {
    case "viable":
      B2 = 15;
      break;
    case "moderate_changes":
      B2 = 8;
      break;
    case "severe":
      B2 = 2;
      break;
    case "collapse":
      B2 = 0;
      triggered_flags.push("B_COLLAPSE");
      break;
  }
  
  // B3: Estágio (0-10)
  let B3 = 0;
  switch (data.tissue_biologic_stage_grade) {
    case "responsive":
      B3 = 10;
      break;
    case "advanced_low_matrix":
      B3 = 5;
      break;
    case "very_advanced":
      B3 = 0;
      triggered_flags.push("B_LOW_REGEN");
      break;
  }
  
  // B4: Tentativas prévias (0-5)
  let B4 = 0;
  switch (data.prior_orthobiologic_attempts) {
    case "first":
      B4 = 5;
      break;
    case "failed_once":
      B4 = 2;
      triggered_flags.push("B_PRIOR_FAILURE");
      break;
    case "failed_2plus":
      B4 = 0;
      triggered_flags.push("B_MULTIPLE_FAILURES");
      break;
  }
  
  const B = Math.min(B1 + B2 + B3 + B4, 45);

  // ==================== DOMÍNIO C (0-20) ====================
  
  // C1: Logística (0-8)
  let C1 = 0;
  switch (data.logistics_capacity) {
    case "high":
      C1 = 8;
      break;
    case "medium":
      C1 = 4;
      triggered_flags.push("C_LOGISTICS_LIMIT");
      break;
    case "low":
      C1 = 0;
      triggered_flags.push("C_LOGISTICS_POOR");
      break;
  }
  
  // C2: Adesão (0-7)
  let C2 = 0;
  switch (data.adherence_estimate) {
    case "high":
      C2 = 7;
      break;
    case "medium":
      C2 = 3;
      triggered_flags.push("C_ADH_MED");
      break;
    case "low":
      C2 = 0;
      triggered_flags.push("C_ADH_LOW");
      break;
  }
  
  // C3: Expectativa (0-5)
  let C3 = 0;
  switch (data.expectation_realism) {
    case "realistic":
      C3 = 5;
      break;
    case "partial":
      C3 = 2;
      triggered_flags.push("C_EXPECT_PARTIAL");
      break;
    case "unrealistic":
      C3 = 0;
      triggered_flags.push("C_EXPECT_UNREAL");
      break;
  }
  
  const C = Math.min(C1 + C2 + C3, 20);

  // ==================== SCORE TOTAL E STATUS ====================
  
  const score_total = A + B + C;
  
  let status: ScoreStatus;
  let bloqueio = false;
  let score_valid = true;
  
  if (triggered_blocks.length > 0) {
    bloqueio = true;
    status = "NAO_APTO_NO_MOMENTO";
    score_valid = false;
  } else {
    if (score_total <= settings.score_thresholds.nao_apto_max) {
      status = "NAO_APTO";
    } else if (score_total <= settings.score_thresholds.alto_risco_max) {
      status = "APTO_COM_ALTO_RISCO";
    } else if (score_total <= settings.score_thresholds.apto_max) {
      status = "APTO";
    } else {
      status = "EXCELENTE_CANDIDATO";
    }
  }

  // ==================== MENSAGENS ====================
  
  const mensagemPaciente = getMensagemPaciente(status, bloqueio);
  const mensagemProfissional = getMensagemProfissional(score_total, A, B, C, bloqueio, triggered_blocks, triggered_flags);

  return {
    biological_readiness_score: score_total,
    domains: { A, B, C },
    status,
    bloqueio,
    score_valid,
    triggered_blocks,
    triggered_flags,
    mensagem_paciente: mensagemPaciente,
    mensagem_profissional: mensagemProfissional,
  };
}

function getMensagemPaciente(status: ScoreStatus, bloqueio: boolean): string {
  if (bloqueio) {
    return "No momento, existem condições que precisam ser resolvidas antes de prosseguir com o tratamento ortobiológico. Seu médico irá orientá-lo sobre os próximos passos.";
  }
  
  switch (status) {
    case "NAO_APTO":
      return "Sua avaliação indica que o tratamento ortobiológico pode não ter os resultados esperados neste momento. Discuta alternativas com seu médico.";
    case "APTO_COM_ALTO_RISCO":
      return "Você pode se beneficiar do tratamento, mas existem fatores que podem limitar os resultados. Seu médico irá discutir expectativas realistas.";
    case "APTO":
      return "Sua avaliação indica boa condição para o tratamento ortobiológico. Continue seguindo as orientações médicas.";
    case "EXCELENTE_CANDIDATO":
      return "Excelente! Sua avaliação indica condições ótimas para responder bem ao tratamento ortobiológico.";
    default:
      return "";
  }
}

function getMensagemProfissional(
  score: number,
  A: number,
  B: number,
  C: number,
  bloqueio: boolean,
  blocks: BlockType[],
  flags: FlagType[]
): string {
  const bloqueioStr = bloqueio ? "SIM" : "NÃO";
  const blocksStr = blocks.length > 0 ? blocks.join(", ") : "Nenhum";
  const flagsStr = flags.length > 0 ? flags.join(", ") : "Nenhum";
  
  return `FISIOREGEN SCORE: ${score}/100 (A=${A}, B=${B}, C=${C}). Bloqueio: ${bloqueioStr}. Bloqueios ativos: ${blocksStr}. Flags: ${flagsStr}.`;
}
