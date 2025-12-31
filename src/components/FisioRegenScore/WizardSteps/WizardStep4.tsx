import { FisioRegenFormData, SmokingStatus, SmokingQuitBucket } from "@/types/fisioregen-score";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Cigarette, Check, AlertTriangle, Clock } from "lucide-react";

interface WizardStep4Props {
  formData: FisioRegenFormData;
  updateFormData: <K extends keyof FisioRegenFormData>(field: K, value: FisioRegenFormData[K]) => void;
}

export function WizardStep4({ formData, updateFormData }: WizardStep4Props) {
  const isExSmoker = formData.smoking_status === "ex_smoker";

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
        onValueChange={(val) => {
          updateFormData("smoking_status", val as SmokingStatus);
          // Reset quit bucket if not ex-smoker
          if (val !== "ex_smoker") {
            updateFormData("regen_smoking_quit_bucket", null);
          }
        }}
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
              Nunca fumou
            </p>
          </div>
          <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
            +5 pts
          </span>
        </div>

        <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
          formData.smoking_status === "ex_smoker" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : ""
        }`}>
          <RadioGroupItem value="ex_smoker" id="ex_smoker" />
          <div className="flex-1">
            <Label htmlFor="ex_smoker" className="font-medium cursor-pointer flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Já fumei, mas parei
            </Label>
            <p className="text-sm text-muted-foreground">
              Ex-fumante
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
            variável
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
              Até 10 cigarros/dia
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

      {/* Condicional: se ex-fumante, perguntar há quanto tempo parou */}
      {isExSmoker && (
        <div className="p-4 border border-blue-300 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
          <Label className="font-medium">Há quanto tempo parou de fumar?</Label>
          <RadioGroup
            value={formData.regen_smoking_quit_bucket || ""}
            onValueChange={(val) => updateFormData("regen_smoking_quit_bucket", val as SmokingQuitBucket)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="lt_6m" id="quit_lt_6m" />
              <Label htmlFor="quit_lt_6m" className="cursor-pointer text-sm">
                Menos de 6 meses
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="m6_12" id="quit_m6_12" />
              <Label htmlFor="quit_m6_12" className="cursor-pointer text-sm">
                Entre 6 e 12 meses
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="gt_12m" id="quit_gt_12m" />
              <Label htmlFor="quit_gt_12m" className="cursor-pointer text-sm">
                Mais de 12 meses
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="unknown" id="quit_unknown" />
              <Label htmlFor="quit_unknown" className="cursor-pointer text-sm">
                Não sei / Não lembro
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
