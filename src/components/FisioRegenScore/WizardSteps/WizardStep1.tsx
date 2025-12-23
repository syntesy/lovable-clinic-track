import { FisioRegenFormData } from "@/types/fisioregen-score";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";

interface WizardStep1Props {
  formData: FisioRegenFormData;
  updateFormData: <K extends keyof FisioRegenFormData>(field: K, value: FisioRegenFormData[K]) => void;
}

export function WizardStep1({ formData, updateFormData }: WizardStep1Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
        <div>
          <p className="font-medium text-destructive">Bloqueios Clínicos</p>
          <p className="text-sm text-muted-foreground">
            Estas condições impedem o procedimento independentemente do score calculado.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="has_active_infection" className="font-medium">
              Infecção ativa
            </Label>
            <p className="text-sm text-muted-foreground">
              Paciente apresenta infecção em atividade no momento
            </p>
          </div>
          <Switch
            id="has_active_infection"
            checked={formData.has_active_infection}
            onCheckedChange={(checked) => updateFormData("has_active_infection", checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="has_skin_compromise_at_site" className="font-medium">
              Comprometimento cutâneo no local
            </Label>
            <p className="text-sm text-muted-foreground">
              Lesão de pele ou ferida no local de aplicação
            </p>
          </div>
          <Switch
            id="has_skin_compromise_at_site"
            checked={formData.has_skin_compromise_at_site}
            onCheckedChange={(checked) => updateFormData("has_skin_compromise_at_site", checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="has_active_cancer_on_treatment" className="font-medium">
              Câncer ativo em tratamento
            </Label>
            <p className="text-sm text-muted-foreground">
              Neoplasia em tratamento ativo (quimioterapia, radioterapia, etc.)
            </p>
          </div>
          <Switch
            id="has_active_cancer_on_treatment"
            checked={formData.has_active_cancer_on_treatment}
            onCheckedChange={(checked) => updateFormData("has_active_cancer_on_treatment", checked)}
          />
        </div>
      </div>
    </div>
  );
}
