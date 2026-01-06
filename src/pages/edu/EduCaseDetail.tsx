import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, ArrowLeft, Loader2, User, Stethoscope, FileText } from 'lucide-react';

export default function EduCaseDetail() {
  const { caseId } = useParams();

  interface EduCase {
    id: string;
    title: string;
    difficulty: string;
    presentation: string | null;
    history: string | null;
    exam_findings: string | null;
    module_id: string;
  }

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['edu-case', caseId],
    queryFn: async (): Promise<EduCase | null> => {
      const { data, error } = await supabase
        .from('edu_cases' as any)
        .select('id, title, difficulty, presentation, history, exam_findings, module_id')
        .eq('id', caseId)
        .single();

      if (error) throw error;
      return data as unknown as EduCase;
    },
    enabled: !!caseId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Badge className="bg-success/10 text-success border-success">Iniciante</Badge>;
      case 'intermediate': return <Badge className="bg-warning/10 text-warning border-warning">Intermediário</Badge>;
      case 'advanced': return <Badge className="bg-destructive/10 text-destructive border-destructive">Avançado</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/edu/modules/${caseData?.module_id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{caseData?.title || 'Caso Clínico'}</h1>
          </div>
          {getDifficultyBadge(caseData?.difficulty)}
        </div>
      </div>

      {/* Case Content */}
      <div className="grid gap-6">
        {caseData?.presentation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Apresentação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{caseData.presentation}</p>
            </CardContent>
          </Card>
        )}

        {caseData?.history && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                História Clínica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{caseData.history}</p>
            </CardContent>
          </Card>
        )}

        {caseData?.exam_findings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5 text-primary" />
                Achados do Exame
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{caseData.exam_findings}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
