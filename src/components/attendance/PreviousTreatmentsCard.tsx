import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TREATMENT_OPTIONS = [
  { value: "PHYSIOTHERAPY", label: "Fisioterapia" },
  { value: "NSAIDS", label: "AINEs" },
  { value: "CORTICOSTEROID_IA", label: "Corticoide intra-articular" },
  { value: "HYALURONIC_ACID", label: "Ácido hialurônico" },
  { value: "ORTHOBIOLOGIC_PREV", label: "OrtoBiológico prévio" },
  { value: "SHOCKWAVE", label: "Ondas de Choque" },
  { value: "EPI", label: "Eletrólise Percutânea Intratissular" },
  { value: "LASER", label: "Laser" },
  { value: "SURGERY", label: "Cirurgia" },
  { value: "NONE", label: "Nenhum" },
  { value: "OTHER", label: "Outro" },
] as const;

const TIME_BUCKET_OPTIONS = [
  { value: "LT_1M", label: "< 1 mês" },
  { value: "M1_3", label: "1–3 meses" },
  { value: "M3_6", label: "3–6 meses" },
  { value: "M6_12", label: "6–12 meses" },
  { value: "Y1_2", label: "1–2 anos" },
  { value: "GT_2Y", label: "> 2 anos" },
  { value: "UNKNOWN", label: "Não sabe/não lembra" },
] as const;

const SHOCKWAVE_TYPE_OPTIONS = [
  { value: "FOCAL", label: "Focal" },
  { value: "RADIAL", label: "Radial" },
] as const;

export interface PreviousTreatmentsState {
  treatments: string[];
  lastTreatmentTimeBucket: string;
  otherText: string;
  shockwaveType: string;
}

interface PreviousTreatmentsCardProps {
  value: PreviousTreatmentsState;
  onChange: (state: PreviousTreatmentsState) => void;
  onSave?: () => Promise<void>;
  disabled?: boolean;
  isSaving?: boolean;
  validationError?: string | null;
  shockwaveValidationError?: string | null;
}

export function PreviousTreatmentsCard({
  value,
  onChange,
  onSave,
  disabled = false,
  isSaving = false,
  validationError = null,
  shockwaveValidationError = null,
}: PreviousTreatmentsCardProps) {
  const { treatments, lastTreatmentTimeBucket, otherText, shockwaveType } = value;

  const handleTreatmentToggle = useCallback(
    (treatmentValue: string, checked: boolean) => {
      let next: string[];

      if (treatmentValue === "NONE") {
        next = checked ? ["NONE"] : [];
      } else {
        if (checked) {
          next = [...treatments.filter((t) => t !== "NONE"), treatmentValue];
        } else {
          next = treatments.filter((t) => t !== treatmentValue);
        }
      }

      const newOtherText = next.includes("OTHER") ? otherText : "";
      const newShockwaveType = next.includes("SHOCKWAVE") ? shockwaveType : "";

      onChange({ treatments: next, lastTreatmentTimeBucket, otherText: newOtherText, shockwaveType: newShockwaveType });
    },
    [treatments, lastTreatmentTimeBucket, otherText, shockwaveType, onChange]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tratamentos Prévios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Multi-select checkboxes */}
        <div className="space-y-3">
          {TREATMENT_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`prev-treat-${opt.value}`}
                checked={treatments.includes(opt.value)}
                onCheckedChange={(checked) =>
                  handleTreatmentToggle(opt.value, !!checked)
                }
                disabled={disabled}
              />
              <Label
                htmlFor={`prev-treat-${opt.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </div>

        {/* SHOCKWAVE type dropdown */}
        {treatments.includes("SHOCKWAVE") && (
          <div className="space-y-1.5 pl-6">
            <Label className="text-sm">Tipo de ondas de choque</Label>
            <Select
              value={shockwaveType}
              onValueChange={(v) =>
                onChange({ treatments, lastTreatmentTimeBucket, otherText, shockwaveType: v })
              }
              disabled={disabled}
            >
              <SelectTrigger className={shockwaveValidationError ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {SHOCKWAVE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {shockwaveValidationError && (
              <p className="text-sm text-destructive">{shockwaveValidationError}</p>
            )}
          </div>
        )}

        {/* OTHER text input */}
        {treatments.includes("OTHER") && (
          <div className="space-y-1.5 pl-6">
            <Label htmlFor="prev-treat-other-text" className="text-sm">
              Outro (qual?)
            </Label>
            <Input
              id="prev-treat-other-text"
              value={otherText}
              onChange={(e) =>
                onChange({ treatments, lastTreatmentTimeBucket, otherText: e.target.value.slice(0, 80), shockwaveType })
              }
              maxLength={80}
              placeholder="Especifique..."
              disabled={disabled}
              className={validationError ? "border-destructive" : ""}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>
        )}

        {/* Time bucket dropdown */}
        <div className="space-y-1.5">
          <Label className="text-sm">Tempo desde o último tratamento</Label>
          <Select
            value={lastTreatmentTimeBucket}
            onValueChange={(v) =>
              onChange({ treatments, lastTreatmentTimeBucket: v, otherText, shockwaveType })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {TIME_BUCKET_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save button */}
        {onSave && !disabled && (
          <Button onClick={onSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Tratamentos Prévios"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
