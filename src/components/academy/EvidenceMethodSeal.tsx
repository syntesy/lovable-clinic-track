import { ShieldCheck } from "lucide-react";

/**
 * Institutional seal — read-only, shown only for published papers.
 * Text is hardcoded and must not be editable.
 */
export function EvidenceMethodSeal({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 select-none pointer-events-none ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-[11px] font-semibold tracking-wide text-primary whitespace-nowrap">
        RegHen Evidence Method™
      </span>
    </div>
  );
}
