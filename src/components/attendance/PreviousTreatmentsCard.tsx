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

const LASER_INTENSITY_OPTIONS = [
  { value: "LOW", label: "Baixa intensidade" },
  { value: "HIGH", label: "Alta intensidade" },
] as const;

const ORTHOBIOLOGIC_TYPE_OPTIONS = [
  { value: "PRP", label: "PRP" },
  { value: "PRF", label: "PRF" },
  { value: "BMAC", label: "BMAC" },
  { value: "SVF", label: "SVF" },
  { value: "EXOSOMES", label: "Exossomos" },
  { value: "COMBINATION", label: "Combinação" },
  { value: "OTHER", label: "Outro" },
] as const;

const EPI_US_GUIDED_OPTIONS = [
  { value: "YES", label: "Sim" },
  { value: "NO", label: "Não" },
  { value: "UNKNOWN", label: "Não informado" },
] as const;

const PHYSIO_TYPE_OPTIONS = [
  { value: "CONVENTIONAL", label: "Convencional" },
  { value: "EXERCISE", label: "Exercício terapêutico estruturado" },
  { value: "MANUAL", label: "Terapia manual" },
  { value: "INVASIVE", label: "Fisioterapia invasiva" },
  { value: "UNKNOWN", label: "Não informado" },
] as const;

const PHYSIO_DURATION_OPTIONS = [
  { value: "LT_4W", label: "< 4 semanas" },
  { value: "M1_3", label: "1–3 meses" },
  { value: "GT_3M", label: "> 3 meses" },
  { value: "UNKNOWN", label: "Não informado" },
] as const;

export interface PreviousTreatmentsState {
  treatments: string[];
  lastTreatmentTimeBucket: string;
  otherText: string;
  shockwaveType: string;
  laserIntensity: string;
  orthobiologicPrevType: string;
  orthobiologicPrevOtherText: string;
  epiUsGuided: string;
  physioType: string;
  physioDuration: string;
}

interface PreviousTreatmentsCardProps {
  value: PreviousTreatmentsState;
  onChange: (state: PreviousTreatmentsState) => void;
  onSave?: () => Promise<void>;
  disabled?: boolean;
  isSaving?: boolean;
  validationError?: string | null;
  shockwaveValidationError?: string | null;
  laserValidationError?: string | null;
  orthobiologicPrevValidationError?: string | null;
  orthobiologicPrevOtherValidationError?: string | null;
}

export function PreviousTreatmentsCard({
  value,
  onChange,
  onSave,
  disabled = false,
  isSaving = false,
  validationError = null,
  shockwaveValidationError = null,
  laserValidationError = null,
  orthobiologicPrevValidationError = null,
  orthobiologicPrevOtherValidationError = null,
}: PreviousTreatmentsCardProps) {
  const { treatments, lastTreatmentTimeBucket, otherText, shockwaveType, laserIntensity, orthobiologicPrevType, orthobiologicPrevOtherText, epiUsGuided, physioType, physioDuration } = value;

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
      const newLaserIntensity = next.includes("LASER") ? laserIntensity : "";
      const newOrthobiologicPrevType = next.includes("ORTHOBIOLOGIC_PREV") ? orthobiologicPrevType : "";
      const newOrthobiologicPrevOtherText = next.includes("ORTHOBIOLOGIC_PREV") ? orthobiologicPrevOtherText : "";
      const newEpiUsGuided = next.includes("EPI") ? epiUsGuided : "";
      const newPhysioType = next.includes("PHYSIOTHERAPY") ? physioType : "";
      const newPhysioDuration = next.includes("PHYSIOTHERAPY") ? physioDuration : "";

      onChange({ treatments: next, lastTreatmentTimeBucket, otherText: newOtherText, shockwaveType: newShockwaveType, laserIntensity: newLaserIntensity, orthobiologicPrevType: newOrthobiologicPrevType, orthobiologicPrevOtherText: newOrthobiologicPrevOtherText, epiUsGuided: newEpiUsGuided, physioType: newPhysioType, physioDuration: newPhysioDuration });
    },
    [treatments, lastTreatmentTimeBucket, otherText, shockwaveType, laserIntensity, orthobiologicPrevType, orthobiologicPrevOtherText, epiUsGuided, physioType, physioDuration, onChange]
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

        {/* PHYSIOTHERAPY type + duration dropdowns (optional) */}
        {treatments.includes("PHYSIOTHERAPY") && (
          <div className="space-y-3 pl-6">
            <div className="space-y-1.5">
              <Label className="text-sm">Tipo de fisioterapia predominante</Label>
              <Select
                value={physioType}
                onValueChange={(v) => onChange({ ...value, physioType: v })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PHYSIO_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Duração aproximada</Label>
              <Select
                value={physioDuration}
                onValueChange={(v) => onChange({ ...value, physioDuration: v })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PHYSIO_DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* SHOCKWAVE type dropdown */}
        {treatments.includes("SHOCKWAVE") && (
          <div className="space-y-1.5 pl-6">
            <Label className="text-sm">Tipo de ondas de choque</Label>
            <Select
              value={shockwaveType}
              onValueChange={(v) =>
                onChange({ ...value, shockwaveType: v })
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

        {/* LASER intensity dropdown */}
        {treatments.includes("LASER") && (
          <div className="space-y-1.5 pl-6">
            <Label className="text-sm">Intensidade do laser</Label>
            <Select
              value={laserIntensity}
              onValueChange={(v) =>
                onChange({ ...value, laserIntensity: v })
              }
              disabled={disabled}
            >
              <SelectTrigger className={laserValidationError ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {LASER_INTENSITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {laserValidationError && (
              <p className="text-sm text-destructive">{laserValidationError}</p>
            )}
          </div>
        )}

        {/* EPI us_guided dropdown (optional) */}
        {treatments.includes("EPI") && (
          <div className="space-y-1.5 pl-6">
            <Label className="text-sm">EPI guiada por ultrassom?</Label>
            <Select
              value={epiUsGuided}
              onValueChange={(v) =>
                onChange({ ...value, epiUsGuided: v })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {EPI_US_GUIDED_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ORTHOBIOLOGIC_PREV type dropdown */}
        {treatments.includes("ORTHOBIOLOGIC_PREV") && (
          <div className="space-y-1.5 pl-6">
            <Label className="text-sm">Tipo de ortobiológico prévio</Label>
            <Select
              value={orthobiologicPrevType}
              onValueChange={(v) =>
                onChange({ ...value, orthobiologicPrevType: v, orthobiologicPrevOtherText: v !== "OTHER" ? "" : orthobiologicPrevOtherText })
              }
              disabled={disabled}
            >
              <SelectTrigger className={orthobiologicPrevValidationError ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {ORTHOBIOLOGIC_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orthobiologicPrevValidationError && (
              <p className="text-sm text-destructive">{orthobiologicPrevValidationError}</p>
            )}

            {/* ORTHOBIOLOGIC_PREV OTHER text input */}
            {orthobiologicPrevType === "OTHER" && (
              <div className="space-y-1.5 mt-2">
                <Label htmlFor="orthobio-prev-other-text" className="text-sm">
                  Qual ortobiológico?
                </Label>
                <Input
                  id="orthobio-prev-other-text"
                  value={orthobiologicPrevOtherText}
                  onChange={(e) =>
                    onChange({ ...value, orthobiologicPrevOtherText: e.target.value.slice(0, 80) })
                  }
                  maxLength={80}
                  placeholder="Ex: Enxerto X, produto Y…"
                  disabled={disabled}
                  className={orthobiologicPrevOtherValidationError ? "border-destructive" : ""}
                />
                {orthobiologicPrevOtherValidationError && (
                  <p className="text-sm text-destructive">{orthobiologicPrevOtherValidationError}</p>
                )}
              </div>
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
                onChange({ ...value, otherText: e.target.value.slice(0, 80) })
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
              onChange({ ...value, lastTreatmentTimeBucket: v })
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
