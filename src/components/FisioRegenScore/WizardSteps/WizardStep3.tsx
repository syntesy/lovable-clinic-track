import { FisioRegenFormData, CRPStatus } from "@/types/fisioregen-score";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FlaskConical } from "lucide-react";

interface WizardStep3Props {
  formData: FisioRegenFormData;
  updateFormData: <K extends keyof FisioRegenFormData>(field: K, value: FisioRegenFormData[K]) => void;
}

export function WizardStep3({ formData, updateFormData }: WizardStep3Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <FlaskConical className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Exames Laboratoriais</p>
          <p className="text-sm text-muted-foreground">
            Informe os resultados dos exames disponíveis. Valores ausentes recebem pontuação neutra.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Diabetes conhecido */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="diabetes_known" className="font-medium">
              Diabetes conhecido
            </Label>
            <p className="text-sm text-muted-foreground">
              Paciente tem diagnóstico prévio de diabetes
            </p>
          </div>
          <Switch
            id="diabetes_known"
            checked={formData.diabetes_known}
            onCheckedChange={(checked) => updateFormData("diabetes_known", checked)}
          />
        </div>

        {/* Plaquetas */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="space-y-1">
            <Label htmlFor="platelets_value" className="font-medium">
              Contagem de Plaquetas (/µL)
            </Label>
            <p className="text-sm text-muted-foreground">
              Deixe em branco se não disponível
            </p>
          </div>
          <Input
            id="platelets_value"
            type="number"
            placeholder="Ex: 250000"
            value={formData.platelets_value ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              updateFormData("platelets_value", val ? Number(val) : null);
            }}
          />
        </div>

        {/* HbA1c */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="space-y-1">
            <Label htmlFor="hba1c_value" className="font-medium">
              Hemoglobina Glicada (HbA1c) %
            </Label>
            <p className="text-sm text-muted-foreground">
              Deixe em branco se não disponível
            </p>
          </div>
          <Input
            id="hba1c_value"
            type="number"
            step="0.1"
            placeholder="Ex: 5.6"
            value={formData.hba1c_value ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              updateFormData("hba1c_value", val ? Number(val) : null);
            }}
          />
        </div>

        {/* PCR Status */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="space-y-1">
            <Label className="font-medium">Proteína C-Reativa (PCR)</Label>
            <p className="text-sm text-muted-foreground">
              Status do exame de PCR
            </p>
          </div>
          <RadioGroup
            value={formData.crp_status}
            onValueChange={(val) => updateFormData("crp_status", val as CRPStatus)}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="not_available" id="crp_not_available" />
              <Label htmlFor="crp_not_available" className="cursor-pointer">
                Não disponível
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="normal" id="crp_normal" />
              <Label htmlFor="crp_normal" className="cursor-pointer">
                Normal
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="mild" id="crp_mild" />
              <Label htmlFor="crp_mild" className="cursor-pointer">
                Levemente elevado
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="high" id="crp_high" />
              <Label htmlFor="crp_high" className="cursor-pointer">
                Alto
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
