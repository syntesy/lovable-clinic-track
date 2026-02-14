/**
 * ResultsAnalyticsDashboard — Etapa 5: Página base para validação de integração.
 * Exibe JSON bruto da RPC get_results_analytics.
 */

import { useState } from "react";
import { useResultsAnalytics } from "@/hooks/useResultsAnalytics";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const now = new Date();
const twelveMonthsAgo = new Date(now);
twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

export default function ResultsAnalyticsDashboard() {
  const [trigger, setTrigger] = useState(0);

  const { data, loading, error, refetch } = useResultsAnalytics({
    start: twelveMonthsAgo.toISOString(),
    end: now.toISOString(),
    onlyCompleted: true,
    page: 1,
    pageSize: 25,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Análise de Resultados
        </h1>
        <p className="text-muted-foreground mt-1">
          Painel consolidado dos desfechos clínicos da sua prática, com filtros
          por procedimento, patologia e período.
        </p>
      </div>

      <Button onClick={() => refetch()} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Testar Consulta
      </Button>

      {loading && !data && (
        <p className="text-muted-foreground">Carregando...</p>
      )}

      {error && (
        <p className="text-destructive font-medium">Erro: {error}</p>
      )}

      {data && (
        <pre className="rounded-md border bg-muted p-4 text-xs overflow-auto max-h-[70vh] whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
