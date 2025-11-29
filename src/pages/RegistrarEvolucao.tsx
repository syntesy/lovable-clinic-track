import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Activity, User, Upload, X } from "lucide-react";

const RegistrarEvolucao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ultrasoundFiles, setUltrasoundFiles] = useState<File[]>([]);
  const [thermographyFiles, setThermographyFiles] = useState<File[]>([]);
  const [bloodTestFiles, setBloodTestFiles] = useState<File[]>([]);
  const [selectedLights, setSelectedLights] = useState<string[]>([]);
  const { register, handleSubmit, watch, setValue } = useForm();

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
      navigate("/evolucao");
    } catch (error) {
      console.error("Erro ao registrar alta:", error);
      toast.error("Erro ao registrar alta terapêutica");
    }
  };

  const onSubmit = async (data: any) => {
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
            session_description: data.session_description,
            clinical_observations: data.clinical_observations,
            light_type: selectedLights.join(", "),
            treatment_time: data.treatment_time_total ? parseFloat(data.treatment_time_total) : null,
            pharmaceutical_used: data.pharmaceutical_used,
            associated_techniques: data.associated_techniques,
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

      toast.success("Evolução registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["patient-sessions", id] });
      navigate("/evolucao");
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/evolucao")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-foreground">Registrar Evolução</h2>
          <p className="text-muted-foreground">
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
                <Label htmlFor="session_number">Número da Sessão *</Label>
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
              <Label>LUZ</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="luz_vermelho"
                    checked={selectedLights.includes("Vermelho")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLights([...selectedLights, "Vermelho"]);
                      } else {
                        setSelectedLights(selectedLights.filter(l => l !== "Vermelho"));
                      }
                    }}
                  />
                  <Label htmlFor="luz_vermelho" className="font-normal flex-1">Vermelho</Label>
                  <Input
                    type="number"
                    placeholder="Tempo (s)"
                    {...register("tempo_vermelho")}
                    className="w-28 border-input"
                    disabled={!selectedLights.includes("Vermelho")}
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="luz_infravermelho"
                    checked={selectedLights.includes("Infravermelho")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLights([...selectedLights, "Infravermelho"]);
                      } else {
                        setSelectedLights(selectedLights.filter(l => l !== "Infravermelho"));
                      }
                    }}
                  />
                  <Label htmlFor="luz_infravermelho" className="font-normal flex-1">Infravermelho</Label>
                  <Input
                    type="number"
                    placeholder="Tempo (s)"
                    {...register("tempo_infravermelho")}
                    className="w-28 border-input"
                    disabled={!selectedLights.includes("Infravermelho")}
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="luz_verde"
                    checked={selectedLights.includes("Verde")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLights([...selectedLights, "Verde"]);
                      } else {
                        setSelectedLights(selectedLights.filter(l => l !== "Verde"));
                      }
                    }}
                  />
                  <Label htmlFor="luz_verde" className="font-normal flex-1">Verde</Label>
                  <Input
                    type="number"
                    placeholder="Tempo (s)"
                    {...register("tempo_verde")}
                    className="w-28 border-input"
                    disabled={!selectedLights.includes("Verde")}
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="luz_ambar"
                    checked={selectedLights.includes("Âmbar")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLights([...selectedLights, "Âmbar"]);
                      } else {
                        setSelectedLights(selectedLights.filter(l => l !== "Âmbar"));
                      }
                    }}
                  />
                  <Label htmlFor="luz_ambar" className="font-normal flex-1">Âmbar</Label>
                  <Input
                    type="number"
                    placeholder="Tempo (s)"
                    {...register("tempo_ambar")}
                    className="w-28 border-input"
                    disabled={!selectedLights.includes("Âmbar")}
                  />
                </div>
              </div>
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
              <Label htmlFor="session_description">Descrição da Sessão</Label>
              <Textarea
                id="session_description"
                {...register("session_description")}
                className="border-input min-h-[100px]"
                placeholder="Descreva o que foi realizado durante a sessão..."
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

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-primary" />
              Exames e Imagens
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
