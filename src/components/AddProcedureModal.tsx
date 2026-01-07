import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRegistryEpisode } from "@/hooks/useRegistryEpisode";
import { useTherapyTaxonomy } from "@/hooks/useTherapyTaxonomy";

interface AddProcedureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onSuccess: () => void;
}

export function AddProcedureModal({ open, onOpenChange, patientId, onSuccess }: AddProcedureModalProps) {
  const [procedureCode, setProcedureCode] = useState("");
  const [procedureDate, setProcedureDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Taxonomy hook - uses therapy_items + therapy_categories
  const { items, categories, categoriesMap, loading: taxonomyLoading } = useTherapyTaxonomy();

  // Registry episode hook - non-intrusive capture
  const { ensureActiveEpisode, captureProcedurePerformed } = useRegistryEpisode(patientId);

  // Ensure episode exists when modal opens with patient context
  useEffect(() => {
    if (open && patientId) {
      ensureActiveEpisode().catch(console.error);
    }
  }, [open, patientId]);

  // Preferred category order for display
  const categoryOrder = [
    "autologous_biologic",
    "bio_stimulator", 
    "injectable_nutrition",
    "neuromodulation_light",
  ];

  // Group items by effective_category_code for display
  const groupedItems = useMemo(() => {
    const groups: Record<string, { categoryName: string; items: typeof items }> = {};
    
    for (const item of items) {
      const catCode = item.effective_category_code;
      if (!groups[catCode]) {
        const category = categoriesMap.get(catCode);
        groups[catCode] = {
          categoryName: category?.name || catCode,
          items: [],
        };
      }
      groups[catCode].items.push(item);
    }

    // Sort groups by preferred order, then by name; items alphabetically within each group
    return Object.entries(groups)
      .sort(([codeA], [codeB]) => {
        const orderA = categoryOrder.indexOf(codeA);
        const orderB = categoryOrder.indexOf(codeB);
        if (orderA !== -1 && orderB !== -1) return orderA - orderB;
        if (orderA !== -1) return -1;
        if (orderB !== -1) return 1;
        return codeA.localeCompare(codeB);
      })
      .map(([code, group]) => ({
        code,
        name: group.categoryName,
        items: group.items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      }));
  }, [items, categoriesMap]);

  // Find selected item details
  const selectedItem = useMemo(() => {
    return items.find(item => item.code === procedureCode);
  }, [items, procedureCode]);

  const handleSubmit = async () => {
    if (!procedureCode || !selectedItem) {
      toast.error("Selecione um procedimento");
      return;
    }

    setIsLoading(true);
    try {
      const categoryName = categoriesMap.get(selectedItem.effective_category_code)?.name || "Outros";
      
      const { error } = await supabase.from("patient_procedures").insert({
        patient_id: patientId,
        procedure_type: categoryName,
        procedure_name: selectedItem.name,
        procedure_date: format(procedureDate, "yyyy-MM-dd"),
        notes: notes || null,
        therapy_item_code: selectedItem.code,
      });

      if (error) throw error;

      // === REGISTRY CAPTURE: Procedure Performed (non-intrusive) ===
      try {
        await captureProcedurePerformed(
          selectedItem.name,
          format(procedureDate, "yyyy-MM-dd"),
          undefined, // sessionNumber
          categoryName,
          undefined, // guidance
          undefined, // volumeUsed
          undefined, // productDetails
          false, // adverseEvent
          undefined, // adverseEventNotes
          notes || undefined
        );
      } catch (registryError) {
        // Non-blocking: log but don't fail the main operation
        console.error("Registry capture error (non-blocking):", registryError);
      }

      toast.success("Procedimento registrado com sucesso!");
      onSuccess();
      onOpenChange(false);
      setProcedureCode("");
      setNotes("");
      setProcedureDate(new Date());
    } catch (error: any) {
      console.error("Error adding procedure:", error);
      toast.error("Erro ao registrar procedimento");
    } finally {
      setIsLoading(false);
    }
  };

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
            {taxonomyLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando procedimentos...
              </div>
            ) : (
              <Select value={procedureCode} onValueChange={setProcedureCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {groupedItems.map((group) => (
                    <SelectGroup key={group.code}>
                      <SelectLabel className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1.5">
                        {group.name}
                      </SelectLabel>
                      {group.items.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            )}
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
          <Button onClick={handleSubmit} disabled={isLoading || taxonomyLoading}>
            {isLoading ? "Salvando..." : "Registrar Procedimento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}