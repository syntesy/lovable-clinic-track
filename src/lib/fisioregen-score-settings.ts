// FISIOREGEN SCORE - Configurações editáveis
// Os valores podem ser ajustados conforme necessidade clínica

export const fisioRegenScoreSettings = {
  // Janelas de tempo em dias para medicações
  windows_days: {
    aspirin_critical: 5,              // AAS - recuperação funcional plaquetária
    nsaid_nonselective_critical: 5,   // AINE não seletivo
    p2y12_critical: 7,                // Clopidogrel/Ticagrelor - janela conservadora
    systemic_corticosteroid_critical: 21,       // Evita sabotagem da fase inflamatória
    local_corticosteroid_target_critical: 21,   // Corticoide local no alvo
  },
  
  // Thresholds para exames laboratoriais
  thresholds: {
    platelets: {
      block_below: 100000,      // <100k = bloqueio automático (segurança + baixa eficácia)
      good_below: 150000,       // ≥150k = ideal
      borderline_below: 100000, // 100-149k = limítrofe (pontuação intermediária)
    },
    hba1c: {
      good_max: 7.5,       // ≤7.5 = bom ambiente biológico
      borderline_max: 8.5, // 7.6-8.5 = risco moderado (flag); >8.5 = baixo potencial regenerativo
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
