/**
 * Aviso Institucional de Curadoria
 * Exibido no marketplace de mentorias
 */

import { Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketplaceCurationNoticeProps {
  variant?: "default" | "compact";
  className?: string;
}

export function MarketplaceCurationNotice({
  variant = "default",
  className,
}: MarketplaceCurationNoticeProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          className
        )}
      >
        <Shield className="h-3.5 w-3.5 text-emerald-600" />
        <span>
          Mentores verificados por curadoria científica e institucional
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50",
        className
      )}
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
        <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Curadoria Científica REGEN
        </p>
        <p className="text-sm text-muted-foreground">
          Todos os mentores do REGEN Academy passam por curadoria científica e
          institucional. O selo "Mentor Verificado REGEN" indica conformidade
          com critérios técnicos, éticos e educacionais definidos pela
          plataforma.
        </p>
      </div>
    </div>
  );
}

// Versão para footer/rodapé
export function MarketplaceCurationFooter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground border-t",
        className
      )}
    >
      <Info className="h-3.5 w-3.5" />
      <span>
        Mentores selecionados por curadoria científica do REGEN Academy
      </span>
    </div>
  );
}

export default MarketplaceCurationNotice;
