import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegistryEligibilityBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Badge discreto que indica que o caso contribui para evidência clínica
 * Exibido apenas quando o paciente tem consentimento ativo
 */
export function RegistryEligibilityBadge({ 
  className,
  size = 'sm' 
}: RegistryEligibilityBadgeProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 text-muted-foreground",
        size === 'sm' && "text-xs",
        size === 'md' && "text-sm",
        className
      )}
      title="Este caso contribui para evidência clínica com dados anonimizados"
    >
      <FlaskConical className={cn(
        "text-green-600",
        size === 'sm' && "h-3 w-3",
        size === 'md' && "h-4 w-4"
      )} />
      <span>Contribui para evidência clínica</span>
    </div>
  );
}
