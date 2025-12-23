import { FisioRegenFormData } from "@/types/fisioregen-score";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Pill } from "lucide-react";

interface WizardStep2Props {
  formData: FisioRegenFormData;
  updateFormData: <K extends keyof FisioRegenFormData>(field: K, value: FisioRegenFormData[K]) => void;
}

interface MedicationRowProps {
  label: string;
  description: string;
  useField: keyof FisioRegenFormData;
  dateField: keyof FisioRegenFormData;
  useValue: boolean;
  dateValue: string | null;
  onUseChange: (checked: boolean) => void;
  onDateChange: (date: string | null) => void;
}

function MedicationRow({
  label,
  description,
  useValue,
  dateValue,
  onUseChange,
  onDateChange,
}: MedicationRowProps) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="font-medium">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Usa?</span>
          <Switch
            checked={useValue}
            onCheckedChange={(checked) => {
              onUseChange(checked);
              if (!checked) {
                onDateChange(null);
              }
            }}
          />
        </div>
      </div>
      
      {useValue && (
        <div className="pt-2 border-t">
          <Label className="text-sm">Data do último uso</Label>
          <Input
            type="date"
            value={dateValue || ""}
            onChange={(e) => onDateChange(e.target.value || null)}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}

export function WizardStep2({ formData, updateFormData }: WizardStep2Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <Pill className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Medicações em Uso</p>
          <p className="text-sm text-muted-foreground">
            Marque as medicações que o paciente utiliza e informe a data do último uso. 
            Janelas críticas podem bloquear o procedimento.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <MedicationRow
          label="Aspirina (AAS)"
          description="Ácido acetilsalicílico"
          useField="use_aspirin"
          dateField="last_aspirin_date"
          useValue={formData.use_aspirin}
          dateValue={formData.last_aspirin_date}
          onUseChange={(checked) => updateFormData("use_aspirin", checked)}
          onDateChange={(date) => updateFormData("last_aspirin_date", date)}
        />

        <MedicationRow
          label="AINE Não-seletivo"
          description="Anti-inflamatórios não-esteroidais (ex: ibuprofeno, diclofenaco)"
          useField="use_nsaid_nonselective"
          dateField="last_nsaid_nonselective_date"
          useValue={formData.use_nsaid_nonselective}
          dateValue={formData.last_nsaid_nonselective_date}
          onUseChange={(checked) => updateFormData("use_nsaid_nonselective", checked)}
          onDateChange={(date) => updateFormData("last_nsaid_nonselective_date", date)}
        />

        <MedicationRow
          label="Inibidor P2Y12"
          description="Clopidogrel, prasugrel, ticagrelor"
          useField="use_p2y12"
          dateField="last_p2y12_date"
          useValue={formData.use_p2y12}
          dateValue={formData.last_p2y12_date}
          onUseChange={(checked) => updateFormData("use_p2y12", checked)}
          onDateChange={(date) => updateFormData("last_p2y12_date", date)}
        />

        <MedicationRow
          label="Corticosteroide Sistêmico"
          description="Prednisona, dexametasona, etc. (oral ou injetável sistêmico)"
          useField="use_systemic_corticosteroid"
          dateField="last_systemic_corticosteroid_date"
          useValue={formData.use_systemic_corticosteroid}
          dateValue={formData.last_systemic_corticosteroid_date}
          onUseChange={(checked) => updateFormData("use_systemic_corticosteroid", checked)}
          onDateChange={(date) => updateFormData("last_systemic_corticosteroid_date", date)}
        />

        <MedicationRow
          label="Corticosteroide Local no Alvo"
          description="Infiltração de corticoide no local a ser tratado"
          useField="use_local_corticosteroid_target"
          dateField="last_local_corticosteroid_target_date"
          useValue={formData.use_local_corticosteroid_target}
          dateValue={formData.last_local_corticosteroid_target_date}
          onUseChange={(checked) => updateFormData("use_local_corticosteroid_target", checked)}
          onDateChange={(date) => updateFormData("last_local_corticosteroid_target_date", date)}
        />
      </div>
    </div>
  );
}
