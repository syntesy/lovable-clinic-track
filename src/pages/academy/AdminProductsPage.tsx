import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useAllProductsAdmin, useAdminPublishProduct, useAdminArchiveProduct, useAdminRequestChanges,
} from "@/hooks/useAcademyProducts";
import { useIsAcademyAdmin } from "@/hooks/useAcademyRoles";
import { Check, X, MessageSquare, Archive, BookOpen, Users, Repeat, Package, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const typeLabels: Record<string, string> = { course: 'Curso', mentorship: 'Mentoria', subscription: 'Assinatura' };
const typeIcons: Record<string, any> = { course: BookOpen, mentorship: Users, subscription: Repeat };
const statusLabels: Record<string, string> = { draft: 'Rascunho', in_review: 'Em Revisão', published: 'Publicado', archived: 'Arquivado' };

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAcademyAdmin();
  const [tab, setTab] = useState('in_review');
  const { data: products = [], isLoading } = useAllProductsAdmin(tab);
  const publishProduct = useAdminPublishProduct();
  const archiveProduct = useAdminArchiveProduct();
  const requestChanges = useAdminRequestChanges();
  const [changesDialog, setChangesDialog] = useState<string | null>(null);
  const [changesNote, setChangesNote] = useState('');

  if (adminLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Verificando permissões...</div>;
  if (!isAdmin) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Acesso restrito a administradores.</div>;

  const handleRequestChanges = () => {
    if (!changesDialog || !changesNote.trim()) return;
    requestChanges.mutate({ productId: changesDialog, note: changesNote.trim() });
    setChangesDialog(null);
    setChangesNote('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/academy/home')} className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-6">Gestão de Produtos — Academy</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="in_review">Em Revisão</TabsTrigger>
            <TabsTrigger value="published">Publicados</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
            <TabsTrigger value="archived">Arquivados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : products.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum produto neste filtro.</CardContent></Card>
            ) : (
              <div className="space-y-4 mt-4">
                {products.map(product => {
                  const TypeIcon = typeIcons[product.type] || Package;
                  return (
                    <Card key={product.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                            <TypeIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-foreground">{product.title}</h3>
                              <Badge variant="secondary">{typeLabels[product.type]}</Badge>
                              <Badge variant="outline">{statusLabels[product.status]}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                            {product.price_cents != null && (
                              <p className="text-sm font-medium text-foreground">R$ {(product.price_cents / 100).toFixed(2)}</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {product.status === 'in_review' && (
                              <>
                                <Button size="sm" onClick={() => publishProduct.mutate(product.id)} disabled={publishProduct.isPending}>
                                  <Check className="w-4 h-4 mr-1" /> Aprovar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setChangesDialog(product.id)}>
                                  <MessageSquare className="w-4 h-4 mr-1" /> Ajustes
                                </Button>
                              </>
                            )}
                            {product.status !== 'archived' && (
                              <Button size="sm" variant="ghost" onClick={() => archiveProduct.mutate(product.id)} disabled={archiveProduct.isPending}>
                                <Archive className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Changes Dialog */}
      <Dialog open={!!changesDialog} onOpenChange={() => setChangesDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Ajustes</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Descreva os ajustes necessários..."
            value={changesNote}
            onChange={e => setChangesNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesDialog(null)}>Cancelar</Button>
            <Button onClick={handleRequestChanges} disabled={!changesNote.trim() || requestChanges.isPending}>
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductsPage;
