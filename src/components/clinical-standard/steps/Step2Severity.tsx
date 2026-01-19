import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  SeverityData,
  getSeverityOptionsForPathology,
  needsHerniaCompression,
  HERNIA_COMPRESSION,
  PATHOLOGY_OPTIONS,
} from "@/types/clinical-standard";

interface Step2Props {
  data: SeverityData;
  pathology: string;
  onChange: (data: Partial<SeverityData>) => void;
}

export function Step2Severity({ data, pathology, onChange }: Step2Props) {
  const severityOptions = getSeverityOptionsForPathology(pathology);
  const showHerniaCompression = needsHerniaCompression(pathology);
  
  const pathologyLabel = PATHOLOGY_OPTIONS.find(p => p.value === pathology)?.label || pathology;

  if (!pathology || pathology === 'outra') {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {pathology === 'outra' 
              ? "Patologia marcada como 'Outra' — classificação não aplicável para fins de comparação."
              : "Selecione uma patologia no passo anterior para definir a classificação."
            }
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Classificação de gravidade para: <span className="font-semibold text-foreground">{pathologyLabel}</span>
        </p>
      </div>

      {/* Severity Classification */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          {pathology === 'hernia_disco' ? 'Tipo de hérnia *' : 'Gravidade *'}
        </Label>
        <RadioGroup
          value={data.severity_classification}
          onValueChange={(value) => onChange({ severity_classification: value })}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {severityOptions.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                data.severity_classification === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`severity-${option.value}`} />
              <Label htmlFor={`severity-${option.value}`} className="cursor-pointer flex-1">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Hernia Compression (only for hernia) */}
      {showHerniaCompression && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Grau de compressão *</Label>
          <RadioGroup
            value={data.hernia_compression || ''}
            onValueChange={(value) => onChange({ hernia_compression: value })}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            {HERNIA_COMPRESSION.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  data.hernia_compression === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value={option.value} id={`compression-${option.value}`} />
                <Label htmlFor={`compression-${option.value}`} className="cursor-pointer flex-1 text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
