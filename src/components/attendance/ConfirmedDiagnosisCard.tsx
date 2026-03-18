import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Loader2,
  Save,
  ImageIcon,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  type PathologyState,
  type StructuralModel,
} from "./PathologyCard";
import { PathologyCharacterizationSection } from "./PathologyCharacterizationSection";
import {
  resolveCharacterizationProfile,
  type PathologyCharacterizationProfile,
} from "@/config/pathologyCharacterization";

// ── Structural options ───────────────────────────────────────

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

// ── Scale button ─────────────────────────────────────────────

function ScaleButton({
  value,
  index,
  selected,
  colorFn,
  disabled,
  onClick,
}: {
  value: number;
  index: number;
  selected: boolean;
  colorFn: (i: number) => { bg: string; text: string; ring: string };
  disabled: boolean;
  onClick: () => void;
}) {
  const colors = colorFn(index);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex-1 min-w-0 h-11 rounded-lg text-sm font-bold border-2 transition-all",
        selected
          ? `${colors.bg} ${colors.text} ${colors.ring} border-transparent shadow-sm scale-105`
          : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {value}
    </button>
  );
}

function getEvaColors(i: number) {
  if (i === 0) return { bg: "bg-green-500", text: "text-white", ring: "ring-2 ring-green-400" };
  if (i <= 3) return { bg: "bg-emerald-400", text: "text-white", ring: "ring-2 ring-emerald-300" };
  if (i <= 5) return { bg: "bg-yellow-400", text: "text-white", ring: "ring-2 ring-yellow-300" };
  if (i <= 7) return { bg: "bg-orange-500", text: "text-white", ring: "ring-2 ring-orange-400" };
  return { bg: "bg-red-600", text: "text-white", ring: "ring-2 ring-red-500" };
}

function getIfnColors(i: number) {
  return getEvaColors(i); // same scale
}

// ── Subsection divider ────────────────────────────────────────

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────

interface ConfirmedDiagnosisCardProps {
  value: PathologyState;
  onChange: (state: PathologyState) => void;
  onSave?: () => void;
  disabled?: boolean;
  isSaving?: boolean;
  isSaved?: boolean;
  isVisible: boolean;
  onRequestOpen: () => void;
  hypothesisCategoryId: string | null;
  hypothesisPathologyId: string | null;
  hypothesisCustomLabel: string;
  characterizationValues?: Record<string, string>;
  onCharacterizationChange?: (values: Record<string, string>) => void;
  onProfileChange?: (profile: PathologyCharacterizationProfile | null) => void;
}

export function ConfirmedDiagnosisCard({
  value,
  onChange,
  onSave,
  disabled = false,
  isSaving = false,
  isSaved = false,
  isVisible,
  onRequestOpen,
  hypothesisCategoryId,
  hypothesisPathologyId,
  hypothesisCustomLabel,
  characterizationValues = {},
  onCharacterizationChange,
  onProfileChange,
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

  const selectedCategory = categories.find((c) => c.id === effectiveCategoryId);
  const characterizationProfile = useMemo(() => {
    return resolveCharacterizationProfile(
      selectedPathology?.code,
      selectedCategory?.code,
      selectedPathology?.label || effectiveCustomLabel,
      selectedCategory?.label,
    );
  }, [selectedPathology, selectedCategory, effectiveCustomLabel]);

  useEffect(() => {
    onProfileChange?.(characterizationProfile);
  }, [characterizationProfile, onProfileChange]);

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

  // ── Collapsed state ─────────────────────────────────────
  if (!isVisible) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 space-y-3">
        <Alert className="border-border bg-transparent">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Registre o diagnóstico confirmado após exame de imagem (US, RM, RX).
          </AlertDescription>
        </Alert>
        {!disabled && (
          <Button variant="outline" onClick={onRequestOpen} className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Registrar confirmação do diagnóstico
          </Button>
        )}
      </div>
    );
  }

  // ── Expanded state ───────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Identity header — diagnosis pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground font-medium">
          {categoryLabel}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className="inline-flex items-center text-xs bg-primary/10 px-3 py-1.5 rounded-full text-primary font-semibold">
          {pathologyLabel}
        </span>
        <Badge variant="outline" className="gap-1 border-green-500/40 text-green-600 dark:text-green-400 ml-auto">
          <CheckCircle2 className="h-3 w-3" />
          Confirmado por imagem
        </Badge>
      </div>

      {/* ── Block A: Classificação por Imagem ── */}
      {activeModel !== "NONE" && (
        <SubSection label="Classificação por Imagem">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Classificação Estrutural *</Label>
              <Select value={value.structuralGrade || ""} onValueChange={handleGradeChange} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grau..." />
                </SelectTrigger>
                <SelectContent>
                  {getGradeOptions(activeModel).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {value.structuralGroup && (
                <p className="text-xs text-muted-foreground">
                  Grupo: <span className="font-medium">{value.structuralGroup}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Método de Imagem *</Label>
              <Select
                value={value.imagingMethod || ""}
                onValueChange={(v) => onChange({ ...value, imagingMethod: v })}
                disabled={disabled || activeModel === "DISC_HERNIATION_TYPE"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {getImagingOptions(activeModel).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showTearPercentage && (
            <div className="space-y-1.5 max-w-[200px]">
              <Label className="text-sm">Percentual de Ruptura (%)</Label>
              <Input
                type="number"
                min={1}
                max={99}
                value={value.tearPercentage ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? parseInt(e.target.value, 10) : null;
                  onChange({ ...value, tearPercentage: v });
                }}
                placeholder="1–99 (opcional)"
                disabled={disabled}
              />
            </div>
          )}

          {activeModel === "DISC_HERNIATION_TYPE" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Nível do Disco *</Label>
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
                <Label className="text-sm">Localização *</Label>
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
            </div>
          )}
        </SubSection>
      )}

      {/* ── Block B: Caracterização Clínica ── */}
      {activeModel === "NONE" && (
        characterizationProfile && onCharacterizationChange ? (
          <SubSection label="Caracterização Clínica">
            <PathologyCharacterizationSection
              profile={characterizationProfile}
              values={characterizationValues}
              onChange={onCharacterizationChange}
              disabled={disabled}
            />
          </SubSection>
        ) : (
          <Alert className="border-border bg-muted/30">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Esta patologia não requer classificação estrutural.
            </AlertDescription>
          </Alert>
        )
      )}

      {/* ── Block C: Avaliação Funcional ── */}
      <SubSection label="Avaliação Funcional">
        <div className="grid sm:grid-cols-2 gap-8">
          {/* EVA */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-sm font-semibold">Escala de Dor – EVA</Label>
              {value.evaPain != null ? (
                <span className={cn(
                  "text-3xl font-black tabular-nums",
                  value.evaPain <= 3 ? "text-green-500" :
                  value.evaPain <= 5 ? "text-yellow-500" :
                  value.evaPain <= 7 ? "text-orange-500" : "text-red-600"
                )}>
                  {value.evaPain}
                  <span className="text-sm font-normal text-muted-foreground">/10</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground italic">Não avaliado</span>
              )}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <ScaleButton
                  key={i}
                  value={i}
                  index={i}
                  selected={value.evaPain === i}
                  colorFn={getEvaColors}
                  disabled={disabled}
                  onClick={() => onChange({ ...value, evaPain: i })}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
              <span>Sem dor</span>
              <span>Pior imaginável</span>
            </div>
          </div>

          {/* IFN */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-sm font-semibold">Limitação Funcional – IFN</Label>
              {value.ifnFunction != null ? (
                <span className={cn(
                  "text-3xl font-black tabular-nums",
                  value.ifnFunction <= 3 ? "text-green-500" :
                  value.ifnFunction <= 5 ? "text-yellow-500" :
                  value.ifnFunction <= 7 ? "text-orange-500" : "text-red-600"
                )}>
                  {value.ifnFunction}
                  <span className="text-sm font-normal text-muted-foreground">/10</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground italic">Não avaliado</span>
              )}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <ScaleButton
                  key={i}
                  value={i}
                  index={i}
                  selected={value.ifnFunction === i}
                  colorFn={getIfnColors}
                  disabled={disabled}
                  onClick={() => onChange({ ...value, ifnFunction: i })}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
              <span>Sem limitação</span>
              <span>Limitação total</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 mt-2">
          IFN — Em uma escala de 0 a 10, quanto esta condição limita as atividades do dia a dia?
        </p>
      </SubSection>

      {/* ── Save ── */}
      {onSave && !disabled && (
        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className={cn("gap-2 transition-colors", isSaved && "bg-green-600 hover:bg-green-700 border-green-600")}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
            ) : isSaved ? (
              <><CheckCircle2 className="h-4 w-4" />Salvo!</>
            ) : (
              <><Save className="h-4 w-4" />Salvar Confirmação</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
