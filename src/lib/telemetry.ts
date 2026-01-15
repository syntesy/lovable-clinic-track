/**
 * Lightweight telemetry utility for critical flow logging.
 * 
 * SECURITY: Never log PHI (patient data, clinical text, names).
 * Only log IDs, event names, error codes.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface TelemetryMeta {
  attendanceId?: string;
  recordId?: string;
  patientId?: string;
  code?: string;
  message?: string;
  [key: string]: string | number | boolean | undefined;
}

const PREFIX = '[telemetry]';

function sanitizeMessage(msg: string | undefined): string | undefined {
  if (!msg) return undefined;
  // Truncate and remove potential PHI patterns
  return msg.slice(0, 100).replace(/[A-Za-z]{2,}\s+[A-Za-z]{2,}/g, '[REDACTED]');
}

function formatLog(event: string, meta?: TelemetryMeta): [string, TelemetryMeta | undefined] {
  const safeMeta = meta ? {
    ...meta,
    message: meta.message ? sanitizeMessage(meta.message) : undefined,
  } : undefined;
  return [`${PREFIX} ${event}`, safeMeta];
}

export function logInfo(event: string, meta?: TelemetryMeta): void {
  const [msg, safeMeta] = formatLog(event, meta);
  if (safeMeta) {
    console.info(msg, safeMeta);
  } else {
    console.info(msg);
  }
}

export function logWarn(event: string, meta?: TelemetryMeta): void {
  const [msg, safeMeta] = formatLog(event, meta);
  if (safeMeta) {
    console.warn(msg, safeMeta);
  } else {
    console.warn(msg);
  }
}

export function logError(event: string, meta?: TelemetryMeta): void {
  const [msg, safeMeta] = formatLog(event, meta);
  if (safeMeta) {
    console.error(msg, safeMeta);
  } else {
    console.error(msg);
  }
}
