import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddProcedureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onSuccess: () => void;
}

const PROCEDURE_TYPES = [
  { value: "fotobiomodulacao", label: "Fotobiomodulação", category: "Terapia por Luz" },
  { value: "mac", label: "Modulação da Atividade Celular (MAC)", category: "Terapia por Luz" },
  { value: "prp", label: "PRP (Plasma Rico em Plaquetas)", category: "Ortobiológicos" },
  { value: "prf", label: "PRF (Fibrina Rica em Plaquetas)", category: "Ortobiológicos" },
  { value: "celulas_tronco", label: "Células-Tronco", category: "Ortobiológicos" },
  { value: "epi", label: "Eletrólise Percutânea Intratecidual (EPI)", category: "Invasivo" },
  { value: "ondas_choque", label: "Ondas de Choque", category: "Físico" },
  { value: "agulhamento_seco", label: "Agulhamento Seco", category: "Invasivo" },
  { value: "infiltracao", label: "Infiltração", category: "Invasivo" },
  { value: "neuromodulacao", label: "Neuromodulação", category: "Eletroterapia" },
  { value: "exercicio_terapeutico", label: "Exercício Terapêutico", category: "Movimento" },
  { value: "terapia_manual", label: "Terapia Manual", category: "Movimento" },
  { value: "ultrassom_terapeutico", label: "Ultrassom Terapêutico", category: "Físico" },
  { value: "laser_alta_potencia", label: "Laser Alta Potência", category: "Terapia por Luz" },
  { value: "outro", label: "Outro", category: "Outros" },
];

export function AddProcedureModal({ open, onOpenChange, patientId, onSuccess }: AddProcedureModalProps) {
  const [procedureType, setProcedureType] = useState("");
  const [procedureDate, setProcedureDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!procedureType) {
      toast.error("Selecione um procedimento");
      return;
    }

    setIsLoading(true);
    try {
      const selectedProcedure = PROCEDURE_TYPES.find(p => p.value === procedureType);
      
      const { error } = await supabase.from("patient_procedures").insert({
        patient_id: patientId,
        procedure_type: selectedProcedure?.category || "Outros",
        procedure_name: selectedProcedure?.label || procedureType,
        procedure_date: format(procedureDate, "yyyy-MM-dd"),
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Procedimento registrado com sucesso!");
      onSuccess();
      onOpenChange(false);
      setProcedureType("");
      setNotes("");
      setProcedureDate(new Date());
    } catch (error: any) {
      console.error("Error adding procedure:", error);
      toast.error("Erro ao registrar procedimento");
    } finally {
      setIsLoading(false);
    }
  };

  // Group procedures by category
  const groupedProcedures = PROCEDURE_TYPES.reduce((acc, proc) => {
    if (!acc[proc.category]) {
      acc[proc.category] = [];
    }
    acc[proc.category].push(proc);
    return acc;
  }, {} as Record<string, typeof PROCEDURE_TYPES>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Registrar Procedimento Realizado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Procedimento</Label>
            <Select value={procedureType} onValueChange={setProcedureType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o procedimento" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedProcedures).map(([category, procedures]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      {category}
                    </div>
                    {procedures.map((proc) => (
                      <SelectItem key={proc.value} value={proc.value}>
                        {proc.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data do Procedimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !procedureDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {procedureDate ? format(procedureDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={procedureDate}
                  onSelect={(date) => date && setProcedureDate(date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre o procedimento..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Registrar Procedimento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
