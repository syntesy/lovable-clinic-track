import { FlaskConical } from "lucide-react";
import { MetricCard, MetricValue } from "./MetricCard";
import { Card4Data } from "@/hooks/useClinicalDashboard";

interface Props {
  data?: Card4Data;
  isLoading?: boolean;
}

export function CardProcedimentos({ data, isLoading }: Props) {
  const total = data?.total ?? 0;

  return (
    <MetricCard title="Procedimentos Realizados" icon={FlaskConical} iconClass="text-violet-500" isLoading={isLoading}>
      <MetricValue value={total} unit="procedimentos" />
      <p className="text-xs text-muted-foreground mt-1 mb-3">no período selecionado</p>

      {data?.byType && data.byType.length > 0 ? (
        <div className="space-y-1.5">
          {data.byType.map(({ type, count }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={type} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground font-medium">{type}</span>
                  <span className="text-muted-foreground tabular-nums">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum procedimento no período</p>
      )}
    </MetricCard>
  );
}
