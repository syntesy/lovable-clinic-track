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
import { ArrowLeft, Upload, FileText, Thermometer, Edit, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AudioRecorder from "@/components/AudioRecorder";

const ProntuarioClinico = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state - 4 campos obrigatórios (FONTE ÚNICA)
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState("");
  
  // Campos adicionais
  const [painNociceptive, setPainNociceptive] = useState(false);
  const [painNeuropathic, setPainNeuropathic] = useState(false);
  const [painNociplastic, setPainNociplastic] = useState(false);
  const [initialVas, setInitialVas] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: clinicalRecord } = useQuery({
    queryKey: ["clinical-record", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("patient_id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: ultrasoundImages } = useQuery({
    queryKey: ["ultrasound-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ultrasound_images")
        .select("*")
        .eq("patient_id", id)
        .order("exam_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: thermographyImages } = useQuery({
    queryKey: ["thermography-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thermography_images")
        .select("*")
        .eq("patient_id", id)
        .order("exam_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Initialize form with patient data (campos legados)
  useEffect(() => {
    if (patient) {
      setPainNociceptive(patient.pain_type_nociceptive || false);
      setPainNeuropathic(patient.pain_type_neuropathic || false);
      setPainNociplastic(patient.pain_type_nociplastic || false);
      setInitialVas(patient.initial_vas?.toString() || "");
    }
  }, [patient]);

  // Initialize all 4 clinical fields from clinical_records (FONTE ÚNICA)
  useEffect(() => {
    if (clinicalRecord) {
      const record = clinicalRecord as Record<string, unknown>;
      setChiefComplaint((record.chief_complaint as string) || "");
      setAnamnesis((record.anamnesis as string) || "");
      setPhysicalExam((record.physical_exam as string) || "");
      setClinicalDiagnosis((record.clinical_diagnosis as string) || "");
    }
  }, [clinicalRecord]);

  // Track changes
  useEffect(() => {
    if (patient && clinicalRecord !== undefined) {
      const record = clinicalRecord as Record<string, unknown> | null;
      
      const patientChanged =
        painNociceptive !== (patient.pain_type_nociceptive || false) ||
        painNeuropathic !== (patient.pain_type_neuropathic || false) ||
        painNociplastic !== (patient.pain_type_nociplastic || false) ||
        initialVas !== (patient.initial_vas?.toString() || "");

      const clinicalChanged = 
        chiefComplaint !== ((record?.chief_complaint as string) || "") ||
        anamnesis !== ((record?.anamnesis as string) || "") ||
        physicalExam !== ((record?.physical_exam as string) || "") ||
        clinicalDiagnosis !== ((record?.clinical_diagnosis as string) || "");

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

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      // Update patient data (apenas classificação de dor e EVA)
      const { error: patientError } = await supabase
        .from("patients")
        .update({
          pain_type_nociceptive: painNociceptive,
          pain_type_neuropathic: painNeuropathic,
          pain_type_nociplastic: painNociplastic,
          initial_vas: initialVas ? parseFloat(initialVas) : null,
        })
        .eq("id", id);

      if (patientError) throw patientError;

      // Upsert clinical record com os 4 campos obrigatórios (FONTE ÚNICA)
      const clinicalData = {
        chief_complaint: chiefComplaint.trim() || null,
        anamnesis: anamnesis.trim() || null,
        physical_exam: physicalExam.trim() || null,
        clinical_diagnosis: clinicalDiagnosis.trim() || null,
      };

      if (clinicalRecord) {
        const { error: recordError } = await supabase
          .from("clinical_records")
          .update(clinicalData)
          .eq("id", clinicalRecord.id);

        if (recordError) throw recordError;
      } else {
        const { error: insertError } = await supabase
          .from("clinical_records")
          .insert({
            patient_id: id,
            ...clinicalData,
          });

        if (insertError) throw insertError;
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["patient", id] });
      await queryClient.invalidateQueries({ queryKey: ["clinical-record", id] });
      // Invalidar também o checklist na Avaliação REGENAPP
      await queryClient.invalidateQueries({ queryKey: ["clinical-record-checklist", id] });

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["patient", id] });
      await queryClient.invalidateQueries({ queryKey: ["clinical-record", id] });

      toast.success("Prontuário salvo com sucesso!");
      navigate(`/pacientes/${id}`);
      setHasChanges(false);
    } catch (error) {
      console.error("Erro ao salvar prontuário:", error);
      toast.error("Erro ao salvar prontuário. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (!patient) {
    return <div className="text-center py-12">Paciente não encontrado</div>;
  }

  const getFototipoLabel = (code: string) => {
    const fototipos: { [key: string]: string } = {
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
    <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/pacientes/${id}`)}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-3xl font-bold text-foreground truncate">
              {patient.full_name}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {patient.age} anos • {patient.gender || "—"} •{" "}
              {getFototipoLabel(patient.skin_phototype || "")}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate(`/pacientes/editar/${id}`)}
            className="flex-1 sm:flex-none"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Cadastro
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Salvando..." : "Salvar Prontuário"}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg text-sm">
          ⚠️ Você tem alterações não salvas. Clique em "Salvar Prontuário" para não perder os dados.
        </div>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Avaliação Clínica (Prontuário do Profissional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Estes são os 4 campos obrigatórios para a Avaliação REGENAPP
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo 1: Queixa Principal */}
          <div className="space-y-2">
            <Label htmlFor="chief-complaint" className="flex items-center gap-2">
              Queixa Principal
              {!chiefComplaint.trim() && <span className="text-destructive text-xs">*</span>}
            </Label>
            <Textarea
              id="chief-complaint"
              className="border-input min-h-[80px]"
              placeholder="Descreva a queixa principal do paciente..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
            />
          </div>

          {/* Campo 2: Anamnese */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="anamnesis" className="flex items-center gap-2">
                Anamnese
                {!anamnesis.trim() && <span className="text-destructive text-xs">*</span>}
              </Label>
              <AudioRecorder 
                onTranscription={(text) => {
                  setAnamnesis(prev => prev ? `${prev}\n\n${text}` : text);
                }}
                maxDurationMinutes={45}
              />
            </div>
            <Textarea
              id="anamnesis"
              className="border-input min-h-[150px]"
              placeholder="Histórico clínico detalhado do paciente..."
              value={anamnesis}
              onChange={(e) => setAnamnesis(e.target.value)}
            />
          </div>

          {/* Campo 3: Exame Físico */}
          <div className="space-y-2">
            <Label htmlFor="physical-exam" className="flex items-center gap-2">
              Exame Físico
              {!physicalExam.trim() && <span className="text-destructive text-xs">*</span>}
            </Label>
            <Textarea
              id="physical-exam"
              className="border-input min-h-[120px]"
              placeholder="Achados do exame físico..."
              value={physicalExam}
              onChange={(e) => setPhysicalExam(e.target.value)}
            />
          </div>

          {/* Campo 4: Diagnóstico Clínico */}
          <div className="space-y-2">
            <Label htmlFor="clinical-diagnosis" className="flex items-center gap-2">
              Diagnóstico Clínico
              {!clinicalDiagnosis.trim() && <span className="text-destructive text-xs">*</span>}
            </Label>
            <Textarea
              id="clinical-diagnosis"
              className="border-input min-h-[80px]"
              placeholder="Diagnóstico clínico..."
              value={clinicalDiagnosis}
              onChange={(e) => setClinicalDiagnosis(e.target.value)}
            />
          </div>

          {/* Indicador de completude */}
          <div className="pt-2 border-t">
            {chiefComplaint.trim() && anamnesis.trim() && physicalExam.trim() && clinicalDiagnosis.trim() ? (
              <span className="text-sm text-green-600">✓ Todos os campos obrigatórios preenchidos</span>
            ) : (
              <span className="text-sm text-yellow-600">⚠️ Preencha todos os campos obrigatórios (*)</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Classificação da Dor */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Classificação da Dor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pain_nociceptive"
                checked={painNociceptive}
                onCheckedChange={(checked) =>
                  setPainNociceptive(checked === true)
                }
              />
              <Label htmlFor="pain_nociceptive" className="font-normal">
                Nociceptiva
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pain_neuropathic"
                checked={painNeuropathic}
                onCheckedChange={(checked) =>
                  setPainNeuropathic(checked === true)
                }
              />
              <Label htmlFor="pain_neuropathic" className="font-normal">
                Neuropática
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pain_nociplastic"
                checked={painNociplastic}
                onCheckedChange={(checked) =>
                  setPainNociplastic(checked === true)
                }
              />
              <Label htmlFor="pain_nociplastic" className="font-normal">
                Nociplástica
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
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
              className="border-input max-w-xs"
              value={initialVas}
              onChange={(e) => setInitialVas(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Imagens de Ultrassom */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            Imagens de Ultrassom
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            Adicionar Imagem de Ultrassom
          </Button>
          {ultrasoundImages && ultrasoundImages.length > 0 ? (
            <div className="space-y-2">
              {ultrasoundImages.map((image) => (
                <div
                  key={image.id}
                  className="flex items-center justify-between p-3 bg-accent/20 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{image.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {image.image_type} •{" "}
                      {new Date(image.exam_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Visualizar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma imagem cadastrada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Imagens de Termografia */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Thermometer className="h-5 w-5 mr-2 text-primary" />
            Imagens de Termografia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            Adicionar Imagem de Termografia
          </Button>
          {thermographyImages && thermographyImages.length > 0 ? (
            <div className="space-y-2">
              {thermographyImages.map((image) => (
                <div
                  key={image.id}
                  className="flex items-center justify-between p-3 bg-accent/20 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{image.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {image.evaluated_region} •{" "}
                      {new Date(image.exam_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Visualizar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma imagem cadastrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProntuarioClinico;
