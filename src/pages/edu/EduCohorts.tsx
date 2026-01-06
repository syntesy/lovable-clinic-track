import { useEduEnrollments } from '@/hooks/useEduMembership';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EduCohorts() {
  const { data: enrollments, isLoading } = useEduEnrollments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/edu">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Turmas</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe seu progresso em todas as turmas matriculadas.
        </p>
      </div>

      {/* Cohorts List */}
      {enrollments && enrollments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment: any) => (
            <Card key={enrollment.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline">Em andamento</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg mb-2">
                  {enrollment.cohort?.name || 'Turma'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">0%</span>
                    </div>
                    <Progress value={0} />
                  </div>
                  <Button className="w-full" asChild>
                    <Link to={`/edu/cohorts/${enrollment.cohort_id}`}>
                      Acessar Turma
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
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
                Você ainda não está matriculado em nenhuma turma.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Entre em contato com sua instituição para solicitar matrícula.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
