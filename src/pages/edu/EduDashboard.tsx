import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentInstitution, useEduEnrollments } from '@/hooks/useEduMembership';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Users, Trophy, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EduDashboard() {
  const { institution, role, isLoading: membershipLoading } = useCurrentInstitution();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEduEnrollments();

  const isLoading = membershipLoading || enrollmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-foreground">
          Bem-vindo ao Academy
        </h1>
        {institution && (
          <p className="text-muted-foreground mt-1">
            {institution.name}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Turmas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Módulos Completos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">0h</p>
                <p className="text-sm text-muted-foreground">Tempo de Estudo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">
                  {role === 'institution_admin' ? 'Admin' :
                   role === 'director' ? 'Diretor' :
                   role === 'teacher' ? 'Professor' : 'Estudante'}
                </p>
                <p className="text-sm text-muted-foreground">Seu Perfil</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Cohorts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Suas Turmas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/edu/cohorts">
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enrollments && enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.slice(0, 3).map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{enrollment.cohort?.name || 'Turma'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Em andamento
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">0%</p>
                      <p className="text-xs text-muted-foreground">Progresso</p>
                    </div>
                    <Progress value={0} className="w-24 hidden md:block" />
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/edu/cohorts/${enrollment.cohort_id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Você ainda não está matriculado em nenhuma turma.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Entre em contato com sua instituição para solicitar matrícula.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
