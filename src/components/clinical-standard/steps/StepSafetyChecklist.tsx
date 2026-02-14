import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldCheck, AlertTriangle, Package, CalendarDays, 
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2 
} from "lucide-react";
import type { SafetyChecklistData, MaterialTraceabilityData, AdverseEventData } from "@/types/clinical-standard";

interface StepSafetyChecklistProps {
  checklist: SafetyChecklistData;
  material: MaterialTraceabilityData;
  adverseEvent: AdverseEventData | null;
  adverseEventStatus: "NONE" | "REPORTED";
  onChecklistChange: (checklist: SafetyChecklistData) => void;
  onMaterialChange: (material: MaterialTraceabilityData) => void;
  onAdverseEventChange: (event: AdverseEventData | null) => void;
  onAdverseEventStatusChange: (status: "NONE" | "REPORTED") => void;
}

function isMinimalMaterialFilled(m: MaterialTraceabilityData): boolean {
  return !!(m.manufacturer?.trim() && m.kit_system?.trim() && m.lot?.trim() && m.expiry_date?.trim());
}

function computeChecklistStatus(items: SafetyChecklistData["items"]): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" {
  const anyChecked = items.some(i => i.checked);
  const allRequiredChecked = items.filter(i => i.required).every(i => i.checked);
  if (!anyChecked) return "NOT_STARTED";
  if (allRequiredChecked) return "COMPLETED";
  return "IN_PROGRESS";
}

export function StepSafetyChecklist({
  checklist,
  material,
  adverseEvent,
  adverseEventStatus,
  onChecklistChange,
  onMaterialChange,
  onAdverseEventChange,
  onAdverseEventStatusChange,
}: StepSafetyChecklistProps) {
  const [materialExpanded, setMaterialExpanded] = useState(true);
  const [adverseExpanded, setAdverseExpanded] = useState(false);
  const [materialError, setMaterialError] = useState("");

  const status = computeChecklistStatus(checklist.items);
  const pendingRequired = checklist.items.filter(i => i.required && !i.checked);

  const handleToggleItem = (key: string, checked: boolean) => {
    // Special rule: material_logged requires material fields
    if (key === "material_logged" && checked && !isMinimalMaterialFilled(material)) {
      setMaterialError("Preencha os dados mínimos de material (fabricante, sistema/kit, lote e validade) antes de marcar este item.");
      setMaterialExpanded(true);
      return;
    }
    setMaterialError("");

    const updatedItems = checklist.items.map(item =>
      item.key === key ? { ...item, checked } : item
    );
    
    const newStatus = computeChecklistStatus(updatedItems);
    const allRequiredDone = newStatus === "COMPLETED";

    onChecklistChange({
      items: updatedItems,
      completed_at: allRequiredDone ? new Date().toISOString() : null,
    });
  };

  const handleNoteChange = (key: string, note: string) => {
    const updatedItems = checklist.items.map(item =>
      item.key === key ? { ...item, note } : item
    );
    onChecklistChange({ ...checklist, items: updatedItems });
  };

  const handleAdverseToggle = (hasEvent: boolean) => {
    if (hasEvent) {
      onAdverseEventStatusChange("REPORTED");
      onAdverseEventChange({
        type: "",
        severity: "LEVE",
        management: "",
        outcome: "",
        event_date: new Date().toISOString().split("T")[0],
        resolution_date: null,
      });
      setAdverseExpanded(true);
    } else {
      onAdverseEventStatusChange("NONE");
      onAdverseEventChange(null);
    }
  };

  const statusBadge = () => {
    switch (status) {
      case "NOT_STARTED":
        return <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1" />Não iniciado</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Em andamento ({pendingRequired.length} pendente{pendingRequired.length > 1 ? "s" : ""})</Badge>;
      case "COMPLETED":
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle2 className="w-3 h-3 mr-1" />Completo</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Checklist Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <Label className="text-base font-semibold">Checklist de Segurança</Label>
        </div>
        {statusBadge()}
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.items.map((item) => (
          <div key={item.key} className={`p-3 rounded-lg border transition-colors ${
            item.checked ? "bg-primary/5 border-primary/20" : "bg-card border-border"
          }`}>
            <div className="flex items-start gap-3">
              <Checkbox
                id={`check-${item.key}`}
                checked={item.checked}
                onCheckedChange={(checked) => handleToggleItem(item.key, checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <Label htmlFor={`check-${item.key}`} className="cursor-pointer text-sm font-medium leading-tight">
                  {item.label}
                  {item.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {(item.key === "consent" || item.key === "anticoag_nsaid") && (
                  <Input
                    placeholder="Observação (opcional)"
                    value={item.note || ""}
                    onChange={(e) => handleNoteChange(item.key, e.target.value)}
                    className="h-7 text-xs mt-1"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {materialError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{materialError}</AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Material Traceability */}
      <div>
        <button
          type="button"
          onClick={() => setMaterialExpanded(!materialExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <Label className="text-base font-semibold cursor-pointer">Rastreabilidade de Material</Label>
            {isMinimalMaterialFilled(material) && (
              <Badge className="bg-primary text-primary-foreground text-[10px]">Preenchido</Badge>
            )}
          </div>
          {materialExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {materialExpanded && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="space-y-1">
              <Label className="text-xs">Fabricante *</Label>
              <Input
                placeholder="Ex: Arthrex"
                value={material.manufacturer}
                onChange={(e) => onMaterialChange({ ...material, manufacturer: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sistema/Kit *</Label>
              <Input
                placeholder="Ex: ACP Double Syringe"
                value={material.kit_system}
                onChange={(e) => onMaterialChange({ ...material, kit_system: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lote *</Label>
              <Input
                placeholder="Ex: LOT2025A1234"
                value={material.lot}
                onChange={(e) => onMaterialChange({ ...material, lot: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Validade *</Label>
              <Input
                type="date"
                value={material.expiry_date}
                onChange={(e) => onMaterialChange({ ...material, expiry_date: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Observações</Label>
              <Input
                placeholder="Notas adicionais (opcional)"
                value={material.notes}
                onChange={(e) => onMaterialChange({ ...material, notes: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Adverse Events */}
      <div>
        <button
          type="button"
          onClick={() => setAdverseExpanded(!adverseExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <Label className="text-base font-semibold cursor-pointer">Intercorrências</Label>
            {adverseEventStatus === "REPORTED" && (
              <Badge variant="destructive" className="text-[10px]">Evento registrado</Badge>
            )}
            {adverseEventStatus === "NONE" && (
              <Badge variant="outline" className="text-[10px]">Sem intercorrências</Badge>
            )}
          </div>
          {adverseExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {adverseExpanded && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adverse"
                  checked={adverseEventStatus === "NONE"}
                  onChange={() => handleAdverseToggle(false)}
                  className="accent-primary"
                />
                <span className="text-sm">Sem intercorrências</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adverse"
                  checked={adverseEventStatus === "REPORTED"}
                  onChange={() => handleAdverseToggle(true)}
                  className="accent-primary"
                />
                <span className="text-sm">Registrar evento adverso</span>
              </label>
            </div>

            {adverseEventStatus === "REPORTED" && adverseEvent && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-destructive/5">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo do evento *</Label>
                  <Input
                    placeholder="Ex: Reação vasovagal"
                    value={adverseEvent.type}
                    onChange={(e) => onAdverseEventChange({ ...adverseEvent, type: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Gravidade *</Label>
                  <select
                    value={adverseEvent.severity}
                    onChange={(e) => onAdverseEventChange({ ...adverseEvent, severity: e.target.value as any })}
                    className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="LEVE">Leve</option>
                    <option value="MODERADO">Moderado</option>
                    <option value="GRAVE">Grave</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Conduta / Manejo</Label>
                  <Input
                    placeholder="Ex: Repouso, observação 30 min"
                    value={adverseEvent.management}
                    onChange={(e) => onAdverseEventChange({ ...adverseEvent, management: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Desfecho</Label>
                  <Input
                    placeholder="Ex: Resolvido sem sequelas"
                    value={adverseEvent.outcome}
                    onChange={(e) => onAdverseEventChange({ ...adverseEvent, outcome: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data do evento</Label>
                  <Input
                    type="date"
                    value={adverseEvent.event_date}
                    onChange={(e) => onAdverseEventChange({ ...adverseEvent, event_date: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data resolução</Label>
                  <Input
                    type="date"
                    value={adverseEvent.resolution_date || ""}
                    onChange={(e) => onAdverseEventChange({ ...adverseEvent, resolution_date: e.target.value || null })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
