import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CuradoriaArticle, CuradoriaStatus } from "@/types/curadoria";
import { SolicitarCuradoriaModal } from "@/components/curadoria/SolicitarCuradoriaModal";
import { ArrowLeft, MessageSquarePlus, AlertCircle, ExternalLink, FileText } from "lucide-react";

export default function CuradoriaOriginal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<CuradoriaArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fetchArticle = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("curadoria_articles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      const typedArticle: CuradoriaArticle = {
        ...data,
        status: data.status as CuradoriaStatus,
        interest: data.interest as CuradoriaArticle['interest']
      };
      setArticle(typedArticle);

      // Get PDF URL from storage if pdf_path exists
      if (data.pdf_path) {
        const { data: urlData } = supabase.storage
          .from("articles")
          .getPublicUrl(data.pdf_path);
        
        setPdfUrl(urlData.publicUrl);
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

  const handleOpenExternal = () => {
    if (article?.pubmed_url) {
      window.open(article.pubmed_url, "_blank", "noopener,noreferrer");
    } else if (article?.doi) {
      window.open(`https://doi.org/${article.doi}`, "_blank", "noopener,noreferrer");
    }
  };

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

  // Determine if we have a viewable PDF
  const hasPdf = Boolean(pdfUrl);
  const hasExternalUrl = Boolean(article.pubmed_url || article.doi);

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          asChild
          className="gap-2"
        >
          <Link to={`/curadoria/${article.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para Curadoria
          </Link>
        </Button>
        {hasExternalUrl && !hasPdf && (
          <Button variant="outline" onClick={handleOpenExternal} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir em nova aba
          </Button>
        )}
      </div>

      {/* Banner CTA */}
      <Card className="bg-primary/10 border-primary/30">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              Você está lendo o artigo original. Deseja uma curadoria clínica aplicada à prática?
            </p>
          </div>
          {canRequestCuradoria && (
            <Button 
              size="sm" 
              onClick={() => setShowRequestModal(true)}
              className="shrink-0 gap-2"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Solicitar Curadoria
            </Button>
          )}
        </CardContent>
      </Card>

      {/* PDF Viewer */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          {hasPdf ? (
            <div className="relative w-full" style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}>
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="absolute inset-0 w-full h-full"
                title={article.title}
              />
            </div>
          ) : article.pubmed_url ? (
            <div className="relative w-full" style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}>
              <iframe
                src={article.pubmed_url}
                className="absolute inset-0 w-full h-full"
                title={article.title}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-lg font-medium text-foreground mb-2">
                Artigo original não disponível
              </h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                O PDF deste artigo ainda não foi anexado ao sistema.
                {article.doi && " Você pode acessá-lo através do DOI."}
              </p>
              {article.doi && (
                <Button asChild variant="outline" className="gap-2">
                  <a 
                    href={`https://doi.org/${article.doi}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Acessar via DOI
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating back button */}
      <div className="fixed bottom-6 left-6">
        <Button 
          variant="secondary" 
          asChild
          className="shadow-lg gap-2"
        >
          <Link to={`/curadoria/${article.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para Curadoria
          </Link>
        </Button>
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
