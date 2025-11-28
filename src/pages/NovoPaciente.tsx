import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const NovoPaciente = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skinPhototype, setSkinPhototype] = useState("");
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
          address: data.address,
          skin_phototype: skinPhototype,
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
          <p className="text-muted-foreground">Cadastro de dados demográficos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Dados Cadastrais</CardTitle>
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
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  {...register("birth_date")}
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
                <Label htmlFor="sport_activity">Esporte / Nível de Atividade</Label>
                <Input
                  id="sport_activity"
                  {...register("sport_activity")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  {...register("address")}
                  className="border-input"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="skin_phototype">Fototipo de Pele (Fitzpatrick) *</Label>
                <Select 
                  required
                  onValueChange={(value) => {
                    setSkinPhototype(value);
                  }}
                  value={skinPhototype}
                >
                  <SelectTrigger className="border-input">
                    <SelectValue placeholder="Selecione o fototipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border z-50">
                    <SelectItem value="I">Fototipo I – Pele branca pálida; cabelo ruivo/loiro; olhos azuis ou verdes; presença de sardas</SelectItem>
                    <SelectItem value="II">Fototipo II – Pele clara; cabelo ruivo/loiro; olhos azuis, verdes ou castanhos claros</SelectItem>
                    <SelectItem value="III">Fototipo III – Branco mais escuro; qualquer cor de olho e cabelo</SelectItem>
                    <SelectItem value="IV">Fototipo IV – Pele morena clara</SelectItem>
                    <SelectItem value="V">Fototipo V – Pele morena escura</SelectItem>
                    <SelectItem value="VI">Fototipo VI – Pele negra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            disabled={isSubmitting || !skinPhototype}
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
