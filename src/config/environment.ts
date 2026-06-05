// Environment detection — single source of truth for env checks.
// Policy: fail-closed. Unknown or missing VITE_APP_ENV = production (QA blocked).
// Valid values: 'development' | 'staging'

const APP_ENV = import.meta.env.VITE_APP_ENV as string | undefined;

const QA_ENVS = new Set(['development', 'staging']);

export function isProductionEnv(): boolean {
  return !QA_ENVS.has(APP_ENV ?? '');
}

export function areQAToolsEnabled(): boolean {
  return QA_ENVS.has(APP_ENV ?? '');
}
