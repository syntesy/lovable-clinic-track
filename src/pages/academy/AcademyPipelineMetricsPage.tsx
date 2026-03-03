import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart3, Clock, DollarSign, FileText, Activity } from "lucide-react";
import { toast } from "sonner";

interface Metrics {
  totalPapers: number;
  byStatus: Record<string, number>;
  routeDistribution: Record<string, number>;
  avgIngestDuration: number;
  avgCurateDuration: number;
  totalLlmCost: number;
  topReviewReasons: { reason: string; count: number }[];
  publishedPct: number;
  needsReviewPct: number;
  pmcXmlPct: number;
  pdfGrobidPct: number;
}

export default function AcademyPipelineMetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Parallel queries
      const [papersRes, ingestionRes, curationRes, reviewRes, aiLogsRes] = await Promise.all([
        supabase.from("academy_papers").select("id, curation_status").is("deleted_at", null),
        supabase.from("academy_paper_ingestion").select("route_used, duration_ms, status"),
        supabase.from("academy_paper_curation").select("id, cost_estimate_usd, created_at"),
        supabase.from("academy_review_task").select("reason, status").eq("status", "open"),
        supabase.from("academy_ai_logs").select("action, duration_ms, status").in("action", ["auto_curation", "ingest_paper"]),
      ]);

      const papers = papersRes.data || [];
      const ingestion = ingestionRes.data || [];
      const curation = curationRes.data || [];
      const reviews = reviewRes.data || [];
      const aiLogs = aiLogsRes.data || [];

      // Status distribution
      const byStatus: Record<string, number> = {};
      papers.forEach(p => { byStatus[p.curation_status] = (byStatus[p.curation_status] || 0) + 1; });

      // Route distribution
      const routeDistribution: Record<string, number> = {};
      const successIngestion = ingestion.filter(i => i.status === "success");
      successIngestion.forEach(i => { routeDistribution[i.route_used] = (routeDistribution[i.route_used] || 0) + 1; });

      // Avg durations
      const ingestLogs = aiLogs.filter(l => l.action === "ingest_paper" && l.status === "success" && l.duration_ms);
      const curateLogs = aiLogs.filter(l => l.action === "auto_curation" && l.status === "success" && l.duration_ms);
      const avgIngestDuration = ingestLogs.length > 0
        ? Math.round(ingestLogs.reduce((s, l) => s + (l.duration_ms || 0), 0) / ingestLogs.length)
        : 0;
      const avgCurateDuration = curateLogs.length > 0
        ? Math.round(curateLogs.reduce((s, l) => s + (l.duration_ms || 0), 0) / curateLogs.length)
        : 0;

      // LLM cost
      const totalLlmCost = curation.reduce((s, c) => s + (c.cost_estimate_usd || 0), 0);

      // Top review reasons
      const reasonCounts: Record<string, number> = {};
      reviews.forEach(r => { reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1; });
      const topReviewReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const total = papers.length || 1;
      const publishedCount = byStatus["published"] || 0;
      const needsReviewCount = byStatus["needs_review"] || 0;
      const pmcCount = routeDistribution["pmc_xml"] || 0;
      const pdfCount = routeDistribution["pdf_grobid"] || 0;
      const routeTotal = pmcCount + pdfCount || 1;

      setMetrics({
        totalPapers: papers.length,
        byStatus,
        routeDistribution,
        avgIngestDuration,
        avgCurateDuration,
        totalLlmCost,
        topReviewReasons,
        publishedPct: Math.round((publishedCount / total) * 100),
        needsReviewPct: Math.round((needsReviewCount / total) * 100),
        pmcXmlPct: Math.round((pmcCount / routeTotal) * 100),
        pdfGrobidPct: Math.round((pdfCount / routeTotal) * 100),
      });
    } catch (e: any) {
      toast.error("Erro ao carregar métricas");
    }
    setLoading(false);
  };

  useEffect(() => { fetchMetrics(); }, []);

  if (loading) return <div className="py-12 text-center text-muted-foreground">Carregando métricas...</div>;
  if (!metrics) return <div className="py-12 text-center text-muted-foreground">Erro ao carregar</div>;

  const STATUS_LABELS: Record<string, string> = {
    ingesting: "Ingestão", draft: "Rascunho", curating: "Curadoria", published: "Publicado",
    needs_review: "Revisão", needs_input: "Aguardando input", error: "Erro", ready: "Pronto",
    rejected: "Rejeitado", archived: "Arquivado",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Métricas do Pipeline</h1>
          <p className="text-muted-foreground text-sm">Observabilidade operacional da biblioteca científica</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMetrics}>
          <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileText className="h-4 w-4" /> Total Papers
            </div>
            <p className="text-3xl font-bold text-foreground">{metrics.totalPapers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-4 w-4" /> % Publicados
            </div>
            <p className="text-3xl font-bold text-emerald-400">{metrics.publishedPct}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-4 w-4" /> Avg Ingest
            </div>
            <p className="text-3xl font-bold text-foreground">{(metrics.avgIngestDuration / 1000).toFixed(1)}s</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-4 w-4" /> Avg Curate
            </div>
            <p className="text-3xl font-bold text-foreground">{(metrics.avgCurateDuration / 1000).toFixed(1)}s</p>
          </CardContent>
        </Card>
      </div>

      {/* Route & Status distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(metrics.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{STATUS_LABELS[status] || status}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-primary/20 rounded-full w-24 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.round((count / metrics.totalPapers) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Distribuição por Rota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">PMC XML</span>
              <span className="font-bold text-foreground">{metrics.pmcXmlPct}% ({metrics.routeDistribution["pmc_xml"] || 0})</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">PDF Extract</span>
              <span className="font-bold text-foreground">{metrics.pdfGrobidPct}% ({metrics.routeDistribution["pdf_grobid"] || 0})</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">PubMed</span>
              <span className="font-bold text-foreground">{metrics.routeDistribution["pubmed"] || 0}</span>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Custo LLM total
                </span>
                <span className="font-bold text-foreground">${metrics.totalLlmCost.toFixed(4)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Review Reasons */}
      {metrics.topReviewReasons.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Top Razões de Revisão (abertos)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.topReviewReasons.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <Badge variant="outline">{r.reason}</Badge>
                <span className="font-mono text-foreground">{r.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
