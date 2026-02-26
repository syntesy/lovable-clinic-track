import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, RefreshCw, RotateCcw, Sparkles, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PipelinePaper {
  id: string;
  title: string;
  curation_status: string;
  created_at: string;
  file?: {
    id: string;
    processing_status: string;
    processing_error: string | null;
    size_bytes: number | null;
    file_name: string;
    request_id: string | null;
  };
  fulltext?: {
    char_count: number | null;
    word_count: number | null;
    chunk_count: number | null;
    extraction_method: string | null;
    abstract_source: string | null;
    abstract_char_count: number | null;
    has_sufficient_text: boolean | null;
    is_scanned: boolean | null;
  };
  curation?: {
    nivel_evidencia: string | null;
    score_metodologico: number | null;
    risco_vies: string | null;
    request_id: string | null;
  };
}

interface PipelineLog {
  id: string;
  action: string;
  status: string;
  request_id: string | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  output: any;
  input: any;
}

export default function AcademyPipelineHealthPage() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<PipelinePaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [recuratingId, setRecuratingId] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => { loadPapers(); }, []);

  const loadPapers = async () => {
    setIsLoading(true);
    try {
      const { data: papersData } = await supabase
        .from("academy_papers")
        .select("id, title, curation_status, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!papersData || papersData.length === 0) {
        setPapers([]);
        return;
      }

      const paperIds = papersData.map(p => p.id);

      const [filesRes, fulltextRes, curationRes] = await Promise.all([
        supabase.from("academy_paper_files" as any).select("id, paper_id, processing_status, processing_error, size_bytes, file_name, request_id").in("paper_id", paperIds),
        supabase.from("academy_paper_fulltext" as any).select("paper_id, char_count, word_count, chunk_count, extraction_method, abstract_source, abstract_char_count, has_sufficient_text, is_scanned").in("paper_id", paperIds),
        supabase.from("academy_paper_curation").select("paper_id, nivel_evidencia, score_metodologico, risco_vies, request_id").in("paper_id", paperIds),
      ]);

      const filesMap = new Map<string, any>();
      ((filesRes.data || []) as any[]).forEach((f: any) => {
        if (!filesMap.has(f.paper_id) || f.created_at > filesMap.get(f.paper_id).created_at) {
          filesMap.set(f.paper_id, f);
        }
      });

      const fulltextMap = new Map<string, any>();
      ((fulltextRes.data || []) as any[]).forEach((f: any) => fulltextMap.set(f.paper_id, f));

      const curationMap = new Map<string, any>();
      ((curationRes.data || []) as any[]).forEach((c: any) => curationMap.set(c.paper_id, c));

      const result: PipelinePaper[] = papersData.map(p => ({
        id: p.id,
        title: p.title,
        curation_status: p.curation_status,
        created_at: p.created_at,
        file: filesMap.get(p.id) || undefined,
        fulltext: fulltextMap.get(p.id) || undefined,
        curation: curationMap.get(p.id) || undefined,
      }));

      setPapers(result);
    } catch (err) {
      console.error("Error loading pipeline papers:", err);
      toast.error("Erro ao carregar dados do pipeline.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async (paperId: string) => {
    if (expandedLogs === paperId) {
      setExpandedLogs(null);
      return;
    }
    setExpandedLogs(paperId);
    setLogsLoading(true);
    try {
      const { data } = await supabase
        .from("academy_ai_logs")
        .select("id, action, status, request_id, duration_ms, error_message, created_at, output, input")
        .eq("paper_id", paperId)
        .order("created_at", { ascending: false })
        .limit(10);
      setLogs((data || []) as PipelineLog[]);
    } catch {
      toast.error("Erro ao carregar logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleReprocess = async (paperId: string) => {
    setReprocessingId(paperId);
    try {
      toast.info("Reprocessando PDF...");
      const { data, error } = await supabase.functions.invoke("academy-extract-pdf-text", {
        body: { paper_id: paperId, force: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Reprocessado: ${data.chunks_created} chunks, ${data.chars_extracted} chars`);
      await loadPapers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao reprocessar.");
    } finally {
      setReprocessingId(null);
    }
  };

  const handleRecurate = async (paperId: string) => {
    setRecuratingId(paperId);
    try {
      toast.info("Regenerando curadoria...");
      const { data, error } = await supabase.functions.invoke("academy-curate-paper", {
        body: { paper_id: paperId, force: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Curadoria regenerada: ${data.nivel_evidencia}, score ${data.score_metodologico}`);
      await loadPapers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao regerar curadoria.");
    } finally {
      setRecuratingId(null);
    }
  };

  const statusBadge = (status: string, type: "processing" | "curation") => {
    const colors: Record<string, string> = {
      queued: "bg-muted text-muted-foreground",
      processing: "bg-blue-500/20 text-blue-400",
      processed: "bg-emerald-500/20 text-emerald-400",
      failed: "bg-destructive/20 text-destructive",
      draft: "bg-muted text-muted-foreground",
      pending: "bg-muted text-muted-foreground",
      curating: "bg-purple-500/20 text-purple-400",
      ready: "bg-emerald-500/20 text-emerald-400",
      published: "bg-primary/20 text-primary",
    };
    return <Badge variant="outline" className={`${colors[status] || "bg-muted text-muted-foreground"} text-[10px]`}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Pipeline Health</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Observabilidade completa · Extração · Curadoria · Logs
            </p>
          </div>
          <Button variant="outline" onClick={loadPapers} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : papers.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Nenhum paper encontrado.</p>
        ) : (
          <div className="space-y-3">
            {papers.map(p => (
              <Collapsible key={p.id}>
                <Card>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground line-clamp-1">{p.title}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {p.file && statusBadge(p.file.processing_status, "processing")}
                          {statusBadge(p.curation_status, "curation")}
                          {p.fulltext && (
                            <>
                              <Badge variant="outline" className="text-[10px]">{(p.fulltext.char_count || 0).toLocaleString()} chars</Badge>
                              <Badge variant="outline" className="text-[10px]">{p.fulltext.word_count || 0} words</Badge>
                              <Badge variant="outline" className="text-[10px]">{p.fulltext.chunk_count || 0} chunks</Badge>
                              <Badge variant="outline" className="text-[10px]">{p.fulltext.extraction_method || "—"}</Badge>
                              {p.fulltext.abstract_source && p.fulltext.abstract_source !== "none" && (
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400">abstract: {p.fulltext.abstract_source} ({p.fulltext.abstract_char_count})</Badge>
                              )}
                              {p.fulltext.is_scanned && (
                                <Badge variant="outline" className="text-[10px] bg-orange-500/20 text-orange-400">scan suspected</Badge>
                              )}
                            </>
                          )}
                          {!p.fulltext && !p.file && (
                            <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">sem PDF</Badge>
                          )}
                          {p.curation && (
                            <>
                              <Badge variant="outline" className="text-[10px]">{p.curation.nivel_evidencia || "—"}</Badge>
                              <Badge variant="outline" className="text-[10px]">score: {p.curation.score_metodologico ?? "—"}</Badge>
                              <Badge variant="outline" className="text-[10px]">{p.curation.risco_vies || "—"}</Badge>
                            </>
                          )}
                        </div>
                        {/* Error display */}
                        {p.file?.processing_error && (
                          <p className="text-[11px] text-destructive mt-1 line-clamp-2">{p.file.processing_error}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 items-start">
                        {p.file && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReprocess(p.id)}
                            disabled={reprocessingId === p.id}
                            className="gap-1 text-xs h-7"
                          >
                            {reprocessingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                            PDF
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRecurate(p.id)}
                          disabled={recuratingId === p.id}
                          className="gap-1 text-xs h-7"
                        >
                          {recuratingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Curar
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadLogs(p.id)}
                            className="text-xs h-7 px-2"
                          >
                            {expandedLogs === p.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    {/* Collapsible logs */}
                    {expandedLogs === p.id && (
                      <CollapsibleContent>
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-[11px] font-medium text-muted-foreground mb-2">
                            request_id: {p.file?.request_id || p.curation?.request_id || "—"}
                          </p>
                          {logsLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : logs.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nenhum log encontrado.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                              {logs.map(log => (
                                <div key={log.id} className="text-[11px] p-2 rounded bg-muted/50 border border-border">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                                    <Badge variant="outline" className={`text-[9px] ${log.status === "success" ? "text-emerald-400" : "text-destructive"}`}>
                                      {log.status}
                                    </Badge>
                                    <span className="text-foreground font-medium">{log.action}</span>
                                    {log.duration_ms && <span className="text-muted-foreground">{log.duration_ms}ms</span>}
                                    {log.request_id && <span className="font-mono text-muted-foreground text-[9px]">{log.request_id}</span>}
                                  </div>
                                  {log.error_message && (
                                    <p className="text-destructive mt-1">{log.error_message}</p>
                                  )}
                                  {log.output && (
                                    <details className="mt-1">
                                      <summary className="text-muted-foreground cursor-pointer">output</summary>
                                      <pre className="text-[10px] text-muted-foreground mt-1 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(log.output, null, 2)}</pre>
                                    </details>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    )}
                  </CardContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
