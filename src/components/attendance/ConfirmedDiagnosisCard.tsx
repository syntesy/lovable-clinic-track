import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2, Save, ImageIcon, Info, CheckCircle2 } from "lucide-react";
import {
  type PathologyState,
  type StructuralModel,
  INITIAL_PATHOLOGY_STATE,
} from "./PathologyCard";

// ── Structural options (reused from PathologyCard) ──────────

const KL_GRADES = [
  { value: "KL0", label: "KL 0 – Normal" },
  { value: "KL1", label: "KL 1 – Duvidoso" },
  { value: "KL2", label: "KL 2 – Mínimo" },
  { value: "KL3", label: "KL 3 – Moderado" },
  { value: "KL4", label: "KL 4 – Grave" },
];

const TENDON_GRADES = [
  { value: "GRADE_0", label: "Grau 0 – Normal" },
  { value: "GRADE_I", label: "Grau I – Sem ruptura" },
  { value: "GRADE_II", label: "Grau II – Ruptura <50%" },
  { value: "GRADE_III", label: "Grau III – Ruptura ≥50%" },
  { value: "GRADE_IV", label: "Grau IV – Ruptura completa" },
];

const MUSCLE_GRADES = [
  { value: "GRADE_I", label: "Grau I" },
  { value: "GRADE_II", label: "Grau II" },
  { value: "GRADE_III", label: "Grau III" },
];

const DISC_GRADES = [
  { value: "PROTRUSAO", label: "Protrusão" },
  { value: "EXTRUSAO", label: "Extrusão" },
  { value: "SEQUESTRO", label: "Sequestro" },
];

const DISC_LEVELS_LUMBAR = [
  { value: "L1_L2", label: "L1-L2" },
  { value: "L2_L3", label: "L2-L3" },
  { value: "L3_L4", label: "L3-L4" },
  { value: "L4_L5", label: "L4-L5" },
  { value: "L5_S1", label: "L5-S1" },
];

const DISC_LEVELS_CERVICAL = [
  { value: "C3_C4", label: "C3-C4" },
  { value: "C4_C5", label: "C4-C5" },
  { value: "C5_C6", label: "C5-C6" },
  { value: "C6_C7", label: "C6-C7" },
];

const DISC_LOCATIONS = [
  { value: "CENTRAL", label: "Central" },
  { value: "PARAMEDIANA", label: "Paramediana" },
  { value: "FORAMINAL", label: "Foraminal" },
  { value: "EXTRAFORAMINAL", label: "Extraforaminal" },
];

function getImagingOptions(model: StructuralModel) {
  switch (model) {
    case "KELLGREN_LAWRENCE":
      return [
        { value: "XR", label: "Radiografia (XR)" },
        { value: "MRI", label: "Ressonância (MRI)" },
      ];
    case "TENDON_STRUCTURAL_INTEGRITY":
    case "MUSCLE_INJURY_GRADE":
      return [
        { value: "US", label: "Ultrassonografia (US)" },
        { value: "MRI", label: "Ressonância (MRI)" },
      ];
    case "DISC_HERNIATION_TYPE":
      return [{ value: "MRI", label: "Ressonância (MRI)" }];
    default:
      return [];
  }
}

function getGradeOptions(model: StructuralModel) {
  switch (model) {
    case "KELLGREN_LAWRENCE": return KL_GRADES;
    case "TENDON_STRUCTURAL_INTEGRITY": return TENDON_GRADES;
    case "MUSCLE_INJURY_GRADE": return MUSCLE_GRADES;
    case "DISC_HERNIATION_TYPE": return DISC_GRADES;
    default: return [];
  }
}

function deriveKLGroup(grade: string): string | null {
  switch (grade) {
    case "KL0": case "KL1": return "LEVE";
    case "KL2": return "MODERADA";
    case "KL3": return "GRAVE";
    case "KL4": return "GRAVE_PLUS";
    default: return null;
  }
}

// ── Component ──────────────────────────────────────────

interface ConfirmedDiagnosisCardProps {
  value: PathologyState;
  onChange: (state: PathologyState) => void;
  onSave?: () => void;
  disabled?: boolean;
  isSaving?: boolean;
  isVisible: boolean;
  onRequestOpen: () => void;
  /** Category/pathology pre-filled from hypothesis */
  hypothesisCategoryId: string | null;
  hypothesisPathologyId: string | null;
  hypothesisCustomLabel: string;
}

export function ConfirmedDiagnosisCard({
  value,
  onChange,
  onSave,
  disabled = false,
  isSaving = false,
  isVisible,
  onRequestOpen,
  hypothesisCategoryId,
  hypothesisPathologyId,
  hypothesisCustomLabel,
}: ConfirmedDiagnosisCardProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ["pathology-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pathology_categories")
        .select("id, code, label, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const effectiveCategoryId = value.categoryId || hypothesisCategoryId;

  const { data: pathologies = [] } = useQuery({
    queryKey: ["pathologies", effectiveCategoryId],
    queryFn: async () => {
      if (!effectiveCategoryId) return [];
      const { data, error } = await supabase
        .from("pathologies")
        .select("id, code, label, sort_order, structural_model")
        .eq("category_id", effectiveCategoryId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveCategoryId,
  });

  const effectivePathologyId = value.pathologyId || hypothesisPathologyId;
  const effectiveCustomLabel = value.customLabel || hypothesisCustomLabel;

  const selectedPathology = pathologies.find((p) => p.id === effectivePathologyId);
  const activeModel: StructuralModel = effectivePathologyId
    ? (selectedPathology?.structural_model as StructuralModel) ?? "NONE"
    : "NONE";

  const isCervical = selectedPathology?.code === "DISC_HERNIATION_CERVICAL";
  const discLevels = isCervical ? DISC_LEVELS_CERVICAL : DISC_LEVELS_LUMBAR;

  const showTearPercentage = activeModel === "TENDON_STRUCTURAL_INTEGRITY" &&
    (value.structuralGrade === "GRADE_II" || value.structuralGrade === "GRADE_III");

  const handleGradeChange = (grade: string) => {
    const group = activeModel === "KELLGREN_LAWRENCE" ? deriveKLGroup(grade) : null;
    onChange({
      ...value,
      categoryId: effectiveCategoryId,
      pathologyId: effectivePathologyId,
      customLabel: effectiveCustomLabel,
      structuralModel: activeModel,
      structuralGrade: grade,
      structuralGroup: group,
      tearPercentage: (activeModel === "TENDON_STRUCTURAL_INTEGRITY" && (grade === "GRADE_II" || grade === "GRADE_III"))
        ? value.tearPercentage
        : null,
      imagingMethod: activeModel === "DISC_HERNIATION_TYPE" ? "MRI" : value.imagingMethod,
    });
  };

  const pathologyLabel = selectedPathology?.label || effectiveCustomLabel || "—";
  const categoryLabel = categories.find((c) => c.id === effectiveCategoryId)?.label || "—";

  // Summary for confirmed
  const summaryParts = useMemo(() => {
    const parts: string[] = [];
    parts.push(`Diagnóstico confirmado: ${pathologyLabel}`);
    parts.push(`Categoria: ${categoryLabel}`);
    if (value.structuralGrade && activeModel !== "NONE") {
      const gradeOpt = getGradeOptions(activeModel).find((g) => g.value === value.structuralGrade);
      parts.push(`Classificação: ${gradeOpt?.label || value.structuralGrade}`);
    }
    if (value.structuralGroup) parts.push(`Grupo: ${value.structuralGroup}`);
    if (value.discLevelEnum) parts.push(`Nível: ${value.discLevelEnum}`);
    if (value.discLocationEnum) parts.push(`Localização: ${value.discLocationEnum}`);
    if (value.tearPercentage != null) parts.push(`Ruptura: ${value.tearPercentage}%`);
    if (value.evaPain != null) parts.push(`EVA: ${value.evaPain}/10`);
    if (value.ifnFunction != null) parts.push(`IFN: ${value.ifnFunction}/10`);
    return parts;
  }, [value, pathologyLabel, categoryLabel, activeModel]);

  // Not visible: show the trigger button
  if (!isVisible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            DIAGNÓSTICO CONFIRMADO (IMAGEM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-border bg-muted/30">
            <Info className="h-4 w-4" />
            <AlertDescription>
              A classificação estrutural deve ser registrada após exame complementar (US, RM, RX).
            </AlertDescription>
          </Alert>
          {!disabled && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" onClick={onRequestOpen} className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Registrar diagnóstico confirmado
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Visible: show full structural classification form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          DIAGNÓSTICO CONFIRMADO (IMAGEM)
          <Badge variant="outline" className="ml-auto text-xs gap-1 border-primary/40 text-primary">
            <CheckCircle2 className="h-3 w-3" />
            Confirmado por imagem
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {categoryLabel} → {pathologyLabel}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Structural Classification */}
        {activeModel !== "NONE" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Classificação Estrutural *</Label>
              <Select value={value.structuralGrade || ""} onValueChange={handleGradeChange} disabled={disabled}>
                <SelectTrigger><SelectValue placeholder="Selecione o grau..." /></SelectTrigger>
                <SelectContent>
                  {getGradeOptions(activeModel).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {value.structuralGroup && (
                <p className="text-xs text-muted-foreground">
                  Grupo derivado: <span className="font-medium">{value.structuralGroup}</span>
                </p>
              )}
            </div>

            {/* Imaging method */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Método de Imagem *</Label>
              <Select
                value={value.imagingMethod || ""}
                onValueChange={(v) => onChange({ ...value, imagingMethod: v })}
                disabled={disabled || activeModel === "DISC_HERNIATION_TYPE"}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {getImagingOptions(activeModel).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tear percentage */}
            {showTearPercentage && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Percentual de Ruptura (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={value.tearPercentage ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? parseInt(e.target.value, 10) : null;
                    onChange({ ...value, tearPercentage: v });
                  }}
                  placeholder="1-99 (opcional)"
                  disabled={disabled}
                />
              </div>
            )}

            {/* Disc level & location */}
            {activeModel === "DISC_HERNIATION_TYPE" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Nível do Disco *</Label>
                  <Select
                    value={value.discLevelEnum || ""}
                    onValueChange={(v) => onChange({ ...value, discLevelEnum: v })}
                    disabled={disabled}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione o nível..." /></SelectTrigger>
                    <SelectContent>
                      {discLevels.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Localização *</Label>
                  <Select
                    value={value.discLocationEnum || ""}
                    onValueChange={(v) => onChange({ ...value, discLocationEnum: v })}
                    disabled={disabled}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione a localização..." /></SelectTrigger>
                    <SelectContent>
                      {DISC_LOCATIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </>
        )}

        {activeModel === "NONE" && (
          <Alert className="border-border bg-muted/30">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Esta patologia não requer classificação estrutural.
            </AlertDescription>
          </Alert>
        )}

        {/* EVA (Pain) — botões 0–10 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Dor – EVA (0–10)
            {value.evaPain != null && (
              <span className="text-muted-foreground font-normal ml-2">
                selecionado: {value.evaPain}
              </span>
            )}
          </Label>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, evaPain: i })}
                className={cn(
                  "w-9 h-9 rounded-md text-sm font-medium border transition-colors",
                  value.evaPain === i
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50 text-foreground",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 – Sem dor</span>
            <span>10 – Pior dor</span>
          </div>
        </div>

        {/* IFN (Function) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Função – IFN (0–10)
            {value.ifnFunction != null && (
              <span className="text-muted-foreground font-normal ml-2">
                selecionado: {value.ifnFunction}
              </span>
            )}
          </Label>
          <p className="text-xs text-muted-foreground italic">
            Em uma escala de 0 a 10, quanto essa condição limita sua função nas atividades do dia a dia?
          </p>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, ifnFunction: i })}
                className={cn(
                  "w-9 h-9 rounded-md text-sm font-medium border transition-colors",
                  value.ifnFunction === i
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50 text-foreground",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 – Sem limitação</span>
            <span>10 – Limitação total</span>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Resumo</p>
          <div className="space-y-0.5">
            {summaryParts.map((part, i) => (
              <p key={i} className="text-sm text-foreground">{part}</p>
            ))}
          </div>
        </div>

        {/* Save */}
        {onSave && !disabled && (
          <div className="flex justify-end pt-2">
            <Button onClick={onSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                <><Save className="h-4 w-4" />Salvar Diagnóstico Confirmado</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
