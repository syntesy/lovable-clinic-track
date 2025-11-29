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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, FileText, User } from "lucide-react";

const ProtocoloMAC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usesPhotosensitizer, setUsesPhotosensitizer] = useState(false);
  const { register, handleSubmit, watch } = useForm();

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

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("mac_protocols").insert([
        {
          patient_id: id,
          light_type: data.light_type,
          wavelength: parseFloat(data.wavelength),
          power: parseFloat(data.power),
          total_energy: parseFloat(data.total_energy),
          fluence: parseFloat(data.fluence),
          irradiated_area: parseFloat(data.irradiated_area),
          application_time: parseFloat(data.application_time),
          delivery_mode: data.delivery_mode,
          technique: data.technique,
          target_tissue: data.target_tissue,
          frequency: data.frequency ? parseFloat(data.frequency) : null,
          distance_to_tissue: data.distance_to_tissue ? parseFloat(data.distance_to_tissue) : null,
          estimated_depth: data.estimated_depth ? parseFloat(data.estimated_depth) : null,
          uses_photosensitizer: usesPhotosensitizer,
          photosensitizer_type: usesPhotosensitizer ? data.photosensitizer_type : null,
          concentration: usesPhotosensitizer && data.concentration ? parseFloat(data.concentration) : null,
          application_method: usesPhotosensitizer ? data.application_method : null,
          time_between_application_and_irradiation: usesPhotosensitizer ? data.time_between_application_and_irradiation : null,
          mac_time_per_session: data.mac_time_per_session ? parseFloat(data.mac_time_per_session) : null,
          accumulated_treatment_time: data.accumulated_treatment_time ? parseFloat(data.accumulated_treatment_time) : null,
          clinical_rationale: data.clinical_rationale,
          technical_observations: data.technical_observations,
        },
      ]);

      if (error) throw error;

      toast.success("Protocolo MAC cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["patient-protocols", id] });
      navigate(`/pacientes/${id}`);
    } catch (error) {
      console.error("Erro ao cadastrar protocolo:", error);
      toast.error("Erro ao cadastrar protocolo MAC");
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
          onClick={() => navigate(`/pacientes/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-foreground">Protocolo MAC</h2>
          <p className="text-muted-foreground">
            Método de Aceleração Cicatricial
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
        {/* Parâmetros da Luz */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Parâmetros de Fotobiomodulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="light_type">Tipo de Luz *</Label>
                <Input
                  id="light_type"
                  {...register("light_type")}
                  required
                  placeholder="Ex: LED, Laser"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wavelength">Comprimento de Onda (nm) *</Label>
                <Input
                  id="wavelength"
                  type="number"
                  step="0.1"
                  {...register("wavelength")}
                  required
                  placeholder="Ex: 660, 850"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="power">Potência (mW) *</Label>
                <Input
                  id="power"
                  type="number"
                  step="0.1"
                  {...register("power")}
                  required
                  placeholder="Ex: 100, 200"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="irradiated_area">Área Irradiada (cm²) *</Label>
                <Input
                  id="irradiated_area"
                  type="number"
                  step="0.01"
                  {...register("irradiated_area")}
                  required
                  placeholder="Ex: 1, 4"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="application_time">Tempo de Aplicação (s) *</Label>
                <Input
                  id="application_time"
                  type="number"
                  step="1"
                  {...register("application_time")}
                  required
                  placeholder="Ex: 60, 120"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência (Hz)</Label>
                <Input
                  id="frequency"
                  type="number"
                  step="0.1"
                  {...register("frequency")}
                  placeholder="Ex: 10, 50 (opcional)"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_energy">Energia Total (J) *</Label>
                <Input
                  id="total_energy"
                  type="number"
                  step="0.01"
                  {...register("total_energy")}
                  required
                  placeholder="Ex: 6, 12"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fluence">Fluência (J/cm²) *</Label>
                <Input
                  id="fluence"
                  type="number"
                  step="0.01"
                  {...register("fluence")}
                  required
                  placeholder="Ex: 4, 8"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance_to_tissue">Distância ao Tecido (cm)</Label>
                <Input
                  id="distance_to_tissue"
                  type="number"
                  step="0.1"
                  {...register("distance_to_tissue")}
                  placeholder="Ex: 0, 2 (opcional)"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modo e Técnica */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Modo de Aplicação e Técnica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_mode">Modo de Entrega *</Label>
                <Input
                  id="delivery_mode"
                  {...register("delivery_mode")}
                  required
                  placeholder="Ex: Contínuo, Pulsado"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technique">Técnica *</Label>
                <Input
                  id="technique"
                  {...register("technique")}
                  required
                  placeholder="Ex: Pontual, Varredura"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_tissue">Tecido Alvo *</Label>
                <Input
                  id="target_tissue"
                  {...register("target_tissue")}
                  required
                  placeholder="Ex: Músculo, Tendão, Ligamento"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_depth">Profundidade Estimada (mm)</Label>
                <Input
                  id="estimated_depth"
                  type="number"
                  step="0.1"
                  {...register("estimated_depth")}
                  placeholder="Ex: 10, 20 (opcional)"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fotossensibilizador */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Fotossensibilizador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="uses_photosensitizer"
                checked={usesPhotosensitizer}
                onCheckedChange={(checked) => setUsesPhotosensitizer(!!checked)}
              />
              <Label htmlFor="uses_photosensitizer" className="font-normal">
                Utiliza fotossensibilizador
              </Label>
            </div>

            {usesPhotosensitizer && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="photosensitizer_type">Tipo de Fotossensibilizador</Label>
                    <Input
                      id="photosensitizer_type"
                      {...register("photosensitizer_type")}
                      placeholder="Ex: Azul de Metileno"
                      style={{
                        backgroundColor: '#F5F6FA',
                        border: '2px solid #3D4F7C',
                        borderRadius: '14px',
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="concentration">Concentração (%)</Label>
                    <Input
                      id="concentration"
                      type="number"
                      step="0.01"
                      {...register("concentration")}
                      placeholder="Ex: 0.01, 0.05"
                      style={{
                        backgroundColor: '#F5F6FA',
                        border: '2px solid #3D4F7C',
                        borderRadius: '14px',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="application_method">Método de Aplicação</Label>
                    <Input
                      id="application_method"
                      {...register("application_method")}
                      placeholder="Ex: Tópico, Injetável"
                      style={{
                        backgroundColor: '#F5F6FA',
                        border: '2px solid #3D4F7C',
                        borderRadius: '14px',
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time_between_application_and_irradiation">
                      Tempo entre Aplicação e Irradiação
                    </Label>
                    <Input
                      id="time_between_application_and_irradiation"
                      {...register("time_between_application_and_irradiation")}
                      placeholder="Ex: 5 minutos, 10 minutos"
                      style={{
                        backgroundColor: '#F5F6FA',
                        border: '2px solid #3D4F7C',
                        borderRadius: '14px',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tempo de Tratamento */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Tempo de Tratamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mac_time_per_session">Tempo MAC por Sessão (min)</Label>
                <Input
                  id="mac_time_per_session"
                  type="number"
                  step="0.1"
                  {...register("mac_time_per_session")}
                  placeholder="Ex: 5, 10 (opcional)"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accumulated_treatment_time">
                  Tempo Acumulado Total (min)
                </Label>
                <Input
                  id="accumulated_treatment_time"
                  type="number"
                  step="0.1"
                  {...register("accumulated_treatment_time")}
                  placeholder="Ex: 50, 100 (opcional)"
                  style={{
                    backgroundColor: '#F5F6FA',
                    border: '2px solid #3D4F7C',
                    borderRadius: '14px',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinical_rationale">Justificativa Clínica</Label>
              <Textarea
                id="clinical_rationale"
                {...register("clinical_rationale")}
                placeholder="Descreva a justificativa clínica para o protocolo escolhido..."
                className="min-h-[100px]"
                style={{
                  backgroundColor: '#F5F6FA',
                  border: '2px solid #3D4F7C',
                  borderRadius: '14px',
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technical_observations">Observações Técnicas</Label>
              <Textarea
                id="technical_observations"
                {...register("technical_observations")}
                placeholder="Observações sobre a aplicação do protocolo..."
                className="min-h-[100px]"
                style={{
                  backgroundColor: '#F5F6FA',
                  border: '2px solid #3D4F7C',
                  borderRadius: '14px',
                }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/pacientes/${id}`)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: '#2F3F6B',
              color: '#FFFFFF',
              borderRadius: '12px',
              fontWeight: 600,
            }}
            className="hover:opacity-90"
          >
            {isSubmitting ? "Salvando..." : "Cadastrar Protocolo"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProtocoloMAC;
