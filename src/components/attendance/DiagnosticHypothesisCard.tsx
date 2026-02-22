import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Loader2, Save } from "lucide-react";

export interface HypothesisState {
  categoryId: string | null;
  pathologyId: string | null;
  customLabel: string;
  clinicalObservation: string;
}

export const INITIAL_HYPOTHESIS_STATE: HypothesisState = {
  categoryId: null,
  pathologyId: null,
  customLabel: "",
  clinicalObservation: "",
};

interface DiagnosticHypothesisCardProps {
  value: HypothesisState;
  onChange: (state: HypothesisState) => void;
  onSave?: () => void;
  disabled?: boolean;
  isSaving?: boolean;
}

export function DiagnosticHypothesisCard({ value, onChange, onSave, disabled = false, isSaving = false }: DiagnosticHypothesisCardProps) {
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

  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (value.pathologyId === null && value.customLabel.length > 0) {
      setIsCustomMode(true);
    }
  }, []);

  const handleCategoryChange = (catId: string) => {
    setIsCustomMode(false);
    onChange({
      ...INITIAL_HYPOTHESIS_STATE,
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

  const pathologySelectValue = isCustomMode ? "__CUSTOM__" : (value.pathologyId || "");

  const summaryParts = useMemo(() => {
    const parts: string[] = [];
    const catLabel = categories.find((c) => c.id === value.categoryId)?.label;
    const pathLabel = pathologies.find((p) => p.id === value.pathologyId)?.label || value.customLabel;
    if (catLabel) parts.push(`Categoria: ${catLabel}`);
    if (pathLabel) parts.push(`Hipótese: ${pathLabel}`);
    if (value.clinicalObservation) parts.push(`Obs: ${value.clinicalObservation}`);
    return parts;
  }, [value, categories, pathologies]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          HIPÓTESE DIAGNÓSTICA INICIAL
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Registre o raciocínio clínico inicial. A classificação estrutural será feita após exame complementar.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Categoria */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Categoria</Label>
          <Select value={value.categoryId || ""} onValueChange={handleCategoryChange} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Selecione a categoria..." /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Patologia */}
        {value.categoryId && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Patologia</Label>
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

        {/* Custom label */}
        {value.categoryId && isCustomMode && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Qual patologia?</Label>
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

        {/* Observação clínica */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Observação clínica</Label>
          <Textarea
            value={value.clinicalObservation}
            onChange={(e) => onChange({ ...value, clinicalObservation: e.target.value })}
            maxLength={500}
            placeholder="Notas iniciais sobre o quadro clínico (opcional)..."
            disabled={disabled}
            className="min-h-[60px]"
          />
        </div>

        {/* Resumo */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Resumo</p>
          {summaryParts.length > 0 ? (
            <div className="space-y-0.5">
              {summaryParts.map((part, i) => (
                <p key={i} className="text-sm text-foreground">{part}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma hipótese registrada.</p>
          )}
        </div>

        {/* Salvar */}
        {onSave && !disabled && (
          <div className="flex justify-end pt-2">
            <Button onClick={onSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                <><Save className="h-4 w-4" />Salvar Hipótese</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
