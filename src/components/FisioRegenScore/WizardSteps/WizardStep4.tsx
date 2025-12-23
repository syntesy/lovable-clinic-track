import { FisioRegenFormData, SmokingStatus } from "@/types/fisioregen-score";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Cigarette, Check, AlertTriangle } from "lucide-react";

interface WizardStep4Props {
  formData: FisioRegenFormData;
  updateFormData: <K extends keyof FisioRegenFormData>(field: K, value: FisioRegenFormData[K]) => void;
}

export function WizardStep4({ formData, updateFormData }: WizardStep4Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <Cigarette className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Status de Tabagismo</p>
          <p className="text-sm text-muted-foreground">
            O tabagismo afeta significativamente a capacidade regenerativa dos tecidos.
          </p>
        </div>
      </div>

      <RadioGroup
        value={formData.smoking_status}
        onValueChange={(val) => updateFormData("smoking_status", val as SmokingStatus)}
        className="space-y-3"
      >
        <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
          formData.smoking_status === "non_smoker" ? "border-green-500 bg-green-50 dark:bg-green-950/30" : ""
        }`}>
          <RadioGroupItem value="non_smoker" id="non_smoker" />
          <div className="flex-1">
            <Label htmlFor="non_smoker" className="font-medium cursor-pointer flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Não fumante
            </Label>
            <p className="text-sm text-muted-foreground">
              Nunca fumou ou parou há mais de 1 ano
            </p>
          </div>
          <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
            +5 pts
          </span>
        </div>

        <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
          formData.smoking_status === "light_moderate" ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : ""
        }`}>
          <RadioGroupItem value="light_moderate" id="light_moderate" />
          <div className="flex-1">
            <Label htmlFor="light_moderate" className="font-medium cursor-pointer flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Fumante leve/moderado
            </Label>
            <p className="text-sm text-muted-foreground">
              Até 10 cigarros/dia ou parou há menos de 1 ano
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
            +2 pts
          </span>
        </div>

        <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
          formData.smoking_status === "heavy" ? "border-red-500 bg-red-50 dark:bg-red-950/30" : ""
        }`}>
          <RadioGroupItem value="heavy" id="heavy" />
          <div className="flex-1">
            <Label htmlFor="heavy" className="font-medium cursor-pointer flex items-center gap-2">
              <Cigarette className="h-4 w-4 text-red-600" />
              Fumante pesado
            </Label>
            <p className="text-sm text-muted-foreground">
              Mais de 10 cigarros/dia
            </p>
          </div>
          <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
            0 pts
          </span>
        </div>
      </RadioGroup>
    </div>
  );
}
