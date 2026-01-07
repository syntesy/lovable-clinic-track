/**
 * CurationContextAccordion - Accordion de curadoria contextual
 * 
 * Exibe curadoria relacionada à intervenção com fallback item→categoria→geral.
 * Colapsado por padrão para não criar fricção.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, AlertCircle, Info, Clock } from "lucide-react";
import { useContextualCuration, CurationSource } from "@/hooks/useContextualCuration";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CurationContextAccordionProps {
  therapyItemCode: string | null | undefined;
}

const SOURCE_LABELS: Record<CurationSource, string> = {
  item: "Curadoria específica do procedimento",
  category: "Curadoria da categoria",
  general: "Curadoria geral",
  none: "",
};

function getCurationDate(curation: { 
  updated_at: string | null; 
  reviewed_at: string | null; 
  created_at: string;
}): string | null {
  const raw = curation.updated_at ?? curation.reviewed_at ?? curation.created_at;
  if (!raw) return null;
  try {
    const date = parseISO(raw);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return null;
  }
}

export function CurationContextAccordion({
  therapyItemCode,
}: CurationContextAccordionProps) {
  const { status, source, curations, error, shouldShow } = useContextualCuration(therapyItemCode);

  // Don't render if curadoria not required or no item
  if (!shouldShow) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="curation" className="border rounded-lg bg-muted/30">
        <AccordionTrigger className="px-3 py-2 hover:no-underline">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Evidência relacionada</span>
            {source !== "none" && status === "success" && (
              <Badge variant="outline" className="text-xs font-normal">
                {curations.length}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3">
          {/* Loading state */}
          {status === "loading" && (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
              <AlertCircle className="w-4 h-4" />
              <span>Falha ao carregar curadoria</span>
            </div>
          )}

          {/* Success with curations */}
          {status === "success" && curations.length > 0 && (
            <div className="space-y-3">
              {/* Source label */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="w-3 h-3" />
                <span>Fonte: {SOURCE_LABELS[source]}</span>
              </div>

              {/* Curation cards */}
              {curations.map((curation) => (
                <div
                  key={curation.id}
                  className="border rounded-lg p-3 bg-card space-y-2"
                >
                  {/* Article info */}
                  {curation.article_title && (
                    <h4 className="text-sm font-medium line-clamp-2">
                      {curation.article_title}
                    </h4>
                  )}
                  {curation.article_authors && (
                    <p className="text-xs text-muted-foreground">
                      {curation.article_authors}
                      {curation.article_year && ` (${curation.article_year})`}
                    </p>
                  )}

                  {/* Key results or objective */}
                  {curation.results_key && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {curation.results_key}
                    </p>
                  )}
                  {!curation.results_key && curation.objective && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {curation.objective}
                    </p>
                  )}

                  {/* Clinical takeaways */}
                  {curation.clinical_takeaways && curation.clinical_takeaways.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {curation.clinical_takeaways.slice(0, 2).map((takeaway, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {takeaway.length > 40 ? takeaway.slice(0, 40) + "…" : takeaway}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Footer: Evidence level + Timestamp */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                    {curation.evidence_level && (
                      <Badge variant="outline" className="text-xs">
                        Nível: {curation.evidence_level}
                      </Badge>
                    )}
                    {getCurationDate(curation) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Atualizado: {getCurationDate(curation)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Success but no curations */}
          {status === "success" && curations.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded">
              <Info className="w-4 h-4" />
              <span>Sem curadoria cadastrada para esta intervenção.</span>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
