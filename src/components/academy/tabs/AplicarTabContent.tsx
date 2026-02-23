import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, ExternalLink, FileText, Loader2, Microscope } from "lucide-react";
import { useAcademyArticles, useAcademyArticleDetail, type ArticleFilters } from "@/hooks/useAcademyArticles";
import { useAcademyFavorites, useToggleFavorite } from "@/hooks/useAcademyFavorites";
import { Heart } from "lucide-react";

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

export default function AplicarTabContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Reuse existing hook — articles with summary_full and effect_summary are filtered client-side
  const filters: ArticleFilters = { sort: "recent", page };
  const { data, isLoading } = useAcademyArticles(filters);
  const { data: detail, isLoading: loadingDetail } = useAcademyArticleDetail(selectedId);
  const { data: favorites = [] } = useAcademyFavorites();
  const toggleFav = useToggleFavorite();

  // Client-side filter for "applied science" articles
  const articles = (data?.articles ?? []).filter(
    (a) => a.summary_short && a.study_type
  );

  return (
    <>
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Microscope className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Ciência Aplicada à Prática</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Artigos com análise clínica completa, conectando evidência científica ao dia a dia do consultório.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum artigo com análise clínica disponível</h3>
              <p className="text-muted-foreground">Em breve novos conteúdos serão adicionados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => {
                const isFav = favorites.includes(article.id);
                const extUrl = article.pubmed_url || article.doi_url || null;
                return (
                  <Card key={article.id} className="cursor-pointer hover:shadow-lg transition-all group">
                    <CardContent className="py-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                              <Microscope className="w-3 h-3 mr-1" /> Análise Clínica
                            </Badge>
                            <Badge className={getStudyBadgeClass(article.study_type)}>{article.study_type}</Badge>
                            {article.interventions.slice(0, 2).map((i) => (
                              <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                            ))}
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {article.year} • {article.journal}
                          </p>
                          <p className="text-muted-foreground line-clamp-2">{article.summary_short}</p>
                        </div>
                        <div className="flex md:flex-col gap-2 md:justify-center items-start">
                          <button onClick={(e) => { e.stopPropagation(); toggleFav.mutate({ articleId: article.id, isFavorited: isFav }); }} className="mb-1">
                            <Heart className={`w-4 h-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"}`} />
                          </button>
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelectedId(article.id)}>
                            <BookOpen className="w-4 h-4" /> Ler análise
                          </Button>
                          {extUrl && (
                            <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.open(extUrl, "_blank")}>
                              <ExternalLink className="w-4 h-4" /> Ver original
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
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
                {detail.summary_full && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Resumo Completo</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.summary_full}</div>
                  </div>
                )}
                {detail.effect_summary && (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Efeito Principal</h4>
                    <p className="text-sm text-muted-foreground">{detail.effect_summary}</p>
                  </div>
                )}
                {detail.limitations && detail.limitations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Limitações</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {detail.limitations.map((l, i) => (<li key={i}>{l}</li>))}
                    </ul>
                  </div>
                )}
                {(detail.pubmed_url || detail.doi_url) && (
                  <Button variant="outline" className="gap-2 w-full" onClick={() => window.open((detail.pubmed_url || detail.doi_url)!, "_blank")}>
                    <ExternalLink className="w-4 h-4" /> Abrir no {detail.pubmed_url ? "PubMed" : "DOI"}
                  </Button>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
