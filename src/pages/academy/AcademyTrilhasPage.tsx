import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Route, Search, BookOpen, Loader2, ExternalLink } from "lucide-react";
import { useAcademyArticles, useArticleFilterOptions } from "@/hooks/useAcademyArticles";
import { computeEvidenceScore } from "@/hooks/useEvidenceScore";
import { EvidenceMethodSeal } from "@/components/academy/EvidenceMethodSeal";

const LEVELS = [
  { level: 1, label: "Nível 1 — Revisões Sistemáticas e Meta-análises", types: ["Meta-análise", "Revisão Sistemática", "Systematic Review", "Meta-analysis"] },
  { level: 2, label: "Nível 2 — Ensaios Clínicos Randomizados", types: ["ECR", "RCT", "Ensaio Clínico Randomizado", "Randomized Controlled Trial"] },
  { level: 3, label: "Nível 3 — Estudos Observacionais e outros", types: [] }, // catch-all
];

function classifyLevel(studyType: string): number {
  const st = studyType.toLowerCase();
  if (st.includes("meta") || st.includes("revisão sistemática") || st.includes("systematic")) return 1;
  if (st.includes("ecr") || st.includes("rct") || st.includes("randomiz")) return 2;
  return 3;
}

function getScoreBadge(score: number | null) {
  if (score == null) return null;
  const color = score >= 70 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
    : score >= 40 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" 
    : "bg-red-500/10 text-red-400 border-red-500/30";
  return <Badge variant="outline" className={`text-xs ${color}`}>Score: {score}</Badge>;
}

export default function AcademyTrilhasPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("");
  const [filterType, setFilterType] = useState<"intervention" | "pathology">("intervention");
  const { data: options } = useArticleFilterOptions();

  const filters = useMemo(() => {
    if (!theme) return {};
    return filterType === "intervention" 
      ? { interventions: [theme], per_page: 100 } 
      : { pathologies: [theme], per_page: 100 };
  }, [theme, filterType]);

  const { data, isLoading } = useAcademyArticles(theme ? filters : { per_page: 0 });

  const trailArticles = useMemo(() => {
    if (!data?.articles) return [];
    return [...data.articles]
      .sort((a, b) => {
        const la = classifyLevel(a.study_type);
        const lb = classifyLevel(b.study_type);
        if (la !== lb) return la - lb;
        return (b.evidence_score ?? 0) - (a.evidence_score ?? 0);
      });
  }, [data]);

  const grouped = useMemo(() => {
    const map = new Map<number, typeof trailArticles>();
    for (const a of trailArticles) {
      const level = classifyLevel(a.study_type);
      if (!map.has(level)) map.set(level, []);
      map.get(level)!.push(a);
    }
    return map;
  }, [trailArticles]);

  const themeOptions = filterType === "intervention" 
    ? (options?.interventions ?? []) 
    : (options?.pathologies ?? []);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/academy/home")} className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Badge variant="secondary" className="mb-4"><Route className="w-3 h-3 mr-1" />Trilhas</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Trilhas de Aprendizado</h1>
          <p className="text-lg text-muted-foreground">Sequência lógica de leitura baseada no nível de evidência.</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Select value={filterType} onValueChange={(v) => { setFilterType(v as any); setTheme(""); }}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="intervention">Por Intervenção</SelectItem>
                <SelectItem value="pathology">Por Patologia</SelectItem>
              </SelectContent>
            </Select>

            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Selecione o tema..." />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!theme && (
            <Card className="text-center py-16">
              <CardContent>
                <Route className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Selecione um tema para montar a trilha de aprendizado.</p>
              </CardContent>
            </Card>
          )}

          {theme && isLoading && (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          )}

          {theme && !isLoading && trailArticles.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">Nenhum artigo publicado encontrado para "{theme}".</p>
              </CardContent>
            </Card>
          )}

          {theme && !isLoading && trailArticles.length > 0 && (
            <div className="space-y-8">
              {LEVELS.map(({ level, label }) => {
                const articles = grouped.get(level);
                if (!articles?.length) return null;
                return (
                  <div key={level}>
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Badge className="text-sm">{level}</Badge> {label}
                    </h2>
                    <div className="space-y-3">
                      {articles.map((a, idx) => (
                        <Card key={a.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                                  <Badge variant="secondary" className="text-xs">{a.study_type}</Badge>
                                  <span className="text-xs text-muted-foreground">{a.year}</span>
                                  {getScoreBadge(a.evidence_score)}
                                </div>
                                <h3 className="font-medium text-foreground text-sm line-clamp-2">{a.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.summary_short}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {(a.pubmed_url || a.doi_url) && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={(a.pubmed_url || a.doi_url)!} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground italic text-center mt-4">
            ⚕️ Trilha sugerida com base em tipo de estudo e score heurístico. A ordem não implica hierarquia clínica absoluta.
          </p>
        </div>
      </section>
    </div>
  );
}
