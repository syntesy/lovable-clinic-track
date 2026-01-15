import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, AlertCircle, FlaskConical, Plus, Lock, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logInfo, logWarn, logError } from "@/lib/telemetry";
import { 
  useAttendanceSession, 
  useAttendanceFiles,
  useAttendanceRecords,
  useCloseAttendance
} from "@/hooks/useAttendance";
import { 
  AttendanceStepper, 
  AttendanceHeader, 
  AttendanceDocumentsStep 
} from "@/components/attendance";
import { getVisibleSteps, AttendanceStatus, isAttendanceClosed } from "@/types/attendance";
import { 
  ensureClinicalRecordForAttendance, 
  hasClinicalRecordMinimumData,
  ClinicalRecordBasic 
} from "@/services/clinicalRecordsService";

// Import existing components for steps (reusing, not changing logic)
import { AvaliacaoRegenapp } from "@/components/RegenEvaluation";

const AtendimentoDetail = () => {
  const { attendanceId } = useParams<{ attendanceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState("complaint");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  // Fetch attendance session
  const { 
    data: attendance, 
    isLoading: isLoadingAttendance,
    error: attendanceError 
  } = useAttendanceSession(attendanceId ?? null);
  
  // Close attendance mutation
  const closeAttendance = useCloseAttendance();
  
  // Check if attendance is closed
  const isClosed = isAttendanceClosed(attendance ?? null);
  
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
  
  // Handler: Create or Open clinical record (prontuário)
  const handleOpenOrCreateProntuario = useCallback(async () => {
    if (!attendance || !attendanceId || isCreatingRecord) return;
    
    logInfo("clinical_record.open_or_create.clicked", { attendanceId });
    setIsCreatingRecord(true);
    try {
      // Use attendance_id FK for proper linking
      const record = await ensureClinicalRecordForAttendance(
        attendanceId,
        attendance.patient_id
      );
      
      // Invalidate query to refresh the view
      await queryClient.invalidateQueries({ 
        queryKey: ["clinical-records-attendance", attendanceId] 
      });
      
      logInfo("clinical_record.open_or_create.navigating", { recordId: record.id, attendanceId });
      // Navigate to the record editor with attendance context
      navigate(`/patients/${attendance.patient_id}/records/${record.id}?atendimento=${attendanceId}`);
    } catch (error: any) {
      logError("clinical_record.open_or_create.error", { attendanceId, code: error?.code });
      toast.error("Erro ao criar prontuário. Tente novamente.");
    } finally {
      setIsCreatingRecord(false);
    }
  }, [attendance, attendanceId, isCreatingRecord, navigate, queryClient]);

  // Handler: Generate Report with gating
  const handleGenerateReport = useCallback(() => {
    logInfo("report.generate.clicked", { attendanceId: attendanceId || "unknown" });
    
    // Check if prontuário exists
    if (!clinicalRecord) {
      logWarn("report.generate.blocked.no_record", { attendanceId: attendanceId || "unknown" });
      toast.error("Para gerar relatório, é necessário criar o prontuário do atendimento primeiro.", {
        action: {
          label: "Criar Prontuário",
          onClick: handleOpenOrCreateProntuario,
        },
        duration: 6000,
      });
      return;
    }
    
    // Check if prontuário has minimum data (relaxed: queixa+anamnese OU diagnóstico)
    if (!hasClinicalRecordMinimumData(clinicalRecord as ClinicalRecordBasic)) {
      logWarn("report.generate.blocked.incomplete_record", { attendanceId: attendanceId || "unknown", recordId: clinicalRecord.id });
      toast.error("O prontuário precisa ter pelo menos: queixa + anamnese OU diagnóstico clínico preenchido.", {
        action: {
          label: "Completar Prontuário",
          onClick: () => navigate(`/patients/${attendance?.patient_id}/records/${clinicalRecord.id}?atendimento=${attendanceId}`),
        },
        duration: 6000,
      });
      return;
    }
    
    logInfo("report.generate.start", { attendanceId: attendanceId || "unknown", recordId: clinicalRecord.id });
    // Navigate to report step
    setCurrentStep("report");
  }, [clinicalRecord, attendance, attendanceId, handleOpenOrCreateProntuario, navigate]);

  // Helper: Persist report metadata to attendance (audit trail)
  const persistReportMetadata = useCallback(async (
    type: 'preview' | 'pdf',
    recordId: string,
    durationMs: number
  ) => {
    if (!attendanceId) return;
    
    try {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({
          last_report_generated_at: new Date().toISOString(),
          last_report_record_id: recordId,
          last_report_type: type,
          last_report_duration_ms: durationMs,
        })
        .eq("id", attendanceId);

      if (error) throw error;
      
      logInfo("report.persist.success", { attendanceId, recordId, type, ms: durationMs });
      
      // Invalidate to refresh the attendance data
      queryClient.invalidateQueries({ queryKey: ["attendance", attendanceId] });
    } catch (error: any) {
      // Fail silently - don't break report generation
      logError("report.persist.error", { attendanceId, recordId, code: error?.code });
    }
  }, [attendanceId, queryClient]);

  // Handler: Export PDF with full telemetry
  const handleExportPdf = useCallback(async () => {
    if (!clinicalRecord || !patient || isExportingPdf) return;
    
    const t0 = performance.now();
    const recordId = clinicalRecord.id;
    
    logInfo("report.generate.export_start", { attendanceId: attendanceId || "unknown", recordId });
    setIsExportingPdf(true);
    
    try {
      // TODO: Replace with actual report generation logic when implemented
      // For now, navigate to the existing report visualization page
      navigate(`/relatorio/${clinicalRecord.id}`);
      
      const ms = Math.round(performance.now() - t0);
      logInfo("report.generate.success", { 
        attendanceId: attendanceId || "unknown", 
        recordId, 
        hasExport: true, 
        ms 
      });
      
      // Persist audit trail (async, non-blocking)
      persistReportMetadata('pdf', recordId, ms);
      
      toast.success("Relatório gerado com sucesso!");
    } catch (error: any) {
      const ms = Math.round(performance.now() - t0);
      logError("report.generate.error", { 
        attendanceId: attendanceId || "unknown", 
        recordId, 
        code: error?.code || "UNKNOWN",
        message: error?.message?.slice(0, 50),
        ms
      });
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [clinicalRecord, patient, isExportingPdf, attendanceId, navigate, persistReportMetadata]);

  // Handler: Preview report
  const handlePreviewReport = useCallback(async () => {
    if (!clinicalRecord) return;
    const t0 = performance.now();
    const recordId = clinicalRecord.id;
    
    logInfo("report.preview.clicked", { attendanceId: attendanceId || "unknown", recordId });
    
    // Persist audit trail (async, non-blocking)
    const ms = Math.round(performance.now() - t0);
    persistReportMetadata('preview', recordId, ms);
    
    navigate(`/relatorio/${clinicalRecord.id}`);
  }, [clinicalRecord, attendanceId, navigate, persistReportMetadata]);
  
  // Handle conclude attendance
  const handleConclude = async () => {
    if (!attendance) return;
    if (!confirm("Tem certeza que deseja concluir este atendimento? Após a conclusão, não será possível fazer novas alterações.")) {
      return;
    }
    await closeAttendance.mutateAsync(attendance.id);
  };
  
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
    // Show locked message for closed attendances
    const renderClosedAlert = () => (
      <Alert className="mb-4">
        <Lock className="h-4 w-4" />
        <AlertTitle>Atendimento Concluído</AlertTitle>
        <AlertDescription>
          Este atendimento foi concluído. As informações estão disponíveis apenas para visualização.
        </AlertDescription>
      </Alert>
    );
    
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
              {isClosed && renderClosedAlert()}
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
                  {!isClosed && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/patients/${attendance.patient_id}/records/${clinicalRecord.id}?atendimento=${attendanceId}`)}
                    >
                      Editar Prontuário
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhum prontuário criado para este atendimento
                  </p>
                  {!isClosed && (
                    <Button 
                      onClick={handleOpenOrCreateProntuario}
                      disabled={isCreatingRecord}
                    >
                      {isCreatingRecord ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Criar Prontuário
                    </Button>
                  )}
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
              {isClosed && renderClosedAlert()}
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
                  {!isClosed && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/patients/${attendance.patient_id}/records/${clinicalRecord.id}?atendimento=${attendanceId}`)}
                    >
                      Editar Prontuário
                    </Button>
                  )}
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
              {isClosed && renderClosedAlert()}
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
                  {!isClosed && (
                    <Button 
                      onClick={() => navigate(`/triagem-biologica?paciente=${attendance.patient_id}`)}
                    >
                      <FlaskConical className="w-4 h-4 mr-2" />
                      Iniciar Triagem
                    </Button>
                  )}
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
              {isClosed && renderClosedAlert()}
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
            disabled={isClosed}
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
        // Gating: Check if clinical record exists and has minimum data
        const hasRecord = !!clinicalRecord;
        const hasMinData = hasClinicalRecordMinimumData(clinicalRecord as ClinicalRecordBasic | null);
        const canGenerateReport = hasRecord && hasMinData && (attendance?.involves_orthobiologics ? currentStatus === "S3" : true);
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>Relatório & Exportação</CardTitle>
              <CardDescription>
                Gere e exporte o relatório final do atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Gating: No clinical record */}
              {!hasRecord && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">Prontuário Necessário</p>
                  <p className="text-muted-foreground mb-4">
                    Para gerar o relatório, é necessário criar o prontuário do atendimento primeiro.
                  </p>
                  <Button onClick={handleOpenOrCreateProntuario} disabled={isCreatingRecord}>
                    {isCreatingRecord ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Criar Prontuário
                  </Button>
                </div>
              )}
              
              {/* Gating: Clinical record exists but incomplete */}
              {hasRecord && !hasMinData && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">Prontuário Incompleto</p>
                  <p className="text-muted-foreground mb-4">
                    O prontuário precisa ter pelo menos: queixa + anamnese OU diagnóstico clínico preenchido.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/patients/${attendance?.patient_id}/records/${clinicalRecord?.id}?atendimento=${attendanceId}`)}
                  >
                    Completar Prontuário
                  </Button>
                </div>
              )}
              
              {/* Gating: Prontuário OK but orthobiologics needs S3 */}
              {hasRecord && hasMinData && attendance?.involves_orthobiologics && currentStatus !== "S3" && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Relatório disponível após conclusão do Score Definitivo (S3)</p>
                  <p className="text-sm mt-2">Status atual: {currentStatus}</p>
                </div>
              )}
              
              {/* Ready to generate */}
              {canGenerateReport && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Pronto para Gerar Relatório</AlertTitle>
                    <AlertDescription>
                      {attendance?.involves_orthobiologics 
                        ? "O score definitivo foi gerado. Você pode gerar o relatório final."
                        : "O prontuário está completo. Você pode gerar o relatório final."
                      }
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button onClick={handleExportPdf} disabled={isExportingPdf}>
                      {isExportingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        "Gerar Relatório PDF"
                      )}
                    </Button>
                    <Button variant="outline" onClick={handlePreviewReport}>
                      Visualizar Preview
                    </Button>
                  </div>
                  
                  {/* Last report info (audit trail) */}
                  {attendance?.last_report_generated_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Último relatório gerado em{" "}
                        {format(new Date(attendance.last_report_generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {attendance.last_report_type && (
                          <span className="ml-1">
                            ({attendance.last_report_type === 'pdf' ? 'PDF' : 'Preview'})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {files.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {files.length} arquivo(s) anexado(s) a este atendimento
                      </p>
                    </div>
                  )}
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
        onSave={!isClosed ? () => {/* TODO */} : undefined}
        onGenerateReport={handleGenerateReport}
        onConclude={handleConclude}
        isConcluding={closeAttendance.isPending}
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
