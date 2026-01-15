/**
 * Versionamento do Gerador de Relatórios
 * 
 * IMPORTANTE: Incrementar a versão sempre que houver mudanças
 * no motor de geração de relatórios para rastreabilidade.
 * 
 * Formato: MAJOR.MINOR.PATCH
 * - MAJOR: Mudanças incompatíveis no formato do relatório
 * - MINOR: Novas funcionalidades de forma compatível
 * - PATCH: Correções de bugs
 */
export const REPORT_GENERATOR_VERSION = "1.0.0";

/**
 * Changelog de versões:
 * 
 * 1.0.0 (2025-01-15):
 *   - Implementação inicial do gerador dinâmico
 *   - Suporte a snapshot imutável
 *   - Rastreabilidade completa (evaluation_id, data, profissional)
 *   - Fallbacks clínicos ("não informado na avaliação")
 *   - Linha de lastro no topo do relatório
 */
