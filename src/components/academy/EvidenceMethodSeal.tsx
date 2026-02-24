import { ShieldCheck } from "lucide-react";

const SEAL_TEXT = "Reghen Evidence Method™";

/**
 * Institutional seal — read-only, shown only for published papers.
 * Text is hardcoded and must not be editable.
 */
export function EvidenceMethodSeal({
  className = "",
  size = "sm",
  visible = true,
}: {
  className?: string;
  size?: "sm" | "md";
  visible?: boolean;
}) {
  if (!visible) return null;

  const iconSize = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  const textSize = size === "md" ? "text-xs" : "text-[11px]";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 select-none pointer-events-none ${className}`}
    >
      <ShieldCheck className={`${iconSize} text-primary shrink-0`} />
      <span className={`${textSize} font-semibold tracking-wide text-primary whitespace-nowrap`}>
        {SEAL_TEXT}
      </span>
    </div>
  );
}

/** Plain text version for exports (clipboard/PDF). */
export const EVIDENCE_METHOD_SEAL_TEXT = SEAL_TEXT;
