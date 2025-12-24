import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { CuradoriaArticle, CuradoriaContent, statusConfig, interestColors, CuradoriaStatus } from "@/types/curadoria";
import { CuradoriaStatusBadge } from "@/components/curadoria/CuradoriaStatusBadge";
import { SolicitarCuradoriaModal } from "@/components/curadoria/SolicitarCuradoriaModal";
import { 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  AlertTriangle,
  Target,
  Microscope,
  BarChart3,
  Stethoscope,
  AlertCircle,
  Award
} from "lucide-react";

export default function CuradoriaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<CuradoriaArticle | null>(null);
  const [content, setContent] = useState<CuradoriaContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const fetchArticle = async () => {
    if (!id) return;
    
    try {
      const { data: articleData, error: articleError } = await supabase
        .from("curadoria_articles")
        .select("*")
        .eq("id", id)
        .single();

      if (articleError) throw articleError;
      
      // Cast the status to CuradoriaStatus
      const typedArticle: CuradoriaArticle = {
        ...articleData,
        status: articleData.status as CuradoriaStatus,
        interest: articleData.interest as CuradoriaArticle['interest']
      };
      setArticle(typedArticle);

      // Fetch curadoria content if available
      if (typedArticle.status === "disponivel") {
        const { data: contentData } = await supabase
          .from("curadoria_content")
          .select("*")
          .eq("article_id", id)
          .single();

        if (contentData) {
          setContent(contentData);
        }
      }
    } catch (error) {
      console.error("Error fetching article:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const canRequestCuradoria = article && 
    (article.status === "sem_curadoria" || article.status === "indeferida");

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
              </div>
              <CardTitle className="text-2xl font-bold text-foreground leading-tight">
                {article.title}
              </CardTitle>
              <p className="text-muted-foreground">
                {article.authors} · {article.year} · {article.journal}
              </p>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
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
            <Button asChild>
              <Link to={`/curadoria/${article.id}/original`} className="gap-2">
                <FileText className="h-4 w-4" />
                Ler artigo original
              </Link>
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

      {/* Curadoria Content */}
      {article.status === "disponivel" && content ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Curadoria Clínica</h2>
          </div>

          {/* Summary */}
          {content.summary && (
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-foreground">{content.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Detailed Sections */}
          <div className="grid gap-4 md:grid-cols-2">
            {content.objective && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Objetivo do Estudo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{content.objective}</p>
                </CardContent>
              </Card>
            )}

            {content.methodology && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Microscope className="h-4 w-4 text-primary" />
                    Metodologia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{content.methodology}</p>
                </CardContent>
              </Card>
            )}

            {content.main_results && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Principais Resultados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{content.main_results}</p>
                </CardContent>
              </Card>
            )}

            {content.clinical_applicability && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Aplicabilidade Clínica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{content.clinical_applicability}</p>
                </CardContent>
              </Card>
            )}

            {content.limitations && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Limitações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{content.limitations}</p>
                </CardContent>
              </Card>
            )}

            {content.evidence_level && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Nível de Evidência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{content.evidence_level}</p>
                </CardContent>
              </Card>
            )}
          </div>

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
      ) : (
        /* Status Section when no curadoria available */
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Status da Curadoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CuradoriaStatusBadge status={article.status} />
              <span className="text-sm text-muted-foreground">
                Atualizado em {new Date(article.updated_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <p className="text-muted-foreground">
              {statusConfig[article.status].description}
            </p>

            {/* Practice Change Insight */}
            {article.practice_change && (
              <div className="bg-secondary/30 rounded-lg p-4 border border-border mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Insight clínico preliminar
                </p>
                <p className="text-sm text-foreground">{article.practice_change}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fixed CTA Footer */}
      <div className="sticky bottom-4 flex justify-end">
        {canRequestCuradoria ? (
          <Button 
            size="lg" 
            onClick={() => setShowRequestModal(true)}
            className="shadow-lg"
          >
            Solicitar Curadoria
          </Button>
        ) : article.status !== "disponivel" && (
          <Button size="lg" disabled className="shadow-lg">
            Curadoria em andamento
          </Button>
        )}
      </div>

      {/* Request Modal */}
      <SolicitarCuradoriaModal
        open={showRequestModal}
        onOpenChange={setShowRequestModal}
        articleId={article.id}
        articleTitle={article.title}
        onSuccess={fetchArticle}
      />
    </div>
  );
}
