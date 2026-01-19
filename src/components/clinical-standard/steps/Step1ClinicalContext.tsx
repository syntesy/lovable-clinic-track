import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
  ClinicalContextData,
  PATHOLOGY_OPTIONS,
  ANATOMIC_REGION_OPTIONS,
  SPINE_LOCATIONS,
  needsSpineLocation,
} from "@/types/clinical-standard";

interface Step1Props {
  data: ClinicalContextData;
  onChange: (data: Partial<ClinicalContextData>) => void;
}

export function Step1ClinicalContext({ data, onChange }: Step1Props) {
  const showSpineLocations = needsSpineLocation(data.anatomic_region);

  return (
    <div className="space-y-6">
      {/* Pathology */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Patologia tratada *</Label>
        <RadioGroup
          value={data.pathology}
          onValueChange={(value) => onChange({ pathology: value })}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {PATHOLOGY_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                data.pathology === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`pathology-${option.value}`} />
              <Label htmlFor={`pathology-${option.value}`} className="cursor-pointer flex-1">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Anatomic Region */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Região anatômica *</Label>
        <RadioGroup
          value={data.anatomic_region}
          onValueChange={(value) => onChange({ anatomic_region: value, specific_location: '' })}
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
        >
          {ANATOMIC_REGION_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                data.anatomic_region === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`region-${option.value}`} />
              <Label htmlFor={`region-${option.value}`} className="cursor-pointer flex-1 text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Spine-specific location */}
      {showSpineLocations && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Localização específica *</Label>
          <RadioGroup
            value={data.specific_location || ''}
            onValueChange={(value) => onChange({ specific_location: value })}
            className="grid grid-cols-2 gap-2"
          >
            {SPINE_LOCATIONS.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  data.specific_location === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value={option.value} id={`spine-${option.value}`} />
                <Label htmlFor={`spine-${option.value}`} className="cursor-pointer flex-1 text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Symptom Duration (optional) */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Duração dos sintomas (opcional)</Label>
        <Input
          placeholder="Ex: 6 meses, 2 anos"
          value={data.symptom_duration || ''}
          onChange={(e) => onChange({ symptom_duration: e.target.value })}
          className="max-w-xs"
        />
      </div>
    </div>
  );
}
