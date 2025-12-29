import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Pill, Sparkles, Calendar, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrescriptionDetailModal } from '@/components/PrescriptionDetailModal';

interface PatientPrescriptionsListProps {
  patientId: string;
  patientName?: string;
}

const prescriptionTypes = {
  cuidados_gerais: { label: 'Cuidados Gerais', icon: Heart, color: 'bg-rose-500' },
  medicacoes: { label: 'Medicações', icon: Pill, color: 'bg-blue-500' },
  suplementacoes: { label: 'Suplementações', icon: Sparkles, color: 'bg-amber-500' },
  // Legacy types for backwards compatibility
  alimentar: { label: 'Cuidados Gerais', icon: Heart, color: 'bg-rose-500' },
  medicamentosa: { label: 'Medicações', icon: Pill, color: 'bg-blue-500' },
  suplementar: { label: 'Suplementações', icon: Sparkles, color: 'bg-amber-500' }
};

export function PatientPrescriptionsList({ patientId, patientName = "Paciente" }: PatientPrescriptionsListProps) {
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['patient-prescriptions', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId
  });

  const handlePrescriptionClick = (prescription: any) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const handleVisibilityChange = () => {
    queryClient.invalidateQueries({ queryKey: ['patient-prescriptions', patientId] });
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-center py-8">Carregando prescrições...</div>;
  }

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Pill className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma prescrição cadastrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {prescriptions.map((prescription) => {
          const typeInfo = prescriptionTypes[prescription.prescription_type as keyof typeof prescriptionTypes];
          const Icon = typeInfo?.icon || Pill;

          return (
            <Card 
              key={prescription.id} 
              className="border-border/50 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
              onClick={() => handlePrescriptionClick(prescription)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${typeInfo?.color} bg-opacity-20 flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${typeInfo?.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{typeInfo?.label || prescription.prescription_type}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {typeInfo?.label}
                    </Badge>
                    {prescription.is_visible_to_patient ? (
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Visível
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Oculto
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-2">
                  {prescription.content}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PrescriptionDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        prescription={selectedPrescription}
        patientName={patientName}
        onVisibilityChange={handleVisibilityChange}
      />
    </>
  );
}
