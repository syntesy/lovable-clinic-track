import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, AlertCircle, FlaskConical, Lock, FileText, Clock, Stethoscope, ClipboardList, Plus } from "lucide-react";
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
  useCloseAttendance,
  useUpdateAttendanceType
} from "@/hooks/useAttendance";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AttendanceStepper,
  AttendanceHeader
} from "@/components/attendance";
import { ClinicalAssessmentInline } from "@/components/attendance/ClinicalAssessmentInline";
import { AttendanceStatus, isAttendanceClosed } from "@/types/attendance";
import {
  ensureClinicalRecordForAttendance,
  hasClinicalRecordMinimumData,
  ClinicalRecordBasic
} from "@/services/clinicalRecordsService";

// Import existing components for steps (reusing, not changing logic)
import { AvaliacaoRegenapp } from "@/components/RegenEvaluation";
import { AddProcedureModal } from "@/components/AddProcedureModal";
import { PrescriptionFormModal } from "@/components/patient/PrescriptionFormModal";
import { PatientPrescriptionsList } from "@/components/patient/PatientPrescriptionsList";
import { PatientProceduresList } from "@/components/patient/PatientProceduresList";

const AtendimentoDetail = () => {
  const { attendanceId } = useParams<{ attendanceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Default step is "clinical" (first clinical step - Avaliação Clínica)
  const [currentStep, setCurrentStep] = useState("clinical");
  const [completedSteps] = useState<string[]>([]);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Plan step modals
  const [isAddProcedureOpen, setIsAddProcedureOpen] = useState(false);
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);

  // Fetch attendance session
  const {
    data: attendance,
    isLoading: isLoadingAttendance,
    error: attendanceError
  } = useAttendanceSession(attendanceId ?? null);

  // Close attendance mutation
  const closeAttendance = useCloseAttendance();
  
  // Update attendance type mutation
  const updateAttendanceType = useUpdateAttendanceType();

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
  const { clinicalRecord, screening } = useAttendanceRecords(
    attendance ?? null,
    attendance?.patient_id ?? null
  );

  // Ensure clinical record exists automatically (internal system detail)
  // This avoids forcing a manual "Criar Prontuário" action at the start of the attendance.
  useEffect(() => {
    if (!attendance || !attendanceId) return;
    if (isClosed) return;
    if (clinicalRecord) return;
    if (isCreatingRecord) return;

    let cancelled = false;

    (async () => {
      setIsCreatingRecord(true);
      try {
        await ensureClinicalRecordForAttendance(attendanceId, attendance.patient_id);
        if (!cancelled) {
          await queryClient.invalidateQueries({
            queryKey: ["clinical-records-attendance", attendanceId],
          });
        }
      } catch (error: any) {
        logError("clinical_record.autocreate.error", { attendanceId, code: error?.code });
      } finally {
        if (!cancelled) setIsCreatingRecord(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attendance, attendanceId, clinicalRecord, isClosed, isCreatingRecord, queryClient]);

  // Redirect from triage step if attendance is not orthobiologic
  useEffect(() => {
    if (currentStep === "triage" && attendance && !attendance.involves_orthobiologics) {
      setCurrentStep("plan");
    }
  }, [currentStep, attendance]);


  const handleEnsureClinicalAssessment = useCallback(async () => {
    if (!attendance || !attendanceId) return;

    setIsCreatingRecord(true);
    try {
      await ensureClinicalRecordForAttendance(attendanceId, attendance.patient_id);
      await queryClient.invalidateQueries({ queryKey: ["clinical-records-attendance", attendanceId] });
    } catch (error: any) {
      logError("clinical_record.ensure.error", { attendanceId, code: error?.code });
      toast.error("Erro ao iniciar avaliação clínica. Tente novamente.");
    } finally {
      setIsCreatingRecord(false);
    }
  }, [attendance, attendanceId, queryClient]);


  // Handler: Generate Report with gating
  const handleGenerateReport = useCallback(() => {
    logInfo("report.generate.clicked", { attendanceId: attendanceId || "unknown" });

    if (!clinicalRecord) {
      logWarn("report.generate.blocked.no_record", { attendanceId: attendanceId || "unknown" });
      toast.error("Para gerar relatório, complete a avaliação clínica primeiro.");
      setCurrentStep("clinical");
      return;
    }

    if (!hasClinicalRecordMinimumData(clinicalRecord as ClinicalRecordBasic)) {
      logWarn("report.generate.blocked.incomplete_record", {
        attendanceId: attendanceId || "unknown",
        recordId: clinicalRecord.id,
      });
      toast.error("A avaliação clínica precisa ter pelo menos: queixa + anamnese OU diagnóstico clínico.");
      setCurrentStep("clinical");
      return;
    }

    logInfo("report.generate.start", { attendanceId: attendanceId || "unknown", recordId: clinicalRecord.id });
    setCurrentStep("report");
  }, [clinicalRecord, attendanceId]);

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
      queryClient.invalidateQueries({ queryKey: ["attendance", attendanceId] });
    } catch (error: any) {
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
      navigate(`/relatorio/${clinicalRecord.id}`);

      const ms = Math.round(performance.now() - t0);
      logInfo("report.generate.success", {
        attendanceId: attendanceId || "unknown",
        recordId,
        hasExport: true,
        ms
      });

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

    if (screening.labs_validated) {
      if (screening.canonical_hash) {
        return "S3";
      }
      return "S2";
    }

    return "S1";
  }, [attendance, screening]);

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
      case "clinical":
        return (
          <div className="space-y-6">
            {/* Attendance Type Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  Tipo de Atendimento
                </CardTitle>
                <CardDescription>
                  Selecione se este atendimento envolve terapias ortobiológicas. Isso habilita a Triagem específica (opcional).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={attendance.involves_orthobiologics ? "orthobiologic" : "non-orthobiologic"}
                  onValueChange={(value) => {
                    if (isClosed) return;
                    const isOrtho = value === "orthobiologic";
                    updateAttendanceType.mutate({
                      attendanceId: attendance.id,
                      involvesOrthobiologics: isOrtho
                    });
                  }}
                  disabled={isClosed || updateAttendanceType.isPending}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="orthobiologic" id="orthobiologic" />
                    <Label htmlFor="orthobiologic" className="cursor-pointer">
                      <span className="font-medium">Ortobiológico</span>
                      <span className="text-muted-foreground text-sm ml-2">(com Triagem)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-orthobiologic" id="non-orthobiologic" />
                    <Label htmlFor="non-orthobiologic" className="cursor-pointer">
                      <span className="font-medium">Não Ortobiológico</span>
                      <span className="text-muted-foreground text-sm ml-2">(sem Triagem)</span>
                    </Label>
                  </div>
                </RadioGroup>
                {attendance.involves_orthobiologics && (
                  <p className="text-sm text-muted-foreground mt-3">
                    ✓ Triagem disponível (opcional). Você pode realizá-la agora ou depois.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Clinical Assessment Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Avaliação Clínica
                </CardTitle>
                <CardDescription>
                  Registre queixa, anamnese, exame físico e diagnóstico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isClosed && renderClosedAlert()}

                <div className="space-y-4">
                  <ClinicalAssessmentInline
                    attendanceId={attendanceId!}
                    patientId={attendance.patient_id}
                    clinicalRecord={clinicalRecord as ClinicalRecordBasic | null}
                    isClosed={isClosed}
                    isBusy={isCreatingRecord}
                    onEnsureRecord={handleEnsureClinicalAssessment}
                    onSaved={async () => {
                      await queryClient.invalidateQueries({
                        queryKey: ["clinical-records-attendance", attendanceId],
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "triage":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5" />
                Triagem (Opcional)
              </CardTitle>
              <CardDescription>
                Questionário de triagem, scores e elegibilidade — pode ser pulado
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
                    Triagem não realizada — esta etapa é opcional
                  </p>
                  {!isClosed && (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => navigate(`/triagem-biologica?paciente=${attendance.patient_id}`)}>
                        <FlaskConical className="w-4 h-4 mr-2" />
                        Iniciar Triagem
                      </Button>
                      <Button variant="outline" onClick={() => setCurrentStep("plan")}>
                        Pular Triagem
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "plan":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Plano Terapêutico
                </CardTitle>
                <CardDescription>
                  Registre procedimentos e prescrições/orientações para este paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => setIsAddProcedureOpen(true)} disabled={isClosed}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Procedimento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddPrescriptionOpen(true)}
                    disabled={isClosed || !attendance || !patient?.full_name}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Prescrição
                  </Button>
                </div>

                {isClosed && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Atendimento concluído: alterações estão desabilitadas.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Procedimentos</CardTitle>
                  <CardDescription>Procedimentos planejados/realizados</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendance ? (
                    <PatientProceduresList patientId={attendance.patient_id} />
                  ) : (
                    <div className="text-muted-foreground text-center py-8">Carregando...</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prescrições</CardTitle>
                  <CardDescription>Orientações, medicações e suplementações</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendance ? (
                    <PatientPrescriptionsList patientId={attendance.patient_id} patientName={patient?.full_name ?? "Paciente"} />
                  ) : (
                    <div className="text-muted-foreground text-center py-8">Carregando...</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {attendance && (
              <>
                <AddProcedureModal
                  open={isAddProcedureOpen}
                  onOpenChange={setIsAddProcedureOpen}
                  patientId={attendance.patient_id}
                  onSuccess={async () => {
                    await queryClient.invalidateQueries({
                      queryKey: ["patient-procedures", attendance.patient_id],
                    });
                  }}
                />

                {patient?.full_name && (
                  <PrescriptionFormModal
                    open={isAddPrescriptionOpen}
                    onOpenChange={setIsAddPrescriptionOpen}
                    patientId={attendance.patient_id}
                    patientName={patient.full_name}
                  />
                )}
              </>
            )}
          </div>
        );

      case "report": {
        const hasRecord = !!clinicalRecord;
        const hasMinData = hasClinicalRecordMinimumData(clinicalRecord as ClinicalRecordBasic | null);
        const canGenerateReport =
          hasRecord &&
          hasMinData &&
          (attendance?.involves_orthobiologics ? currentStatus === "S3" : true);

        return (
          <Card>
            <CardHeader>
              <CardTitle>Relatório</CardTitle>
              <CardDescription>
                Gere e exporte o relatório final do atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasRecord && (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Preparando avaliação clínica...
                </div>
              )}

              {hasRecord && !hasMinData && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">Avaliação Clínica Incompleta</p>
                  <p className="text-muted-foreground mb-4">
                    Preencha pelo menos: queixa + anamnese OU diagnóstico clínico.
                  </p>
                  <Button variant="outline" onClick={() => setCurrentStep("clinical")}>
                    Ir para Avaliação Clínica
                  </Button>
                </div>
              )}

              {hasRecord && hasMinData && attendance?.involves_orthobiologics && currentStatus !== "S3" && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Relatório disponível após conclusão do Score Definitivo (S3)</p>
                  <p className="text-sm mt-2">Status atual: {currentStatus}</p>
                </div>
              )}

              {canGenerateReport && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Pronto para Gerar Relatório</AlertTitle>
                    <AlertDescription>
                      {attendance?.involves_orthobiologics
                        ? "O score definitivo foi gerado. Você pode gerar o relatório final."
                        : "A avaliação clínica está completa. Você pode gerar o relatório final."}
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
      }

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
