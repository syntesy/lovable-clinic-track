import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Trash2, ExternalLink, BookOpen, Plus, Search } from "lucide-react";
import { useCollectionDetail, useCollectionArticles, useRemoveArticleFromCollection, useAddArticleToCollection } from "@/hooks/useAcademyCollections";
import { useAcademyArticleDetail, useArticleFilterOptions } from "@/hooks/useAcademyArticles";
import { useSearchPublishedArticles } from "@/hooks/useAcademyEvidence";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AcademyCollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: collection, isLoading } = useCollectionDetail(id ?? null);
  const { data: articles = [], isLoading: loadingArticles } = useCollectionArticles(id ?? null);
  const removeArticle = useRemoveArticleFromCollection();
  const addArticle = useAddArticleToCollection();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail, isLoading: loadingDetail } = useAcademyArticleDetail(selectedId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStudyType, setFilterStudyType] = useState<string>("all");
  const { data: searchResults = [] } = useSearchPublishedArticles(searchQuery);
  const { data: filterOptions } = useArticleFilterOptions();

  const { data: currentUserId } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
  });

  const isOwner = collection && currentUserId && collection.owner_user_id === currentUserId;
  const isPersonal = collection?.kind === "personal";

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!collection) {
    return <div className="text-center py-16"><p className="text-muted-foreground">Coleção não encontrada.</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/academy/colecoes")} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{collection.kind === "official" ? "Oficial" : "Pessoal"}</Badge>
            {collection.is_featured && <Badge className="bg-primary text-primary-foreground">Destaque</Badge>}
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground mb-2">{collection.title}</h1>
            {isOwner && (
              <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
                <Plus className="w-4 h-4" /> Adicionar Paper
              </Button>
            )}
          </div>
          {collection.description && <p className="text-muted-foreground">{collection.description}</p>}
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {loadingArticles ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Nenhum artigo nesta coleção.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article: any) => (
                <Card key={article.id} className="group hover:shadow-lg transition-all cursor-pointer flex flex-col" onClick={() => setSelectedId(article.id)}>
                  <CardContent className="py-5 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="secondary" className="text-xs">{article.study_type}</Badge>
                      {article.evidence_score != null && (
                        <Badge variant="outline" className={`text-xs ${
                          article.evidence_score >= 70 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : article.evidence_score >= 40 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}>Score: {article.evidence_score}</Badge>
                      )}
                      {article.interventions?.slice(0, 2).map((i: string) => (
                        <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                      ))}
                    </div>
                    <h3 className="text-base font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{article.year} • {article.journal}</p>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{article.summary_short}</p>
                    {isOwner && isPersonal && (
                      <div className="mt-3 pt-3 border-t">
                        <Button variant="ghost" size="sm" className="text-destructive gap-1" onClick={(e) => {
                          e.stopPropagation();
                          removeArticle.mutate({ collectionId: id!, articleId: article.id });
                        }}>
                          <Trash2 className="w-3 h-3" /> Remover
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
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
                <DialogTitle className="text-xl leading-tight">{detail.title}</DialogTitle>
                <div className="text-sm text-muted-foreground mt-2">
                  {detail.authors && <p>{detail.authors}</p>}
                  <p>{detail.journal} • {detail.year}</p>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {detail.summary_full || detail.summary_short}
                </div>
                {(detail.pubmed_url || detail.doi_url) && (
                  <Button variant="outline" className="gap-2 w-full" onClick={() => window.open((detail.pubmed_url || detail.doi_url)!, "_blank")}>
                    <ExternalLink className="w-4 h-4" />Abrir fonte
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
