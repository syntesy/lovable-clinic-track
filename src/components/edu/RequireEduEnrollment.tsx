import { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldX, BookX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RequireEduEnrollmentProps {
  children: ReactNode;
  cohortId?: string;
}

export function RequireEduEnrollment({ children, cohortId: propCohortId }: RequireEduEnrollmentProps) {
  const params = useParams();
  const cohortId = propCohortId || params.cohortId;

  const { data: enrollment, isLoading, error } = useQuery({
    queryKey: ['edu-enrollment-check', cohortId],
    queryFn: async () => {
      if (!cohortId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('edu_enrollments' as any)
        .select('id, status, cohort:edu_cohorts!cohort_id (id, name, status)')
        .eq('user_id', user.id)
        .eq('cohort_id', cohortId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar enrollment:', error);
        throw error;
      }

      return data;
    },
    enabled: !!cohortId,
    staleTime: 5 * 60 * 1000,
  });

  if (!cohortId) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando matrícula...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <ShieldX className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Erro de Verificação</h2>
              <p className="text-muted-foreground">
                Não foi possível verificar sua matrícula. Por favor, tente novamente.
              </p>
              <Button onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <BookX className="h-12 w-12 text-warning" />
              <h2 className="text-xl font-semibold">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Você não está matriculado nesta turma.
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com sua instituição para solicitar matrícula.
              </p>
              <Button variant="outline" asChild>
                <a href="/edu">Voltar para Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
