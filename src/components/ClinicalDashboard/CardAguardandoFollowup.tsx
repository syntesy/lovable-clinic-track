import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetricCard, MetricValue, StatRow } from "./MetricCard";
import { Card3Data } from "@/hooks/useClinicalDashboard";

interface Props {
  data?: Card3Data;
  isLoading?: boolean;
  onDetails?: () => void;
}

export function CardAguardandoFollowup({ data, isLoading, onDetails }: Props) {
  const overdue = data?.overdue ?? 0;

  return (
    <MetricCard
      title="Aguardando Follow-up"
      icon={Clock}
      iconClass="text-amber-500"
      isLoading={isLoading}
      onDetails={onDetails}
    >
      <div className="flex items-end gap-3">
        <MetricValue value={data?.total ?? 0} unit="pendentes" />
        {overdue > 0 && (
          <Badge variant="outline" className="mb-0.5 bg-red-500/10 text-red-500 border-red-500/20 text-xs">
            {overdue} em atraso
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1 mb-2">pós-tratamento (D90/D180/D365)</p>
      <StatRow label="3 meses (D90)"   value={data?.followup3m  ?? 0} />
      <StatRow label="6 meses (D180)"  value={data?.followup6m  ?? 0} />
      <StatRow label="12 meses (D365)" value={data?.followup12m ?? 0} />
    </MetricCard>
  );
}
