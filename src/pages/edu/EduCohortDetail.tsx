import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RequireEduEnrollment } from '@/components/edu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, FileText, FlaskConical, ClipboardCheck, ChevronRight, Loader2, ArrowLeft, Lock } from 'lucide-react';

export default function EduCohortDetail() {
  const { cohortId } = useParams();

  const { data: cohort, isLoading } = useQuery({
    queryKey: ['edu-cohort', cohortId],
    queryFn: async (): Promise<{ id: string; name: string; status: string; institution_id: string } | null> => {
      const { data, error } = await supabase
        .from('edu_cohorts' as any)
        .select('id, name, status, institution_id')
        .eq('id', cohortId)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!cohortId,
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['edu-cohort-modules', cohortId],
    queryFn: async (): Promise<Array<{ id: string; title: string; description: string | null; sort_order: number; published: boolean }>> => {
      const { data, error } = await supabase
        .from('edu_modules' as any)
        .select('id, title, description, sort_order, published')
        .eq('cohort_id', cohortId)
        .eq('published', true)
        .order('sort_order');

      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!cohortId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <RequireEduEnrollment cohortId={cohortId}>
      <div className="space-y-6">
        {/* Header with Breadcrumb */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/edu/cohorts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">{cohort?.name || 'Turma'}</h1>
          <p className="text-muted-foreground mt-1">
            Explore os módulos e conteúdos desta turma.
          </p>
        </div>

        {/* Modules List */}
        {modulesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : modules && modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((module: any, index: number) => (
              <Card key={module.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{module.title}</h3>
                        {module.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>0</span>
                        <FlaskConical className="h-4 w-4 ml-2" />
                        <span>0</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/edu/modules/${module.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum módulo publicado nesta turma ainda.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Aguarde a liberação pelo professor.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RequireEduEnrollment>
  );
}
