import { useState, useEffect, useMemo } from "react";
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
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, Loader2, Save } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

export type StructuralModel =
  | "NONE"
  | "KELLGREN_LAWRENCE"
  | "TENDON_STRUCTURAL_INTEGRITY"
  | "MUSCLE_INJURY_GRADE"
  | "DISC_HERNIATION_TYPE";

export interface PathologyState {
  categoryId: string | null;
  pathologyId: string | null;
  customLabel: string;
  structuralModel: StructuralModel;
  structuralGrade: string | null;
  structuralGroup: string | null;
  imagingMethod: string | null;
  tearPercentage: number | null;
  discLevelEnum: string | null;
  discLocationEnum: string | null;
  evaPain: number | null;
  ifnFunction: number | null;
}

export const INITIAL_PATHOLOGY_STATE: PathologyState = {
  categoryId: null,
  pathologyId: null,
  customLabel: "",
  structuralModel: "NONE",
  structuralGrade: null,
  structuralGroup: null,
  imagingMethod: null,
  tearPercentage: null,
  discLevelEnum: null,
  discLocationEnum: null,
  evaPain: null,
  ifnFunction: null,
};

// ── Structural options ─────────────────────────────────────────────

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

// ── Component ──────────────────────────────────────────────────────

interface PathologyCardProps {
  value: PathologyState;
  onChange: (state: PathologyState) => void;
  onSave?: () => void;
  disabled?: boolean;
  isSaving?: boolean;
}

export function PathologyCard({ value, onChange, onSave, disabled = false, isSaving = false }: PathologyCardProps) {
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

  const { data: pathologies = [] } = useQuery({
    queryKey: ["pathologies", value.categoryId],
    queryFn: async () => {
      if (!value.categoryId) return [];
      const { data, error } = await supabase
        .from("pathologies")
        .select("id, code, label, sort_order, structural_model")
        .eq("category_id", value.categoryId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!value.categoryId,
  });

  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (value.pathologyId === null && value.customLabel.length > 0) {
      setIsCustomMode(true);
    }
  }, []);

  // Get structural model from selected pathology
  const selectedPathology = pathologies.find((p) => p.id === value.pathologyId);
  const activeModel: StructuralModel = isCustomMode
    ? "NONE"
    : (selectedPathology?.structural_model as StructuralModel) ?? "NONE";

  // Detect if it's a cervical disc herniation
  const isCervical = selectedPathology?.code === "DISC_HERNIATION_CERVICAL";
  const discLevels = isCervical ? DISC_LEVELS_CERVICAL : DISC_LEVELS_LUMBAR;

  const handleCategoryChange = (catId: string) => {
    setIsCustomMode(false);
    onChange({
      ...INITIAL_PATHOLOGY_STATE,
      categoryId: catId,
    });
  };

  const handlePathologyChange = (val: string) => {
    if (val === "__CUSTOM__") {
      setIsCustomMode(true);
      onChange({
        ...INITIAL_PATHOLOGY_STATE,
        categoryId: value.categoryId,
        customLabel: "",
        evaPain: value.evaPain,
        ifnFunction: value.ifnFunction,
      });
    } else {
      setIsCustomMode(false);
      const path = pathologies.find((p) => p.id === val);
      const model = (path?.structural_model as StructuralModel) ?? "NONE";
      onChange({
        ...INITIAL_PATHOLOGY_STATE,
        categoryId: value.categoryId,
        pathologyId: val,
        structuralModel: model,
        evaPain: value.evaPain,
        ifnFunction: value.ifnFunction,
        // For disc herniation with only MRI, auto-set it
        imagingMethod: model === "DISC_HERNIATION_TYPE" ? "MRI" : null,
      });
    }
  };

  const handleGradeChange = (grade: string) => {
    const group = activeModel === "KELLGREN_LAWRENCE" ? deriveKLGroup(grade) : null;
    onChange({
      ...value,
      structuralGrade: grade,
      structuralGroup: group,
      // Clear tear_percentage if not applicable
      tearPercentage: (activeModel === "TENDON_STRUCTURAL_INTEGRITY" && (grade === "GRADE_II" || grade === "GRADE_III"))
        ? value.tearPercentage
        : null,
    });
  };

  // Summary
  const summaryParts = useMemo(() => {
    const parts: string[] = [];
    const catLabel = categories.find((c) => c.id === value.categoryId)?.label;
    const pathLabel = selectedPathology?.label || value.customLabel;
    if (catLabel) parts.push(`Categoria: ${catLabel}`);
    if (pathLabel) parts.push(`Patologia: ${pathLabel}`);
    if (value.structuralGrade && activeModel !== "NONE") {
      const gradeOpt = getGradeOptions(activeModel).find((g) => g.value === value.structuralGrade);
      parts.push(`Classificação: ${gradeOpt?.label || value.structuralGrade}`);
    }
    if (value.structuralGroup) {
      parts.push(`Grupo: ${value.structuralGroup}`);
    }
    if (value.discLevelEnum) parts.push(`Nível: ${value.discLevelEnum}`);
    if (value.discLocationEnum) parts.push(`Localização: ${value.discLocationEnum}`);
    if (value.tearPercentage != null) parts.push(`Ruptura: ${value.tearPercentage}%`);
    if (value.evaPain != null) parts.push(`EVA: ${value.evaPain}/10`);
    if (value.ifnFunction != null) parts.push(`IFN: ${value.ifnFunction}/10`);
    return parts;
  }, [value, categories, selectedPathology, activeModel]);

  const pathologySelectValue = isCustomMode ? "__CUSTOM__" : (value.pathologyId || "");

  const showTearPercentage = activeModel === "TENDON_STRUCTURAL_INTEGRITY" &&
    (value.structuralGrade === "GRADE_II" || value.structuralGrade === "GRADE_III");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-primary" />
          PATOLOGIA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Categoria */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Categoria *</Label>
          <Select value={value.categoryId || ""} onValueChange={handleCategoryChange} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Selecione a categoria..." /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Patologia */}
        {value.categoryId && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Patologia *</Label>
            <Select value={pathologySelectValue} onValueChange={handlePathologyChange} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Selecione a patologia..." /></SelectTrigger>
              <SelectContent>
                {pathologies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
                <SelectItem value="__CUSTOM__" className="text-primary font-medium">
                  Adicionar patologia...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 3. Custom label */}
        {value.categoryId && isCustomMode && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Qual patologia? *</Label>
            <Input
              value={value.customLabel}
              onChange={(e) => onChange({ ...value, customLabel: e.target.value })}
              maxLength={120}
              placeholder="Informe a patologia..."
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground text-right">{value.customLabel.length}/120</p>
          </div>
        )}

        {/* 4. Classificação Estrutural (condicional) */}
        {value.categoryId && (value.pathologyId || isCustomMode) && activeModel !== "NONE" && (
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

            {/* Tear percentage (tendon GRADE_II/III) */}
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

        {/* 5. EVA (Dor) */}
        {value.categoryId && (value.pathologyId || isCustomMode) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Dor – EVA (0–10) *
              <span className="text-muted-foreground font-normal ml-2">
                {value.evaPain != null ? value.evaPain : "—"}
              </span>
            </Label>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[value.evaPain ?? 0]}
              onValueChange={([v]) => onChange({ ...value, evaPain: v })}
              disabled={disabled}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 – Sem dor</span>
              <span>10 – Pior dor</span>
            </div>
          </div>
        )}

        {/* 6. IFN (Função) */}
        {value.categoryId && (value.pathologyId || isCustomMode) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Função – IFN (0–10) *
              <span className="text-muted-foreground font-normal ml-2">
                {value.ifnFunction != null ? value.ifnFunction : "—"}
              </span>
            </Label>
            <p className="text-xs text-muted-foreground italic">
              Em uma escala de 0 a 10, quanto essa condição limita sua função nas atividades do dia a dia?
            </p>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[value.ifnFunction ?? 0]}
              onValueChange={([v]) => onChange({ ...value, ifnFunction: v })}
              disabled={disabled}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 – Sem limitação</span>
              <span>10 – Limitação total</span>
            </div>
          </div>
        )}

        {/* 7. Resumo */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Resumo</p>
          {summaryParts.length > 0 ? (
            <div className="space-y-0.5">
              {summaryParts.map((part, i) => (
                <p key={i} className="text-sm text-foreground">{part}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma patologia selecionada.</p>
          )}
        </div>

        {/* 8. Salvar */}
        {onSave && !disabled && (
          <div className="flex justify-end pt-2">
            <Button onClick={onSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                <><Save className="h-4 w-4" />Salvar Patologia</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
