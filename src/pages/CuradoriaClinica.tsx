import { useState, useMemo } from "react";
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
import { Search, FileText, Sparkles, X } from "lucide-react";

interface Article {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  interest: "PRP" | "PRF" | "PPP" | "BMP";
  tags: string[];
  status: "curated" | "raw";
  practiceChange: string;
}

const mockArticles: Article[] = [
  {
    id: "1",
    title: "Platelet-Rich Plasma for Knee Osteoarthritis: A Systematic Review",
    authors: "Silva, M.J. et al.",
    year: 2023,
    journal: "Journal of Orthopaedic Research",
    interest: "PRP",
    tags: ["osteoartrite", "joelho", "revisão sistemática", "injeção intra-articular"],
    status: "curated",
    practiceChange: "PRP mostra superioridade ao ácido hialurônico em OA de joelho grau II-III."
  },
  {
    id: "2",
    title: "Clinical Outcomes of Leukocyte-Rich vs Leukocyte-Poor PRP in Tendinopathies",
    authors: "Chen, L. et al.",
    year: 2024,
    journal: "American Journal of Sports Medicine",
    interest: "PRP",
    tags: ["tendinopatia", "leucócitos", "comparativo"],
    status: "raw",
    practiceChange: "LR-PRP pode ser mais eficaz em tendinopatias crônicas degenerativas."
  },
  {
    id: "3",
    title: "PRF Membranes in Periodontal Regeneration: A Meta-Analysis",
    authors: "Rodrigues, A.P. et al.",
    year: 2023,
    journal: "Clinical Oral Investigations",
    interest: "PRF",
    tags: ["periodontia", "regeneração", "meta-análise", "membrana"],
    status: "curated",
    practiceChange: "PRF acelera cicatrização em defeitos intraósseos periodontais."
  },
  {
    id: "4",
    title: "Advanced PRF (A-PRF) vs Standard PRF in Bone Augmentation",
    authors: "Miron, R.J. et al.",
    year: 2022,
    journal: "Journal of Clinical Periodontology",
    interest: "PRF",
    tags: ["A-PRF", "aumento ósseo", "implantes"],
    status: "raw",
    practiceChange: "A-PRF libera fatores de crescimento por período mais prolongado."
  },
  {
    id: "5",
    title: "Platelet-Poor Plasma in Dermatological Applications",
    authors: "Kim, S.H. et al.",
    year: 2024,
    journal: "Dermatologic Surgery",
    interest: "PPP",
    tags: ["dermatologia", "rejuvenescimento", "cicatrizes"],
    status: "curated",
    practiceChange: "PPP pode ser combinado com microagulhamento para potencializar resultados."
  },
  {
    id: "6",
    title: "PPP as a Scaffold for Growth Factor Delivery in Wound Healing",
    authors: "Martinez, C.L. et al.",
    year: 2023,
    journal: "Wound Repair and Regeneration",
    interest: "PPP",
    tags: ["cicatrização", "feridas crônicas", "scaffold"],
    status: "raw",
    practiceChange: "PPP serve como veículo para liberação controlada de fatores de crescimento."
  },
  {
    id: "7",
    title: "BMP-2 in Spinal Fusion: Long-Term Outcomes and Safety Profile",
    authors: "Johnson, D.R. et al.",
    year: 2023,
    journal: "Spine Journal",
    interest: "BMP",
    tags: ["coluna", "fusão espinhal", "BMP-2", "segurança"],
    status: "curated",
    practiceChange: "BMP-2 apresenta taxa de fusão superior mas requer dosagem cuidadosa."
  },
  {
    id: "8",
    title: "Bone Morphogenetic Proteins in Non-Union Fractures: Current Evidence",
    authors: "Williams, P.T. et al.",
    year: 2024,
    journal: "Journal of Bone and Joint Surgery",
    interest: "BMP",
    tags: ["pseudoartrose", "fraturas", "consolidação óssea"],
    status: "raw",
    practiceChange: "BMPs podem reduzir tempo de consolidação em pseudoartroses refratárias."
  }
];

const interestOptions = [
  { value: "all", label: "Todos" },
  { value: "PRP", label: "PRP" },
  { value: "PRF", label: "PRF" },
  { value: "PPP", label: "PPP" },
  { value: "BMP", label: "BMP" },
];

const interestColors: Record<string, string> = {
  PRP: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PRF: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  PPP: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  BMP: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function CuradoriaClinica() {
  const [interestFilter, setInterestFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredArticles = useMemo(() => {
    return mockArticles.filter((article) => {
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
  }, [interestFilter, searchQuery]);

  const clearFilters = () => {
    setInterestFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = interestFilter !== "all" || searchQuery.trim() !== "";

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
                  {article.status === "curated" ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1">
                      <Sparkles className="h-3 w-3" />
                      Curadoria disponível
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                      Sem curadoria
                    </Badge>
                  )}
                </div>

                {/* Insight Clínico */}
                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Insight clínico
                  </p>
                  <p className="text-sm text-foreground">
                    {article.practiceChange}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    disabled
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ler artigo original
                  </Button>
                  {article.status === "curated" ? (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      disabled
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ver curadoria
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      disabled
                    >
                      Solicitar curadoria
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
