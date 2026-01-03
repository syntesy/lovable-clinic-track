/**
 * Status Banner - Exibe o status atual do caso REGENAPP
 */

import { AlertCircle, CheckCircle2, Clock, AlertTriangle, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  RegenCaseStatus, 
  REGEN_CASE_STATUS_MAP 
} from "@/types/regen-case-status";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StatusBannerProps {
  status: RegenCaseStatus;
  engineComputedAt?: string | null;
  isStale?: boolean;
  onRecalculate?: () => void;
}

export function StatusBanner({ 
  status, 
  engineComputedAt,
  isStale = false,
  onRecalculate
}: StatusBannerProps) {
  const statusInfo = REGEN_CASE_STATUS_MAP[status];
  
  const getIcon = () => {
    switch (status) {
      case "S0": return <Clock className="h-5 w-5" />;
      case "S1": return <AlertTriangle className="h-5 w-5" />;
      case "S2": return <CheckCircle2 className="h-5 w-5" />;
      case "S3": return <Shield className="h-5 w-5" />;
    }
  };
  
  const getVariant = (): "default" | "destructive" => {
    if (isStale) return "destructive";
    return "default";
  };
  
  const getBgClass = () => {
    if (isStale) return "border-orange-500 bg-orange-50 dark:bg-orange-950/20";
    switch (statusInfo.color) {
      case "blue": return "border-blue-500 bg-blue-50 dark:bg-blue-950/20";
      case "yellow": return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
      case "green": return "border-green-500 bg-green-50 dark:bg-green-950/20";
      case "red": return "border-primary bg-primary/5";
    }
  };
  
  const getTextClass = () => {
    if (isStale) return "text-orange-700 dark:text-orange-300";
    switch (statusInfo.color) {
      case "blue": return "text-blue-700 dark:text-blue-300";
      case "yellow": return "text-yellow-700 dark:text-yellow-300";
      case "green": return "text-green-700 dark:text-green-300";
      case "red": return "text-primary";
    }
  };

  return (
    <Alert className={`${getBgClass()} border-2`}>
      <div className={getTextClass()}>
        {getIcon()}
      </div>
      <AlertTitle className={`font-bold ${getTextClass()}`}>
        {isStale ? "RESULTADO DESATUALIZADO" : statusInfo.label}
        {status === "S3" && engineComputedAt && !isStale && (
          <span className="font-normal text-sm ml-2">
            — {format(new Date(engineComputedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        )}
      </AlertTitle>
      <AlertDescription className={getTextClass()}>
        {isStale ? (
          <div className="flex flex-col gap-1">
            <span>
              Resultado desatualizado. Dados foram alterados após a geração do score.
              Recalcule para atualizar.
            </span>
            {onRecalculate && (
              <button 
                onClick={onRecalculate}
                className="underline font-medium hover:no-underline text-left w-fit"
              >
                Recalcular Resultado
              </button>
            )}
          </div>
        ) : (
          statusInfo.description || statusInfo.provisionalLabel
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Banner Jurídico Fixo
 */
export function LegalDisclaimer() {
  return (
    <Alert className="bg-muted/50 border-muted-foreground/20">
      <AlertCircle className="h-4 w-4 text-muted-foreground" />
      <AlertDescription className="text-xs text-muted-foreground">
        <strong>AVISO LEGAL:</strong> O REGENAPP é um sistema de suporte informacional. 
        Não prescreve, não decide e não substitui o julgamento clínico. 
        O score definitivo só é gerado após avaliação profissional e exames laboratoriais válidos.
      </AlertDescription>
    </Alert>
  );
}