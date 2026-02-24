import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, FileText, AlertTriangle, HardDrive, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PdfHealthMetrics {
  totalPdfs: number;
  scanSuspectedCount: number;
  scanSuspectedPct: number;
  avgExtractedChars: number;
  avgChunksCreated: number;
  avgExtractionMs: number;
  topPapersByChunks: { paper_id: string; title: string; chunk_count: number }[];
}

export default function AcademyPdfHealthPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<PdfHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      // Fetch paper files
      const { data: files } = await supabase
        .from("academy_paper_files" as any)
        .select("id, paper_id, scan_suspected, size_bytes")
        .order("created_at", { ascending: false });

      const allFiles = (files || []) as any[];
      const totalPdfs = allFiles.length;
      const scanSuspectedCount = allFiles.filter((f: any) => f.scan_suspected).length;

      // Fetch extraction logs
      const { data: extractLogs } = await supabase
        .from("academy_ai_logs")
        .select("paper_id, output, duration_ms")
        .eq("action", "pdf_extract_index")
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(200);

      const logs = (extractLogs || []) as any[];
      let totalChars = 0;
      let totalChunks = 0;
      let totalMs = 0;
      let logCount = 0;

      const paperChunkMap = new Map<string, number>();

      for (const log of logs) {
        const output = log.output as any;
        if (output?.chars_indexed || output?.extracted_chars) {
          totalChars += output.chars_indexed || output.extracted_chars || 0;
        }
        if (output?.chunks_created) {
          totalChunks += output.chunks_created;
          const existing = paperChunkMap.get(log.paper_id) || 0;
          paperChunkMap.set(log.paper_id, Math.max(existing, output.chunks_created));
        }
        if (log.duration_ms) {
          totalMs += log.duration_ms;
        }
        logCount++;
      }

      // Get paper titles for top chunks
      const topEntries = Array.from(paperChunkMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const topPaperIds = topEntries.map(e => e[0]).filter(Boolean);
      let topPapersByChunks: { paper_id: string; title: string; chunk_count: number }[] = [];

      if (topPaperIds.length > 0) {
        const { data: papers } = await supabase
          .from("academy_papers")
          .select("id, title")
          .in("id", topPaperIds);

        const paperMap = new Map((papers || []).map(p => [p.id, p.title]));
        topPapersByChunks = topEntries.map(([pid, count]) => ({
          paper_id: pid,
          title: paperMap.get(pid) || "Título não encontrado",
          chunk_count: count,
        }));
      }

      setMetrics({
        totalPdfs,
        scanSuspectedCount,
        scanSuspectedPct: totalPdfs > 0 ? Math.round((scanSuspectedCount / totalPdfs) * 100) : 0,
        avgExtractedChars: logCount > 0 ? Math.round(totalChars / logCount) : 0,
        avgChunksCreated: logCount > 0 ? Math.round(totalChunks / logCount) : 0,
        avgExtractionMs: logCount > 0 ? Math.round(totalMs / logCount) : 0,
        topPapersByChunks,
      });
    } catch (err) {
      console.error("Error loading PDF health metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <div className="flex items-center gap-3">
              <HardDrive className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">PDF Health</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Observabilidade de PDFs indexados • Custo • Scan detection
            </p>
          </div>
          <Button variant="outline" onClick={loadMetrics}>
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : metrics ? (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KpiCard label="Total PDFs" value={metrics.totalPdfs} />
              <KpiCard
                label="Scan Suspected"
                value={`${metrics.scanSuspectedCount} (${metrics.scanSuspectedPct}%)`}
                variant={metrics.scanSuspectedPct > 30 ? "warning" : "default"}
              />
              <KpiCard label="Média Chars Extraídos" value={metrics.avgExtractedChars.toLocaleString()} />
              <KpiCard label="Média Chunks/Paper" value={metrics.avgChunksCreated} />
              <KpiCard label="Tempo Médio Extração" value={`${metrics.avgExtractionMs}ms`} />
            </div>

            {/* Top papers by chunks */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Top 10 Papers por Chunks (custo)
                </h3>
                {metrics.topPapersByChunks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>
                ) : (
                  <div className="space-y-2">
                    {metrics.topPapersByChunks.map((p, i) => (
                      <div key={p.paper_id} className="flex items-center justify-between p-2 rounded border border-border">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                          <span className="text-sm text-foreground truncate">{p.title}</span>
                        </div>
                        <Badge variant="outline" className="shrink-0 ml-2">
                          {p.chunk_count} chunks
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-16">Erro ao carregar métricas.</p>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, variant = "default" }: { label: string; value: string | number; variant?: "default" | "warning" }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${variant === "warning" ? "text-orange-400" : "text-foreground"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
