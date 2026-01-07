import { useState, useMemo } from "react";
import { Syringe, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useTherapyTaxonomy } from "@/hooks/useTherapyTaxonomy";

interface ProcedureSelectionProps {
  isApt: boolean;
  selectedProcedure: string | null;
  onProcedureChange: (procedure: string) => void;
  onSave: () => void;
  /** Callback com flags de governança quando item é selecionado */
  onGovernanceChange?: (flags: {
    requires_score: boolean;
    requires_checklist: boolean;
    requires_curadoria: boolean;
  }) => void;
}

export function ProcedureSelection({ 
  isApt, 
  selectedProcedure, 
  onProcedureChange,
  onSave,
  onGovernanceChange,
}: ProcedureSelectionProps) {
  const [customProcedure, setCustomProcedure] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  
  const { items, loading, error, getFlags } = useTherapyTaxonomy();

  // Agrupar itens por categoria efetiva para melhor UX
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    
    items.forEach((item) => {
      const cat = item.effective_category_code;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    return groups;
  }, [items]);

  // Labels amigáveis para categorias
  const categoryLabels: Record<string, string> = {
    autologous_biologic: "🩸 Biológicos Autólogos",
    bio_stimulator: "💉 Bioestimuladores",
    injectable_nutrition: "🧬 Terapias Nutricionais",
    neuromodulation_light: "⚡ Neuromodulação",
  };

  if (!isApt) return null;

  const handleProcedureSelect = (code: string) => {
    onProcedureChange(code);

    // Notificar flags de governança
    if (code !== "outro" && onGovernanceChange) {
      const item = items.find((i) => i.code === code);
      if (item) {
        const flags = getFlags(item);
        onGovernanceChange({
          requires_score: flags.requires_score,
          requires_checklist: flags.requires_checklist,
          requires_curadoria: flags.requires_curadoria,
        });
      }
    }
  };

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

  const selectedItem = items.find((i) => i.code === selectedProcedure);

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
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando procedimentos...
          </div>
        ) : error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : (
          <RadioGroup 
            value={selectedProcedure || ""} 
            onValueChange={handleProcedureSelect}
            className="space-y-4"
          >
            {Object.entries(groupedItems).map(([categoryCode, categoryItems]) => (
              <div key={categoryCode} className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {categoryLabels[categoryCode] || categoryCode}
                </div>
                <div className="space-y-2 ml-2">
                  {categoryItems.map((item) => (
                    <div key={item.code} className="flex items-center space-x-3">
                      <RadioGroupItem value={item.code} id={item.code} />
                      <Label htmlFor={item.code} className="cursor-pointer flex items-center gap-2">
                        {item.name}
                        {item.requires_score && (
                          <Badge variant="secondary" className="text-xs">
                            Requer Triagem
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Opção "Outro" para compatibilidade */}
            <div className="pt-2 border-t">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="outro" id="outro" />
                <Label htmlFor="outro" className="cursor-pointer">
                  Outro (especificar)
                </Label>
              </div>
            </div>
          </RadioGroup>
        )}

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

        {/* Mostrar flags do item selecionado */}
        {selectedItem && (
          <div className="mt-4 p-3 bg-background rounded-lg border text-sm">
            <div className="font-medium mb-1">Governança clínica:</div>
            <div className="flex gap-2 flex-wrap">
              {selectedItem.requires_score && (
                <Badge variant="outline" className="text-xs">✓ Score/Triagem</Badge>
              )}
              {selectedItem.requires_checklist && (
                <Badge variant="outline" className="text-xs">✓ Checklist</Badge>
              )}
              {selectedItem.requires_curadoria && (
                <Badge variant="outline" className="text-xs">✓ Curadoria</Badge>
              )}
              {!selectedItem.requires_score && !selectedItem.requires_checklist && !selectedItem.requires_curadoria && (
                <span className="text-muted-foreground">Sem requisitos adicionais</span>
              )}
            </div>
          </div>
        )}

        <Button 
          onClick={handleSave} 
          className="mt-4 gap-2"
          disabled={isSaved || loading}
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
