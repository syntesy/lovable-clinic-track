import { useQuery } from '@tanstack/react-query';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PatientLayout } from '@/components/patient/PatientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calendar, User, Eye, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PatientReports() {
  const { session } = usePatientAuth();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['patient-reports', session?.patientId],
    queryFn: async () => {
      if (!session?.patientId) return [];

      const { data, error } = await supabase
        .from('patient_evaluation_reports')
        .select('*')
        .eq('patient_id', session.patientId)
        .eq('is_visible_to_patient', true)
        .order('generated_at', { ascending: false });

      if (error) throw error;

      // Registrar evento de visualização
      await supabase.from('patient_events').insert({
        patient_id: session.patientId,
        professional_id: session.professionalId,
        event_name: 'patient_view_reports_list',
        event_data: { count: data?.length || 0 }
      });

      return data || [];
    },
    enabled: !!session?.patientId
  });

  const handleViewReport = async (reportId: string) => {
    // Registrar evento de visualização de relatório específico
    if (session) {
      await supabase.from('patient_events').insert({
        patient_id: session.patientId,
        professional_id: session.professionalId,
        event_name: 'patient_view_report',
        event_data: { report_id: reportId }
      });
    }
    
    // TODO: Abrir modal ou página de visualização do relatório
    console.log('View report:', reportId);
  };

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Meus Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Relatórios clínicos liberados pelo seu profissional de saúde
          </p>
        </div>

        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Este relatório resume a avaliação realizada pelo seu profissional.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Carregando relatórios...</div>
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Relatório de Avaliação</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(report.generated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                          {report.professional_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {report.professional_name}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleViewReport(report.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                Nenhum relatório disponível
              </h3>
              <p className="text-muted-foreground">
                Quando seu profissional liberar relatórios, eles aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PatientLayout>
  );
}
