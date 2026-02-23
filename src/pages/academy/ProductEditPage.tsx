import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  useAcademyProduct, useUpdateProduct, useSubmitForReview,
  useCourseModules, useCreateModule, useCreateLesson,
  useMentorshipCohorts, useCreateCohort, useCreateMentorshipSession,
  useSubscriptionPosts, useCreateSubscriptionPost,
  useProductReviewNotes,
} from "@/hooks/useAcademyProducts";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Send, ChevronDown, BookOpen, Users, Repeat, MessageSquare, Upload, Video, FileUp } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { draft: 'Rascunho', in_review: 'Em Revisão', published: 'Publicado', archived: 'Arquivado' };

const ProductEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useAcademyProduct(id);
  const updateProduct = useUpdateProduct();
  const submitForReview = useSubmitForReview();
  const { data: modules = [] } = useCourseModules(product?.type === 'course' ? id : undefined);
  const { data: cohorts = [] } = useMentorshipCohorts(product?.type === 'mentorship' ? id : undefined);
  const { data: posts = [] } = useSubscriptionPosts(product?.type === 'subscription' ? id : undefined);
  const { data: reviewNotes = [] } = useProductReviewNotes(id);
  const createModule = useCreateModule();
  const createLesson = useCreateLesson();
  const createCohort = useCreateCohort();
  const createSession = useCreateMentorshipSession();
  const createPost = useCreateSubscriptionPost();

  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState<Record<string, string>>({});
  const [newCohortTitle, setNewCohortTitle] = useState('');
  const [newSessionTitle, setNewSessionTitle] = useState<Record<string, string>>({});
  const [newPostTitle, setNewPostTitle] = useState('');

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!product) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Produto não encontrado</div>;

  const canEdit = product.status === 'draft' || product.status === 'in_review';

  const handleSave = () => {
    if (!id) return;
    const updates: any = {};
    if (editForm.title !== undefined) updates.title = editForm.title;
    if (editForm.description !== undefined) updates.description = editForm.description;
    if (editForm.subtitle !== undefined) updates.subtitle = editForm.subtitle || null;
    if (editForm.category !== undefined) updates.category = editForm.category || null;
    if (editForm.price_cents !== undefined) updates.price_cents = editForm.price_cents ? Math.round(parseFloat(editForm.price_cents) * 100) : null;
    if (Object.keys(updates).length > 0) {
      updateProduct.mutate({ id, ...updates });
    }
  };

  const handleAddModule = () => {
    if (!newModuleTitle.trim() || !id) return;
    createModule.mutate({ product_id: id, title: newModuleTitle.trim(), order_index: modules.length });
    setNewModuleTitle('');
  };

  const handleAddLesson = (moduleId: string) => {
    const title = newLessonTitle[moduleId]?.trim();
    if (!title || !id) return;
    const mod = modules.find(m => m.id === moduleId);
    createLesson.mutate({ module_id: moduleId, title, order_index: mod?.lessons?.length || 0, product_id: id });
    setNewLessonTitle(prev => ({ ...prev, [moduleId]: '' }));
  };

  const handleAddCohort = () => {
    if (!newCohortTitle.trim() || !id) return;
    createCohort.mutate({ product_id: id, title: newCohortTitle.trim() });
    setNewCohortTitle('');
  };

  const handleAddSession = (cohortId: string) => {
    const title = newSessionTitle[cohortId]?.trim();
    if (!title || !id) return;
    const cohort = cohorts.find(c => c.id === cohortId);
    createSession.mutate({ cohort_id: cohortId, title, order_index: cohort?.sessions?.length || 0, product_id: id });
    setNewSessionTitle(prev => ({ ...prev, [cohortId]: '' }));
  };

  const handleAddPost = () => {
    if (!newPostTitle.trim() || !id) return;
    createPost.mutate({ product_id: id, title: newPostTitle.trim() });
    setNewPostTitle('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/academy/professor/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-foreground">{product.title}</h1>
          <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
            {statusLabels[product.status]}
          </Badge>
        </div>

        {/* Review Notes */}
        {reviewNotes.length > 0 && (
          <Card className="mb-6 border-amber-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                <MessageSquare className="w-4 h-4" />
                Notas da Revisão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviewNotes.map(note => (
                <div key={note.id} className="text-sm text-muted-foreground border-l-2 border-amber-400 pl-3 mb-2">
                  {note.note}
                  <span className="block text-xs mt-1">{new Date(note.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    disabled={!canEdit}
                    defaultValue={product.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    disabled={!canEdit}
                    defaultValue={product.subtitle || ''}
                    onChange={e => setEditForm(f => ({ ...f, subtitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    disabled={!canEdit}
                    defaultValue={product.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    disabled={!canEdit}
                    defaultValue={product.category || ''}
                    onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                  />
                </div>
                {product.type !== 'subscription' && (
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number" step="0.01" min="0"
                      disabled={!canEdit}
                      defaultValue={product.price_cents ? (product.price_cents / 100).toFixed(2) : ''}
                      onChange={e => setEditForm(f => ({ ...f, price_cents: e.target.value }))}
                    />
                  </div>
                )}
                {canEdit && (
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSave} disabled={updateProduct.isPending}>
                      Salvar Rascunho
                    </Button>
                    {product.status === 'draft' && (
                      <Button
                        variant="outline"
                        onClick={() => id && submitForReview.mutate(id)}
                        disabled={submitForReview.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar para Revisão
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            {/* COURSE MODULES */}
            {product.type === 'course' && (
              <div className="space-y-4">
                {modules.map(mod => (
                  <Collapsible key={mod.id}>
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <CardTitle className="text-base">{mod.title}</CardTitle>
                            <Badge variant="secondary" className="text-xs">{mod.lessons?.length || 0} aulas</Badge>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-2">
                          {mod.lessons?.map(lesson => (
                            <div key={lesson.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                              <span className="text-muted-foreground w-6">{lesson.order_index + 1}.</span>
                              <span className="text-foreground">{lesson.title}</span>
                              {lesson.is_free_preview && <Badge variant="outline" className="text-xs">Preview</Badge>}
                            </div>
                          ))}
                          {canEdit && (
                            <div className="flex gap-2 mt-2">
                              <Input
                                placeholder="Título da aula"
                                value={newLessonTitle[mod.id] || ''}
                                onChange={e => setNewLessonTitle(prev => ({ ...prev, [mod.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleAddLesson(mod.id)}
                              />
                              <Button size="sm" variant="outline" onClick={() => handleAddLesson(mod.id)}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
                {canEdit && (
                  <div className="flex gap-2">
                    <Input placeholder="Nome do módulo" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddModule()} />
                    <Button variant="outline" onClick={handleAddModule}><Plus className="w-4 h-4 mr-2" /> Módulo</Button>
                  </div>
                )}
              </div>
            )}

            {/* MENTORSHIP COHORTS */}
            {product.type === 'mentorship' && (
              <div className="space-y-4">
                {cohorts.map(cohort => (
                  <Collapsible key={cohort.id}>
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <CardTitle className="text-base">{cohort.title}</CardTitle>
                            <Badge variant="secondary" className="text-xs">{cohort.sessions?.length || 0} sessões</Badge>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-2">
                          {cohort.sessions?.map(session => (
                            <div key={session.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                              <span className="text-muted-foreground w-6">{session.order_index + 1}.</span>
                              <span className="text-foreground">{session.title}</span>
                            </div>
                          ))}
                          {canEdit && (
                            <div className="flex gap-2 mt-2">
                              <Input
                                placeholder="Título da sessão"
                                value={newSessionTitle[cohort.id] || ''}
                                onChange={e => setNewSessionTitle(prev => ({ ...prev, [cohort.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleAddSession(cohort.id)}
                              />
                              <Button size="sm" variant="outline" onClick={() => handleAddSession(cohort.id)}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
                {canEdit && (
                  <div className="flex gap-2">
                    <Input placeholder="Nome da turma" value={newCohortTitle} onChange={e => setNewCohortTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCohort()} />
                    <Button variant="outline" onClick={handleAddCohort}><Plus className="w-4 h-4 mr-2" /> Turma</Button>
                  </div>
                )}
              </div>
            )}

            {/* SUBSCRIPTION POSTS */}
            {product.type === 'subscription' && (
              <div className="space-y-4">
                {posts.map(post => (
                  <Card key={post.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">{post.title}</span>
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                          {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {canEdit && (
                  <div className="flex gap-2">
                    <Input placeholder="Título do post" value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPost()} />
                    <Button variant="outline" onClick={handleAddPost}><Plus className="w-4 h-4 mr-2" /> Post</Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductEditPage;
