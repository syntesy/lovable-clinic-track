import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, FileText, Brain, History, RefreshCw, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { PAPER_STATUS_LABELS } from "@/constants/academy-pipeline";
import type { Json } from "@/integrations/supabase/types";

interface PaperDetail {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  journal: string | null;
  doi: string | null;
  pmid: string | null;
  curation_status: string;
  abstract_text: string | null;
  warnings: string[] | null;
  error_code: string | null;
}

interface FulltextData {
  current_structured: any;
  char_count: number | null;
  word_count: number | null;
  extraction_method: string | null;
  has_sufficient_text: boolean | null;
}

interface CurationData {
  id: string;
  curation_json: any;
  nivel_evidencia: string | null;
  score_metodologico: number | null;
  risco_vies: string | null;
  paper_template: string;
  schema_version: number;
  validation_report: any;
  llm_input_hash: string | null;
  model: string | null;
  prompt_version: string | null;
  created_at: string;
}

interface IngestionAttempt {
  id: string;
  route_used: string;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
  job_id: string | null;
  retry_count: number;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  ingesting: "bg-blue-500/20 text-blue-300",
  curating: "bg-purple-500/20 text-purple-300",
  published: "bg-emerald-500/20 text-emerald-300",
  needs_input: "bg-amber-500/20 text-amber-300",
  needs_review: "bg-orange-500/20 text-orange-300",
  error: "bg-red-500/20 text-red-300",
  draft: "bg-muted text-muted-foreground",
  ready: "bg-teal-500/20 text-teal-300",
};

export default function AcademyPaperDetailPage() {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [fulltext, setFulltext] = useState<FulltextData | null>(null);
  const [curation, setCuration] = useState<CurationData | null>(null);
  const [attempts, setAttempts] = useState<IngestionAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!paperId) return;
    setLoading(true);

    const [paperRes, ftRes, curRes, attRes] = await Promise.all([
      supabase.from("academy_papers").select("id, title, authors, year, journal, doi, pmid, curation_status, abstract_text, warnings, error_code").eq("id", paperId).single(),
      supabase.from("academy_paper_fulltext").select("current_structured, char_count, word_count, extraction_method, has_sufficient_text").eq("paper_id", paperId).maybeSingle(),
      supabase.from("academy_paper_curation").select("id, curation_json, nivel_evidencia, score_metodologico, risco_vies, paper_template, schema_version, validation_report, llm_input_hash, model, prompt_version, created_at").eq("paper_id", paperId).maybeSingle(),
      supabase.from("academy_paper_ingestion").select("id, route_used, status, error_message, duration_ms, created_at, job_id, retry_count").eq("paper_id", paperId).order("created_at", { ascending: false }).limit(20),
    ]);

    if (paperRes.data) setPaper(paperRes.data as unknown as PaperDetail);
    if (ftRes.data) setFulltext(ftRes.data as unknown as FulltextData);
    if (curRes.data) setCuration(curRes.data as unknown as CurationData);
    if (attRes.data) setAttempts(attRes.data as unknown as IngestionAttempt[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [paperId]);

  const triggerAction = async (action: string) => {
    if (!paperId) return;
    setActionLoading(action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast.error("Sessão expirada"); return; }

      let fnName = "";
      const body: any = { paper_id: paperId, force: true };

      switch (action) {
        case "ingest": fnName = "academy-ingest-paper"; break;
        case "curate": fnName = "academy-curate-paper"; break;
        default: return;
      }

      const res = await supabase.functions.invoke(fnName, { body });
      if (res.error) throw res.error;
      toast.success(`${action === "ingest" ? "Ingestão" : "Curadoria"} disparada!`);
      setTimeout(fetchAll, 2000);
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Carregando...</div>;
  if (!paper) return <div className="py-12 text-center text-muted-foreground">Paper não encontrado</div>;

  const cs = fulltext?.current_structured as any;
  const cj = curation?.curation_json as any;
  const vr = curation?.validation_report as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="text-xl font-bold text-foreground">{paper.title}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            {paper.authors && <span>{paper.authors.slice(0, 80)}...</span>}
            {paper.year && <span>({paper.year})</span>}
            {paper.journal && <span>• {paper.journal}</span>}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={STATUS_BADGE_CLASS[paper.curation_status] || ""}>
              {PAPER_STATUS_LABELS[paper.curation_status as keyof typeof PAPER_STATUS_LABELS] || paper.curation_status}
            </Badge>
            {paper.doi && <Badge variant="outline">DOI: {paper.doi}</Badge>}
            {paper.pmid && <Badge variant="outline">PMID: {paper.pmid}</Badge>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="sm" onClick={() => triggerAction("ingest")} disabled={!!actionLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${actionLoading === "ingest" ? "animate-spin" : ""}`} /> Reprocessar ingest
          </Button>
          <Button size="sm" variant="secondary" onClick={() => triggerAction("curate")} disabled={!!actionLoading}>
            <Brain className={`h-4 w-4 mr-1 ${actionLoading === "curate" ? "animate-spin" : ""}`} /> Rodar curadoria
          </Button>
        </div>
      </div>

      {/* Warnings/Errors */}
      {paper.error_code && (
        <Card className="border-red-500/30">
          <CardContent className="py-3 flex items-center gap-2 text-red-300">
            <AlertTriangle className="h-4 w-4" /> {paper.error_code}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="fulltext">
        <TabsList>
          <TabsTrigger value="fulltext"><FileText className="h-4 w-4 mr-1" /> Full Text</TabsTrigger>
          <TabsTrigger value="curation"><Brain className="h-4 w-4 mr-1" /> Curadoria</TabsTrigger>
          <TabsTrigger value="audit"><History className="h-4 w-4 mr-1" /> Auditoria</TabsTrigger>
        </TabsList>

        {/* Full Text Tab */}
        <TabsContent value="fulltext" className="space-y-4">
          {cs ? (
            <>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Card><CardContent className="py-3"><span className="text-muted-foreground">Chars</span><p className="font-mono font-bold">{cs.char_count?.toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="py-3"><span className="text-muted-foreground">Words</span><p className="font-mono font-bold">{cs.word_count?.toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="py-3"><span className="text-muted-foreground">Source</span><p className="font-mono font-bold">{cs.source}</p></CardContent></Card>
              </div>
              {cs.quality_flags?.length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-amber-300">Quality flags: {cs.quality_flags.join(", ")}</span>
                </div>
              )}
              {["abstract", "introduction", "methods", "results", "discussion", "conclusion"].map((section) => (
                cs[section] ? (
                  <Card key={section}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm capitalize">{section}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {(cs[section] as string).slice(0, 3000)}
                      {(cs[section] as string).length > 3000 && "..."}
                    </CardContent>
                  </Card>
                ) : null
              ))}
            </>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum full text estruturado disponível</CardContent></Card>
          )}
        </TabsContent>

        {/* Curation Tab */}
        <TabsContent value="curation" className="space-y-4">
          {cj ? (
            <>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <Card><CardContent className="py-3"><span className="text-muted-foreground">Nível Evidência</span><p className="font-bold">{cj.nivel_evidencia || "—"}</p></CardContent></Card>
                <Card><CardContent className="py-3"><span className="text-muted-foreground">Score Metodológico</span><p className="font-bold">{cj.score_metodologico ?? "—"}/10</p></CardContent></Card>
                <Card><CardContent className="py-3"><span className="text-muted-foreground">Risco de Viés</span><p className="font-bold capitalize">{cj.risco_vies || "—"}</p></CardContent></Card>
                <Card><CardContent className="py-3"><span className="text-muted-foreground">Template</span><p className="font-bold text-xs">{curation?.paper_template}</p></CardContent></Card>
              </div>

              {/* Validation Report */}
              {vr && (
                <Card className={vr.hard_fails?.length > 0 ? "border-red-500/30" : "border-emerald-500/30"}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {vr.hard_fails?.length > 0 ? <AlertTriangle className="h-4 w-4 text-red-400" /> : <CheckCircle className="h-4 w-4 text-emerald-400" />}
                      Validação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    {vr.hard_fails?.map((f: string, i: number) => (
                      <div key={i} className="text-red-300">❌ {f}</div>
                    ))}
                    {vr.errors?.map((e: string, i: number) => (
                      <div key={i} className="text-amber-300">⚠️ {e}</div>
                    ))}
                    {vr.warnings?.map((w: string, i: number) => (
                      <div key={i} className="text-muted-foreground">ℹ️ {w}</div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Key fields */}
              <div className="grid grid-cols-2 gap-3">
                <Card><CardContent className="py-3"><span className="text-xs text-muted-foreground">Tipo de Estudo</span><p className="text-sm">{cj.tipo_estudo || "—"}</p></CardContent></Card>
                <Card><CardContent className="py-3"><span className="text-xs text-muted-foreground">Intervenção</span><p className="text-sm">{cj.intervencao || "—"}</p></CardContent></Card>
                <Card><CardContent className="py-3"><span className="text-xs text-muted-foreground">Comparador</span><p className="text-sm">{cj.comparador || "—"}</p></CardContent></Card>
                <Card><CardContent className="py-3"><span className="text-xs text-muted-foreground">Amostra Total</span><p className="text-sm">{cj.tamanho_amostra_total || "—"}</p></CardContent></Card>
              </div>

              {cj.resultados_principais && (
                <Card><CardContent className="py-3"><span className="text-xs text-muted-foreground">Resultados Principais</span><p className="text-sm mt-1">{cj.resultados_principais}</p></CardContent></Card>
              )}
              {cj.conclusao_pratica && (
                <Card><CardContent className="py-3"><span className="text-xs text-muted-foreground">Conclusão Prática</span><p className="text-sm mt-1">{cj.conclusao_pratica}</p></CardContent></Card>
              )}

              {/* Outcomes */}
              {cj.outcomes?.length > 0 && (
                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-sm">Outcomes ({cj.outcomes.length})</CardTitle></CardHeader>
                  <CardContent className="text-xs space-y-2">
                    {cj.outcomes.map((o: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{o.domain}</Badge>
                        <span>{o.name}</span>
                        <Badge variant={o.direction === "favorable" ? "default" : "secondary"} className="text-[10px]">{o.direction}</Badge>
                        <span className="text-muted-foreground">{o.timeframe}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Meta */}
              <div className="text-xs text-muted-foreground flex items-center gap-4">
                <span>Model: {curation?.model}</span>
                <span>Prompt: {curation?.prompt_version}</span>
                <span>Schema: v{curation?.schema_version}</span>
                <span>Hash: {curation?.llm_input_hash?.slice(0, 12)}...</span>
              </div>
            </>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma curadoria disponível</CardContent></Card>
          )}
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-3">
          {attempts.length > 0 ? attempts.map((a) => (
            <Card key={a.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "success" ? "default" : a.status === "fail" ? "destructive" : "secondary"}>
                      {a.status}
                    </Badge>
                    <span className="font-mono text-sm">{a.route_used}</span>
                    {a.job_id && <Badge variant="outline" className="text-[10px]">job: {a.job_id.slice(0, 8)}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    {a.duration_ms && <span>{a.duration_ms}ms</span>}
                    <span>retries: {a.retry_count}</span>
                    <span>{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
                {a.error_message && <p className="text-xs text-red-300 mt-1">{a.error_message}</p>}
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma tentativa registrada</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
