import { FisioRegenFormData, LogisticsCapacity, AdherenceEstimate, ExpectationRealism } from "@/types/fisioregen-score";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserCheck, Calendar, Target } from "lucide-react";

interface WizardStep6Props {
  formData: FisioRegenFormData;
  updateFormData: <K extends keyof FisioRegenFormData>(field: K, value: FisioRegenFormData[K]) => void;
}

export function WizardStep6({ formData, updateFormData }: WizardStep6Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <UserCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Execução e Adesão</p>
          <p className="text-sm text-muted-foreground">
            Fatores relacionados à capacidade do paciente de seguir o tratamento.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Capacidade Logística */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Capacidade Logística (0-8 pts)</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Disponibilidade para comparecer às sessões e realizar repouso necessário
          </p>
          <RadioGroup
            value={formData.logistics_capacity}
            onValueChange={(val) => updateFormData("logistics_capacity", val as LogisticsCapacity)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="high" id="lc_high" />
              <Label htmlFor="lc_high" className="cursor-pointer flex-1 text-sm">
                Alta - Total disponibilidade
              </Label>
              <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                +8 pts
              </span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="medium" id="lc_medium" />
              <Label htmlFor="lc_medium" className="cursor-pointer flex-1 text-sm">
                Média - Limitações moderadas
              </Label>
              <span className="text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                +4 pts
              </span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="low" id="lc_low" />
              <Label htmlFor="lc_low" className="cursor-pointer flex-1 text-sm">
                Baixa - Grandes limitações
              </Label>
              <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                0 pts
              </span>
            </div>
          </RadioGroup>
        </div>

        {/* Adesão Estimada */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Adesão Estimada (0-7 pts)</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Histórico e expectativa de adesão às orientações médicas
          </p>
          <RadioGroup
            value={formData.adherence_estimate}
            onValueChange={(val) => updateFormData("adherence_estimate", val as AdherenceEstimate)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="high" id="ae_high" />
              <Label htmlFor="ae_high" className="cursor-pointer flex-1 text-sm">
                Alta - Excelente adesão prévia
              </Label>
              <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                +7 pts
              </span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="medium" id="ae_medium" />
              <Label htmlFor="ae_medium" className="cursor-pointer flex-1 text-sm">
                Média - Adesão variável
              </Label>
              <span className="text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                +3 pts
              </span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="low" id="ae_low" />
              <Label htmlFor="ae_low" className="cursor-pointer flex-1 text-sm">
                Baixa - Histórico de não-adesão
              </Label>
              <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                0 pts
              </span>
            </div>
          </RadioGroup>
        </div>

        {/* Realismo de Expectativas */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Realismo de Expectativas (0-5 pts)</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Alinhamento das expectativas do paciente com resultados realistas
          </p>
          <RadioGroup
            value={formData.expectation_realism}
            onValueChange={(val) => updateFormData("expectation_realism", val as ExpectationRealism)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="realistic" id="er_realistic" />
              <Label htmlFor="er_realistic" className="cursor-pointer flex-1 text-sm">
                Realistas - Expectativas alinhadas
              </Label>
              <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                +5 pts
              </span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="partial" id="er_partial" />
              <Label htmlFor="er_partial" className="cursor-pointer flex-1 text-sm">
                Parciais - Necessita ajuste de expectativas
              </Label>
              <span className="text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                +2 pts
              </span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="unrealistic" id="er_unrealistic" />
              <Label htmlFor="er_unrealistic" className="cursor-pointer flex-1 text-sm">
                Irrealistas - Expectativas desalinhadas
              </Label>
              <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                0 pts
              </span>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
