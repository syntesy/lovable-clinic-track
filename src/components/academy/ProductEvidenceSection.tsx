import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProductArticlesWithDetails, useProductCollectionsWithDetails } from "@/hooks/useAcademyEvidence";
import { EvidenceArticleCard } from "./EvidenceArticleCard";
import { BookOpen, Library, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductEvidenceSectionProps {
  productId: string;
}

export function ProductEvidenceSection({ productId }: ProductEvidenceSectionProps) {
  const { data: articleLinks = [] } = useProductArticlesWithDetails(productId);
  const { data: collectionLinks = [] } = useProductCollectionsWithDetails(productId);
  const [showAll, setShowAll] = useState(false);

  if (!articleLinks.length && !collectionLinks.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FlaskConical className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Base científica em construção</p>
        </CardContent>
      </Card>
    );
  }

  const visibleArticles = showAll ? articleLinks : articleLinks.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Base Científica
          <Badge variant="secondary">{articleLinks.length} artigos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Articles */}
        {visibleArticles.map((link: any) => (
          <EvidenceArticleCard
            key={link.id}
            article={link.article}
            relationType={link.relation_type}
            note={link.note}
          />
        ))}
        {articleLinks.length > 10 && !showAll && (
          <Button variant="outline" className="w-full" onClick={() => setShowAll(true)}>
            Ver mais ({articleLinks.length - 10} restantes)
          </Button>
        )}

        {/* Collections */}
        {collectionLinks.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <Library className="w-4 h-4" /> Coleções Vinculadas
            </h4>
            <div className="space-y-2">
              {collectionLinks.map((link: any) => (
                <Link
                  key={link.id}
                  to={`/academy/colecoes/${link.collection_id}`}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{link.collection?.title}</p>
                    {link.collection?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{link.collection.description}</p>
                    )}
                  </div>
                  {link.collection?.kind === "official" && (
                    <Badge variant="default" className="text-xs">Curadoria Oficial</Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
