import { TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MetricCard, MetricValue, StatRow } from "./MetricCard";
import { Card5Data } from "@/hooks/useClinicalDashboard";

interface Props {
  data?: Card5Data;
  isLoading?: boolean;
}

export function CardTaxaMelhora({ data, isLoading }: Props) {
  const rate = data?.improvementRate ?? null;
  const hasData = (data?.totalWithFollowup ?? 0) > 0;

  return (
    <MetricCard
      title="Taxa de Melhora"
      icon={TrendingUp}
      iconClass="text-emerald-500"
      isLoading={isLoading}
    >
      <div className="flex items-end gap-2">
        <MetricValue
          value={rate !== null ? rate : null}
          unit="%"
          className={rate !== null ? (rate >= 50 ? "text-emerald-500" : undefined) : undefined}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground mb-1 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-52">
                Percentual de pacientes com redução ≥50% na escala EVA entre baseline e follow-up (M3/M6/M12).
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {hasData ? (
        <>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            pacientes com EVA ≥50% de melhora
          </p>
          <StatRow label="Com follow-up" value={data?.totalWithFollowup ?? 0} />
          <StatRow label="Respondedores"  value={data?.responders ?? 0}        />
        </>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">
          Dados insuficientes — registre baseline + follow-up nos prontuários.
        </p>
      )}
    </MetricCard>
  );
}
