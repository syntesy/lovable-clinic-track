import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  BookOpen,
  ExternalLink,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Library,
  Heart,
} from "lucide-react";
import {
  useAcademyArticles,
  useAcademyArticleDetail,
  useArticleFilterOptions,
  type ArticleFilters,
} from "@/hooks/useAcademyArticles";
import { useAcademyFavorites, useToggleFavorite } from "@/hooks/useAcademyFavorites";

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

function getExternalUrl(article: { pubmed_url?: string | null; doi_url?: string | null }) {
  return article.pubmed_url || article.doi_url || null;
}

export default function AcademyLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  // Derive filters from URL
  const filters: ArticleFilters = useMemo(() => ({
    search: searchParams.get("q") || undefined,
    study_type: searchParams.get("study_type") || undefined,
    interventions: searchParams.get("interventions")?.split(",").filter(Boolean) || undefined,
    pathologies: searchParams.get("pathologies")?.split(",").filter(Boolean) || undefined,
    year_min: searchParams.get("year_min") ? Number(searchParams.get("year_min")) : undefined,
    year_max: searchParams.get("year_max") ? Number(searchParams.get("year_max")) : undefined,
    sort: (searchParams.get("sort") as ArticleFilters["sort"]) || "recent",
    page: Number(searchParams.get("page") ?? 1),
  }), [searchParams]);

  const onlySaved = searchParams.get("saved") === "1";
  const { data, isLoading } = useAcademyArticles(filters);
  const { data: filterOptions } = useArticleFilterOptions();
  const { data: articleDetail, isLoading: isLoadingDetail } = useAcademyArticleDetail(selectedArticleId);
  const { data: favorites = [] } = useAcademyFavorites();
  const toggleFav = useToggleFavorite();

  const updateParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }, [setSearchParams]);

  const handleSearch = useCallback(() => {
    updateParam("q", searchInput.trim() || null);
  }, [searchInput, updateParam]);

  const clearFilters = useCallback(() => {
    setSearchParams({});
    setSearchInput("");
  }, [setSearchParams]);

  const hasFilters = searchParams.toString() !== "";
  const allArticles = data?.articles ?? [];
  const articles = onlySaved ? allArticles.filter(a => favorites.includes(a.id)) : allArticles;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;
  const total = onlySaved ? articles.length : (data?.total ?? 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Library className="w-3 h-3 mr-1" />
              Biblioteca Científica
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Biblioteca Científica do Academy
            </h1>
            <p className="text-lg text-muted-foreground">
              Artigos curados por especialistas, organizados por intervenção, patologia e nível de evidência.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artigos…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 pr-10"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); updateParam("q", null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button size="sm" onClick={handleSearch}>Buscar</Button>

            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {/* Study type */}
              <Select
                value={filters.study_type ?? "all"}
                onValueChange={(v) => updateParam("study_type", v === "all" ? null : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de estudo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {filterOptions?.studyTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={filters.sort ?? "recent"}
                onValueChange={(v) => updateParam("sort", v)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="alpha">Ordem alfabética</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="w-3 h-3" /> Limpar
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
              <p className="text-muted-foreground mb-4">Tente ajustar os filtros de busca.</p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {total} artigo{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Card
                    key={article.id}
                    className="group hover:shadow-lg transition-all cursor-pointer flex flex-col"
                    onClick={() => setSelectedArticleId(article.id)}
                  >
                    <CardContent className="py-5 flex flex-col flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge className={getStudyBadgeClass(article.study_type)}>
                          {article.study_type}
                        </Badge>
                        {article.interventions.slice(0, 2).map((i) => (
                          <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                        ))}
                        {article.pathologies.slice(0, 1).map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                      <h3 className="text-base font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {article.year} • {article.journal}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                        {article.summary_short}
                      </p>
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={(e) => { e.stopPropagation(); setSelectedArticleId(article.id); }}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Ver resumo
                        </Button>
                        {getExternalUrl(article) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getExternalUrl(article)!, "_blank");
                            }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            PubMed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => updateParam("page", String(currentPage - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => updateParam("page", String(currentPage + 1))}
                  >
                    Próxima <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Article Detail Modal */}
      <Dialog open={!!selectedArticleId} onOpenChange={(open) => !open && setSelectedArticleId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          {isLoadingDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : articleDetail ? (
            <ScrollArea className="max-h-[75vh] pr-4">
              <DialogHeader className="mb-4">
                <Badge className={`w-fit mb-2 ${getStudyBadgeClass(articleDetail.study_type)}`}>
                  {articleDetail.study_type}
                </Badge>
                <DialogTitle className="text-xl leading-tight">
                  {articleDetail.title}
                </DialogTitle>
                <div className="text-sm text-muted-foreground mt-2">
                  {articleDetail.authors && <p>{articleDetail.authors}</p>}
                  <p>{articleDetail.journal} • {articleDetail.year}</p>
                </div>
              </DialogHeader>

              <div className="space-y-5">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {articleDetail.interventions.map((i) => (
                    <Badge key={i} variant="outline">{i}</Badge>
                  ))}
                  {articleDetail.pathologies.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>

                {/* Summary */}
                {articleDetail.summary_full ? (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Resumo Completo</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {articleDetail.summary_full}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Resumo</h4>
                    <p className="text-sm text-muted-foreground">{articleDetail.summary_short}</p>
                  </div>
                )}

                {/* Effect summary */}
                {articleDetail.effect_summary && (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Efeito Principal</h4>
                    <p className="text-sm text-muted-foreground">{articleDetail.effect_summary}</p>
                  </div>
                )}

                {/* Limitations */}
                {articleDetail.limitations && articleDetail.limitations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Limitações</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {articleDetail.limitations.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up */}
                {articleDetail.follow_up && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Follow-up</h4>
                    <p className="text-sm text-muted-foreground">{articleDetail.follow_up}</p>
                  </div>
                )}

                {/* External link */}
                {getExternalUrl(articleDetail) && (
                  <Button
                    variant="outline"
                    className="gap-2 w-full"
                    onClick={() => window.open(getExternalUrl(articleDetail)!, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir no {articleDetail.pubmed_url ? "PubMed" : "DOI"}
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
