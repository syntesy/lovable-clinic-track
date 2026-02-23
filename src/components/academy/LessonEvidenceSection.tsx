import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLessonArticlesWithDetails, useProductArticlesWithDetails } from "@/hooks/useAcademyEvidence";
import { EvidenceArticleCard } from "./EvidenceArticleCard";
import { FlaskConical } from "lucide-react";

interface LessonEvidenceSectionProps {
  lessonId: string;
  productId: string;
}

export function LessonEvidenceSection({ lessonId, productId }: LessonEvidenceSectionProps) {
  const { data: lessonArticles = [] } = useLessonArticlesWithDetails(lessonId);
  const { data: productArticles = [] } = useProductArticlesWithDetails(productId);

  if (!lessonArticles.length && !productArticles.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="w-4 h-4 text-primary" />
          Evidências
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lessonArticles.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Desta Aula <Badge variant="secondary" className="text-xs ml-1">{lessonArticles.length}</Badge>
            </h4>
            <div className="space-y-2">
              {lessonArticles.map((link: any) => (
                <EvidenceArticleCard
                  key={link.id}
                  article={link.article}
                  relationType={link.relation_type}
                  note={link.note}
                />
              ))}
            </div>
          </div>
        )}
        {productArticles.length > 0 && (
          <div className={lessonArticles.length > 0 ? "pt-3 border-t" : ""}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Do Curso <Badge variant="secondary" className="text-xs ml-1">{productArticles.length}</Badge>
            </h4>
            <div className="space-y-2">
              {productArticles.map((link: any) => (
                <EvidenceArticleCard
                  key={link.id}
                  article={link.article}
                  relationType={link.relation_type}
                  note={link.note}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
