import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Clock, FolderOpen, ArrowRight, BookOpen, ArrowLeft } from "lucide-react";
import { useFeedNewArticles, useFeedForYou, useFeedOfficialCollections } from "@/hooks/useAcademyFeed";
import { useAcademyFavorites, useToggleFavorite } from "@/hooks/useAcademyFavorites";
import { Heart } from "lucide-react";
import { useAcademyArticleDetail } from "@/hooks/useAcademyArticles";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const STUDY_TYPE_COLORS: Record<string, string> = {
  "Revisão Sistemática": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Meta-Análise": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Ensaio Clínico Randomizado": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Estudo de Coorte": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Estudo de Caso": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

function getStudyBadgeClass(type: string) {
  return STUDY_TYPE_COLORS[type] ?? "bg-secondary text-secondary-foreground";
}

function isNew(created_at: string) {
  const d = new Date(created_at);
  return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function AcademyFeedPage() {
  const navigate = useNavigate();
  const { data: newArticles = [], isLoading: loadingNew } = useFeedNewArticles(10);
  const { data: forYou = [], isLoading: loadingForYou } = useFeedForYou(10);
  const { data: officialCollections = [] } = useFeedOfficialCollections();
  const { data: favorites = [] } = useAcademyFavorites();
  const toggleFav = useToggleFavorite();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail, isLoading: loadingDetail } = useAcademyArticleDetail(selectedId);

  const renderCard = (article: any) => {
    const isFav = favorites.includes(article.id);
    return (
      <Card key={article.id} className="group hover:shadow-lg transition-all cursor-pointer flex flex-col" onClick={() => setSelectedId(article.id)}>
        <CardContent className="py-5 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-wrap gap-1.5">
              {isNew(article.created_at) && (
                <Badge className="bg-primary text-primary-foreground text-[10px]">Novo</Badge>
              )}
              <Badge className={getStudyBadgeClass(article.study_type)}>{article.study_type}</Badge>
              {article.interventions?.slice(0, 2).map((i: string) => (
                <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFav.mutate({ articleId: article.id, isFavorited: isFav }); }}
              className="ml-2 flex-shrink-0"
            >
              <Heart className={`w-4 h-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"}`} />
            </button>
          </div>
          <h3 className="text-base font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
          <p className="text-xs text-muted-foreground mb-2">{article.year} • {article.journal}</p>
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{article.summary_short}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/academy/home')} className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Badge variant="secondary" className="mb-4"><Sparkles className="w-3 h-3 mr-1" />Feed Científico</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Seu Feed</h1>
          <p className="text-lg text-muted-foreground">Novidades e artigos relevantes para você.</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 space-y-12">
          {/* New Articles */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Novos Artigos</h2>
            </div>
            {loadingNew ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : newArticles.length === 0 ? (
              <p className="text-muted-foreground">Nenhum artigo novo nos últimos 30 dias.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newArticles.map(renderCard)}
              </div>
            )}
          </div>

          {/* For You */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Para Você</h2>
            </div>
            {loadingForYou ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : forYou.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Siga temas para receber recomendações personalizadas.</p>
                <Button variant="outline" onClick={() => navigate("/academy/biblioteca")}>Explorar Biblioteca</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forYou.map(renderCard)}
              </div>
            )}
          </div>

          {/* Official Collections */}
          {officialCollections.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <FolderOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Curadorias Oficiais</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {officialCollections.map((col) => (
                  <Card key={col.id} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate(`/academy/colecoes/${col.id}`)}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {col.is_featured && <Badge className="bg-primary text-primary-foreground">Destaque</Badge>}
                        <Badge variant="secondary">Oficial</Badge>
                      </div>
                      <CardTitle className="text-lg">{col.title}</CardTitle>
                      {col.description && <CardDescription>{col.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Ver coleção <ArrowRight className="w-3 h-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Article Detail Modal */}
      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          {loadingDetail ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : detail ? (
            <ScrollArea className="max-h-[75vh] pr-4">
              <DialogHeader className="mb-4">
                <Badge className={`w-fit mb-2 ${getStudyBadgeClass(detail.study_type)}`}>{detail.study_type}</Badge>
                <DialogTitle className="text-xl leading-tight">{detail.title}</DialogTitle>
                <div className="text-sm text-muted-foreground mt-2">
                  {detail.authors && <p>{detail.authors}</p>}
                  <p>{detail.journal} • {detail.year}</p>
                </div>
              </DialogHeader>
              <div className="space-y-5">
                {detail.summary_full ? (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Resumo Completo</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.summary_full}</div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Resumo</h4>
                    <p className="text-sm text-muted-foreground">{detail.summary_short}</p>
                  </div>
                )}
                {detail.effect_summary && (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Efeito Principal</h4>
                    <p className="text-sm text-muted-foreground">{detail.effect_summary}</p>
                  </div>
                )}
                {(detail.pubmed_url || detail.doi_url) && (
                  <Button variant="outline" className="gap-2 w-full" onClick={() => window.open((detail.pubmed_url || detail.doi_url)!, "_blank")}>
                    <BookOpen className="w-4 h-4" />Abrir no {detail.pubmed_url ? "PubMed" : "DOI"}
                  </Button>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
