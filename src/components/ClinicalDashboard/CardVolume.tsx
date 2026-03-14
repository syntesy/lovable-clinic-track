import { Users } from "lucide-react";
import { MetricCard, MetricValue, StatRow } from "./MetricCard";
import { Card1Data } from "@/hooks/useClinicalDashboard";

interface Props {
  data?: Card1Data;
  isLoading?: boolean;
}

export function CardVolume({ data, isLoading }: Props) {
  return (
    <MetricCard title="Pacientes Atendidos" icon={Users} iconClass="text-blue-500" isLoading={isLoading}>
      <MetricValue value={data?.uniquePatients ?? 0} unit="pacientes" />
      <p className="text-xs text-muted-foreground mt-1 mb-2">no período selecionado</p>
      <StatRow label="Avaliações" value={data?.consultations ?? 0} />
      <StatRow label="Procedimentos" value={data?.procedures ?? 0} />
    </MetricCard>
  );
}
