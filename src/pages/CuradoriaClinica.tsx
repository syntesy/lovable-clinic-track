import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, FileText, Sparkles, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CuradoriaArticle, CuradoriaStatus, interestColors } from "@/types/curadoria";
import { CuradoriaStatusBadge } from "@/components/curadoria/CuradoriaStatusBadge";
import { SolicitarCuradoriaModal } from "@/components/curadoria/SolicitarCuradoriaModal";

const interestOptions = [
  { value: "all", label: "Todos" },
  { value: "PRP", label: "PRP" },
  { value: "PRF", label: "PRF" },
  { value: "PPP", label: "PPP" },
  { value: "BMP", label: "BMP" },
];

export default function CuradoriaClinica() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<CuradoriaArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interestFilter, setInterestFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<CuradoriaArticle | null>(null);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("curadoria_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Cast the data to proper types
      const typedArticles: CuradoriaArticle[] = (data || []).map(article => ({
        ...article,
        status: article.status as CuradoriaStatus,
        interest: article.interest as CuradoriaArticle['interest']
      }));
      
      setArticles(typedArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Filter by interest
      if (interestFilter !== "all" && article.interest !== interestFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesAuthors = article.authors.toLowerCase().includes(query);
        const matchesJournal = article.journal.toLowerCase().includes(query);
        const matchesTags = article.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesTitle && !matchesAuthors && !matchesJournal && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [articles, interestFilter, searchQuery]);

  const clearFilters = () => {
    setInterestFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = interestFilter !== "all" || searchQuery.trim() !== "";

  const handleRequestCuradoria = (article: CuradoriaArticle) => {
    setSelectedArticle(article);
    setShowRequestModal(true);
  };

  const canRequestCuradoria = (status: CuradoriaStatus) => 
    status === "sem_curadoria" || status === "indeferida";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Curadoria Clínica</h1>
        <p className="text-muted-foreground">
          Evidência científica traduzida em decisão clínica.
        </p>
        <div className="h-px bg-border mt-4" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <Select value={interestFilter} onValueChange={setInterestFilter}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Filtrar por interesse" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {interestOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, autor, journal ou palavra-chave…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
      </div>

      {/* Results */}
      {filteredArticles.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum artigo encontrado com os filtros selecionados.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg font-semibold text-foreground leading-tight">
                    {article.title}
                  </CardTitle>
                  <Badge className={`shrink-0 ${interestColors[article.interest]} border`}>
                    {article.interest}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {article.authors} · {article.year} · {article.journal}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {article.tags.slice(0, 4).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs bg-secondary/50 text-secondary-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 4 && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-secondary/50 text-secondary-foreground"
                    >
                      +{article.tags.length - 4}
                    </Badge>
                  )}
                </div>

                {/* Status Badge */}
                <div>
                  <CuradoriaStatusBadge status={article.status} />
                </div>

                {/* Insight Clínico */}
                {article.practice_change && (
                  <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Insight clínico
                    </p>
                    <p className="text-sm text-foreground">
                      {article.practice_change}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/curadoria/${article.id}/original`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ler artigo original
                  </Button>
                  {article.status === "disponivel" ? (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/curadoria/${article.id}`)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ver curadoria
                    </Button>
                  ) : canRequestCuradoria(article.status) ? (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleRequestCuradoria(article)}
                    >
                      Solicitar curadoria
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/curadoria/${article.id}`)}
                    >
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ver progresso
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Request Modal */}
      {selectedArticle && (
        <SolicitarCuradoriaModal
          open={showRequestModal}
          onOpenChange={setShowRequestModal}
          articleId={selectedArticle.id}
          articleTitle={selectedArticle.title}
          article={selectedArticle}
          onSuccess={fetchArticles}
        />
      )}
    </div>
  );
}
