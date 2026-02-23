import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FolderOpen, Plus, Star, Lock, Loader2, ArrowLeft } from "lucide-react";
import { useOfficialCollections, useMyCollections, useSaveCollection } from "@/hooks/useAcademyCollections";
import { useToast } from "@/hooks/use-toast";

export default function AcademyCollectionsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: official = [], isLoading: lo } = useOfficialCollections();
  const { data: personal = [], isLoading: lp } = useMyCollections();
  const saveCol = useSaveCollection();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    saveCol.mutate({ title: newTitle.trim(), description: newDesc.trim() || null, kind: "personal", is_public: false } as any, {
      onSuccess: () => {
        toast({ title: "Coleção criada" });
        setShowCreate(false);
        setNewTitle("");
        setNewDesc("");
      },
    });
  };

  const isLoading = lo || lp;

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <Badge variant="secondary" className="mb-4"><FolderOpen className="w-3 h-3 mr-1" />Coleções</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Coleções de Artigos</h1>
          <p className="text-lg text-muted-foreground">Organize e explore artigos científicos por tema.</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 space-y-10">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Official */}
              {official.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" /> Coleções Oficiais
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {official.map((col) => (
                      <Card key={col.id} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate(`/academy/colecoes/${col.id}`)}>
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-1">
                            {col.is_featured && <Badge className="bg-primary text-primary-foreground text-[10px]">Destaque</Badge>}
                            <Badge variant="secondary" className="text-[10px]">Oficial</Badge>
                          </div>
                          <CardTitle className="text-lg">{col.title}</CardTitle>
                          {col.description && <CardDescription className="line-clamp-2">{col.description}</CardDescription>}
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-5 h-5 text-muted-foreground" /> Minhas Coleções
                  </h2>
                  <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1">
                    <Plus className="w-4 h-4" /> Nova Coleção
                  </Button>
                </div>
                {personal.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Você ainda não criou nenhuma coleção.</p>
                      <Button variant="outline" onClick={() => setShowCreate(true)}>Criar primeira coleção</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {personal.map((col) => (
                      <Card key={col.id} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate(`/academy/colecoes/${col.id}`)}>
                        <CardHeader>
                          <CardTitle className="text-lg">{col.title}</CardTitle>
                          {col.description && <CardDescription className="line-clamp-2">{col.description}</CardDescription>}
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Coleção</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título da coleção" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Input placeholder="Descrição (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || saveCol.isPending}>
              {saveCol.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
