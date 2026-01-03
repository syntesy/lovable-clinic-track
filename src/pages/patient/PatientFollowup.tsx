import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PatientLayout } from '@/components/patient/PatientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, CheckCircle2, Send, Activity } from 'lucide-react';
import { toast } from 'sonner';

type TreatmentAdherence = 'full' | 'partial' | 'none';
type SelfReportedProgress = 'better' | 'same' | 'worse';

interface FollowupFormData {
  painScore: number;
  adverseEvent: boolean;
  adverseEventDescription: string;
  treatmentAdherence: TreatmentAdherence | null;
  selfReportedProgress: SelfReportedProgress | null;
}

export default function PatientFollowup() {
  const { session } = usePatientAuth();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<FollowupFormData>({
    painScore: 5,
    adverseEvent: false,
    adverseEventDescription: '',
    treatmentAdherence: null,
    selfReportedProgress: null,
  });

  // Check if patient has an active screening (case)
  const { data: activeScreening, isLoading: checkingScreening } = useQuery({
    queryKey: ['patient-active-screening', session?.patientId],
    queryFn: async () => {
      if (!session?.patientId) return null;

      const { data, error } = await supabase
        .from('prp_screenings')
        .select('id, screening_date, classification')
        .eq('patient_id', session.patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.patientId,
  });

  // Check for pending followup to update
  const { data: pendingFollowup, isLoading: checkingFollowup } = useQuery({
    queryKey: ['patient-pending-followup', session?.patientId, activeScreening?.id],
    queryFn: async () => {
      if (!session?.patientId || !activeScreening?.id) return null;

      const { data, error } = await supabase
        .from('procedure_followups')
        .select('id, timepoint, scheduled_for')
        .eq('patient_id', session.patientId)
        .eq('screening_id', activeScreening.id)
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.patientId && !!activeScreening?.id,
  });

  const submitFollowup = useMutation({
    mutationFn: async (data: FollowupFormData) => {
      if (!session?.patientId || !activeScreening?.id) {
        throw new Error('Dados de sessão inválidos');
      }

      // Map selfReportedProgress to global_change format
      const globalChangeMap: Record<SelfReportedProgress, string> = {
        better: 'better',
        same: 'same',
        worse: 'worse',
      };

      if (pendingFollowup?.id) {
        // Update existing pending followup
        const { error } = await supabase
          .from('procedure_followups')
          .update({
            pain_score: data.painScore,
            adverse_event: data.adverseEvent,
            adverse_event_description: data.adverseEvent ? data.adverseEventDescription : null,
            treatment_adherence: data.treatmentAdherence,
            global_change: data.selfReportedProgress ? globalChangeMap[data.selfReportedProgress] : null,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', pendingFollowup.id);

        if (error) throw error;
      } else {
        // Create new followup record if no pending exists
        const { error } = await supabase
          .from('procedure_followups')
          .insert({
            screening_id: activeScreening.id,
            patient_id: session.patientId,
            clinician_id: session.professionalId,
            timepoint: 'D30', // Default timepoint for patient-initiated followups
            scheduled_for: new Date().toISOString().split('T')[0],
            status: 'completed',
            completed_at: new Date().toISOString(),
            pain_score: data.painScore,
            adverse_event: data.adverseEvent,
            adverse_event_description: data.adverseEvent ? data.adverseEventDescription : null,
            treatment_adherence: data.treatmentAdherence,
            global_change: data.selfReportedProgress ? globalChangeMap[data.selfReportedProgress] : null,
          });

        if (error) throw error;
      }

      // Log patient event
      await supabase.from('patient_events').insert({
        patient_id: session.patientId,
        professional_id: session.professionalId,
        event_name: 'patient_followup_submitted',
        event_data: {
          screening_id: activeScreening.id,
          followup_id: pendingFollowup?.id || null,
          timestamp: new Date().toISOString(),
        },
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['patient-pending-followup'] });
      toast.success('Acompanhamento enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Error submitting followup:', error);
      toast.error('Erro ao enviar acompanhamento. Tente novamente.');
    },
  });

  const handleSubmit = () => {
    if (formData.treatmentAdherence === null || formData.selfReportedProgress === null) {
      toast.error('Por favor, responda todas as perguntas.');
      return;
    }
    if (formData.adverseEvent && !formData.adverseEventDescription.trim()) {
      toast.error('Por favor, descreva o efeito indesejado.');
      return;
    }
    submitFollowup.mutate(formData);
  };

  const isLoading = checkingScreening || checkingFollowup;

  // No active screening - cannot submit
  if (!isLoading && !activeScreening) {
    return (
      <PatientLayout>
        <div className="space-y-6">
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum caso clínico ativo
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Não foi encontrado um caso clínico ativo associado ao seu cadastro. 
                Entre em contato com seu profissional de saúde para mais informações.
              </p>
            </CardContent>
          </Card>
        </div>
      </PatientLayout>
    );
  }

  // Submission confirmed
  if (submitted) {
    return (
      <PatientLayout>
        <div className="space-y-6">
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Obrigado!
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Suas informações foram registradas e estarão disponíveis para o profissional responsável.
              </p>
            </CardContent>
          </Card>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Acompanhamento Clínico</h1>
          <p className="text-muted-foreground mt-1">
            Suas respostas ajudam o profissional responsável a acompanhar sua evolução.
          </p>
        </div>

        {/* Mandatory Disclaimer */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Estas informações não substituem avaliação profissional presencial.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Block 1 - Pain Score (VAS/NRS) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Dor
                </CardTitle>
                <CardDescription>Como está sua dor hoje?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={[formData.painScore]}
                    onValueChange={(value) => setFormData({ ...formData, painScore: value[0] })}
                    min={0}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>0 - Sem dor</span>
                    <span className="font-medium text-foreground text-lg">{formData.painScore}</span>
                    <span>10 - Dor máxima</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Block 2 - Adverse Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eventos Adversos</CardTitle>
                <CardDescription>
                  Você sentiu algum efeito indesejado desde o último acompanhamento?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={formData.adverseEvent ? 'yes' : 'no'}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    adverseEvent: value === 'yes',
                    adverseEventDescription: value === 'no' ? '' : formData.adverseEventDescription
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="adverse-no" />
                    <Label htmlFor="adverse-no">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="adverse-yes" />
                    <Label htmlFor="adverse-yes">Sim</Label>
                  </div>
                </RadioGroup>

                {formData.adverseEvent && (
                  <div className="pt-2">
                    <Label htmlFor="adverse-description" className="text-sm text-muted-foreground">
                      Descreva brevemente o que sentiu (máx. 300 caracteres)
                    </Label>
                    <Textarea
                      id="adverse-description"
                      value={formData.adverseEventDescription}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        adverseEventDescription: e.target.value.slice(0, 300) 
                      })}
                      placeholder="Descreva o efeito indesejado..."
                      className="mt-2"
                      maxLength={300}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {formData.adverseEventDescription.length}/300
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Block 3 - Treatment Adherence */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adesão ao Tratamento</CardTitle>
                <CardDescription>
                  Você conseguiu seguir o tratamento conforme orientado?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.treatmentAdherence || ''}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    treatmentAdherence: value as TreatmentAdherence 
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="adherence-full" />
                    <Label htmlFor="adherence-full">Sim, conforme orientado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="adherence-partial" />
                    <Label htmlFor="adherence-partial">Parcialmente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="adherence-none" />
                    <Label htmlFor="adherence-none">Não consegui</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Block 4 - Self-Reported Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Autoavaliação de Evolução</CardTitle>
                <CardDescription>
                  De forma geral, como você se sente em relação à sua evolução?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.selfReportedProgress || ''}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    selfReportedProgress: value as SelfReportedProgress 
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="better" id="progress-better" />
                    <Label htmlFor="progress-better">Melhor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="same" id="progress-same" />
                    <Label htmlFor="progress-same">Igual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="worse" id="progress-worse" />
                    <Label htmlFor="progress-worse">Pior</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit} 
              disabled={submitFollowup.isPending}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitFollowup.isPending ? 'Enviando...' : 'Enviar acompanhamento'}
            </Button>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
