import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Beaker, ArrowLeft, Loader2, AlertTriangle, Brain } from 'lucide-react';

export default function EduDecisionLabDetail() {
  const { scenarioId } = useParams();

  interface EduScenario {
    id: string;
    title: string;
    context: string | null;
    options: any[] | null;
    module_id: string;
  }

  const { data: scenario, isLoading } = useQuery({
    queryKey: ['edu-scenario', scenarioId],
    queryFn: async (): Promise<EduScenario | null> => {
      const { data, error } = await supabase
        .from('edu_decision_scenarios' as any)
        .select('id, title, context, options, module_id')
        .eq('id', scenarioId)
        .single();

      if (error) throw error;
      return data as unknown as EduScenario;
    },
    enabled: !!scenarioId,
  });

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
          <Link to={`/edu/modules/${scenario?.module_id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* Educational Disclaimer Banner */}
      <Alert className="bg-warning/10 border-warning">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-warning-foreground">
          <strong>Ambiente educacional.</strong> Este exercício de raciocínio clínico não representa decisão clínica real e não gera SCORE.
        </AlertDescription>
      </Alert>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Beaker className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{scenario?.title || 'Decision Lab'}</h1>
          </div>
        </div>
      </div>

      {/* Scenario Context */}
      {scenario?.context && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              Contexto do Cenário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{scenario.context}</p>
          </CardContent>
        </Card>
      )}

      {/* Decision Options */}
      {scenario?.options && Array.isArray(scenario.options) && scenario.options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Opções de Decisão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scenario.options.map((option: any, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 px-4 text-left"
                >
                  <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                  <span>{typeof option === 'string' ? option : option.text}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!scenario?.context && (!scenario?.options || scenario.options.length === 0)) && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Cenário em preparação.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
