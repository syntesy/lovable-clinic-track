import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PreviousTreatmentsSummary } from "@/components/attendance/PreviousTreatmentsSummary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Mail, AlertTriangle, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClinicalRecordById, listClinicalRecords, ClinicalRecord } from "@/lib/clinical-record-helpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const VisualizarRelatorio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  // Pegar recordId da query string (se fornecido)
  const recordIdFromQuery = searchParams.get("recordId");

  // Se não tiver recordId, buscar lista de prontuários para seleção
  const { data: recordsList, isLoading: loadingRecordsList } = useQuery({
    queryKey: ["clinical-record", "list", id],
    queryFn: () => listClinicalRecords(id!),
    enabled: !!id && !recordIdFromQuery,
  });

  // Se tiver recordId, buscar o relatório completo
  const { data: patientReport, isLoading: loadingReport, error } = useQuery({
    queryKey: ["patient-report-full", id, recordIdFromQuery],
    enabled: !!id && !!recordIdFromQuery,
    queryFn: async () => {
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (patientError) throw patientError;

      // Tipo B: Carregar prontuário específico por ID (OBRIGATÓRIO)
      let clinicalRecord: ClinicalRecord;
      try {
        clinicalRecord = await getClinicalRecordById(id!, recordIdFromQuery!);
        console.log("[VisualizarRelatorio] Loaded specific record:", recordIdFromQuery);
      } catch (err) {
        console.error("[VisualizarRelatorio] Record not found:", recordIdFromQuery);
        throw new Error("Prontuário não encontrado");
      }

      const { data: protocols } = await supabase
        .from("mac_protocols")
        .select("*")
        .eq("patient_id", id);

      const { data: sessions } = await supabase
        .from("treatment_sessions")
        .select("*")
        .eq("patient_id", id)
        .order("session_number", { ascending: true });

      const { data: ultrasoundImages } = await supabase
        .from("ultrasound_images")
        .select("*")
        .eq("patient_id", id);

      const { data: thermographyImages } = await supabase
        .from("thermography_images")
        .select("*")
        .eq("patient_id", id);

      const { data: bloodTests } = await supabase
        .from("blood_tests")
        .select("*")
        .eq("patient_id", id);

      // Fetch previous treatments and pathology if clinical record has an attendance_id
      let previousTreatments = null;
      let pathologyData: {
        category_id: string;
        pathology_id: string | null;
        custom_pathology_label: string | null;
        severity_model: string | null;
        severity_scale_id: string | null;
        severity_value: string | null;
        pathology_label?: string | null;
        category_label?: string | null;
        scale_label?: string | null;
        scale_options?: { value: string; label: string; help?: string }[] | null;
      } | null = null;
      
      const { data: crRaw } = await supabase
        .from("clinical_records")
        .select("attendance_id")
        .eq("id", recordIdFromQuery!)
        .maybeSingle();
      if (crRaw?.attendance_id) {
        const { data: ptData } = await supabase
          .from("attendance_previous_treatments")
          .select("treatments, last_treatment_time_bucket, details")
          .eq("attendance_id", crRaw.attendance_id)
          .maybeSingle();
        previousTreatments = ptData;

        // Fetch pathology data
        const { data: apData } = await supabase
          .from("attendance_pathology")
          .select("category_id, pathology_id, custom_pathology_label, severity_model, severity_scale_id, severity_value")
          .eq("attendance_id", crRaw.attendance_id)
          .maybeSingle();
        
        if (apData) {
          pathologyData = { ...apData, pathology_label: null, category_label: null, scale_label: null, scale_options: null };
          
          // Fetch pathology label
          if (apData.pathology_id) {
            const { data: pData } = await supabase
              .from("pathologies")
              .select("label")
              .eq("id", apData.pathology_id)
              .maybeSingle();
            if (pData) pathologyData.pathology_label = pData.label;
          }
          
          // Fetch category label
          const { data: cData } = await supabase
            .from("pathology_categories")
            .select("label")
            .eq("id", apData.category_id)
            .maybeSingle();
          if (cData) pathologyData.category_label = cData.label;
          
          // Fetch scale label and options (no is_active filter — show historical data)
          if (apData.severity_scale_id) {
            const { data: sData } = await supabase
              .from("pathology_severity_scales")
              .select("scale_label, options")
              .eq("id", apData.severity_scale_id)
              .maybeSingle();
            if (sData) {
              pathologyData.scale_label = sData.scale_label;
              pathologyData.scale_options = Array.isArray(sData.options) ? sData.options as { value: string; label: string; help?: string }[] : null;
            }
          }
        }
      }

      return {
        patient,
        clinicalRecord,
        protocols: protocols || [],
        sessions: sessions || [],
        ultrasoundImages: ultrasoundImages || [],
        thermographyImages: thermographyImages || [],
        bloodTests: bloodTests || [],
        previousTreatments,
        pathologyData,
      };
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.error("Digite um email válido");
      return;
    }

    toast.info("Funcionalidade de envio de email será implementada em breve");
    setIsEmailDialogOpen(false);
    setRecipientEmail("");
  };

  const handleSelectRecord = (recordId: string) => {
    setSearchParams({ recordId });
  };

  const handleCreateNewRecord = async () => {
    if (!id) return;
    
    try {
      const { data: newRecord, error } = await supabase
        .from("clinical_records")
        .insert({ patient_id: id })
        .select("id")
        .single();
      
      if (error) throw error;
      
      toast.success("Prontuário criado");
      navigate(`/patients/${id}/records/${newRecord.id}`);
    } catch (err) {
      console.error("Error creating record:", err);
      toast.error("Erro ao criar prontuário");
    }
  };

  const isLoading = loadingRecordsList || loadingReport;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Se não tiver recordId: mostrar seletor de prontuários
  if (!recordIdFromQuery) {
    return (
      <div className="min-h-screen bg-background">
        <div className="print:hidden sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/pacientes/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Paciente
          </Button>
        </div>

        <div className="max-w-2xl mx-auto p-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Selecione um Prontuário
              </CardTitle>
              <CardDescription>
                Escolha qual prontuário deseja visualizar no relatório
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recordsList && recordsList.length > 0 ? (
                <>
                  <Select onValueChange={handleSelectRecord}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um prontuário..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recordsList.map((record) => (
                        <SelectItem key={record.id} value={record.id}>
                          <div className="flex items-center gap-2">
                            <span>
                              {format(new Date(record.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <Badge variant={record.status === "final" ? "default" : "secondary"}>
                              {record.status === "final" ? "Finalizado" : "Rascunho"}
                            </Badge>
                            {record.clinical_diagnosis && (
                              <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                                — {record.clinical_diagnosis}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="text-sm text-muted-foreground">
                    {recordsList.length} prontuário(s) encontrado(s)
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">Nenhum prontuário encontrado</p>
                  <Button onClick={handleCreateNewRecord} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Prontuário
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Erro ao carregar
  if (error || !patientReport) {
    return (
      <div className="min-h-screen bg-background">
        <div className="print:hidden sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/pacientes/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Paciente
          </Button>
        </div>
        <div className="max-w-2xl mx-auto p-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Prontuário não encontrado. O prontuário solicitado pode ter sido excluído ou você não tem permissão para acessá-lo.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => navigate(`/patients/${id}/records`)} variant="outline">
              Ver Histórico de Prontuários
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Action Bar - Hidden when printing */}
        <div className="print:hidden sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/pacientes/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Paciente
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEmailDialogOpen(true)}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Enviar por Email
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="max-w-4xl mx-auto p-8 print:p-0">
          {/* Header */}
          <div className="text-center mb-8 print:mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 print:text-2xl">
              Relatório de Tratamento MAC
            </h1>
            <p className="text-muted-foreground print:text-sm">
              Método de Aceleração Cicatricial
            </p>
            {/* Badge indicando qual prontuário */}
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Prontuário de {format(new Date(patientReport.clinicalRecord.created_at), "dd/MM/yyyy", { locale: ptBR })}
                {patientReport.clinicalRecord.status === "final" && " — Finalizado"}
              </Badge>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Dados do Paciente */}
          <section className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
              Dados do Paciente
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:gap-3 print:text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Nome:</span>
                <p className="mt-1">{patientReport.patient.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Idade:</span>
                <p className="mt-1">{patientReport.patient.age} anos</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Gênero:</span>
                <p className="mt-1">{patientReport.patient.gender || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Telefone:</span>
                <p className="mt-1">{patientReport.patient.phone || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Email:</span>
                <p className="mt-1">{patientReport.patient.email || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Fototipo:</span>
                <p className="mt-1">{patientReport.patient.skin_phototype || "—"}</p>
              </div>
            </div>
          </section>

          <Separator className="mb-6" />

          {/* Avaliação Clínica Inicial - DO PRONTUÁRIO ESPECÍFICO */}
          <section className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
              Avaliação Clínica Inicial
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-3 print:text-sm mb-4">
              <div>
                <span className="text-muted-foreground font-medium">Região Tratada:</span>
                <p className="mt-1">{patientReport.patient.treated_region || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">EVA Inicial:</span>
                <p className="mt-1">{patientReport.patient.initial_vas || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Função Inicial:</span>
                <p className="mt-1">{patientReport.patient.initial_function || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Mobilidade Inicial:</span>
                <p className="mt-1">{patientReport.patient.initial_mobility || "—"}</p>
              </div>
            </div>
            
            {/* Dados do prontuário específico */}
            {patientReport.clinicalRecord.chief_complaint && (
              <div className="mb-3 print:text-sm">
                <span className="text-muted-foreground font-medium">Queixa Principal:</span>
                <p className="mt-1">{patientReport.clinicalRecord.chief_complaint}</p>
              </div>
            )}
            {patientReport.clinicalRecord.clinical_diagnosis && (
              <div className="mb-3 print:text-sm">
                <span className="text-muted-foreground font-medium">Diagnóstico Clínico:</span>
                <p className="mt-1">{patientReport.clinicalRecord.clinical_diagnosis}</p>
              </div>
            )}
            {patientReport.clinicalRecord.anamnesis && (
              <div className="mb-3 print:text-sm">
                <span className="text-muted-foreground font-medium">Anamnese:</span>
                <p className="mt-1">{patientReport.clinicalRecord.anamnesis}</p>
              </div>
            )}
            {patientReport.clinicalRecord.physical_exam && (
              <div className="print:text-sm">
                <span className="text-muted-foreground font-medium">Exame Físico:</span>
                <p className="mt-1">{patientReport.clinicalRecord.physical_exam}</p>
              </div>
            )}
          </section>

          <Separator className="mb-6" />

          {/* Patologia */}
          <section className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
              Patologia
            </h2>
            {!patientReport.pathologyData ? (
              <p className="text-muted-foreground italic">Patologia não registrada.</p>
            ) : (
              <div className="space-y-3">
                {/* Linha principal */}
                <div>
                  <span className="text-muted-foreground font-medium">Patologia: </span>
                  <span className="font-semibold">
                    {patientReport.pathologyData.pathology_label 
                      || patientReport.pathologyData.custom_pathology_label 
                      || "—"}
                  </span>
                  {patientReport.pathologyData.category_label && (
                    <span className="text-muted-foreground text-sm ml-2">
                      ({patientReport.pathologyData.category_label})
                    </span>
                  )}
                </div>

                {/* Classificação / Gravidade */}
                {(() => {
                  const model = patientReport.pathologyData.severity_model;
                  const value = patientReport.pathologyData.severity_value;

                  if (model === "CLINICAL_SIMPLE") {
                    const clinicalMap: Record<string, string> = { MILD: "Leve", MODERATE: "Moderada", SEVERE: "Grave" };
                    return (
                      <div className="space-y-1">
                        <div>
                          <span className="text-muted-foreground font-medium">Gravidade: </span>
                          <span className="font-medium">{(value && clinicalMap[value]) || value || "—"}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Avaliação clínica baseada em intensidade dos sintomas e impacto funcional.
                        </p>
                      </div>
                    );
                  }

                  if (model === "SPECIFIC_SCALE") {
                    const opts = patientReport.pathologyData.scale_options;
                    const matchedOpt = opts?.find(
                      (o) => o.value?.toUpperCase() === value?.toUpperCase()
                    );
                    const displayLabel = matchedOpt?.label || value || "—";
                    const scaleLabel = patientReport.pathologyData.scale_label;
                    const helpText = matchedOpt?.help?.trim();

                    return (
                      <div className="space-y-1">
                        <div>
                          <span className="text-muted-foreground font-medium">Classificação: </span>
                          <span className="font-medium">{displayLabel}</span>
                        </div>
                        {scaleLabel && (
                          <div>
                            <span className="text-muted-foreground text-sm">Escala: </span>
                            <span className="text-sm">{scaleLabel}</span>
                          </div>
                        )}
                        {helpText && (
                          <div>
                            <span className="text-muted-foreground text-sm">Descrição: </span>
                            <span className="text-sm">{helpText}</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // UNKNOWN or fallback
                  return (
                    <div>
                      <span className="text-muted-foreground font-medium">Gravidade: </span>
                      <span className="text-muted-foreground">Não informada</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </section>

          <Separator className="mb-6" />

          {/* Tratamentos Prévios */}
          <PreviousTreatmentsSummary data={patientReport.previousTreatments} />

          {/* Protocolos MAC */}
          {patientReport.protocols.length > 0 && (
            <>
              <Separator className="mb-6" />
              <section className="mb-8 print:mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
                  Protocolos MAC Utilizados ({patientReport.protocols.length})
                </h2>
                <div className="space-y-4 print:space-y-3">
                  {patientReport.protocols.map((protocol, idx) => (
                    <div key={protocol.id} className="border border-border rounded-lg p-4 print:p-3">
                      <h3 className="font-semibold mb-3 print:text-sm">Protocolo {idx + 1}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2 print:text-xs">
                        <div>
                          <span className="text-muted-foreground">Tipo de Luz:</span>
                          <p>{protocol.light_type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Comprimento de Onda:</span>
                          <p>{protocol.wavelength} nm</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Potência:</span>
                          <p>{protocol.power} W</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tempo:</span>
                          <p>{protocol.application_time} min</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Energia Total:</span>
                          <p>{protocol.total_energy} J</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fluência:</span>
                          <p>{protocol.fluence} J/cm²</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Técnica:</span>
                          <p>{protocol.technique}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tecido Alvo:</span>
                          <p>{protocol.target_tissue}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Evolução por Sessão */}
          {patientReport.sessions.length > 0 && (
            <>
              <Separator className="mb-6 print:break-before-page" />
              <section className="mb-8 print:mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
                  Evolução por Sessão ({patientReport.sessions.length} sessões)
                </h2>
                <div className="space-y-4 print:space-y-3">
                  {patientReport.sessions.map((session) => (
                    <div key={session.id} className="border border-border rounded-lg p-4 print:p-3">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold print:text-sm">Sessão #{session.session_number}</h3>
                        <span className="text-sm text-muted-foreground print:text-xs">
                          {new Date(session.session_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2 print:text-xs">
                        {session.vas_on_day !== null && (
                          <div>
                            <span className="text-muted-foreground">EVA no Dia:</span>
                            <p>{session.vas_on_day}</p>
                          </div>
                        )}
                        {session.function_score !== null && (
                          <div>
                            <span className="text-muted-foreground">Função:</span>
                            <p>{session.function_score}</p>
                          </div>
                        )}
                        {session.mobility_score !== null && (
                          <div>
                            <span className="text-muted-foreground">Mobilidade:</span>
                            <p>{session.mobility_score}</p>
                          </div>
                        )}
                        {session.light_type && (
                          <div>
                            <span className="text-muted-foreground">Luz Utilizada:</span>
                            <p>{session.light_type}</p>
                          </div>
                        )}
                        {session.treatment_time !== null && (
                          <div>
                            <span className="text-muted-foreground">Tempo de Tratamento:</span>
                            <p>{session.treatment_time}s</p>
                          </div>
                        )}
                      </div>
                      {session.clinical_observations && (
                        <div className="mt-3 print:text-xs">
                          <span className="text-muted-foreground font-medium">Observações:</span>
                          <p className="mt-1">{session.clinical_observations}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Resultados Finais */}
          <Separator className="mb-6" />
          <section className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
              Resultados Finais
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-3 print:text-sm mb-4">
              {patientReport.patient.final_vas !== null && (
                <div>
                  <span className="text-muted-foreground font-medium">EVA Final:</span>
                  <p className="mt-1 text-lg font-semibold print:text-base">
                    {patientReport.patient.final_vas}
                  </p>
                </div>
              )}
              {patientReport.patient.final_function !== null && (
                <div>
                  <span className="text-muted-foreground font-medium">Função Final:</span>
                  <p className="mt-1 text-lg font-semibold print:text-base">
                    {patientReport.patient.final_function}
                  </p>
                </div>
              )}
              {patientReport.patient.final_mobility !== null && (
                <div>
                  <span className="text-muted-foreground font-medium">Mobilidade Final:</span>
                  <p className="mt-1 text-lg font-semibold print:text-base">
                    {patientReport.patient.final_mobility}
                  </p>
                </div>
              )}
              {patientReport.patient.total_sessions !== null && (
                <div>
                  <span className="text-muted-foreground font-medium">Total de Sessões:</span>
                  <p className="mt-1 text-lg font-semibold print:text-base">
                    {patientReport.patient.total_sessions}
                  </p>
                </div>
              )}
            </div>
            {patientReport.patient.final_outcome && (
              <div className="print:text-sm">
                <span className="text-muted-foreground font-medium">Desfecho Final:</span>
                <p className="mt-1">{patientReport.patient.final_outcome}</p>
              </div>
            )}
          </section>

          {/* Exames e Documentação */}
          <Separator className="mb-6" />
          <section className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
              Exames e Documentação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:gap-3 print:text-sm">
              <div className="border border-border rounded-lg p-4 print:p-3">
                <span className="text-muted-foreground font-medium">Ultrassom:</span>
                <p className="mt-1 font-semibold">{patientReport.ultrasoundImages.length} imagem(s)</p>
              </div>
              <div className="border border-border rounded-lg p-4 print:p-3">
                <span className="text-muted-foreground font-medium">Termografia:</span>
                <p className="mt-1 font-semibold">{patientReport.thermographyImages.length} imagem(s)</p>
              </div>
              <div className="border border-border rounded-lg p-4 print:p-3">
                <span className="text-muted-foreground font-medium">Exames de Sangue:</span>
                <p className="mt-1 font-semibold">{patientReport.bloodTests.length} exame(s)</p>
              </div>
            </div>
          </section>

          {/* Rodapé */}
          <Separator className="mb-6" />
          <div className="text-center text-sm text-muted-foreground print:text-xs">
            <p>Relatório gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            <p className="mt-1">Sistema REGENAPP — Fisioterapia Regenerativa</p>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Relatório por Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do destinatário</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail}>
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisualizarRelatorio;
