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
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, Info, Loader2, Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PathologyState {
  categoryId: string | null;
  pathologyId: string | null;
  customLabel: string;
  severityModel: "CLINICAL_SIMPLE" | "SPECIFIC_SCALE" | "UNKNOWN";
  severityScaleId: string | null;
  severityValue: string | null;
}

const INITIAL_STATE: PathologyState = {
  categoryId: null,
  pathologyId: null,
  customLabel: "",
  severityModel: "UNKNOWN",
  severityScaleId: null,
  severityValue: null,
};

interface PathologyCardProps {
  value: PathologyState;
  onChange: (state: PathologyState) => void;
  onSave?: () => void;
  disabled?: boolean;
  isSaving?: boolean;
}

export function PathologyCard({ value, onChange, onSave, disabled = false, isSaving = false }: PathologyCardProps) {
  // Fetch categories
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

  // Fetch pathologies for selected category
  const { data: pathologies = [] } = useQuery({
    queryKey: ["pathologies", value.categoryId],
    queryFn: async () => {
      if (!value.categoryId) return [];
      const { data, error } = await supabase
        .from("pathologies")
        .select("id, code, label, sort_order")
        .eq("category_id", value.categoryId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!value.categoryId,
  });

  // Fetch severity scales for selected category/pathology
  const { data: scales = [] } = useQuery({
    queryKey: ["pathology-severity-scales", value.categoryId, value.pathologyId],
    queryFn: async () => {
      if (!value.categoryId) return [];
      let query = supabase
        .from("pathology_severity_scales")
        .select("id, scale_code, scale_label, is_default, sort_order, options, category_id, pathology_id")
        .eq("is_active", true);

      if (value.pathologyId) {
        query = query.or(
          `category_id.eq.${value.categoryId},pathology_id.eq.${value.pathologyId}`
        );
      } else {
        query = query.eq("category_id", value.categoryId);
      }

      const { data, error } = await query
        .order("is_default", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("scale_label", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!value.categoryId && value.severityModel === "SPECIFIC_SCALE",
  });

  // Get options for selected scale
  const scaleOptions = useMemo(() => {
    if (!value.severityScaleId) return [];
    const scale = scales.find((s) => s.id === value.severityScaleId);
    if (!scale || !Array.isArray(scale.options)) return [];
    return scale.options as Array<{ value: string; label: string; help?: string }>;
  }, [scales, value.severityScaleId]);

  const isCustomPathology = value.pathologyId === null && value.categoryId !== null && value.customLabel !== undefined;
  const showCustomInput = value.categoryId !== null && value.pathologyId === null && categories.length > 0;

  // Helpers to find labels for summary
  const categoryLabel = categories.find((c) => c.id === value.categoryId)?.label;
  const pathologyLabel = pathologies.find((p) => p.id === value.pathologyId)?.label;
  const scaleLabel = scales.find((s) => s.id === value.severityScaleId)?.scale_label;

  const severityDisplayValue = useMemo(() => {
    if (value.severityModel === "UNKNOWN") return "Não informado";
    if (!value.severityValue) return null;
    if (value.severityModel === "CLINICAL_SIMPLE") {
      const map: Record<string, string> = { MILD: "Leve", MODERATE: "Moderada", SEVERE: "Grave" };
      return map[value.severityValue] || value.severityValue;
    }
    if (value.severityModel === "SPECIFIC_SCALE") {
      const opt = scaleOptions.find((o) => o.value === value.severityValue);
      return opt?.label || value.severityValue;
    }
    return null;
  }, [value.severityModel, value.severityValue, scaleOptions]);

  const summaryText = useMemo(() => {
    const name = pathologyLabel || value.customLabel;
    if (!name) return null;

    if (value.severityModel === "UNKNOWN") {
      return `${name} — Não informado`;
    }
    if (value.severityModel === "CLINICAL_SIMPLE" && severityDisplayValue) {
      return `${name} — ${severityDisplayValue} (Clínica)`;
    }
    if (value.severityModel === "SPECIFIC_SCALE" && severityDisplayValue && scaleLabel) {
      return `${name} — ${severityDisplayValue} (${scaleLabel})`;
    }
    return name;
  }, [pathologyLabel, value.customLabel, value.severityModel, severityDisplayValue, scaleLabel]);

  // Track whether user explicitly picked __CUSTOM__
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Sync custom mode from external value
  useEffect(() => {
    if (value.pathologyId === null && value.customLabel.length > 0) {
      setIsCustomMode(true);
    }
  }, []);

  const handleCategoryChange = (catId: string) => {
    setIsCustomMode(false);
    onChange({
      ...INITIAL_STATE,
      categoryId: catId,
    });
  };

  const handlePathologyChange = (val: string) => {
    if (val === "__CUSTOM__") {
      setIsCustomMode(true);
      onChange({
        ...value,
        pathologyId: null,
        customLabel: "",
        severityModel: value.severityModel,
        severityScaleId: value.severityModel === "SPECIFIC_SCALE" ? value.severityScaleId : null,
        severityValue: null,
      });
    } else {
      setIsCustomMode(false);
      onChange({
        ...value,
        pathologyId: val,
        customLabel: "",
      });
    }
  };

  const handleSeverityModelChange = (model: string) => {
    const m = model as PathologyState["severityModel"];
    onChange({
      ...value,
      severityModel: m,
      severityScaleId: null,
      severityValue: null,
    });
  };

  const handleScaleChange = (scaleId: string) => {
    onChange({
      ...value,
      severityScaleId: scaleId,
      severityValue: null,
    });
  };

  const handleSeverityValueChange = (val: string) => {
    onChange({ ...value, severityValue: val });
  };

  const handleCustomLabelChange = (text: string) => {
    onChange({ ...value, customLabel: text });
  };

  // Determine the pathology select value
  const pathologySelectValue = isCustomMode ? "__CUSTOM__" : (value.pathologyId || "");

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
          <Select
            value={value.categoryId || ""}
            onValueChange={handleCategoryChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Patologia */}
        {value.categoryId && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Patologia</Label>
            <Select
              value={pathologySelectValue}
              onValueChange={handlePathologyChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a patologia..." />
              </SelectTrigger>
              <SelectContent>
                {pathologies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
                <SelectItem value="__CUSTOM__" className="text-primary font-medium">
                  Adicionar patologia...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 3. Custom label input */}
        {value.categoryId && isCustomMode && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Qual patologia? *</Label>
            <Input
              value={value.customLabel}
              onChange={(e) => handleCustomLabelChange(e.target.value)}
              maxLength={120}
              placeholder="Informe a patologia..."
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground text-right">
              {value.customLabel.length}/120
            </p>
          </div>
        )}

        {/* 4. Classificação (segmented control) */}
        {value.categoryId && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Classificação</Label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[
                { value: "CLINICAL_SIMPLE", label: "Clínica (simples)" },
                { value: "SPECIFIC_SCALE", label: "Escala específica" },
                { value: "UNKNOWN", label: "Não informado" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSeverityModelChange(opt.value)}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors
                    ${value.severityModel === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Gravidade clínica (CLINICAL_SIMPLE) */}
        {value.categoryId && value.severityModel === "CLINICAL_SIMPLE" && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Gravidade clínica</Label>
            <Select
              value={value.severityValue || ""}
              onValueChange={handleSeverityValueChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a gravidade..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MILD">Leve</SelectItem>
                <SelectItem value="MODERATE">Moderada</SelectItem>
                <SelectItem value="SEVERE">Grave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 6. Escala específica (SPECIFIC_SCALE) */}
        {value.categoryId && value.severityModel === "SPECIFIC_SCALE" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Escala</Label>
              <Select
                value={value.severityScaleId || ""}
                onValueChange={handleScaleChange}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escala..." />
                </SelectTrigger>
                <SelectContent>
                  {scales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.scale_label}
                      {s.is_default && " (padrão)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {value.severityScaleId && scaleOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Grau / Gravidade</Label>
                <Select
                  value={value.severityValue || ""}
                  onValueChange={handleSeverityValueChange}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grau..." />
                  </SelectTrigger>
                  <SelectContent>
                    <TooltipProvider>
                      {scaleOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            {opt.label}
                            {opt.help && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-[240px]">
                                  <p className="text-xs">{opt.help}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </TooltipProvider>
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {/* 7. Resumo */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Resumo</p>
          {summaryText ? (
            <p className="text-sm font-medium text-foreground">{summaryText}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma patologia selecionada.</p>
          )}
        </div>

        {/* 8. Botão Salvar */}
        {onSave && !disabled && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Patologia
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
