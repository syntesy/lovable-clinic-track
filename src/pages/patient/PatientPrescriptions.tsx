import { useQuery } from '@tanstack/react-query';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PatientLayout } from '@/components/patient/PatientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, Salad, Sparkles, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const prescriptionTypes = {
  alimentar: { label: 'Cuidados Alimentares', icon: Salad, color: 'bg-green-500' },
  medicamentosa: { label: 'Medicações', icon: Pill, color: 'bg-blue-500' },
  suplementar: { label: 'Suplementos', icon: Sparkles, color: 'bg-purple-500' }
};

export default function PatientPrescriptions() {
  const { session } = usePatientAuth();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['patient-prescriptions', session?.patientId],
    queryFn: async () => {
      if (!session?.patientId) return [];

      const { data, error } = await supabase
        .from('patient_prescriptions')
        .select('*')
        .eq('patient_id', session.patientId)
        .eq('is_visible_to_patient', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Registrar evento
      await supabase.from('patient_events').insert({
        patient_id: session.patientId,
        professional_id: session.professionalId,
        event_name: 'patient_view_prescriptions',
        event_data: { count: data?.length || 0 }
      });

      return data || [];
    },
    enabled: !!session?.patientId
  });

  const getPrescriptionsByType = (type: string) => {
    return prescriptions?.filter(p => p.prescription_type === type) || [];
  };

  const renderPrescriptionCard = (prescription: any) => {
    const typeInfo = prescriptionTypes[prescription.prescription_type as keyof typeof prescriptionTypes];
    const Icon = typeInfo?.icon || Pill;

    return (
      <Card key={prescription.id} className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${typeInfo?.color} bg-opacity-20 flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${typeInfo?.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <CardTitle className="text-base">{prescription.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary">
              {typeInfo?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm text-foreground">
              {prescription.content}
            </div>
            {prescription.notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Observações:</strong> {prescription.notes}
                </p>
              </div>
            )}
          </div>
          
          <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
              Siga exatamente as orientações do seu profissional de saúde.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = () => (
    <Card className="border-border/50">
      <CardContent className="py-12 text-center">
        <Pill className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">
          Nenhuma prescrição disponível
        </h3>
        <p className="text-muted-foreground">
          Quando seu profissional criar prescrições, elas aparecerão aqui.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Minhas Prescrições</h1>
          <p className="text-muted-foreground mt-1">
            Orientações e prescrições definidas pelo seu profissional
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Carregando prescrições...</div>
          </div>
        ) : prescriptions && prescriptions.length > 0 ? (
          <Tabs defaultValue="todas" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="alimentar">Alimentar</TabsTrigger>
              <TabsTrigger value="medicamentosa">Medicações</TabsTrigger>
              <TabsTrigger value="suplementar">Suplementos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="todas" className="space-y-4 mt-4">
              {prescriptions.map(renderPrescriptionCard)}
            </TabsContent>
            
            <TabsContent value="alimentar" className="space-y-4 mt-4">
              {getPrescriptionsByType('alimentar').length > 0 
                ? getPrescriptionsByType('alimentar').map(renderPrescriptionCard)
                : <EmptyState />}
            </TabsContent>
            
            <TabsContent value="medicamentosa" className="space-y-4 mt-4">
              {getPrescriptionsByType('medicamentosa').length > 0 
                ? getPrescriptionsByType('medicamentosa').map(renderPrescriptionCard)
                : <EmptyState />}
            </TabsContent>
            
            <TabsContent value="suplementar" className="space-y-4 mt-4">
              {getPrescriptionsByType('suplementar').length > 0 
                ? getPrescriptionsByType('suplementar').map(renderPrescriptionCard)
                : <EmptyState />}
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyState />
        )}
      </div>
    </PatientLayout>
  );
}
