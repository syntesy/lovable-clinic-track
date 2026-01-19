import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  PRPProtocolData,
  SESSIONS_COUNT_OPTIONS,
  SESSIONS_INTERVAL_OPTIONS,
  VOLUME_OPTIONS,
  PRP_TYPE_OPTIONS,
  PRP_ACTIVATION_OPTIONS,
  ACTIVATION_METHOD_OPTIONS,
  IMAGING_GUIDANCE_OPTIONS,
} from "@/types/clinical-standard";

interface Step3Props {
  data: PRPProtocolData;
  onChange: (data: Partial<PRPProtocolData>) => void;
}

export function Step3PRPProtocol({ data, onChange }: Step3Props) {
  const showActivationMethod = data.prp_activation === 'ativado';

  return (
    <div className="space-y-6">
      {/* Sessions Count */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Número de sessões *</Label>
        <RadioGroup
          value={data.sessions_count}
          onValueChange={(value) => onChange({ sessions_count: value })}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {SESSIONS_COUNT_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center justify-center p-3 rounded-lg border transition-colors cursor-pointer ${
                data.sessions_count === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`sessions-${option.value}`} className="sr-only" />
              <Label htmlFor={`sessions-${option.value}`} className="cursor-pointer text-center text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Sessions Interval */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Intervalo entre sessões *</Label>
        <RadioGroup
          value={data.sessions_interval}
          onValueChange={(value) => onChange({ sessions_interval: value })}
          className="grid grid-cols-2 gap-2"
        >
          {SESSIONS_INTERVAL_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center justify-center p-3 rounded-lg border transition-colors cursor-pointer ${
                data.sessions_interval === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`interval-${option.value}`} className="sr-only" />
              <Label htmlFor={`interval-${option.value}`} className="cursor-pointer text-center text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Volume */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Volume por sessão *</Label>
        <RadioGroup
          value={data.volume_per_session_range}
          onValueChange={(value) => onChange({ volume_per_session_range: value })}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {VOLUME_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center justify-center p-3 rounded-lg border transition-colors cursor-pointer ${
                data.volume_per_session_range === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`volume-${option.value}`} className="sr-only" />
              <Label htmlFor={`volume-${option.value}`} className="cursor-pointer text-center text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* PRP Type */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Tipo de PRP *</Label>
        <RadioGroup
          value={data.prp_type}
          onValueChange={(value) => onChange({ prp_type: value })}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
        >
          {PRP_TYPE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                data.prp_type === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`prp-type-${option.value}`} />
              <Label htmlFor={`prp-type-${option.value}`} className="cursor-pointer flex-1 text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* PRP Activation */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Ativação *</Label>
        <RadioGroup
          value={data.prp_activation}
          onValueChange={(value) => onChange({ prp_activation: value, activation_method: '' })}
          className="grid grid-cols-2 gap-2"
        >
          {PRP_ACTIVATION_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                data.prp_activation === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`activation-${option.value}`} />
              <Label htmlFor={`activation-${option.value}`} className="cursor-pointer flex-1">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Activation Method (conditional) */}
      {showActivationMethod && (
        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
          <Label className="text-base font-semibold">Método de ativação *</Label>
          <RadioGroup
            value={data.activation_method || ''}
            onValueChange={(value) => onChange({ activation_method: value })}
            className="grid grid-cols-3 gap-2"
          >
            {ACTIVATION_METHOD_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`flex items-center justify-center p-3 rounded-lg border transition-colors cursor-pointer ${
                  data.activation_method === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value={option.value} id={`method-${option.value}`} className="sr-only" />
                <Label htmlFor={`method-${option.value}`} className="cursor-pointer text-center text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Imaging Guidance */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Guia por imagem *</Label>
        <RadioGroup
          value={data.imaging_guidance}
          onValueChange={(value) => onChange({ imaging_guidance: value })}
          className="grid grid-cols-2 gap-2"
        >
          {IMAGING_GUIDANCE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                data.imaging_guidance === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={option.value} id={`guidance-${option.value}`} />
              <Label htmlFor={`guidance-${option.value}`} className="cursor-pointer flex-1 text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
