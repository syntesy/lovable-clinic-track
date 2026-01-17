import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Edit, Trash2, ArrowLeft, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentInstitution } from '@/hooks/useEduMembership';
import { useNavigate } from 'react-router-dom';

interface Module {
  id: string;
  title: string;
  description: string | null;
  status: string;
  sort_order: number;
  cohort_id: string;
  cohort?: { id: string; name: string };
}

interface Cohort {
  id: string;
  name: string;
  status: string;
}

export default function EduTeacherModules() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { institution } = useCurrentInstitution();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cohort_id: '',
    status: 'draft',
  });

  // Fetch cohorts for dropdown
  const { data: cohorts = [] } = useQuery({
    queryKey: ['edu-cohorts-list', institution?.id],
    queryFn: async (): Promise<Cohort[]> => {
      if (!institution?.id) return [];
      const { data, error } = await supabase
        .from('edu_cohorts' as any)
        .select('id, name, status')
        .eq('institution_id', institution.id)
        .order('name');
      
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!institution?.id,
  });

  // Fetch modules
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['edu-modules-list', institution?.id],
    queryFn: async (): Promise<Module[]> => {
      if (!institution?.id) return [];
      const { data, error } = await supabase
        .from('edu_modules' as any)
        .select('id, title, description, status, sort_order, cohort_id')
        .eq('institution_id', institution.id)
        .order('sort_order');
      
      if (error) throw error;

      // Map cohort names
      const modulesWithCohort = (data as any[]).map(m => ({
        ...m,
        cohort: cohorts.find(c => c.id === m.cohort_id)
      }));

      return modulesWithCohort;
    },
    enabled: !!institution?.id && cohorts.length >= 0,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!institution?.id) throw new Error('Instituição não encontrada');
      
      const { error } = await supabase
        .from('edu_modules' as any)
        .insert({
          institution_id: institution.id,
          title: data.title.trim(),
          description: data.description.trim() || null,
          cohort_id: data.cohort_id,
          status: data.status,
          sort_order: modules.length + 1,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-modules-list'] });
      toast({ title: 'Módulo criado com sucesso!' });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao criar módulo:', error);
      toast({
        title: 'Erro ao criar módulo',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('edu_modules' as any)
        .update({
          title: data.title.trim(),
          description: data.description.trim() || null,
          cohort_id: data.cohort_id,
          status: data.status,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-modules-list'] });
      toast({ title: 'Módulo atualizado com sucesso!' });
      setEditingModule(null);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao atualizar módulo:', error);
      toast({
        title: 'Erro ao atualizar módulo',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('edu_modules' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-modules-list'] });
      toast({ title: 'Módulo excluído com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao excluir módulo:', error);
      toast({
        title: 'Erro ao excluir módulo',
        description: 'Este módulo pode ter conteúdos vinculados.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', cohort_id: '', status: 'draft' });
  };

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.cohort_id) {
      toast({
        title: 'Preencha os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingModule || !formData.title.trim() || !formData.cohort_id) {
      toast({
        title: 'Preencha os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate({ id: editingModule.id, data: formData });
  };

  const openEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || '',
      cohort_id: module.cohort_id,
      status: module.status,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline',
    };
    const labels: Record<string, string> = {
      published: 'Publicado',
      draft: 'Rascunho',
      archived: 'Arquivado',
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Módulos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os módulos de cada turma.
            </p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Módulo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cohort">Turma *</Label>
                <Select
                  value={formData.cohort_id}
                  onValueChange={(v) => setFormData({ ...formData, cohort_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        Nenhuma turma disponível
                      </SelectItem>
                    ) : (
                      cohorts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Módulo 1 - Fundamentos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do módulo..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Módulo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modules List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Nenhum módulo criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro módulo para organizar os conteúdos.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Módulo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {modules.map((module) => (
            <Card key={module.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{module.title}</h3>
                        {getStatusBadge(module.status)}
                      </div>
                      {module.cohort && (
                        <p className="text-sm text-muted-foreground">
                          Turma: {module.cohort.name}
                        </p>
                      )}
                      {module.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(module)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir módulo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Todos os conteúdos vinculados serão desassociados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(module.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Módulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cohort">Turma *</Label>
              <Select
                value={formData.cohort_id}
                onValueChange={(v) => setFormData({ ...formData, cohort_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
