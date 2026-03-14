import { TrendingDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MetricCard, MetricValue, StatRow } from "./MetricCard";
import { Card7Data } from "@/hooks/useClinicalDashboard";
import { cn } from "@/lib/utils";

interface Props {
  data?: Card7Data;
  isLoading?: boolean;
}

export function CardSemResposta({ data, isLoading }: Props) {
  const rate = data?.nonResponseRate ?? null;
  const hasData = (data?.totalWithFollowup ?? 0) > 0;

  const rateClass = rate !== null && rate > 30 ? "text-red-500" : undefined;

  return (
    <MetricCard
      title="Taxa Sem Resposta"
      icon={TrendingDown}
      iconClass="text-red-500"
      isLoading={isLoading}
    >
      <div className="flex items-end gap-2">
        <MetricValue value={rate !== null ? rate : null} unit="%" className={cn(rateClass)} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground mb-1 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-52">
                Percentual de pacientes com redução &lt;30% na escala EVA. Sinaliza casos que podem precisar de reavaliação de protocolo.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {hasData ? (
        <>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            pacientes com EVA &lt;30% de melhora
          </p>
          <StatRow label="Com follow-up"     value={data?.totalWithFollowup ?? 0} />
          <StatRow
            label="Sem resposta"
            value={data?.nonResponders ?? 0}
            valueClass={rate !== null && rate > 30 ? "text-red-500" : undefined}
          />
        </>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">
          Dados insuficientes — registre baseline + follow-up nos prontuários.
        </p>
      )}
    </MetricCard>
  );
}
