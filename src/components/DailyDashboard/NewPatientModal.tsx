import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PatientPhotoUpload } from "@/components/PatientPhotoUpload";

interface NewPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientCreated: (patient: { id: string; name: string }) => void;
}

export function NewPatientModal({ open, onOpenChange, onPatientCreated }: NewPatientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { register, handleSubmit, control, reset } = useForm();
  
  const fullName = useWatch({ control, name: "full_name", defaultValue: "" });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { data: newPatient, error } = await supabase.from("patients").insert([
        {
          full_name: data.full_name,
          age: data.age ? parseInt(data.age) : null,
          gender: data.gender,
          birth_date: data.birth_date || null,
          phone: data.phone,
          email: data.email,
          cpf: data.cpf || null,
          address: data.address,
          photo_url: photoUrl,
        },
      ]).select('id, full_name').single();

      if (error) throw error;

      toast.success("Paciente cadastrado com sucesso!");
      
      // Notify parent with new patient
      onPatientCreated({
        id: newPatient.id,
        name: newPatient.full_name,
      });
      
      // Reset form
      reset();
      setPhotoUrl(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      toast.error("Erro ao cadastrar paciente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setPhotoUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center pb-4 border-b border-border">
            <PatientPhotoUpload
              photoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
              patientName={fullName}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                {...register("full_name")}
                required
                placeholder="Nome do paciente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                {...register("birth_date")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
