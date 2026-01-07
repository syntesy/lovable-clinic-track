import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Activity, User, Upload, X, FileText, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { TreatmentSessionFormData, safeParseFloat, safeParseInt } from "@/types/forms";
import { useRegistryEpisode } from "@/hooks/useRegistryEpisode";
import { useTherapyTaxonomy } from "@/hooks/useTherapyTaxonomy";

// Opções legadas que não estão na taxonomia (técnicas, não terapias)
const LEGACY_TECHNIQUE_OPTIONS = [
  { id: "MAC", label: "MAC" },
  { id: "EPI", label: "EPI" },
  { id: "ONDAS_CHOQUE", label: "Ondas de Choque" },
];

const RegistrarEvolucao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ultrasoundFiles, setUltrasoundFiles] = useState<File[]>([]);
  const [thermographyFiles, setThermographyFiles] = useState<File[]>([]);
  const [bloodTestFiles, setBloodTestFiles] = useState<File[]>([]);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  
  // Carregar taxonomia
  const { items: taxonomyItems, loading: taxonomyLoading } = useTherapyTaxonomy();
  
  // Combinar técnicas legadas + itens da taxonomia
  const allProtocolOptions = useMemo(() => {
    const taxonomyOptions = taxonomyItems.map(item => ({
      id: item.code,
      label: item.name,
      isTaxonomy: true,
    }));
    
    const legacyOptions = LEGACY_TECHNIQUE_OPTIONS.map(opt => ({
      ...opt,
      isTaxonomy: false,
    }));
    
    // Legadas primeiro, depois taxonomia
    return [...legacyOptions, ...taxonomyOptions];
  }, [taxonomyItems]);
  
  // Registry episode hook - non-intrusive capture
  const { 
    ensureActiveEpisode, 
    captureProcedurePerformed, 
    captureFollowup
  } = useRegistryEpisode(id || "");
  
  // Ensure episode exists on mount
  useEffect(() => {
    if (id) {
      ensureActiveEpisode().catch(console.error);
    }
  }, [id]);
  
  // Exam results state
  const [examResults, setExamResults] = useState({
    hemoglobin: "",
    hematocrit: "",
    platelets: "",
    leukocytes: "",
    pcr: "",
    glucose: "",
    hba1c: "",
    observations: "",
  });
  
  // Re-evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    apt: boolean;
    message: string;
  } | null>(null);
  
  const { register, handleSubmit, watch, setValue } = useForm<TreatmentSessionFormData>();

  const handleProtocolChange = (protocolId: string, checked: boolean) => {
    if (checked) {
      setSelectedProtocols([...selectedProtocols, protocolId]);
    } else {
      setSelectedProtocols(selectedProtocols.filter((p) => p !== protocolId));
    }
  };

  const handleReEvaluate = () => {
    setIsEvaluating(true);
    
    // Simulate evaluation logic based on exam results
    setTimeout(() => {
      const platelets = parseFloat(examResults.platelets);
      const hemoglobin = parseFloat(examResults.hemoglobin);
      const pcr = parseFloat(examResults.pcr);
      
      let apt = true;
      let messages: string[] = [];
      
      if (platelets && platelets < 100000) {
        apt = false;
        messages.push("Plaquetas abaixo de 100.000/mm³");
      }
      
      if (hemoglobin && hemoglobin < 10) {
        apt = false;
        messages.push("Hemoglobina abaixo de 10 g/dL");
      }
      
      if (pcr && pcr > 10) {
        apt = false;
        messages.push("PCR elevada (>10 mg/L)");
      }
      
      if (messages.length === 0 && !platelets && !hemoglobin && !pcr) {
        setEvaluationResult({
          apt: true,
          message: "Preencha os resultados dos exames para uma avaliação completa.",
        });
      } else if (apt) {
        setEvaluationResult({
          apt: true,
          message: "Paciente apto para realizar o procedimento.",
        });
      } else {
        setEvaluationResult({
          apt: false,
          message: `Contraindicações: ${messages.join(", ")}`,
        });
      }
      
      setIsEvaluating(false);
    }, 1000);
  };


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

  const { data: sessions } = useQuery({
    queryKey: ["patient-sessions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_sessions")
        .select("*")
        .eq("patient_id", id)
        .order("session_number", { ascending: false });

      if (error) throw error;
      return data;
    },
  });


  const handleDischarge = async () => {
    try {
      const { error } = await supabase
        .from("patient_discharges")
        .insert({
          patient_id: id,
          discharge_date: new Date().toISOString().split('T')[0],
          discharge_notes: "Alta terapêutica registrada"
        });

      if (error) throw error;

      toast.success("Alta terapêutica registrada com sucesso!");
      navigate(`/pacientes/${id}`);
    } catch (error) {
      console.error("Erro ao registrar alta:", error);
      toast.error("Erro ao registrar alta terapêutica");
    }
  };

  const onSubmit = async (data: TreatmentSessionFormData) => {
    setIsSubmitting(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("treatment_sessions")
        .insert([
          {
            patient_id: id,
            session_number: data.session_number ? parseInt(data.session_number) : 1,
            session_date: data.session_date,
            vas_on_day: data.vas_on_day ? parseFloat(data.vas_on_day) : null,
            session_description: selectedProtocols.length > 0 ? selectedProtocols.join(", ") : null,
            clinical_observations: data.clinical_observations,
            light_type: selectedProtocols.join(", ") || null,
            treatment_time: data.treatment_time_total ? parseFloat(data.treatment_time_total) : null,
            pharmaceutical_used: data.pharmaceutical_used,
            associated_techniques: data.associated_techniques,
            // Exam results
            hemoglobin: examResults.hemoglobin ? parseFloat(examResults.hemoglobin) : null,
            hematocrit: examResults.hematocrit ? parseFloat(examResults.hematocrit) : null,
            platelets: examResults.platelets ? parseFloat(examResults.platelets) : null,
            leukocytes: examResults.leukocytes ? parseFloat(examResults.leukocytes) : null,
            pcr: examResults.pcr ? parseFloat(examResults.pcr) : null,
            glucose: examResults.glucose ? parseFloat(examResults.glucose) : null,
            hba1c: examResults.hba1c ? parseFloat(examResults.hba1c) : null,
            exam_observations: examResults.observations || null,
            aptitude_status: evaluationResult ? (evaluationResult.apt ? "apt" : "not_apt") : null,
            selected_protocols: selectedProtocols.length > 0 ? selectedProtocols : null,
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Upload files if any
      const sessionId = sessionData.id;

      // Upload ultrasound images
      for (const file of ultrasoundFiles) {
        const filePath = `session-images/${sessionId}/ultrasound/${file.name}`;
        await supabase.from("session_images").insert({
          session_id: sessionId,
          file_name: file.name,
          file_path: filePath,
          image_type: "ultrasound",
        });
      }

      // Upload thermography images
      for (const file of thermographyFiles) {
        const filePath = `session-images/${sessionId}/thermography/${file.name}`;
        await supabase.from("session_images").insert({
          session_id: sessionId,
          file_name: file.name,
          file_path: filePath,
          image_type: "thermography",
        });
      }

      // Upload blood test files
      for (const file of bloodTestFiles) {
        const filePath = `session-images/${sessionId}/blood-test/${file.name}`;
        await supabase.from("session_images").insert({
          session_id: sessionId,
          file_name: file.name,
          file_path: filePath,
          image_type: "blood_test",
        });
      }

      // === REGISTRY CAPTURE: Follow-up + Procedure Performed (non-intrusive) ===
      try {
        const sessionNumber = data.session_number ? parseInt(data.session_number) : 1;
        // Infer timepoint based on session number
        let timepoint: 'baseline' | '1m' | '3m' | '6m' | '12m' = 'baseline';
        if (sessionNumber <= 1) timepoint = 'baseline';
        else if (sessionNumber <= 4) timepoint = '1m';
        else if (sessionNumber <= 8) timepoint = '3m';
        else if (sessionNumber <= 12) timepoint = '6m';
        else timepoint = '12m';

        // Capture followup
        await captureFollowup(
          timepoint,
          data.vas_on_day ? parseFloat(data.vas_on_day) : undefined,
          undefined, // function_score
          undefined, // satisfaction
          data.clinical_observations || undefined
        );

        // Capture procedure performed if protocols selected (indicates procedure was done)
        if (selectedProtocols.length > 0) {
          await captureProcedurePerformed(
            selectedProtocols[0], // Primary protocol type
            data.session_date || new Date().toISOString().split('T')[0],
            sessionNumber,
            undefined, // target
            undefined, // guidance
            undefined, // volumeUsed
            {
              protocols: selectedProtocols,
              pharmaceutical: data.pharmaceutical_used || null,
              techniques: data.associated_techniques || null,
            },
            false, // adverseEvent
            undefined, // adverseEventNotes
            data.clinical_observations || undefined
          );
        }
      } catch (registryError) {
        // Non-blocking: log but don't fail the main operation
        console.error("Registry capture error (non-blocking):", registryError);
      }

      toast.success("Evolução registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["patient-sessions", id] });
      navigate(`/pacientes/${id}`);
    } catch (error) {
      console.error("Erro ao registrar evolução:", error);
      toast.error("Erro ao registrar evolução");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (!patient) {
    return <div className="text-center py-12">Paciente não encontrado</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/pacientes/${id}`)}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-3xl font-bold text-foreground truncate">Registrar Evolução</h2>
          <p className="text-sm md:text-base text-muted-foreground truncate">
            {patient.full_name}
          </p>
        </div>
      </div>

      <Card className="border-border bg-accent/20">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{patient.full_name}</h3>
              <p className="text-sm text-muted-foreground">
                {patient.age} anos • {patient.treated_region || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Dados da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_number">Sessão de Número *</Label>
                <Input
                  id="session_number"
                  type="number"
                  min="1"
                  {...register("session_number")}
                  required
                  className="border-input"
                  placeholder="Ex: 1, 2, 3..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_date">Data da Sessão *</Label>
                <Input
                  id="session_date"
                  type="date"
                  {...register("session_date")}
                  required
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vas_on_day">EVA no Dia (0-10)</Label>
                <Input
                  id="vas_on_day"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...register("vas_on_day")}
                  className="border-input"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base md:text-lg font-semibold text-foreground block">
                Protocolo (selecione um ou mais)
              </Label>
              {taxonomyLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando protocolos...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {allProtocolOptions.map((protocol) => (
                    <div
                      key={protocol.id}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProtocols.includes(protocol.id)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-accent/10 hover:border-primary/50"
                      }`}
                      onClick={() =>
                        handleProtocolChange(
                          protocol.id,
                          !selectedProtocols.includes(protocol.id)
                        )
                      }
                    >
                      <Checkbox
                        id={`protocol-${protocol.id}`}
                        checked={selectedProtocols.includes(protocol.id)}
                        onCheckedChange={(checked) =>
                          handleProtocolChange(protocol.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`protocol-${protocol.id}`}
                        className="font-semibold cursor-pointer text-xs"
                      >
                        {protocol.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              {selectedProtocols.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Protocolos selecionados: {selectedProtocols.join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmaceutical_used">Fármaco Utilizado</Label>
              <Input
                id="pharmaceutical_used"
                type="text"
                {...register("pharmaceutical_used")}
                className="border-input"
                placeholder="Ex: Azul de Metileno..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="associated_techniques">Técnicas Associadas</Label>
              <Textarea
                id="associated_techniques"
                {...register("associated_techniques")}
                className="border-input min-h-[80px]"
                placeholder="Descreva as técnicas associadas ao tratamento..."
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="clinical_observations">Observações Clínicas</Label>
              <Textarea
                id="clinical_observations"
                {...register("clinical_observations")}
                className="border-input"
                placeholder="Observações sobre a evolução clínica do paciente..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Resultados de Exames */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Resultados dos Exames
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hemoglobin">Hemoglobina (g/dL)</Label>
                <Input
                  id="hemoglobin"
                  type="number"
                  step="0.1"
                  value={examResults.hemoglobin}
                  onChange={(e) =>
                    setExamResults({ ...examResults, hemoglobin: e.target.value })
                  }
                  className="border-input"
                  placeholder="Ex: 14.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hematocrit">Hematócrito (%)</Label>
                <Input
                  id="hematocrit"
                  type="number"
                  step="0.1"
                  value={examResults.hematocrit}
                  onChange={(e) =>
                    setExamResults({ ...examResults, hematocrit: e.target.value })
                  }
                  className="border-input"
                  placeholder="Ex: 42"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platelets">Plaquetas (/mm³)</Label>
                <Input
                  id="platelets"
                  type="number"
                  value={examResults.platelets}
                  onChange={(e) =>
                    setExamResults({ ...examResults, platelets: e.target.value })
                  }
                  className="border-input"
                  placeholder="Ex: 250000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leukocytes">Leucócitos (/mm³)</Label>
                <Input
                  id="leukocytes"
                  type="number"
                  value={examResults.leukocytes}
                  onChange={(e) =>
                    setExamResults({ ...examResults, leukocytes: e.target.value })
                  }
                  className="border-input"
                  placeholder="Ex: 7000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pcr">PCR (mg/L)</Label>
                <Input
                  id="pcr"
                  type="number"
                  step="0.01"
                  value={examResults.pcr}
                  onChange={(e) =>
                    setExamResults({ ...examResults, pcr: e.target.value })
                  }
                  className="border-input"
                  placeholder="Ex: 3.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="glucose">Glicose (mg/dL)</Label>
                <Input
                  id="glucose"
                  type="number"
                  value={examResults.glucose}
                  onChange={(e) =>
                    setExamResults({ ...examResults, glucose: e.target.value })
                  }
                  className="border-input"
                  placeholder="Ex: 95"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hba1c">HbA1c (%)</Label>
                <Input
                  id="hba1c"
                  type="number"
                  step="0.1"
                  value={examResults.hba1c}
                  onChange={(e) =>
                    setExamResults({ ...examResults, hba1c: e.target.value })
                  }
                  className="border-input"
                  placeholder="Ex: 5.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam_observations">Observações dos Exames</Label>
              <Textarea
                id="exam_observations"
                value={examResults.observations}
                onChange={(e) =>
                  setExamResults({ ...examResults, observations: e.target.value })
                }
                className="border-input min-h-[80px]"
                placeholder="Observações sobre os resultados dos exames..."
              />
            </div>

            {/* Botão de Reavaliação */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <Button
                type="button"
                onClick={handleReEvaluate}
                disabled={isEvaluating}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isEvaluating ? "animate-spin" : ""}`} />
                {isEvaluating ? "Avaliando..." : "Avaliar Aptidão para Procedimento"}
              </Button>

              {evaluationResult && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    evaluationResult.apt
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {evaluationResult.apt ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">{evaluationResult.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-primary" />
              Anexar Arquivos de Exames
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Imagens de Ultrassom</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setUltrasoundFiles(Array.from(e.target.files));
                  }
                }}
                className="border-input"
              />
              {ultrasoundFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {ultrasoundFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-accent/20 px-3 py-1 rounded-md"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          setUltrasoundFiles(ultrasoundFiles.filter((_, i) => i !== idx));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Imagens de Termografia</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setThermographyFiles(Array.from(e.target.files));
                  }
                }}
                className="border-input"
              />
              {thermographyFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {thermographyFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-accent/20 px-3 py-1 rounded-md"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          setThermographyFiles(thermographyFiles.filter((_, i) => i !== idx));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Exames de Sangue</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setBloodTestFiles(Array.from(e.target.files));
                  }
                }}
                className="border-input"
              />
              {bloodTestFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {bloodTestFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-accent/20 px-3 py-1 rounded-md"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          setBloodTestFiles(bloodTestFiles.filter((_, i) => i !== idx));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/evolucao")}
            style={{ marginRight: '16px' }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleDischarge}
            style={{ 
              backgroundColor: '#2F3F6B', 
              color: '#FFFFFF', 
              borderRadius: '12px',
              marginRight: '16px',
              fontWeight: 600
            }}
            className="hover:opacity-90"
          >
            Alta Terapêutica
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            style={{ 
              backgroundColor: '#2F3F6B', 
              color: '#FFFFFF', 
              borderRadius: '12px',
              fontWeight: 600
            }}
            className="hover:opacity-90"
          >
            {isSubmitting ? "Salvando..." : "Registrar Evolução"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegistrarEvolucao;
