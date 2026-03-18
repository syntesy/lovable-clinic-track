import { FlaskConical, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  favorable: 'text-green-600 dark:text-green-400',
  conditional: 'text-yellow-600 dark:text-yellow-400',
  adverse: 'text-red-600 dark:text-red-400',
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
  const selectedOption = field.options.find(o => o.value === values[field.key]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {field.tooltipText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[240px]">
                <p className="text-xs">{field.tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {field.options.map(option => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(field.key, option.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors',
              values[field.key] === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:border-primary/50 text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {selectedOption?.scoringHint && (
        <p className={cn('text-xs italic', hintColorMap[selectedOption.scoringHint.type])}>
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
    <div className="space-y-4">
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
        <span className="text-xs text-muted-foreground">
          Caracterização científica da patologia
        </span>
      </div>

      {/* Fields in 2-col grid when there are multiple */}
      <div className={profile.fields.length > 1 ? "grid md:grid-cols-2 gap-5" : "space-y-4"}>
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
