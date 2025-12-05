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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [luz1, setLuz1] = useState<string>("");
  const [luz2, setLuz2] = useState<string>("");
  const [luz3, setLuz3] = useState<string>("");
  const [luz4, setLuz4] = useState<string>("");
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
            session_description: null,
            clinical_observations: data.clinical_observations,
            light_type: [luz1, luz2, luz3, luz4].filter(Boolean).join(", "),
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
    <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/evolucao")}
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
                Cluster Utilizado
              </Label>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <Label className="font-medium min-w-[60px] text-sm md:text-base text-foreground">
                    1ª Luz
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Select value={luz1} onValueChange={setLuz1}>
                      <SelectTrigger 
                        className="w-full sm:w-[140px] md:w-[160px]"
                        style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px' }}
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vermelho">Vermelho</SelectItem>
                        <SelectItem value="Infravermelho">Infravermelho</SelectItem>
                        <SelectItem value="Verde">Verde</SelectItem>
                        <SelectItem value="Âmbar">Âmbar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="T1" {...register("tempo_luz1_a")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                    <Input type="number" placeholder="T2" {...register("tempo_luz1_b")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                    <Input type="number" placeholder="T3" {...register("tempo_luz1_c")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <Label className="font-medium min-w-[60px] text-sm md:text-base text-foreground">
                    2ª Luz
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Select value={luz2} onValueChange={setLuz2}>
                      <SelectTrigger 
                        className="w-full sm:w-[140px] md:w-[160px]"
                        style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px' }}
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vermelho">Vermelho</SelectItem>
                        <SelectItem value="Infravermelho">Infravermelho</SelectItem>
                        <SelectItem value="Verde">Verde</SelectItem>
                        <SelectItem value="Âmbar">Âmbar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="T1" {...register("tempo_luz2_a")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                    <Input type="number" placeholder="T2" {...register("tempo_luz2_b")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                    <Input type="number" placeholder="T3" {...register("tempo_luz2_c")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <Label className="font-medium min-w-[60px] text-sm md:text-base text-foreground">
                    3ª Luz
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Select value={luz3} onValueChange={setLuz3}>
                      <SelectTrigger 
                        className="w-full sm:w-[140px] md:w-[160px]"
                        style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px' }}
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vermelho">Vermelho</SelectItem>
                        <SelectItem value="Infravermelho">Infravermelho</SelectItem>
                        <SelectItem value="Verde">Verde</SelectItem>
                        <SelectItem value="Âmbar">Âmbar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="T1" {...register("tempo_luz3_a")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                    <Input type="number" placeholder="T2" {...register("tempo_luz3_b")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                    <Input type="number" placeholder="T3" {...register("tempo_luz3_c")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <Label className="font-medium min-w-[60px] text-sm md:text-base text-foreground">
                    4ª Luz
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Select value={luz4} onValueChange={setLuz4}>
                      <SelectTrigger 
                        className="w-full sm:w-[140px] md:w-[160px]"
                        style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px' }}
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vermelho">Vermelho</SelectItem>
                        <SelectItem value="Infravermelho">Infravermelho</SelectItem>
                        <SelectItem value="Verde">Verde</SelectItem>
                        <SelectItem value="Âmbar">Âmbar</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="T1" {...register("tempo_luz4_a")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                    <Input type="number" placeholder="T2" {...register("tempo_luz4_b")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                    <Input type="number" placeholder="T3" {...register("tempo_luz4_c")} className="w-[70px] md:w-[100px] placeholder:text-muted-foreground" style={{ backgroundColor: '#F5F6FA', border: '2px solid #3D4F7C', borderRadius: '14px', color: '#1F1F1F' }} />
                  </div>
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
