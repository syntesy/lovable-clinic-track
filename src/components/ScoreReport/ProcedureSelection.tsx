import { useState } from "react";
import { Syringe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface ProcedureSelectionProps {
  isApt: boolean;
  selectedProcedure: string | null;
  onProcedureChange: (procedure: string) => void;
  onSave: () => void;
}

const procedures = [
  { id: "prp", label: "PRP (Plasma Rico em Plaquetas)" },
  { id: "prf", label: "PRF (Fibrina Rica em Plaquetas)" },
  { id: "ortobiologicos", label: "Ortobiológicos" },
  { id: "outro", label: "Outro" },
];

export function ProcedureSelection({ 
  isApt, 
  selectedProcedure, 
  onProcedureChange,
  onSave 
}: ProcedureSelectionProps) {
  const [customProcedure, setCustomProcedure] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  if (!isApt) return null;

  const handleSave = () => {
    const finalProcedure = selectedProcedure === "outro" ? customProcedure : selectedProcedure;
    if (!finalProcedure) {
      toast({
        title: "Selecione um procedimento",
        description: "Por favor, selecione o procedimento a ser realizado.",
        variant: "destructive",
      });
      return;
    }
    onSave();
    setIsSaved(true);
    toast({
      title: "Procedimento salvo",
      description: "O procedimento foi registrado no relatório.",
    });
  };

  return (
    <div className="mt-8 print:hidden">
      <h2 className="text-xl font-bold text-[#051F41] mb-4 flex items-center gap-2">
        <Syringe className="h-5 w-5" />
        Selecione o procedimento a ser realizado
      </h2>
      <p className="text-sm text-[#797E88] mb-4">
        Esta seção é visível apenas para o profissional.
      </p>
      
      <div className="rounded-xl p-6 bg-[#F5F6F8] border border-gray-200">
        <RadioGroup 
          value={selectedProcedure || ""} 
          onValueChange={onProcedureChange}
          className="space-y-3"
        >
          {procedures.map((proc) => (
            <div key={proc.id} className="flex items-center space-x-3">
              <RadioGroupItem value={proc.id} id={proc.id} />
              <Label htmlFor={proc.id} className="cursor-pointer">{proc.label}</Label>
            </div>
          ))}
        </RadioGroup>

        {selectedProcedure === "outro" && (
          <div className="mt-4">
            <Label htmlFor="custom-procedure">Especifique o procedimento:</Label>
            <Input
              id="custom-procedure"
              value={customProcedure}
              onChange={(e) => setCustomProcedure(e.target.value)}
              placeholder="Digite o nome do procedimento"
              className="mt-1"
            />
          </div>
        )}

        <Button 
          onClick={handleSave} 
          className="mt-4 gap-2"
          disabled={isSaved}
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4" />
              Salvo
            </>
          ) : (
            "Confirmar procedimento"
          )}
        </Button>
      </div>
    </div>
  );
}
