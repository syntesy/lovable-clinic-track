import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Lock, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import AudioRecorder from "@/components/AudioRecorder";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getClinicalRecordById } from "@/lib/clinical-record-helpers";

export default function ClinicalRecordEditor() {
  const { patientId, recordId } = useParams<{ patientId: string; recordId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState("");
  const [painNociceptive, setPainNociceptive] = useState(false);
  const [painNeuropathic, setPainNeuropathic] = useState(false);
  const [painNociplastic, setPainNociplastic] = useState(false);
  const [initialVas, setInitialVas] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Redirect if no recordId (guardrai: não abrir sem ID específico)
  useEffect(() => {
    if (!recordId && patientId) {
      console.log("[ClinicalRecordEditor] No recordId, redirecting to list");
      navigate(`/patients/${patientId}/records`, { replace: true });
    }
  }, [recordId, patientId, navigate]);

  // Fetch patient
  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Tipo B: Carregar prontuário ESPECÍFICO por recordId (usando helper)
  const { data: clinicalRecord, isLoading: loadingRecord, error: recordError } = useQuery({
    queryKey: ["clinical-record", "byId", patientId, recordId],
    queryFn: async () => {
      if (!patientId || !recordId) throw new Error("IDs obrigatórios");
      console.log("[ClinicalRecordEditor] Loading specific record:", recordId);
      return await getClinicalRecordById(patientId, recordId);
    },
    enabled: !!recordId && !!patientId,
  });

  const isReadOnly = clinicalRecord?.status === "final";

  // Initialize form with patient pain data
  useEffect(() => {
    if (patient) {
      setPainNociceptive(patient.pain_type_nociceptive || false);
      setPainNeuropathic(patient.pain_type_neuropathic || false);
      setPainNociplastic(patient.pain_type_nociplastic || false);
      setInitialVas(patient.initial_vas?.toString() || "");
    }
  }, [patient]);

  // Initialize form with clinical record data
  useEffect(() => {
    if (clinicalRecord) {
      setChiefComplaint(clinicalRecord.chief_complaint || "");
      setAnamnesis(clinicalRecord.anamnesis || "");
      setPhysicalExam(clinicalRecord.physical_exam || "");
      setClinicalDiagnosis(clinicalRecord.clinical_diagnosis || "");
    }
  }, [clinicalRecord]);

  // Track changes
  useEffect(() => {
    if (patient && clinicalRecord) {
      const patientChanged =
        painNociceptive !== (patient.pain_type_nociceptive || false) ||
        painNeuropathic !== (patient.pain_type_neuropathic || false) ||
        painNociplastic !== (patient.pain_type_nociplastic || false) ||
        initialVas !== (patient.initial_vas?.toString() || "");

      const clinicalChanged =
        chiefComplaint !== (clinicalRecord.chief_complaint || "") ||
        anamnesis !== (clinicalRecord.anamnesis || "") ||
        physicalExam !== (clinicalRecord.physical_exam || "") ||
        clinicalDiagnosis !== (clinicalRecord.clinical_diagnosis || "");

      setHasChanges(patientChanged || clinicalChanged);
    }
  }, [
    patient,
    clinicalRecord,
    chiefComplaint,
    anamnesis,
    physicalExam,
    clinicalDiagnosis,
    painNociceptive,
    painNeuropathic,
    painNociplastic,
    initialVas,
  ]);

  const handleSave = async (finalize = false) => {
    if (!recordId || !patientId) return;

    setIsSaving(true);
    try {
      // Update patient pain data
      const { error: patientError } = await supabase
        .from("patients")
        .update({
          pain_type_nociceptive: painNociceptive,
          pain_type_neuropathic: painNeuropathic,
          pain_type_nociplastic: painNociplastic,
          initial_vas: initialVas ? parseFloat(initialVas) : null,
        })
        .eq("id", patientId);

      if (patientError) throw patientError;

      // Update clinical record by ID
      const clinicalData: Record<string, unknown> = {
        chief_complaint: chiefComplaint.trim() || null,
        anamnesis: anamnesis.trim() || null,
        physical_exam: physicalExam.trim() || null,
        clinical_diagnosis: clinicalDiagnosis.trim() || null,
      };

      if (finalize) {
        clinicalData.status = "final";
      }

      const { error: recordError } = await supabase
        .from("clinical_records")
        .update(clinicalData)
        .eq("id", recordId)
        .eq("patient_id", patientId);

      if (recordError) {
        // Detectar erro do trigger prevent_final_record_update
        if (recordError.message?.includes("finalizado") || recordError.message?.includes("final")) {
          toast.error("Prontuário finalizado", {
            description: "Este prontuário está finalizado e não pode mais ser editado. Para fazer alterações, crie um novo prontuário.",
            duration: 6000,
          });
          // Recarregar dados para refletir estado real
          await queryClient.invalidateQueries({ queryKey: ["clinical-record", "byId", patientId, recordId] });
          return;
        }
        throw recordError;
      }

      // Invalidate queries (padronizado)
      await queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical-record", "byId", patientId, recordId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical-record", "list", patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical-record", "latest", patientId] });

      if (finalize) {
        toast.success("Prontuário finalizado com sucesso!");
        navigate(`/patients/${patientId}/records`);
      } else {
        toast.success("Prontuário salvo com sucesso!");
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Erro ao salvar prontuário:", error);
      toast.error("Erro ao salvar prontuário. Tente novamente.");
    } finally {
      setIsSaving(false);
      setShowFinalizeDialog(false);
    }
  };

  if (loadingPatient || loadingRecord) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recordError || !clinicalRecord) {
    // Check if we came from an attendance context
    const searchParams = new URLSearchParams(window.location.search);
    const fromAttendance = searchParams.get("atendimento");
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (fromAttendance) {
                navigate(`/atendimentos/${fromAttendance}`);
              } else {
                navigate(`/patients/${patientId}/records`);
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Prontuário não encontrado
          </h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              O prontuário solicitado não foi encontrado ou você não tem permissão para acessá-lo.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {fromAttendance && (
                <Button onClick={() => navigate(`/atendimentos/${fromAttendance}`)}>
                  Voltar ao Atendimento
                </Button>
              )}
              <Button 
                variant={fromAttendance ? "outline" : "default"}
                onClick={() => navigate(`/patients/${patientId}/records`)}
              >
                Voltar ao Histórico de Prontuários
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(`/atendimentos`)}
              >
                Ver Atendimentos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-12">Paciente não encontrado</div>;
  }

  const getFototipoLabel = (code: string) => {
    const fototipos: Record<string, string> = {
      I: "Fototipo I – Pele branca pálida",
      II: "Fototipo II – Pele clara",
      III: "Fototipo III – Branco mais escuro",
      IV: "Fototipo IV – Pele morena clara",
      V: "Fototipo V – Pele morena escura",
      VI: "Fototipo VI – Pele negra",
    };
    return fototipos[code] || code;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/patients/${patientId}/records`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {patient.full_name}
              </h2>
              {isReadOnly && (
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                  <Lock className="w-3 h-3 mr-1" />
                  Finalizado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {patient.age} anos • {patient.gender || "—"} •{" "}
              {getFototipoLabel(patient.skin_phototype || "")}
            </p>
          </div>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="outline"
              onClick={() => setShowFinalizeDialog(true)}
              disabled={isSaving}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        )}
      </div>

      {/* Read-only warning */}
      {isReadOnly && (
        <Alert className="border-green-500/30 bg-green-500/10">
          <Lock className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Prontuário finalizado — edição bloqueada. Crie um novo prontuário se necessário.
          </AlertDescription>
        </Alert>
      )}

      {/* Unsaved changes warning */}
      {hasChanges && !isReadOnly && (
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Você tem alterações não salvas. Clique em "Salvar" para não perder os dados.
          </AlertDescription>
        </Alert>
      )}

      {/* Clinical Assessment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliação Clínica (Prontuário do Profissional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Estes são os 4 campos obrigatórios para a Avaliação REGENAPP
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chief Complaint */}
          <div className="space-y-2">
            <Label htmlFor="chief-complaint" className="flex items-center gap-2">
              Queixa Principal
              {!chiefComplaint.trim() && <span className="text-destructive text-xs">*</span>}
            </Label>
            <Textarea
              id="chief-complaint"
              className="min-h-[80px]"
              placeholder="Descreva a queixa principal do paciente..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              disabled={isReadOnly}
            />
          </div>

          {/* Anamnesis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="anamnesis" className="flex items-center gap-2">
                Anamnese
                {!anamnesis.trim() && <span className="text-destructive text-xs">*</span>}
              </Label>
              {!isReadOnly && (
                <AudioRecorder
                  onTranscription={(text) => {
                    setAnamnesis((prev) => (prev ? `${prev}\n\n${text}` : text));
                  }}
                  maxDurationMinutes={45}
                />
              )}
            </div>
            <Textarea
              id="anamnesis"
              className="min-h-[150px]"
              placeholder="Histórico clínico detalhado do paciente..."
              value={anamnesis}
              onChange={(e) => setAnamnesis(e.target.value)}
              disabled={isReadOnly}
            />
          </div>

          {/* Physical Exam */}
          <div className="space-y-2">
            <Label htmlFor="physical-exam" className="flex items-center gap-2">
              Exame Físico
              {!physicalExam.trim() && <span className="text-destructive text-xs">*</span>}
            </Label>
            <Textarea
              id="physical-exam"
              className="min-h-[120px]"
              placeholder="Achados do exame físico..."
              value={physicalExam}
              onChange={(e) => setPhysicalExam(e.target.value)}
              disabled={isReadOnly}
            />
          </div>

          {/* Clinical Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="clinical-diagnosis" className="flex items-center gap-2">
              Diagnóstico Clínico
              {!clinicalDiagnosis.trim() && <span className="text-destructive text-xs">*</span>}
            </Label>
            <Textarea
              id="clinical-diagnosis"
              className="min-h-[80px]"
              placeholder="Diagnóstico clínico..."
              value={clinicalDiagnosis}
              onChange={(e) => setClinicalDiagnosis(e.target.value)}
              disabled={isReadOnly}
            />
          </div>

          {/* Completion indicator */}
          <div className="pt-2 border-t">
            {chiefComplaint.trim() && anamnesis.trim() && physicalExam.trim() && clinicalDiagnosis.trim() ? (
              <span className="text-sm text-green-600">✓ Todos os campos obrigatórios preenchidos</span>
            ) : (
              <span className="text-sm text-amber-600">⚠️ Preencha todos os campos obrigatórios (*)</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pain Classification */}
      <Card>
        <CardHeader>
          <CardTitle>Classificação da Dor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pain_nociceptive"
                checked={painNociceptive}
                onCheckedChange={(checked) => setPainNociceptive(checked === true)}
                disabled={isReadOnly}
              />
              <Label htmlFor="pain_nociceptive" className="font-normal">
                Nociceptiva
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pain_neuropathic"
                checked={painNeuropathic}
                onCheckedChange={(checked) => setPainNeuropathic(checked === true)}
                disabled={isReadOnly}
              />
              <Label htmlFor="pain_neuropathic" className="font-normal">
                Neuropática
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pain_nociplastic"
                checked={painNociplastic}
                onCheckedChange={(checked) => setPainNociplastic(checked === true)}
                disabled={isReadOnly}
              />
              <Label htmlFor="pain_nociplastic" className="font-normal">
                Nociplástica
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Baseline Scales */}
      <Card>
        <CardHeader>
          <CardTitle>Escalas Baseline (Pré-Tratamento)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>EVA Inicial (0-10)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="max-w-xs"
              value={initialVas}
              onChange={(e) => setInitialVas(e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Finalize Dialog */}
      <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar prontuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao finalizar, o prontuário será bloqueado para edição.
              Você poderá visualizar e imprimir, mas não alterar os dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Finalizar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
