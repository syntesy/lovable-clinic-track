import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PatientPhotoUpload } from "@/components/PatientPhotoUpload";
import { useQueryClient } from "@tanstack/react-query";

interface Patient {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  
  cpf: string | null;
  address: string | null;
  photo_url: string | null;
}

interface EditPatientModalProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditPatientModal = ({
  patient,
  open,
  onOpenChange,
}: EditPatientModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (patient && open) {
      reset({
        full_name: patient.full_name || "",
        age: patient.age || "",
        gender: patient.gender || "",
        birth_date: patient.birth_date || "",
        phone: patient.phone || "",
        email: patient.email || "",
        cpf: patient.cpf || "",
        address: patient.address || "",
      });
      
      setPhotoUrl(patient.photo_url);
    }
  }, [patient, open, reset]);

  const onSubmit = async (data: any) => {
    if (!patient) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          full_name: data.full_name,
          age: data.age ? parseInt(data.age) : null,
          gender: data.gender || null,
          birth_date: data.birth_date || null,
          phone: data.phone || null,
          email: data.email || null,
          cpf: data.cpf || null,
          address: data.address || null,
          photo_url: photoUrl,
        })
        .eq("id", patient.id);

      if (error) throw error;

      toast.success("Dados do paciente atualizados!");
      queryClient.invalidateQueries({ queryKey: ["patient", patient.id] });
      queryClient.invalidateQueries({ queryKey: ["all-patients"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);
      toast.error("Erro ao atualizar dados do paciente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cadastro do Paciente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="flex justify-center pb-4 border-b border-border">
            <PatientPhotoUpload
              photoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
              patientName={patient?.full_name || ""}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Nome Completo *</Label>
              <Input
                id="edit_full_name"
                {...register("full_name")}
                required
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_birth_date">Data de Nascimento</Label>
              <Input
                id="edit_birth_date"
                type="date"
                {...register("birth_date")}
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_age">Idade</Label>
              <Input
                id="edit_age"
                type="number"
                {...register("age")}
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_gender">Gênero</Label>
              <Input
                id="edit_gender"
                {...register("gender")}
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Telefone</Label>
              <Input
                id="edit_phone"
                {...register("phone")}
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">E-mail</Label>
              <Input
                id="edit_email"
                type="email"
                {...register("email")}
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_cpf">CPF</Label>
              <Input
                id="edit_cpf"
                {...register("cpf")}
                placeholder="000.000.000-00"
                className="border-input"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit_address">Endereço</Label>
              <Input
                id="edit_address"
                {...register("address")}
                className="border-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
