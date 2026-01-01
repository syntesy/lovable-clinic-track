import { FlaskConical } from 'lucide-react';

interface RegistryEligibilityBadgeProps {
  isEligible: boolean;
  className?: string;
}

/**
 * Selo discreto que indica elegibilidade para evidência clínica
 * Não menciona REGENAPP ao médico
 */
export function RegistryEligibilityBadge({ isEligible, className = '' }: RegistryEligibilityBadgeProps) {
  if (!isEligible) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <FlaskConical className="h-3 w-3 text-primary/60" />
      <span>Contribui para evidência clínica (dados anonimizados)</span>
    </div>
  );
}
