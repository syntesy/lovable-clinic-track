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
import { toast } from "sonner";
import { ArrowLeft, Activity, User } from "lucide-react";

const RegistrarEvolucao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm();

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

  const nextSessionNumber = sessions && sessions.length > 0 
    ? sessions[0].session_number + 1 
    : 1;

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("treatment_sessions").insert([
        {
          patient_id: id,
          session_number: nextSessionNumber,
          session_date: data.session_date,
          vas_on_day: data.vas_on_day ? parseFloat(data.vas_on_day) : null,
          function_score: data.function_score ? parseFloat(data.function_score) : null,
          mobility_score: data.mobility_score ? parseFloat(data.mobility_score) : null,
          session_description: data.session_description,
          clinical_observations: data.clinical_observations,
          immediate_response: data.immediate_response,
          improvement_percentage: data.improvement_percentage ? parseFloat(data.improvement_percentage) : null,
          used_therapeutic_exercise: data.used_therapeutic_exercise || false,
          used_stretching: data.used_stretching || false,
          used_epi: data.used_epi || false,
          used_infiltration: data.used_infiltration || false,
          used_neuromodulation: data.used_neuromodulation || false,
          used_other_techniques: data.used_other_techniques || false,
          other_techniques_description: data.other_techniques_description,
          next_session_plan: data.next_session_plan,
        },
      ]);

      if (error) throw error;

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
            Sessão #{nextSessionNumber} • {patient.full_name}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="improvement_percentage">
                  Melhora Percentual (%)
                </Label>
                <Input
                  id="improvement_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...register("improvement_percentage")}
                  className="border-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="function_score">Função (0-10)</Label>
                <Input
                  id="function_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...register("function_score")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobility_score">Mobilidade (0-10)</Label>
                <Input
                  id="mobility_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...register("mobility_score")}
                  className="border-input"
                />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="immediate_response">Resposta Imediata</Label>
              <Textarea
                id="immediate_response"
                {...register("immediate_response")}
                className="border-input"
                placeholder="Como o paciente respondeu imediatamente após a sessão..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Técnicas Utilizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="used_therapeutic_exercise"
                  {...register("used_therapeutic_exercise")}
                />
                <Label htmlFor="used_therapeutic_exercise" className="font-normal">
                  Exercício Terapêutico
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="used_stretching"
                  {...register("used_stretching")}
                />
                <Label htmlFor="used_stretching" className="font-normal">
                  Alongamento
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="used_epi"
                  {...register("used_epi")}
                />
                <Label htmlFor="used_epi" className="font-normal">
                  EPI (Eletrolise Percutânea)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="used_infiltration"
                  {...register("used_infiltration")}
                />
                <Label htmlFor="used_infiltration" className="font-normal">
                  Infiltração
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="used_neuromodulation"
                  {...register("used_neuromodulation")}
                />
                <Label htmlFor="used_neuromodulation" className="font-normal">
                  Neuromodulação
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="used_other_techniques"
                  {...register("used_other_techniques")}
                />
                <Label htmlFor="used_other_techniques" className="font-normal">
                  Outras Técnicas
                </Label>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="other_techniques_description">
                Descrição de Outras Técnicas
              </Label>
              <Textarea
                id="other_techniques_description"
                {...register("other_techniques_description")}
                className="border-input"
                placeholder="Descreva outras técnicas utilizadas..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Planejamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="next_session_plan">Plano para Próxima Sessão</Label>
              <Textarea
                id="next_session_plan"
                {...register("next_session_plan")}
                className="border-input"
                placeholder="Planejamento e objetivos para a próxima sessão..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/evolucao")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Salvando..." : "Registrar Evolução"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegistrarEvolucao;
