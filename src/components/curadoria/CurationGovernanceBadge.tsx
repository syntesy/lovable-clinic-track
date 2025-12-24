import { Badge } from "@/components/ui/badge";
import { Bot, ShieldCheck, AlertTriangle } from "lucide-react";
import { CurationStatus, curationStatusConfig } from "@/types/curation";

interface CurationGovernanceBadgeProps {
  status: CurationStatus;
  className?: string;
}

export function CurationGovernanceBadge({ status, className = "" }: CurationGovernanceBadgeProps) {
  const config = curationStatusConfig[status];
  
  if (!config) return null;
  
  const Icon = config.isAIDraft ? Bot : ShieldCheck;
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} border gap-1.5 ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.badgeText}
    </Badge>
  );
}

export function CurationStatusBadge({ status, className = "" }: CurationGovernanceBadgeProps) {
  const config = curationStatusConfig[status];
  
  if (!config) return null;
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} border ${className}`}
    >
      {config.label}
    </Badge>
  );
}
