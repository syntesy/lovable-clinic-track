/**
 * LabReviewModal
 *
 * Modal de revisão dos exames extraídos de PDF antes de salvar no canonical.
 *
 * Semáforo de confiança:
 *   🟢 high       → pré-preenchido, editável
 *   🟡 medium     → pré-preenchido, destacado para revisão
 *   🔴 low        → pré-preenchido com dúvida, obrigatório revisar
 *   ⚫ not_found  → campo vazio, usuário digita manualmente
 *
 * Ao confirmar, chama onConfirm(labs) com os dados revisados.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Calendar, Save } from "lucide-react";
import { MappedCanonicalLabs, MappedLabField, CanonicalLabsFields, toRegenCanonicalLabs } from "@/lib/mapAnalyzeLabsToCanonical";
import { RegenCanonical } from "@/types/regen-canonical";

// Labels e unidades esperadas para exibição
const LAB_META: Record<keyof CanonicalLabsFields, { label: string; unit: string; placeholder: string }> = {
  hemoglobin:  { label: "Hemoglobina",         unit: "g/dL",    placeholder: "Ex: 14.2" },
  hematocrit:  { label: "Hematócrito",          unit: "%",       placeholder: "Ex: 42" },
  leukocytes:  { label: "Leucócitos",           unit: "mil/mm³", placeholder: "Ex: 6800" },
  platelets:   { label: "Plaquetas",            unit: "mil/mm³", placeholder: "Ex: 187000" },
  crp:         { label: "PCR (Proteína C-Reativa)", unit: "mg/L", placeholder: "Ex: 3.2" },
  ferritin:    { label: "Ferritina",            unit: "ng/mL",   placeholder: "Ex: 42" },
  glucose:     { label: "Glicose",              unit: "mg/dL",   placeholder: "Ex: 89" },
  hba1c:       { label: "HbA1c (Hemoglobina Glicada)", unit: "%", placeholder: "Ex: 5.6" },
};

// Labs críticos que bloqueiam avanço S1→S2
const CRITICAL_LABS: (keyof CanonicalLabsFields)[] = [
  "hemoglobin", "leukocytes", "platelets", "crp", "hba1c", "ferritin",
];

function ConfidenceBadge({ confidence }: { confidence: MappedLabField["confidence"] }) {
  switch (confidence) {
    case "high":
      return (
        <Badge className="bg-green-500 text-white gap-1 text-[10px] h-5">
          <CheckCircle2 className="w-3 h-3" /> Alta confiança
        </Badge>
      );
    case "medium":
      return (
        <Badge className="bg-yellow-500 text-white gap-1 text-[10px] h-5">
          <AlertTriangle className="w-3 h-3" /> Revisar
        </Badge>
      );
    case "low":
      return (
        <Badge className="bg-red-500 text-white gap-1 text-[10px] h-5">
          <XCircle className="w-3 h-3" /> Baixa confiança
        </Badge>
      );
    case "not_found":
      return (
        <Badge variant="outline" className="gap-1 text-[10px] h-5 text-muted-foreground">
          <HelpCircle className="w-3 h-3" /> Não encontrado
        </Badge>
      );
  }
}

interface LabReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappedLabs: MappedCanonicalLabs | null;
  onConfirm: (labs: RegenCanonical["labs"]) => void;
}

export function LabReviewModal({ open, onOpenChange, mappedLabs, onConfirm }: LabReviewModalProps) {
  const [editedValues, setEditedValues] = useState<Record<keyof CanonicalLabsFields, string>>(() =>
    initValues(mappedLabs)
  );
  const [collectedDate, setCollectedDate] = useState<string>(
    mappedLabs?.collected_date ?? ""
  );

  // Re-inicializa ao abrir com novos dados
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && mappedLabs) {
      setEditedValues(initValues(mappedLabs));
      setCollectedDate(mappedLabs.collected_date ?? "");
    }
    onOpenChange(isOpen);
  };

  const handleValueChange = (field: keyof CanonicalLabsFields, value: string) => {
    setEditedValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (!mappedLabs) return;

    // Constrói o canonical final com os valores editados
    const FIELDS = Object.keys(LAB_META) as (keyof CanonicalLabsFields)[];
    const editedMapped: MappedCanonicalLabs = { ...mappedLabs, collected_date: collectedDate || null };

    for (const field of FIELDS) {
      const raw = editedValues[field].trim();
      const parsed = parseFloat(raw.replace(",", "."));
      editedMapped[field] = {
        ...mappedLabs[field],
        raw_value: raw || null,
        parsed_value: isNaN(parsed) ? null : parsed,
        parsed_ok: !isNaN(parsed) && raw !== "",
      };
    }

    const canonicalLabs = toRegenCanonicalLabs(editedMapped, "ocr");
    onConfirm(canonicalLabs);
    onOpenChange(false);
  };

  if (!mappedLabs) return null;

  const FIELDS = Object.keys(LAB_META) as (keyof CanonicalLabsFields)[];
  const criticalMissing = CRITICAL_LABS.filter((f) => {
    const v = editedValues[f].trim();
    return v === "" || isNaN(parseFloat(v.replace(",", ".")));
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Revisar Exames Extraídos do PDF
          </DialogTitle>
          <DialogDescription>
            Confirme ou corrija os valores antes de salvar. Campos marcados em amarelo/vermelho
            requerem atenção.
          </DialogDescription>
        </DialogHeader>

        {/* Data de coleta */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 flex items-center gap-3">
            <Label htmlFor="review-date" className="text-sm whitespace-nowrap">
              Data de coleta:
            </Label>
            <Input
              id="review-date"
              type="date"
              value={collectedDate}
              onChange={(e) => setCollectedDate(e.target.value)}
              className="max-w-[180px] h-8"
            />
          </div>
        </div>

        {/* Grid de exames */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIELDS.map((field) => {
            const meta = LAB_META[field];
            const mapped = mappedLabs[field];
            const isCritical = CRITICAL_LABS.includes(field);
            const value = editedValues[field];
            const isEmpty = value.trim() === "";
            const borderClass =
              mapped.confidence === "not_found" || isEmpty
                ? "border-red-300 bg-red-50/50 dark:bg-red-950/20"
                : mapped.confidence === "medium"
                ? "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20"
                : mapped.confidence === "low"
                ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20"
                : "border-green-300 bg-green-50/50 dark:bg-green-950/20";

            return (
              <div key={field} className={`p-3 rounded-lg border ${borderClass} space-y-2`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`review-${field}`} className="text-sm font-medium">
                      {meta.label}
                    </Label>
                    {isCritical && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-amber-700 border-amber-400">
                        CRÍTICO
                      </Badge>
                    )}
                  </div>
                  <ConfidenceBadge confidence={mapped.confidence} />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id={`review-${field}`}
                    type="text"
                    inputMode="decimal"
                    placeholder={meta.placeholder}
                    value={value}
                    onChange={(e) => handleValueChange(field, e.target.value)}
                    className="h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{meta.unit}</span>
                </div>
                {mapped.notes && (
                  <p className="text-[11px] text-muted-foreground">{mapped.notes}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Aviso labs críticos faltando */}
        {criticalMissing.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-300">
              {criticalMissing.length} exame(s) crítico(s) sem valor — o caso não poderá avançar
              para S2 sem eles. Você pode salvar assim e preencher manualmente depois.
            </span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Save className="w-4 h-4" />
            Confirmar e Salvar Exames
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function initValues(mapped: MappedCanonicalLabs | null): Record<keyof CanonicalLabsFields, string> {
  const FIELDS = Object.keys(LAB_META) as (keyof CanonicalLabsFields)[];
  const init: Record<string, string> = {};
  for (const f of FIELDS) {
    init[f] = mapped?.[f]?.raw_value ?? "";
  }
  return init as Record<keyof CanonicalLabsFields, string>;
}
