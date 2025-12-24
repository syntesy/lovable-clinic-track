import { Badge } from "@/components/ui/badge";
import { CuradoriaStatus, statusConfig } from "@/types/curadoria";
import { Sparkles, Clock, Search, Loader2, CheckCircle, XCircle } from "lucide-react";

interface CuradoriaStatusBadgeProps {
  status: CuradoriaStatus;
  showIcon?: boolean;
  className?: string;
}

const statusIcons: Record<CuradoriaStatus, React.ReactNode> = {
  sem_curadoria: null,
  solicitada: <Clock className="h-3 w-3" />,
  em_analise: <Search className="h-3 w-3" />,
  em_producao: <Loader2 className="h-3 w-3" />,
  disponivel: <Sparkles className="h-3 w-3" />,
  indeferida: <XCircle className="h-3 w-3" />,
};

export function CuradoriaStatusBadge({ status, showIcon = true, className = "" }: CuradoriaStatusBadgeProps) {
  const config = statusConfig[status];
  const icon = statusIcons[status];

  return (
    <Badge className={`${config.color} border gap-1 ${className}`}>
      {showIcon && icon}
      {config.label}
    </Badge>
  );
}
