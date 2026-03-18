import { FlaskConical, Info, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PathologyCharacterizationProfile } from '@/config/pathologyCharacterization';

interface PathologyCharacterizationSectionProps {
  profile: PathologyCharacterizationProfile;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  disabled?: boolean;
}

const hintColorMap = {
  favorable: 'text-green-500',
  conditional: 'text-yellow-500',
  adverse: 'text-red-500',
} as const;

function FieldBlock({
  field,
  values,
  onChange,
  disabled,
}: {
  field: PathologyCharacterizationProfile['fields'][number];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled: boolean;
}) {
  const selectedValue = values[field.key];
  const selectedOption = field.options.find(o => o.value === selectedValue);

  return (
    <div className="space-y-3">
      {/* Field header */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </p>
          {field.tooltipText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[240px]">
                  <p className="text-xs">{field.tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {field.description && (
          <p className="text-xs text-muted-foreground leading-snug">{field.description}</p>
        )}
        {!selectedValue && (
          <p className="text-xs text-muted-foreground/60 italic">Selecione uma opção abaixo</p>
        )}
      </div>

      {/* Options as radio-style cards */}
      <div className="space-y-2">
        {field.options.map(option => {
          const isSelected = selectedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(field.key, option.value)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSelected
                ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                : <Circle className="w-4 h-4 shrink-0 text-muted-foreground/40" />
              }
              <span className={cn('text-sm font-medium', isSelected && 'text-foreground')}>
                {option.label}
              </span>
              {isSelected && option.scoringHint && (
                <span className={cn('text-xs ml-auto', hintColorMap[option.scoringHint.type])}>
                  {option.scoringHint.text}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hint for selected option */}
      {selectedOption?.scoringHint && (
        <p className={cn('text-xs', hintColorMap[selectedOption.scoringHint.type])}>
          {selectedOption.scoringHint.text}
        </p>
      )}
    </div>
  );
}

export function PathologyCharacterizationSection({
  profile,
  values,
  onChange,
  disabled = false,
}: PathologyCharacterizationSectionProps) {
  function handleSelect(key: string, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-6">
      {/* Protocol badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="gap-1.5 border-primary/40 text-primary cursor-help"
              >
                <FlaskConical className="h-3 w-3" />
                {profile.protocol}
                <Info className="h-3 w-3 opacity-60" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[280px]">
              <p className="text-xs font-medium mb-1">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.protocolReference}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-xs text-muted-foreground">Caracterização científica da patologia</span>
      </div>

      {/* Fields in 2-col grid when multiple */}
      <div className={profile.fields.length > 1 ? "grid md:grid-cols-2 gap-8" : "space-y-6"}>
        {profile.fields.map(field => (
          <FieldBlock
            key={field.key}
            field={field}
            values={values}
            onChange={handleSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
