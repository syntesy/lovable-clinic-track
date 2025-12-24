import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CuradoriaArticle, CuradoriaStatus } from "@/types/curadoria";
import { SolicitarCuradoriaModal } from "@/components/curadoria/SolicitarCuradoriaModal";
import { ArrowLeft, MessageSquarePlus, AlertCircle } from "lucide-react";

export default function CuradoriaOriginal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<CuradoriaArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

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
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center gap-4">
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
          {article.pdf_url ? (
            <div className="relative w-full" style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}>
              <iframe
                src={article.pdf_url}
                className="absolute inset-0 w-full h-full"
                title={article.title}
              />
              {/* Fallback message for blocked PDFs */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50 opacity-0 hover:opacity-0">
                <p className="text-muted-foreground text-center mb-4">
                  Se o PDF não carregar, acesse diretamente:
                </p>
                <Button asChild variant="outline">
                  <a href={article.pdf_url} target="_blank" rel="noopener noreferrer">
                    Abrir PDF em nova aba
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-muted-foreground text-center mb-4">
                O PDF deste artigo não está disponível para visualização direta.
              </p>
              {article.doi && (
                <Button asChild variant="outline">
                  <a 
                    href={`https://doi.org/${article.doi}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
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
