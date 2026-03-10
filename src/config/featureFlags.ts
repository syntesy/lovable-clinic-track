// Feature flags — centralized control for unreleased features
export const FEATURE_FLAGS = {
  /**
   * PRACTICE_CURATION: Curadoria clínica aplicada à prática.
   * Feature planejada para futura implementação.
   * Consumida em: CuradoriaOriginal.tsx (banner CTA gated).
   * Manter como false até desenvolvimento completo.
   * TODO: Remover esta flag se o desenvolvimento não iniciar até Q3 2026.
   */
  PRACTICE_CURATION: false,
} as const;
