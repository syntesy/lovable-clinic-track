import { cn } from '@/lib/utils';
import {
  type ClinicalOutcomeClassificationValue,
  CLINICAL_OUTCOME_LABELS,
  CLINICAL_OUTCOME_LABEL_UNAVAILABLE,
  CLINICAL_OUTCOME_BADGE_CLASSES,
} from '@/domain/clinicalOutcomeClassification';

interface ClinicalOutcomeBadgeProps {
  classification: ClinicalOutcomeClassificationValue | null | undefined;
  className?: string;
}

/**
 * Displays the 4-level clinical outcome classification as a status pill.
 *
 * Color mapping (spec section 10):
 * - very_favorable → green
 * - favorable      → blue
 * - partial        → amber/yellow
 * - limited        → red
 * - null           → muted (Classificação indisponível)
 *
 * This badge is for display/interpretation only.
 * It does NOT imply recommendation, indication, approval, or contraindication.
 */
export function ClinicalOutcomeBadge({ classification, className }: ClinicalOutcomeBadgeProps) {
  const label = classification
    ? CLINICAL_OUTCOME_LABELS[classification]
    : CLINICAL_OUTCOME_LABEL_UNAVAILABLE;

  const colorClasses = classification
    ? CLINICAL_OUTCOME_BADGE_CLASSES[classification]
    : 'bg-muted text-muted-foreground border-border';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
        colorClasses,
        className
      )}
    >
      {label}
    </span>
  );
}
