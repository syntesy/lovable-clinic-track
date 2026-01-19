import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  AssociationsData,
  HA_TYPE_OPTIONS,
  NSAID_USE_OPTIONS,
} from "@/types/clinical-standard";

interface Step4Props {
  data: AssociationsData;
  onChange: (data: Partial<AssociationsData>) => void;
}

export function Step4Associations({ data, onChange }: Step4Props) {
  return (
    <div className="space-y-8">
      {/* Hyaluronic Acid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div>
            <Label className="text-base font-semibold">PRP associado ao Ácido Hialurônico</Label>
            <p className="text-sm text-muted-foreground mt-1">
              O PRP foi aplicado junto com ácido hialurônico?
            </p>
          </div>
          <Switch
            checked={data.prp_with_hyaluronic_acid}
            onCheckedChange={(checked) => 
              onChange({ prp_with_hyaluronic_acid: checked, hyaluronic_acid_type: '' })
            }
          />
        </div>

        {data.prp_with_hyaluronic_acid && (
          <div className="space-y-3 pl-4 border-l-2 border-primary/20">
            <Label className="text-base font-semibold">Tipo de Ácido Hialurônico *</Label>
            <RadioGroup
              value={data.hyaluronic_acid_type || ''}
              onValueChange={(value) => onChange({ hyaluronic_acid_type: value })}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              {HA_TYPE_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    data.hyaluronic_acid_type === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={`ha-${option.value}`} />
                  <Label htmlFor={`ha-${option.value}`} className="cursor-pointer flex-1 text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>

      {/* NSAID Use */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Uso recente de AINE *</Label>
        <p className="text-sm text-muted-foreground">
          O paciente fez uso de anti-inflamatórios não esteroides antes do procedimento?
        </p>
        <RadioGroup
          value={data.recent_nsaid_use}
          onValueChange={(value) => onChange({ recent_nsaid_use: value })}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {NSAID_USE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                data.recent_nsaid_use === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`nsaid-${option.value}`} />
              <Label htmlFor={`nsaid-${option.value}`} className="cursor-pointer flex-1">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
