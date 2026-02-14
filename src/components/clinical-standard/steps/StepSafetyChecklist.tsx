import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShieldCheck, AlertTriangle, Package, CalendarDays, 
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  FlaskConical, Wrench
} from "lucide-react";
import type { SafetyChecklistData, MaterialTraceabilityData, AdverseEventData } from "@/types/clinical-standard";

// ── Method types ──
export interface MethodRunData {
  meta?: {
    procedure_category?: string;
    requires_collection_or_prep?: boolean;
  };
  system?: {
    system_type?: string;
    sterility_standard?: string;
  };
  device_kit?: {
    brand?: string;
    model?: string;
    type?: string;
  };
  consumables?: Array<{
    label: string;
    value?: string;
    value_hint?: string;
    required?: boolean;
  }>;
  technical_parameters?: Array<{
    label: string;
    value?: string;
    unit?: string;
    value_hint?: string;
  }>;
  technique?: {
    guidance?: string;
    approach?: string;
  };
  required_fields?: string[];
  confirmed_from_template?: boolean;
  filled_at?: string;
  filled_by_user_id?: string;
  [key: string]: any;
}

interface StepSafetyChecklistProps {
  checklist: SafetyChecklistData;
  material: MaterialTraceabilityData;
  adverseEvent: AdverseEventData | null;
  adverseEventStatus: "NONE" | "REPORTED";
  methodRun: MethodRunData | null;
  methodDeviation: boolean;
  methodDeviationReason: string;
  onChecklistChange: (checklist: SafetyChecklistData) => void;
  onMaterialChange: (material: MaterialTraceabilityData) => void;
  onAdverseEventChange: (event: AdverseEventData | null) => void;
  onAdverseEventStatusChange: (status: "NONE" | "REPORTED") => void;
  onMethodRunChange: (methodRun: MethodRunData) => void;
  onMethodDeviationChange: (deviation: boolean) => void;
  onMethodDeviationReasonChange: (reason: string) => void;
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

// ── Method & Materials Section ──
function MethodMaterialsSection({
  methodRun,
  methodDeviation,
  methodDeviationReason,
  onMethodRunChange,
  onMethodDeviationChange,
  onMethodDeviationReasonChange,
}: {
  methodRun: MethodRunData | null;
  methodDeviation: boolean;
  methodDeviationReason: string;
  onMethodRunChange: (m: MethodRunData) => void;
  onMethodDeviationChange: (d: boolean) => void;
  onMethodDeviationReasonChange: (r: string) => void;
}) {
  const data: MethodRunData = methodRun || {};
  const requiresCollPrep = data.meta?.requires_collection_or_prep === true;
  const systemType = data.system?.system_type || "";
  const sterility = data.system?.sterility_standard || "";
  const consumables = data.consumables || [];
  const techParams = data.technical_parameters || [];
  const guidance = data.technique?.guidance || "";
  const approach = data.technique?.approach || "";
  const deviceKit = data.device_kit || {};

  const update = (patch: Partial<MethodRunData>) => {
    onMethodRunChange({ ...data, ...patch });
  };

  const updateSystem = (patch: Record<string, string>) => {
    update({ system: { ...data.system, ...patch } });
  };

  const updateDeviceKit = (patch: Record<string, string>) => {
    update({ device_kit: { ...deviceKit, ...patch } });
  };

  const updateTechnique = (patch: Record<string, string>) => {
    update({ technique: { ...data.technique, ...patch } });
  };

  const updateConsumable = (index: number, value: string) => {
    const updated = [...consumables];
    updated[index] = { ...updated[index], value };
    update({ consumables: updated });
  };

  const updateTechParam = (index: number, value: string) => {
    const updated = [...techParams];
    updated[index] = { ...updated[index], value };
    update({ technical_parameters: updated });
  };

  const systemTypeOptions = requiresCollPrep
    ? [
        { value: "OPEN", label: "Aberto (Open)" },
        { value: "CLOSED", label: "Fechado (Closed)" },
        { value: "MIXED", label: "Misto (Mixed)" },
      ]
    : [
        { value: "OPEN", label: "Aberto (Open)" },
        { value: "CLOSED", label: "Fechado (Closed)" },
        { value: "MIXED", label: "Misto (Mixed)" },
        { value: "NA", label: "N/A" },
      ];

  return (
    <div className="space-y-4">
      {/* System Type */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Sistema</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">
              Tipo de sistema {requiresCollPrep && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={systemType}
              onValueChange={(v) => updateSystem({ system_type: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {systemTypeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {requiresCollPrep && (
              <p className="text-[10px] text-muted-foreground">Obrigatório para procedimentos com coleta/preparo</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Padrão de esterilidade</Label>
            <Select
              value={sterility}
              onValueChange={(v) => updateSystem({ sterility_standard: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIELD_STERILE">Campo Estéril</SelectItem>
                <SelectItem value="CLOSED_CIRCUIT">Circuito Fechado</SelectItem>
                <SelectItem value="HOOD">Capela</SelectItem>
                <SelectItem value="OTHER">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Device Kit */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Marca do kit</Label>
            <Input
              placeholder="Ex: Arthrex"
              value={deviceKit.brand || ""}
              onChange={(e) => updateDeviceKit({ brand: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Modelo</Label>
            <Input
              placeholder="Ex: ACP"
              value={deviceKit.model || ""}
              onChange={(e) => updateDeviceKit({ model: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Input
              placeholder="Ex: Double Syringe"
              value={deviceKit.type || ""}
              onChange={(e) => updateDeviceKit({ type: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Consumables */}
      {consumables.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Consumíveis</h4>
          <div className="grid grid-cols-2 gap-3">
            {consumables.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <Label className="text-xs">
                  {item.label}
                  {item.required && <span className="text-muted-foreground text-[10px] ml-1">(obrigatório)</span>}
                </Label>
                <Input
                  placeholder={item.value_hint || ""}
                  value={item.value || ""}
                  onChange={(e) => updateConsumable(idx, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Parameters */}
      {techParams.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Parâmetros Técnicos</h4>
          <div className="grid grid-cols-2 gap-3">
            {techParams.map((param, idx) => (
              <div key={idx} className="space-y-1">
                <Label className="text-xs">
                  {param.label} {param.unit && <span className="text-muted-foreground">({param.unit})</span>}
                </Label>
                <Input
                  placeholder={param.value_hint || ""}
                  value={param.value || ""}
                  onChange={(e) => updateTechParam(idx, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technique */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Técnica</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Guia</Label>
            <Select
              value={guidance}
              onValueChange={(v) => updateTechnique({ guidance: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">Ultrassom</SelectItem>
                <SelectItem value="FLUORO">Fluoroscopia</SelectItem>
                <SelectItem value="LANDMARK">Landmark</SelectItem>
                <SelectItem value="NONE">Nenhum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Abordagem</Label>
            <Input
              placeholder="Ex: Posterolateral"
              value={approach}
              onChange={(e) => updateTechnique({ approach: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Deviation Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Houve desvio do método do protocolo?</Label>
            <p className="text-[11px] text-muted-foreground">Marque se a execução diferiu do template institucional</p>
          </div>
          <Switch
            checked={methodDeviation}
            onCheckedChange={onMethodDeviationChange}
          />
        </div>

        {methodDeviation && (
          <div className="space-y-1">
            <Label className="text-xs">
              Motivo do desvio <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Descreva o motivo clínico do desvio do método padronizado..."
              value={methodDeviationReason}
              onChange={(e) => onMethodDeviationReasonChange(e.target.value)}
              className="text-sm min-h-[60px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function StepSafetyChecklist({
  checklist,
  material,
  adverseEvent,
  adverseEventStatus,
  methodRun,
  methodDeviation,
  methodDeviationReason,
  onChecklistChange,
  onMaterialChange,
  onAdverseEventChange,
  onAdverseEventStatusChange,
  onMethodRunChange,
  onMethodDeviationChange,
  onMethodDeviationReasonChange,
}: StepSafetyChecklistProps) {
  const [materialExpanded, setMaterialExpanded] = useState(true);
  const [methodExpanded, setMethodExpanded] = useState(true);
  const [adverseExpanded, setAdverseExpanded] = useState(false);
  const [materialError, setMaterialError] = useState("");

  const status = computeChecklistStatus(checklist.items);
  const pendingRequired = checklist.items.filter(i => i.required && !i.checked);

  const handleToggleItem = (key: string, checked: boolean) => {
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

      {/* Method & Materials */}
      <div>
        <button
          type="button"
          onClick={() => setMethodExpanded(!methodExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            <div>
              <Label className="text-base font-semibold cursor-pointer">Método & Materiais</Label>
              <p className="text-[11px] text-muted-foreground leading-tight">Registre como a técnica foi realizada e com quais materiais</p>
            </div>
          </div>
          {methodExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {methodExpanded && (
          <div className="mt-3">
            <MethodMaterialsSection
              methodRun={methodRun}
              methodDeviation={methodDeviation}
              methodDeviationReason={methodDeviationReason}
              onMethodRunChange={onMethodRunChange}
              onMethodDeviationChange={onMethodDeviationChange}
              onMethodDeviationReasonChange={onMethodDeviationReasonChange}
            />
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
