import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PatientPhotoUpload } from "@/components/PatientPhotoUpload";

const NovoPaciente = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profession, setProfession] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { register, handleSubmit, control } = useForm();
  
  const fullName = useWatch({ control, name: "full_name", defaultValue: "" });

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
          profession: profession,
          address: data.address,
          photo_url: photoUrl,
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
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/pacientes")}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-xl md:text-3xl font-bold text-foreground truncate">Novo Paciente</h2>
          <p className="text-sm md:text-base text-muted-foreground">Cadastro de dados demográficos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Dados Cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center pb-4 border-b border-border">
              <PatientPhotoUpload
                photoUrl={photoUrl}
                onPhotoChange={setPhotoUrl}
                patientName={fullName}
              />
            </div>
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
                <Label htmlFor="profession">Profissão *</Label>
                <Select 
                  required
                  onValueChange={(value) => setProfession(value)}
                  value={profession}
                >
                  <SelectTrigger className="border-input">
                    <SelectValue placeholder="Selecione a profissão" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border z-50">
                    <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                    <SelectItem value="Medicina">Medicina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  {...register("address")}
                  className="border-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/pacientes")}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !profession}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
          >
            {isSubmitting ? "Salvando..." : "Cadastrar Paciente"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovoPaciente;
