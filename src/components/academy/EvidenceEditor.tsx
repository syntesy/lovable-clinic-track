import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useProductArticlesWithDetails, useAddProductArticle, useRemoveProductArticle,
  useProductCollectionsWithDetails, useAddProductCollection, useRemoveProductCollection,
  useLessonArticlesWithDetails, useAddLessonArticle, useRemoveLessonArticle,
  useSearchPublishedArticles,
} from "@/hooks/useAcademyEvidence";
import { useMyCollections, useOfficialCollections } from "@/hooks/useAcademyCollections";
import { useAcademyRole } from "@/hooks/useAcademyRoles";
import { EvidenceArticleCard } from "./EvidenceArticleCard";
import { Plus, Search, Library, FlaskConical, BookOpen } from "lucide-react";

// ===== Product Evidence Editor =====
export function ProductEvidenceEditor({ productId }: { productId: string }) {
  const { data: articleLinks = [] } = useProductArticlesWithDetails(productId);
  const { data: collectionLinks = [] } = useProductCollectionsWithDetails(productId);
  const addArticle = useAddProductArticle();
  const removeArticle = useRemoveProductArticle();
  const addCollection = useAddProductCollection();
  const removeCollection = useRemoveProductCollection();

  const { data: myCollections = [] } = useMyCollections();
  const { data: officialCollections = [] } = useOfficialCollections();
  const { isAdmin } = useAcademyRole();

  const [search, setSearch] = useState("");
  const { data: searchResults = [] } = useSearchPublishedArticles(search);
  const [addRelType, setAddRelType] = useState("supports");
  const [addNote, setAddNote] = useState("");

  const linkedArticleIds = new Set(articleLinks.map((l: any) => l.article_id));
  const linkedCollectionIds = new Set(collectionLinks.map((l: any) => l.collection_id));
  const filteredResults = searchResults.filter((a: any) => !linkedArticleIds.has(a.id));

  const handleAddArticle = (articleId: string) => {
    addArticle.mutate({
      product_id: productId,
      article_id: articleId,
      relation_type: addRelType,
      note: addNote || undefined,
      order_index: articleLinks.length,
    });
    setAddNote("");
  };

  const handleAddCollection = (collectionId: string) => {
    addCollection.mutate({
      product_id: productId,
      collection_id: collectionId,
      order_index: collectionLinks.length,
    });
  };

  return (
    <div className="space-y-6">
      {/* Artigos do Curso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            Artigos do Curso
            <Badge variant="secondary">{articleLinks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search to add */}
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artigo para vincular..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Select value={addRelType} onValueChange={setAddRelType}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supports">Suporta</SelectItem>
                  <SelectItem value="recommended">Recomendado</SelectItem>
                  <SelectItem value="contrasts">Contrasta</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Nota (opcional)"
                value={addNote}
                onChange={e => setAddNote(e.target.value)}
                className="flex-1"
              />
            </div>
            {filteredResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredResults.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 border rounded text-sm hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.year} · {a.study_type}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleAddArticle(a.id)} disabled={addArticle.isPending}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked articles */}
          {articleLinks.map((link: any) => (
            <EvidenceArticleCard
              key={link.id}
              article={link.article}
              relationType={link.relation_type}
              note={link.note}
              showRemove
              onRemove={() => removeArticle.mutate({ id: link.id, product_id: productId, article_id: link.article_id })}
            />
          ))}
        </CardContent>
      </Card>

      {/* Coleções Vinculadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Library className="w-4 h-4 text-primary" />
            Coleções Vinculadas
            <Badge variant="secondary">{collectionLinks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* My collections */}
          {myCollections.filter(c => !linkedCollectionIds.has(c.id)).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Minhas Coleções</p>
              {myCollections.filter(c => !linkedCollectionIds.has(c.id)).map(col => (
                <div key={col.id} className="flex items-center justify-between p-2 border rounded text-sm mb-1">
                  <span>{col.title}</span>
                  <Button size="sm" variant="outline" onClick={() => handleAddCollection(col.id)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Official collections (admin only can link) */}
          {isAdmin && officialCollections.filter(c => !linkedCollectionIds.has(c.id)).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Coleções Oficiais</p>
              {officialCollections.filter(c => !linkedCollectionIds.has(c.id)).map(col => (
                <div key={col.id} className="flex items-center justify-between p-2 border rounded text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span>{col.title}</span>
                    <Badge variant="default" className="text-xs">Oficial</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleAddCollection(col.id)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Linked */}
          {collectionLinks.map((link: any) => (
            <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{link.collection?.title}</span>
                {link.collection?.kind === "official" && (
                  <Badge variant="default" className="text-xs">Oficial</Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => removeCollection.mutate({ id: link.id, product_id: productId, collection_id: link.collection_id })}
              >
                Remover
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Lesson Evidence Editor =====
export function LessonEvidenceEditor({ lessonId, productId }: { lessonId: string; productId: string }) {
  const { data: articleLinks = [] } = useLessonArticlesWithDetails(lessonId);
  const addArticle = useAddLessonArticle();
  const removeArticle = useRemoveLessonArticle();

  const [search, setSearch] = useState("");
  const { data: searchResults = [] } = useSearchPublishedArticles(search);
  const [addRelType, setAddRelType] = useState("supports");
  const [addNote, setAddNote] = useState("");

  const linkedIds = new Set(articleLinks.map((l: any) => l.article_id));
  const filteredResults = searchResults.filter((a: any) => !linkedIds.has(a.id));

  const handleAdd = (articleId: string) => {
    addArticle.mutate({
      lesson_id: lessonId,
      article_id: articleId,
      relation_type: addRelType,
      note: addNote || undefined,
      order_index: articleLinks.length,
      product_id: productId,
    });
    setAddNote("");
  };

  return (
    <div className="space-y-3 mt-3 border-t pt-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <FlaskConical className="w-3 h-3 text-primary" />
        Evidências desta Aula
        <Badge variant="secondary" className="text-xs">{articleLinks.length}</Badge>
      </h4>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar artigo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 h-8 text-xs"
        />
        <Select value={addRelType} onValueChange={setAddRelType}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="supports">Suporta</SelectItem>
            <SelectItem value="recommended">Recomendado</SelectItem>
            <SelectItem value="contrasts">Contrasta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredResults.length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filteredResults.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-1.5 border rounded text-xs hover:bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="truncate">{a.title}</p>
                <p className="text-muted-foreground">{a.year} · {a.study_type}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleAdd(a.id)} className="h-6 px-2">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Linked */}
      {articleLinks.map((link: any) => (
        <div key={link.id} className="flex items-center justify-between p-2 border rounded text-xs">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{link.article?.title}</p>
            <p className="text-muted-foreground">{link.article?.year} · {link.relation_type}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive h-6 px-2"
            onClick={() => removeArticle.mutate({ id: link.id, lesson_id: lessonId, article_id: link.article_id, product_id: productId })}
          >
            ×
          </Button>
        </div>
      ))}
    </div>
  );
}
