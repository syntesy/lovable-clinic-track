/**
 * Selo de Mentor Verificado REGEN
 * Exibe badge visual para mentores com curadoria completa
 */

import { BadgeCheck, Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MentorVerifiedBadgeProps {
  hasValidSeal: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const labelSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function MentorVerifiedBadge({
  hasValidSeal,
  size = "md",
  showLabel = false,
  className,
}: MentorVerifiedBadgeProps) {
  if (!hasValidSeal) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400",
              className
            )}
          >
            <BadgeCheck className={cn(sizeClasses[size], "fill-current")} />
            {showLabel && (
              <span className={cn("font-medium", labelSizeClasses[size])}>
                Mentor Verificado
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">
            Mentor verificado pelo REGEN Academy segundo critérios científicos e
            institucionais.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Badge compacto para cards
export function MentorVerifiedBadgeCompact({
  hasValidSeal,
  className,
}: {
  hasValidSeal: boolean;
  className?: string;
}) {
  if (!hasValidSeal) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium",
              className
            )}
          >
            <Shield className="h-3 w-3" />
            <span>Verificado</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">
            Mentor verificado pelo REGEN Academy segundo critérios científicos e
            institucionais.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default MentorVerifiedBadge;
