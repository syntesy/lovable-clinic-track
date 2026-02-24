import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, LinkIcon, Info } from "lucide-react";

interface EvidenceCoherenceBadgeProps {
  snapshotCount: number;
  hasInsufficientEvidence: boolean;
}

export function EvidenceCoherenceBadge({ snapshotCount, hasInsufficientEvidence }: EvidenceCoherenceBadgeProps) {
  let icon: React.ReactNode;
  let label: string;
  let variant: "default" | "secondary" | "outline" | "destructive" = "outline";
  let className = "";

  if (snapshotCount > 0 && !hasInsufficientEvidence) {
    icon = <CheckCircle className="w-3 h-3 mr-1" />;
    label = "Evidência vinculada";
    className = "bg-green-500/10 text-green-700 border-green-200";
  } else if (hasInsufficientEvidence) {
    icon = <AlertTriangle className="w-3 h-3 mr-1" />;
    label = "Evidência insuficiente";
    className = "text-amber-600 border-amber-300";
  } else {
    icon = <LinkIcon className="w-3 h-3 mr-1" />;
    label = "Sem evidência vinculada";
    variant = "secondary";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={variant} className={`cursor-help gap-0.5 ${className}`}>
          {icon}
          {label}
          <Info className="w-3 h-3 ml-1 opacity-60" />
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        Este indicador apenas reflete a presença de evidência publicada na biblioteca
        para o tópico selecionado. Não é recomendação de conduta.
      </TooltipContent>
    </Tooltip>
  );
}
