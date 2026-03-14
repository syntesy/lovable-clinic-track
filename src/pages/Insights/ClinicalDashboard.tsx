/**
 * Dashboard Clínico – Ortobiológicos
 *
 * Camada 1 — Operacional: volume, tratamento ativo, follow-up, procedimentos
 * Camada 2 — Resultados Clínicos: melhora EVA, comparação nacional, sem-resposta, follow-up pendente
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import {
  DashboardPeriod,
  DateRange,
  periodToDateRange,
  useClinicalDashboard,
} from "@/hooks/useClinicalDashboard";

import { PeriodFilter }           from "@/components/ClinicalDashboard/PeriodFilter";
import { CardVolume }              from "@/components/ClinicalDashboard/CardVolume";
import { CardTratamentoAtivo }     from "@/components/ClinicalDashboard/CardTratamentoAtivo";
import { CardAguardandoFollowup }  from "@/components/ClinicalDashboard/CardAguardandoFollowup";
import { CardProcedimentos }       from "@/components/ClinicalDashboard/CardProcedimentos";
import { CardTaxaMelhora }         from "@/components/ClinicalDashboard/CardTaxaMelhora";
import { CardComparacaoNacional }  from "@/components/ClinicalDashboard/CardComparacaoNacional";
import { CardSemResposta }         from "@/components/ClinicalDashboard/CardSemResposta";
import { CardFollowupPendente }    from "@/components/ClinicalDashboard/CardFollowupPendente";

export default function ClinicalDashboard() {
  const [period, setPeriod]           = useState<DashboardPeriod>("30d");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const dateRange = periodToDateRange(period, customRange);

  const queryClient = useQueryClient();
  const { data, isLoading } = useClinicalDashboard(dateRange);

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["clinical-dashboard"] });
  }

  function handlePeriodChange(p: DashboardPeriod) {
    setPeriod(p);
    if (p !== "custom") setCustomRange(undefined);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            Dashboard Clínico
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ortobiológicos — métricas operacionais e resultados clínicos
          </p>
        </div>

        <PeriodFilter
          period={period}
          onPeriodChange={handlePeriodChange}
          onCustomRangeChange={(range) => {
            setCustomRange(range);
            setPeriod("custom");
          }}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      </div>

      {/* ── Camada 1: Operacional ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Camada Operacional
          </h2>
          <Separator className="mt-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <CardVolume             data={data?.card1} isLoading={isLoading} />
          <CardTratamentoAtivo    data={data?.card2} isLoading={isLoading} />
          <CardAguardandoFollowup data={data?.card3} isLoading={isLoading} />
          <CardProcedimentos      data={data?.card4} isLoading={isLoading} />
        </div>
      </section>

      {/* ── Camada 2: Resultados Clínicos ── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resultados Clínicos
          </h2>
          <Separator className="mt-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <CardTaxaMelhora        data={data?.card5} isLoading={isLoading} />
          <CardComparacaoNacional data={data?.card6} isLoading={isLoading} />
          <CardSemResposta        data={data?.card7} isLoading={isLoading} />
          <CardFollowupPendente   data={data?.card8} isLoading={isLoading} />
        </div>
      </section>
    </div>
  );
}
