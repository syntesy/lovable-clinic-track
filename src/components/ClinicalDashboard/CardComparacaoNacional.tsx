import { Globe, Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "./MetricCard";
import { Card6Data } from "@/hooks/useClinicalDashboard";

interface Props {
  data?: Card6Data;
  isLoading?: boolean;
}

export function CardComparacaoNacional({ data, isLoading }: Props) {
  const prof = data?.professionalRate ?? null;
  const nat  = data?.nationalRate    ?? null;
  const hasEnough = data?.hasEnoughData ?? false;

  const delta = prof !== null && nat !== null ? prof - nat : null;

  function DeltaIcon() {
    if (delta === null) return null;
    if (delta > 3)  return <TrendingUp  className="h-4 w-4 text-emerald-500" />;
    if (delta < -3) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }

  function deltaColor() {
    if (delta === null) return "text-muted-foreground";
    if (delta > 3)  return "text-emerald-500";
    if (delta < -3) return "text-red-500";
    return "text-muted-foreground";
  }

  return (
    <MetricCard title="vs. Média Nacional" icon={Globe} iconClass="text-sky-500" isLoading={isLoading}>
      {!hasEnough ? (
        <div className="flex flex-col items-start gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Dados insuficientes</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Necessário mínimo de {data?.minCasesRequired ?? 10} casos com follow-up para comparar.
          </p>
        </div>
      ) : (
        <>
          {/* Professional rate */}
          <div className="flex items-end gap-2 mb-1">
            <span className="text-3xl font-bold text-foreground leading-none">
              {prof ?? "—"}
            </span>
            <span className="text-sm text-muted-foreground mb-0.5">% (você)</span>
            <div className="flex items-center gap-1 mb-0.5">
              <DeltaIcon />
              {delta !== null && (
                <span className={`text-sm font-semibold ${deltaColor()}`}>
                  {delta > 0 ? "+" : ""}{delta}%
                </span>
              )}
            </div>
          </div>

          {/* National rate */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-muted-foreground">Média nacional:</span>
            <span className="text-sm font-medium">{nat ?? "—"}%</span>
          </div>

          <div className="mt-3">
            {delta !== null && delta > 3 && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                Acima da média
              </Badge>
            )}
            {delta !== null && delta < -3 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                Abaixo da média
              </Badge>
            )}
            {delta !== null && delta >= -3 && delta <= 3 && (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                Dentro da média
              </Badge>
            )}
          </div>
        </>
      )}
    </MetricCard>
  );
}
