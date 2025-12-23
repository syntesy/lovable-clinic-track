// FISIOREGEN SCORE - Configurações editáveis
// Os valores podem ser ajustados conforme necessidade clínica

export const fisioRegenScoreSettings = {
  // Janelas de tempo em dias para medicações
  windows_days: {
    aspirin_critical: 7,
    nsaid_nonselective_critical: 5,
    p2y12_critical: 7,
    systemic_corticosteroid_critical: 14,
    local_corticosteroid_target_critical: 21,
  },
  
  // Thresholds para exames laboratoriais
  thresholds: {
    platelets: {
      block_below: 100000,      // Abaixo disso = bloqueio
      good_below: 150000,       // Acima disso = pontuação máxima
      borderline_below: 120000, // Entre block e good = borderline
    },
    hba1c: {
      good_max: 5.7,      // Até esse valor = pontuação máxima
      borderline_max: 6.5, // Entre good e borderline = parcial
    },
  },
  
  // Thresholds de score para status
  score_thresholds: {
    nao_apto_max: 49,
    alto_risco_max: 64,
    apto_max: 79,
    // >= 80 = EXCELENTE_CANDIDATO
  },
};

export type FisioRegenScoreSettings = typeof fisioRegenScoreSettings;
