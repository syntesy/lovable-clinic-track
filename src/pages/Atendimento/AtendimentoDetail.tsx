import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, FlaskConical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

import { 
  useAttendanceSession, 
  useAttendanceFiles,
  useAttendanceRecords 
} from "@/hooks/useAttendance";
import { 
  AttendanceStepper, 
  AttendanceHeader, 
  AttendanceDocumentsStep 
} from "@/components/attendance";
import { getVisibleSteps, AttendanceStatus } from "@/types/attendance";

// Import existing components for steps (reusing, not changing logic)
import { AvaliacaoRegenapp } from "@/components/RegenEvaluation";

const AtendimentoDetail = () => {
  const { attendanceId } = useParams<{ attendanceId: string }>();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState("complaint");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  // Fetch attendance session
  const { 
    data: attendance, 
    isLoading: isLoadingAttendance,
    error: attendanceError 
  } = useAttendanceSession(attendanceId ?? null);
  
  // Fetch attendance files for counter
  const { data: files = [] } = useAttendanceFiles(attendanceId ?? null);
  
  // Fetch patient info
  const { data: patient } = useQuery({
    queryKey: ["patient", attendance?.patient_id],
    queryFn: async () => {
      if (!attendance?.patient_id) return null;
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, age, gender")
        .eq("id", attendance.patient_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!attendance?.patient_id,
  });
  
  // Fetch records within attendance time window
  const { 
    clinicalRecord, 
    screening,
    isLoadingClinicalRecord,
    isLoadingScreening 
  } = useAttendanceRecords(attendance ?? null, attendance?.patient_id ?? null);
  
  // Determine current clinical status (S0-S3)
  const currentStatus: AttendanceStatus = useMemo(() => {
    if (!attendance?.involves_orthobiologics) return "S1";
    if (!screening) return "S0";
    
    // Check if labs are validated (S2 complete)
    if (screening.labs_validated) {
      // Check if has REGEN result (S3) - use canonical_hash as indicator
      if (screening.canonical_hash) {
        return "S3";
      }
      return "S2";
    }
    
    return "S1";
  }, [attendance, screening]);
  
  // Visible steps based on orthobiologics flag
  const visibleSteps = useMemo(
    () => getVisibleSteps(attendance?.involves_orthobiologics ?? false),
    [attendance?.involves_orthobiologics]
  );
  
  if (isLoadingAttendance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (attendanceError || !attendance) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atendimento não encontrado</AlertTitle>
          <AlertDescription>
            O atendimento solicitado não existe ou você não tem permissão para acessá-lo.
          </AlertDescription>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/atendimentos")}
          >
            Voltar para Atendimentos
          </Button>
        </Alert>
      </div>
    );
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case "complaint":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Queixa Principal & História Clínica</CardTitle>
              <CardDescription>
                Registre a queixa principal e história do paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clinicalRecord ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Queixa Principal</Label>
                    <p className="mt-1">{clinicalRecord.chief_complaint || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Anamnese</Label>
                    <p className="mt-1 whitespace-pre-wrap">{clinicalRecord.anamnesis || "Não informado"}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/patients/${attendance.patient_id}/records/${clinicalRecord.id}`)}
                  >
                    Editar Prontuário
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhum prontuário criado para este atendimento
                  </p>
                  <Button onClick={() => navigate(`/patients/${attendance.patient_id}/records/new`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Prontuário
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
        
      case "exam":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Exame Físico & Achados</CardTitle>
              <CardDescription>
                Registre os achados do exame físico
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clinicalRecord ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Exame Físico</Label>
                    <p className="mt-1 whitespace-pre-wrap">{clinicalRecord.physical_exam || "Não informado"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Diagnóstico Clínico</Label>
                    <p className="mt-1">{clinicalRecord.clinical_diagnosis || "Não informado"}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/patients/${attendance.patient_id}/records/${clinicalRecord.id}`)}
                  >
                    Editar Prontuário
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Complete a etapa anterior primeiro
                </div>
              )}
            </CardContent>
          </Card>
        );
        
      case "triage":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5" />
                Triagem de Ortobiológicos
              </CardTitle>
              <CardDescription>
                Avaliação para tratamento com ortobiológicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {screening ? (
                <AvaliacaoRegenapp
                  patientId={attendance.patient_id}
                  patientName={patient?.full_name}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhuma triagem realizada para este atendimento
                  </p>
                  <Button 
                    onClick={() => navigate(`/triagem-biologica?paciente=${attendance.patient_id}`)}
                  >
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Iniciar Triagem
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
        
      case "labs":
        // S2 - Labs step - reuse existing component via AvaliacaoRegenapp
        return (
          <Card>
            <CardHeader>
              <CardTitle>Exames Laboratoriais (S2)</CardTitle>
              <CardDescription>
                Validação dos exames laboratoriais solicitados na triagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {screening ? (
                <AvaliacaoRegenapp
                  patientId={attendance.patient_id}
                  patientName={patient?.full_name}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>S2 Indisponível</p>
                  <p className="text-sm mt-1">Complete a triagem primeiro</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
        
      case "documents":
        return (
          <AttendanceDocumentsStep
            attendanceId={attendance.id}
            patientId={attendance.patient_id}
            disabled={currentStatus === "S3"}
          />
        );
        
      case "plan":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Plano Terapêutico</CardTitle>
              <CardDescription>
                Defina o plano de tratamento para o paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Plano terapêutico em desenvolvimento</p>
                <p className="text-sm mt-1">Esta funcionalidade será implementada em breve</p>
              </div>
            </CardContent>
          </Card>
        );
        
      case "report":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Relatório & Exportação</CardTitle>
              <CardDescription>
                Gere e exporte o relatório final do atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentStatus === "S3" ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Score Definitivo Disponível</AlertTitle>
                    <AlertDescription>
                      O score definitivo foi gerado. Você pode gerar o relatório final.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button>
                      Gerar Relatório PDF
                    </Button>
                    <Button variant="outline">
                      Visualizar Preview
                    </Button>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {files.length} arquivo(s) anexado(s) a este atendimento
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Relatório disponível após conclusão do Score Definitivo (S3)</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AttendanceHeader
        attendance={attendance}
        patientName={patient?.full_name || "Carregando..."}
        status={currentStatus}
        fileCount={files.length}
        onSave={() => {/* TODO */}}
        onGenerateReport={() => navigate(`#report`)}
      />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stepper */}
        <div className="mb-8">
          <AttendanceStepper
            involvesOrthobiologics={attendance.involves_orthobiologics}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            completedSteps={completedSteps}
          />
        </div>
        
        {/* Step Content */}
        <div className="space-y-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default AtendimentoDetail;
