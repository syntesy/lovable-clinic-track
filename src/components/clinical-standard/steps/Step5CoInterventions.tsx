import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  CoInterventionsData,
  SHOCKWAVE_OPTIONS,
} from "@/types/clinical-standard";

interface Step5Props {
  data: CoInterventionsData;
  onChange: (data: Partial<CoInterventionsData>) => void;
}

export function Step5CoInterventions({ data, onChange }: Step5Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Indique as cointervenções realizadas junto ao PRP
        </p>
      </div>

      {/* Exercise Therapy */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div>
          <Label className="text-base font-semibold">Exercício terapêutico</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Fisioterapia ou programa de exercícios associado?
          </p>
        </div>
        <Switch
          checked={data.exercise_therapy}
          onCheckedChange={(checked) => onChange({ exercise_therapy: checked })}
        />
      </div>

      {/* Shockwave Therapy */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Ondas de choque *</Label>
        <RadioGroup
          value={data.shockwave_therapy}
          onValueChange={(value) => onChange({ shockwave_therapy: value })}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
        >
          {SHOCKWAVE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                data.shockwave_therapy === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`shockwave-${option.value}`} />
              <Label htmlFor={`shockwave-${option.value}`} className="cursor-pointer flex-1">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* EPI Associated */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div>
          <Label className="text-base font-semibold">EPI associada</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Eletrólise Percutânea Intratecidual junto ao PRP?
          </p>
        </div>
        <Switch
          checked={data.epi_associated}
          onCheckedChange={(checked) => onChange({ epi_associated: checked })}
        />
      </div>
    </div>
  );
}
