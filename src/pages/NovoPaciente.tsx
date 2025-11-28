import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const NovoPaciente = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("patients").insert([
        {
          full_name: data.full_name,
          age: data.age ? parseInt(data.age) : null,
          gender: data.gender,
          birth_date: data.birth_date || null,
          phone: data.phone,
          email: data.email,
          profession: data.profession,
          sport_activity: data.sport_activity,
          clinical_diagnosis: data.clinical_diagnosis,
          imaging_diagnosis: data.imaging_diagnosis,
          treated_region: data.treated_region,
          symptoms_duration: data.symptoms_duration,
          pain_type_nociceptive: data.pain_type_nociceptive || false,
          pain_type_neuropathic: data.pain_type_neuropathic || false,
          pain_type_nociplastic: data.pain_type_nociplastic || false,
          previous_treatments: data.previous_treatments,
          initial_vas: data.initial_vas ? parseFloat(data.initial_vas) : null,
          initial_function: data.initial_function
            ? parseFloat(data.initial_function)
            : null,
          initial_mobility: data.initial_mobility
            ? parseFloat(data.initial_mobility)
            : null,
          specific_limitations: data.specific_limitations,
          initial_images_description: data.initial_images_description,
        },
      ]);

      if (error) throw error;

      toast.success("Paciente cadastrado com sucesso!");
      navigate("/pacientes");
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      toast.error("Erro ao cadastrar paciente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/pacientes")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">Novo Paciente</h2>
          <p className="text-muted-foreground">Cadastro completo do paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  {...register("full_name")}
                  required
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  {...register("age")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Input
                  id="gender"
                  {...register("gender")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  {...register("birth_date")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profession">Profissão</Label>
                <Input
                  id="profession"
                  {...register("profession")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sport_activity">Esporte / Atividade</Label>
                <Input
                  id="sport_activity"
                  {...register("sport_activity")}
                  className="border-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Avaliação Clínica Inicial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinical_diagnosis">Diagnóstico Clínico</Label>
              <Textarea
                id="clinical_diagnosis"
                {...register("clinical_diagnosis")}
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imaging_diagnosis">Diagnóstico por Imagem</Label>
              <Textarea
                id="imaging_diagnosis"
                {...register("imaging_diagnosis")}
                className="border-input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treated_region">Região Tratada</Label>
                <Input
                  id="treated_region"
                  {...register("treated_region")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms_duration">Tempo de Sintomas</Label>
                <Input
                  id="symptoms_duration"
                  {...register("symptoms_duration")}
                  className="border-input"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Classificação da Dor</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pain_type_nociceptive"
                    {...register("pain_type_nociceptive")}
                  />
                  <Label htmlFor="pain_type_nociceptive" className="font-normal">
                    Nociceptiva
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pain_type_neuropathic"
                    {...register("pain_type_neuropathic")}
                  />
                  <Label htmlFor="pain_type_neuropathic" className="font-normal">
                    Neuropática
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pain_type_nociplastic"
                    {...register("pain_type_nociplastic")}
                  />
                  <Label htmlFor="pain_type_nociplastic" className="font-normal">
                    Nociplástica
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="previous_treatments">
                Tratamentos Prévios
              </Label>
              <Textarea
                id="previous_treatments"
                {...register("previous_treatments")}
                className="border-input"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Escalas Baseline (Pré-Tratamento)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initial_vas">EVA Inicial (0-10)</Label>
                <Input
                  id="initial_vas"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...register("initial_vas")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial_function">Função Inicial (0-10)</Label>
                <Input
                  id="initial_function"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...register("initial_function")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial_mobility">
                  Mobilidade Inicial (0-10)
                </Label>
                <Input
                  id="initial_mobility"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...register("initial_mobility")}
                  className="border-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specific_limitations">
                Limitações Específicas
              </Label>
              <Textarea
                id="specific_limitations"
                {...register("specific_limitations")}
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial_images_description">
                Descrição das Imagens Iniciais (Ultrassom)
              </Label>
              <Textarea
                id="initial_images_description"
                {...register("initial_images_description")}
                className="border-input"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/pacientes")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Salvando..." : "Cadastrar Paciente"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovoPaciente;
