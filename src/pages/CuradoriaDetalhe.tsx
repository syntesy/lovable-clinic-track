import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { CuradoriaArticle, statusConfig, interestColors, CuradoriaStatus } from "@/types/curadoria";
import { Curation, CurationStatus } from "@/types/curation";
import { CuradoriaStatusBadge } from "@/components/curadoria/CuradoriaStatusBadge";
import { ScientificCurationCard, exampleCurationData } from "@/components/curadoria/ScientificCurationCard";
import { CurationGovernanceBadge } from "@/components/curadoria/CurationGovernanceBadge";
import { CurationEvidenceSection } from "@/components/curadoria/CurationEvidenceSection";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  AlertTriangle,
  Bot,
  Loader2,
  Settings,
  ShieldCheck
} from "lucide-react";

interface CurationJob {
  id: string;
  article_id: string;
  curation_id: string | null;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export default function CuradoriaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<CuradoriaArticle | null>(null);
  const [structuredCuration, setStructuredCuration] = useState<Curation | null>(null);
  const [activeJob, setActiveJob] = useState<CurationJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfChecked, setPdfChecked] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    try {
      // Fetch article
      const { data: articleData, error: articleError } = await supabase
        .from("curadoria_articles")
        .select("*")
        .eq("id", id)
        .single();

      if (articleError) throw articleError;
      
      const typedArticle: CuradoriaArticle = {
        ...articleData,
        status: articleData.status as CuradoriaStatus,
        interest: articleData.interest as CuradoriaArticle['interest']
      };
      setArticle(typedArticle);

      // Fetch latest curation
      const { data: curationData } = await supabase
        .from("curations")
        .select("*")
        .eq("article_id", id)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (curationData) {
        setStructuredCuration({
          ...curationData,
          status: curationData.status as CurationStatus,
          evidence_level: curationData.evidence_level as Curation['evidence_level'],
          bias_risk: curationData.bias_risk as Curation['bias_risk'],
          applicability: curationData.applicability as Curation['applicability'],
          citations: (curationData.citations as Curation['citations']) || []
        });
      }

      // Fetch active job
      const { data: jobData } = await supabase
        .from("curation_jobs")
        .select("*")
        .eq("article_id", id)
        .in("status", ["queued", "running"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (jobData) {
        setActiveJob(jobData as CurationJob);
      } else {
        setActiveJob(null);
      }

      // Check if admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        setIsAdmin(!!roleData);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check PDF availability when user opens original
  useEffect(() => {
    if (!showOriginal || !article || pdfChecked) return;
    
    const checkPdf = async () => {
      if (!article.pdf_path) { setPdfChecked(true); return; }
      
      if (article.pdf_path.startsWith('/articles/')) {
        try {
          const res = await fetch(article.pdf_path, { method: 'HEAD' });
          setPdfUrl(res.ok ? article.pdf_path : null);
        } catch { setPdfUrl(null); }
      } else {
        const { data: urlData } = supabase.storage.from("articles").getPublicUrl(article.pdf_path);
        try {
          const res = await fetch(urlData.publicUrl, { method: 'HEAD' });
          setPdfUrl(res.ok ? urlData.publicUrl : null);
        } catch { setPdfUrl(null); }
      }
      setPdfChecked(true);
    };
    checkPdf();
  }, [showOriginal, article, pdfChecked]);

  // Polling for active job
  useEffect(() => {
    if (!activeJob || !["queued", "running"].includes(activeJob.status)) return;

    const interval = setInterval(async () => {
      const { data: jobData } = await supabase
        .from("curation_jobs")
        .select("*")
        .eq("id", activeJob.id)
        .single();

      if (jobData) {
        const job = jobData as CurationJob;
        setActiveJob(job);

        // If job completed, refresh all data
        if (job.status === "done" || job.status === "error") {
          clearInterval(interval);
          fetchData();
          if (job.status === "done") {
            toast.success("Curadoria gerada com sucesso!");
          } else if (job.error_message) {
            toast.error(`Erro: ${job.error_message}`);
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJob, fetchData]);

  const handleGenerateCuration = async () => {
    if (!id || isGenerating) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-curation-job", {
        body: { articleId: id, userId: user.id }
      });

      if (error) throw error;

      if (data.alreadyRunning) {
        toast.info("Já existe um job em andamento");
        setActiveJob(data.job);
      } else {
        toast.success("Geração iniciada!");
        setActiveJob(data.job);
      }
    } catch (error) {
      console.error("Error starting curation job:", error);
      toast.error("Erro ao iniciar geração");
    } finally {
      setIsGenerating(false);
    }
  };

  // Determine UI state
  const hasActiveJob = activeJob && ["queued", "running"].includes(activeJob.status);
  const hasCuration = structuredCuration !== null;
  const curationStatus = structuredCuration?.status;
  
  const showEmptyState = !hasCuration && !hasActiveJob;
  const showGenerating = hasActiveJob;
  const showDraft = hasCuration && (curationStatus === "em_producao" || curationStatus === "em_revisao");
  const showApproved = hasCuration && curationStatus === "disponivel";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/curadoria")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Artigo não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/curadoria")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Article Header */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${interestColors[article.interest]} border`}>
                  {article.interest}
                </Badge>
                <CuradoriaStatusBadge status={article.status} />
                {hasCuration && (
                  <CurationGovernanceBadge status={structuredCuration.status} />
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-foreground leading-tight">
                {article.title}
              </CardTitle>
              <p className="text-muted-foreground">
                {article.authors} · {article.year} · {article.journal}
              </p>
              <div className="flex flex-wrap gap-2">
                {article.tags?.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-secondary/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {article.doi && (
                <p className="text-sm text-muted-foreground">
                  DOI: <span className="text-primary">{article.doi}</span>
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowOriginal(!showOriginal)} className="gap-2">
              <FileText className="h-4 w-4" />
              {showOriginal ? 'Fechar artigo original' : 'Ler artigo original'}
            </Button>
            {article.pubmed_url && (
              <Button variant="outline" asChild>
                <a href={article.pubmed_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Ver no PubMed
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inline Original Article Viewer */}
      {showOriginal && (
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Artigo Original
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowOriginal(false)}>
              Fechar
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {!pdfChecked ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pdfUrl ? (
              <div className="relative w-full" style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}>
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="absolute inset-0 w-full h-full"
                  aria-label={article.title}
                >
                  {article.doi ? (
                    <iframe
                      src={`https://doi.org/${article.doi}`}
                      className="w-full h-full border-0"
                      title={article.title}
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  ) : article.pubmed_url && article.pubmed_url.length > 35 ? (
                    <iframe
                      src={article.pubmed_url}
                      className="w-full h-full border-0"
                      title={article.title}
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">Não foi possível exibir o artigo neste navegador.</p>
                    </div>
                  )}
                </object>
              </div>
            ) : article.doi ? (
              <div className="relative w-full" style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}>
                <iframe
                  src={`https://doi.org/${article.doi}`}
                  className="absolute inset-0 w-full h-full border-0"
                  title={article.title}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            ) : article.pubmed_url && article.pubmed_url.length > 35 ? (
              <div className="relative w-full" style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}>
                <iframe
                  src={article.pubmed_url}
                  className="absolute inset-0 w-full h-full border-0"
                  title={article.title}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <FileText className="h-14 w-14 text-muted-foreground mb-4" />
                <h3 className="text-base font-medium text-foreground mb-2">
                  Artigo original não disponível
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Nenhum PDF ou link externo cadastrado para este artigo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Abstract Section */}
      {article.abstract && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo do Artigo (Abstract)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{article.abstract}</p>
          </CardContent>
        </Card>
      )}

      {/* Generating State */}
      {showGenerating && activeJob && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <Bot className="h-16 w-16 text-primary animate-pulse" />
                <Loader2 className="h-6 w-6 text-primary absolute -bottom-1 -right-1 animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Gerando curadoria...
                </h3>
                <p className="text-muted-foreground">
                  {activeJob.status === "queued" 
                    ? "Aguardando na fila..." 
                    : "Analisando artigo com IA..."}
                </p>
              </div>
              <div className="w-full max-w-md space-y-2">
                <Progress value={activeJob.progress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">
                  {activeJob.progress}% concluído
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {showEmptyState && (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="rounded-full bg-muted p-4">
                <Bot className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Ainda não existe curadoria para este artigo
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Gere uma curadoria estruturada usando IA para extrair os principais 
                  insights clínicos deste artigo.
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={handleGenerateCuration}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    Gerar Curadoria (IA)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draft/Review State */}
      {showDraft && structuredCuration && (
        <div className="space-y-6">
          {/* Draft Warning */}
          <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800/50">
            <CardContent className="flex items-start gap-3 pt-6">
              <Bot className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Rascunho gerado por IA.</strong> Conteúdo educacional. 
                  Não substitui avaliação clínica. Publicação depende de revisão do especialista.
                </p>
              </div>
              {isAdmin && (
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <Link to={`/admin/curadoria/${structuredCuration.id}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Revisar no Backoffice
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Curadoria Clínica Estruturada</h2>
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
              Rascunho IA
            </Badge>
          </div>
          
          <ScientificCurationCard data={exampleCurationData} />
        </div>
      )}

      {/* Approved/Published State */}
      {showApproved && structuredCuration && (
        <div className="space-y-6">
          {/* Approved Badge */}
          <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50">
            <CardContent className="flex items-start gap-3 pt-6">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                <strong>Revisado por especialista.</strong> Esta curadoria foi verificada e aprovada 
                para publicação.
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Curadoria Clínica Estruturada</h2>
          </div>
          
          <ScientificCurationCard data={exampleCurationData} />

          {/* Disclaimer */}
          <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Aviso:</strong> Esta curadoria tem finalidade educacional. 
                Não substitui a avaliação clínica individual nem a decisão do profissional de saúde.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Observational Data Section - Always show if curation exists */}
      {structuredCuration && (
        <CurationEvidenceSection curationId={structuredCuration.id} />
      )}

      {/* Fixed CTA Footer - Only show when appropriate */}
      {showEmptyState && !isGenerating && !hasActiveJob && (
        <div className="sticky bottom-4 flex justify-end">
          <Button 
            size="lg" 
            onClick={handleGenerateCuration}
            className="shadow-lg gap-2"
          >
            <Bot className="h-4 w-4" />
            Gerar Curadoria (IA)
          </Button>
        </div>
      )}
    </div>
  );
}
