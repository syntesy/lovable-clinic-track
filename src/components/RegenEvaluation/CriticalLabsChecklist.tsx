/**
 * Checklist Visual de Exames Críticos
 * 
 * Componente somente leitura que mostra status de cada exame crítico.
 * Derivado do estado atual — NÃO ALTERA DADOS.
 */

import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock
} from "lucide-react";
import { 
  REQUIRED_CRITICAL_LABS, 
  CRITICAL_LAB_LABELS,
  ValidatedLabData,
  getLabValidationDetails
} from "@/types/regen-case-status";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CriticalLabsChecklistProps {
  labsValidated: Record<string, ValidatedLabData> | null;
  showStaleDate?: string | null;
}

export function CriticalLabsChecklist({ 
  labsValidated,
  showStaleDate 
}: CriticalLabsChecklistProps) {
  const validationDetails = getLabValidationDetails(labsValidated);

  const getStatusInfo = (labKey: string) => {
    const details = validationDetails[labKey];
    const labData = labsValidated?.[labKey];
    
    // Caso 1: Não inserido (pendente)
    if (!details || !labData) {
      return {
        status: "pending" as const,
        icon: AlertTriangle,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
        label: "Pendente",
        tooltip: "Exame ainda não foi inserido no sistema"
      };
    }

    // Caso 2: Válido (valor + data + USE)
    if (details.isValid) {
      return {
        status: "valid" as const,
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
        label: "Válido",
        tooltip: `Valor: ${labData.value} | Data: ${labData.date ? format(new Date(labData.date), "dd/MM/yyyy", { locale: ptBR }) : "-"}`
      };
    }

    // Caso 3: Desatualizado (STALE) - tem valor e data mas status não é USE
    if (labData.value !== null && labData.value !== undefined && 
        labData.date !== null && labData.date !== undefined && labData.date !== "" &&
        labData.status !== "USE") {
      return {
        status: "stale" as const,
        icon: Clock,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/20",
        label: "Desatualizado",
        tooltip: "Exame precisa ser atualizado (fora da janela de validade ou valor inadequado)"
      };
    }

    // Caso 4: Pendente (falta valor ou data)
    const missing = [];
    if (details.missingValue) missing.push("valor");
    if (details.missingDate) missing.push("data");
    
    return {
      status: "pending" as const,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      label: "Pendente",
      tooltip: missing.length > 0 ? `Faltando: ${missing.join(", ")}` : "Dados incompletos"
    };
  };

  const validCount = Object.values(validationDetails).filter(d => d.isValid).length;
  const totalCount = REQUIRED_CRITICAL_LABS.length;

  return (
    <div className="space-y-3">
      {/* Header com progresso */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Exames Críticos</span>
        <Badge variant={validCount === totalCount ? "default" : "secondary"}>
          {validCount}/{totalCount} válidos
        </Badge>
      </div>

      {/* STALE Banner */}
      {showStaleDate && (
        <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded text-sm">
          <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
          <span className="text-orange-700 dark:text-orange-300">
            Exames desatualizados (coletados em {format(new Date(showStaleDate), "dd/MM/yyyy", { locale: ptBR })}).
            Atualize os exames para prosseguir.
          </span>
        </div>
      )}

      {/* Lista de exames */}
      <div className="grid gap-2">
        {REQUIRED_CRITICAL_LABS.map(labKey => {
          const info = getStatusInfo(labKey);
          const Icon = info.icon;
          
          return (
            <Tooltip key={labKey}>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-2 p-2 rounded ${info.bgColor}`}>
                  <Icon className={`h-4 w-4 ${info.color} flex-shrink-0`} />
                  <span className="text-sm flex-1">{CRITICAL_LAB_LABELS[labKey]}</span>
                  <Badge variant="outline" className={`text-xs ${info.color}`}>
                    {info.label}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                {info.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Legenda - apenas 3 estados */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span>Válido</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-yellow-600" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-orange-600" />
          <span>Desatualizado</span>
        </div>
      </div>
    </div>
  );
}
