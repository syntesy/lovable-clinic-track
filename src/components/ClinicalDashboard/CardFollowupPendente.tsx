import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetricCard, MetricValue, StatRow } from "./MetricCard";
import { Card8Data } from "@/hooks/useClinicalDashboard";

interface Props {
  data?: Card8Data;
  isLoading?: boolean;
  onDetails?: () => void;
}

export function CardFollowupPendente({ data, isLoading, onDetails }: Props) {
  const due   = data?.pendingDue   ?? 0;
  const total = data?.pendingTotal ?? 0;
  const rate  = data?.pendingRate  ?? null;

  return (
    <MetricCard
      title="Follow-up Pendente"
      icon={Bell}
      iconClass={due > 0 ? "text-amber-500" : "text-muted-foreground"}
      isLoading={isLoading}
      onDetails={onDetails}
    >
      <div className="flex items-end gap-3">
        <MetricValue value={due} unit="em atraso" />
        {due > 0 && (
          <Badge variant="outline" className="mb-0.5 bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">
            atenção
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1 mb-2">
        follow-ups com data passada ainda pendentes
      </p>
      <StatRow label="Total agendados" value={total} />
      {rate !== null && (
        <StatRow
          label="Taxa de atraso"
          value={`${rate}%`}
          valueClass={rate > 20 ? "text-amber-500" : undefined}
        />
      )}
    </MetricCard>
  );
}
