/**
 * Utility for validating method_run.required_fields completeness.
 *
 * required_fields is an array of dot-paths (e.g. "system.system_type")
 * pointing into the method_run JSON object.
 */

// Human-readable labels for known paths
const PATH_LABELS: Record<string, string> = {
  "system.system_type": "Sistema (aberto/fechado/misto)",
  "system.sterility_standard": "Padrão de esterilidade",
  "device_kit.brand": "Kit (marca)",
  "device_kit.model": "Kit (modelo)",
  "device_kit.type": "Kit (tipo)",
  "technique.guidance": "Guia de técnica",
  "technique.approach": "Abordagem",
};

/** Resolve a dot-path on a plain object. */
export function getValueByPath(obj: Record<string, any> | null | undefined, path: string): unknown {
  if (!obj) return undefined;
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

/** Check whether a single value counts as "filled". */
export function isFieldFilled(
  value: unknown,
  opts?: { requiresCollPrep?: boolean; path?: string },
): boolean {
  if (value === null || value === undefined) return false;

  // Special rule: system_type must be OPEN/CLOSED/MIXED when collection/prep required
  if (opts?.path === "system.system_type" && opts?.requiresCollPrep) {
    return typeof value === "string" && ["OPEN", "CLOSED", "MIXED"].includes(value);
  }

  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "boolean") return true; // booleans are always "filled"
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

export interface MissingField {
  path: string;
  label: string;
}

/**
 * Return the list of required_fields paths that are NOT yet filled.
 * Returns empty array when there are no required_fields or everything is filled.
 */
export function getMissingRequiredFields(
  methodRun: Record<string, any> | null | undefined,
): MissingField[] {
  if (!methodRun) return [];
  const requiredFields: string[] = methodRun.required_fields ?? [];
  if (!Array.isArray(requiredFields) || requiredFields.length === 0) return [];

  const requiresCollPrep = methodRun.meta?.requires_collection_or_prep === true;

  const missing: MissingField[] = [];

  for (const path of requiredFields) {
    const value = getValueByPath(methodRun, path);
    if (!isFieldFilled(value, { requiresCollPrep, path })) {
      missing.push({
        path,
        label: PATH_LABELS[path] ?? formatPath(path),
      });
    }
  }

  return missing;
}

/** Fallback label: "system.system_type" → "System type" */
function formatPath(path: string): string {
  const last = path.split(".").pop() || path;
  return last
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
