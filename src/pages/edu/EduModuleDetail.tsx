import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FlaskConical, ClipboardCheck, ChevronRight, Loader2, ArrowLeft, Beaker, Play } from 'lucide-react';

export default function EduModuleDetail() {
  const { moduleId } = useParams();

  const { data: module, isLoading } = useQuery({
    queryKey: ['edu-module', moduleId],
    queryFn: async (): Promise<{ id: string; title: string; description: string | null; cohort_id: string; published: boolean } | null> => {
      const { data, error } = await supabase
        .from('edu_modules' as any)
        .select('id, title, description, cohort_id, published')
        .eq('id', moduleId)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!moduleId,
  });

  // Fetch learning objects
  const { data: learningObjects } = useQuery({
    queryKey: ['edu-learning-objects', moduleId],
    queryFn: async (): Promise<Array<{ id: string; title: string; type: string; sort_order: number; published: boolean }>> => {
      const { data, error } = await supabase
        .from('edu_learning_objects' as any)
        .select('id, title, type, sort_order, published')
        .eq('module_id', moduleId)
        .eq('published', true)
        .order('sort_order');

      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!moduleId,
  });

  // Fetch cases
  const { data: cases } = useQuery({
    queryKey: ['edu-cases', moduleId],
    queryFn: async (): Promise<Array<{ id: string; title: string; difficulty: string; sort_order: number; published: boolean }>> => {
      const { data, error } = await supabase
        .from('edu_cases' as any)
        .select('id, title, difficulty, sort_order, published')
        .eq('module_id', moduleId)
        .eq('published', true)
        .order('sort_order');

      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!moduleId,
  });

  // Fetch decision scenarios
  const { data: scenarios } = useQuery({
    queryKey: ['edu-scenarios', moduleId],
    queryFn: async (): Promise<Array<{ id: string; title: string; sort_order: number; published: boolean }>> => {
      const { data, error } = await supabase
        .from('edu_decision_scenarios' as any)
        .select('id, title, sort_order, published')
        .eq('module_id', moduleId)
        .eq('published', true)
        .order('sort_order');

      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!moduleId,
  });

  // Fetch checkpoints
  const { data: checkpoints } = useQuery({
    queryKey: ['edu-checkpoints', moduleId],
    queryFn: async (): Promise<Array<{ id: string; title: string; checkpoint_type: string; sort_order: number; published: boolean }>> => {
      const { data, error } = await supabase
        .from('edu_checkpoints' as any)
        .select('id, title, checkpoint_type, sort_order, published')
        .eq('module_id', moduleId)
        .eq('published', true)
        .order('sort_order');

      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!moduleId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'document': return FileText;
      default: return FileText;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Badge variant="outline" className="text-success border-success">Iniciante</Badge>;
      case 'intermediate': return <Badge variant="outline" className="text-warning border-warning">Intermediário</Badge>;
      case 'advanced': return <Badge variant="outline" className="text-destructive border-destructive">Avançado</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/edu/cohorts/${module?.cohort_id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{module?.title || 'Módulo'}</h1>
        {module?.description && (
          <p className="text-muted-foreground mt-1">{module.description}</p>
        )}
      </div>

      {/* Learning Objects Section */}
      {learningObjects && learningObjects.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Conteúdos
          </h2>
          <div className="space-y-2">
            {learningObjects.map((obj: any) => {
              const Icon = getTypeIcon(obj.type);
              return (
                <Card key={obj.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <Link to={`/edu/learning/${obj.id}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{obj.title}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Cases Section */}
      {cases && cases.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Casos Clínicos
          </h2>
          <div className="space-y-2">
            {cases.map((c: any) => (
              <Card key={c.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <Link to={`/edu/cases/${c.id}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FlaskConical className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{c.title}</span>
                      {getDifficultyBadge(c.difficulty)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Decision Lab Section */}
      {scenarios && scenarios.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            Decision Reasoning Lab™
          </h2>
          <div className="space-y-2">
            {scenarios.map((s: any) => (
              <Card key={s.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <Link to={`/edu/decision-lab/${s.id}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Beaker className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{s.title}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Checkpoints Section */}
      {checkpoints && checkpoints.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Checkpoints
          </h2>
          <div className="space-y-2">
            {checkpoints.map((cp: any) => (
              <Card key={cp.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <Link to={`/edu/checkpoints/${cp.id}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{cp.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">{cp.checkpoint_type}</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!learningObjects?.length && !cases?.length && !scenarios?.length && !checkpoints?.length) && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum conteúdo publicado neste módulo ainda.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
