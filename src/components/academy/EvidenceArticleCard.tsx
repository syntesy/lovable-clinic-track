import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAcademyArticleDetail } from "@/hooks/useAcademyArticles";
import { ExternalLink, BookOpen, X } from "lucide-react";
import { EvidenceMethodSeal } from "./EvidenceMethodSeal";

interface EvidenceArticleCardProps {
  article: {
    id: string;
    title: string;
    authors?: string | null;
    journal?: string | null;
    year: number;
    study_type: string;
    interventions?: string[];
    pathologies?: string[];
    pubmed_url?: string | null;
    doi_url?: string | null;
    summary_short?: string;
  };
  relationType?: string;
  note?: string | null;
  onRemove?: () => void;
  showRemove?: boolean;
}

const relationBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  supports: { label: "Suporta", variant: "default" },
  recommended: { label: "Recomendado", variant: "secondary" },
  contrasts: { label: "Contrasta", variant: "outline" },
};

export function EvidenceArticleCard({ article, relationType, note, onRemove, showRemove }: EvidenceArticleCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const { data: fullArticle } = useAcademyArticleDetail(showDetail ? article.id : null);
  const externalUrl = article.pubmed_url || article.doi_url;
  const rel = relationType ? relationBadge[relationType] : null;

  return (
    <>
      <div className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">{article.study_type}</Badge>
              <span className="text-xs text-muted-foreground">{article.year}</span>
              {article.journal && <span className="text-xs text-muted-foreground">· {article.journal}</span>}
              {rel && <Badge variant={rel.variant} className="text-xs">{rel.label}</Badge>}
            </div>
            <h4 className="font-medium text-foreground text-sm line-clamp-2">{article.title}</h4>
            {article.authors && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{article.authors}</p>
            )}
            {(article.interventions?.length || article.pathologies?.length) ? (
              <div className="flex flex-wrap gap-1 mt-2">
                {article.interventions?.slice(0, 3).map(i => (
                  <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                ))}
                {article.pathologies?.slice(0, 3).map(p => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            ) : null}
            {note && <p className="text-xs text-muted-foreground mt-2 italic">"{note}"</p>}
            <EvidenceMethodSeal className="mt-2" />
          </div>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowDetail(true)}>
              <BookOpen className="w-3 h-3 mr-1" /> Resumo
            </Button>
            {externalUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" /> PubMed
                </a>
              </Button>
            )}
            {showRemove && onRemove && (
              <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive">
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{article.title}</DialogTitle>
          </DialogHeader>
          {fullArticle ? (
            <div className="space-y-4">
              {fullArticle.authors && <p className="text-sm text-muted-foreground">{fullArticle.authors}</p>}
              <div className="flex gap-2 flex-wrap">
                <Badge>{fullArticle.study_type}</Badge>
                <span className="text-sm text-muted-foreground">{fullArticle.journal} · {fullArticle.year}</span>
              </div>
              {fullArticle.summary_full && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Resumo Completo</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{fullArticle.summary_full}</p>
                </div>
              )}
              {fullArticle.effect_summary && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Efeito</h4>
                  <p className="text-sm text-muted-foreground">{fullArticle.effect_summary}</p>
                </div>
              )}
              {fullArticle.limitations?.length ? (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Limitações</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {fullArticle.limitations.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              ) : null}
              {fullArticle.follow_up && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Follow-up</h4>
                  <p className="text-sm text-muted-foreground">{fullArticle.follow_up}</p>
                </div>
              )}
              <div className="flex gap-2">
                {fullArticle.pubmed_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={fullArticle.pubmed_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" /> PubMed
                    </a>
                  </Button>
                )}
                {fullArticle.doi_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={fullArticle.doi_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" /> DOI
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
