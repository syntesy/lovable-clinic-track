/**
 * Logger centralizado.
 * - Em desenvolvimento: todos os níveis são exibidos
 * - Em produção: apenas `error` é exibido (evita vazamento de informação)
 *
 * Uso:
 *   import { logger } from "@/lib/logger";
 *   logger.log("carregando paciente", patientId);
 *   logger.error("falha ao salvar", error);
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  /** Erros são sempre registrados — mesmo em produção */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
} as const;
