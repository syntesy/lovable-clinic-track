import { Activity } from "lucide-react";
import { MetricCard, MetricValue } from "./MetricCard";
import { Card2Data } from "@/hooks/useClinicalDashboard";

interface Props {
  data?: Card2Data;
  isLoading?: boolean;
}

export function CardTratamentoAtivo({ data, isLoading }: Props) {
  return (
    <MetricCard title="Em Tratamento Ativo" icon={Activity} iconClass="text-emerald-500" isLoading={isLoading}>
      <MetricValue value={data?.activeTreatment ?? 0} unit="pacientes" />
      <p className="text-xs text-muted-foreground mt-1">
        com follow-up D7 ou D30 pendente
      </p>
    </MetricCard>
  );
}
