/**
 * Mapa Visual de Ações por Estado
 * 
 * Componente somente leitura que mostra ações permitidas/bloqueadas por estado.
 * Derivado dinamicamente de getAllowedActions() — NÃO USA HARDCODE.
 */

import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  ClipboardList, 
  FileText, 
  Zap, 
  RefreshCw 
} from "lucide-react";
import { 
  RegenCaseStatus, 
  getAllowedActions,
  REGEN_CASE_STATUS_MAP
} from "@/types/regen-case-status";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

const STATES: RegenCaseStatus[] = ["S0", "S1", "S2", "S3"];

const ACTIONS = [
  { key: "canGenerateExamRequest", label: "Solicitar Exames", icon: ClipboardList },
  { key: "canGeneratePreReport", label: "Pré-Relatório", icon: FileText },
  { key: "canGenerateDefinitiveScore", label: "Score Definitivo", icon: Zap },
  { key: "canRecalculate", label: "Recalcular", icon: RefreshCw },
] as const;

interface ActionStateMapProps {
  compact?: boolean;
}

export function ActionStateMap({ compact = false }: ActionStateMapProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        {STATES.map(status => {
          const actions = getAllowedActions(status);
          const info = REGEN_CASE_STATUS_MAP[status];
          const enabledCount = Object.values(actions).filter(Boolean).length;
          
          return (
            <div key={status} className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="font-mono w-8 justify-center">{status}</Badge>
              <span className="text-muted-foreground flex-1 truncate">{info.label}</span>
              <span className="text-xs text-muted-foreground">{enabledCount}/4</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 font-medium">Estado</th>
            {ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <th key={action.key} className="text-center p-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-1">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-medium">{action.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {action.label}
                    </TooltipContent>
                  </Tooltip>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {STATES.map(status => {
            const actions = getAllowedActions(status);
            const info = REGEN_CASE_STATUS_MAP[status];
            const colorMap = {
              blue: "bg-blue-50 dark:bg-blue-950/20",
              yellow: "bg-yellow-50 dark:bg-yellow-950/20",
              green: "bg-green-50 dark:bg-green-950/20",
              red: "bg-primary/5"
            };
            
            return (
              <tr key={status} className={`border-b ${colorMap[info.color]}`}>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{status}</Badge>
                    <span className="text-muted-foreground text-xs hidden md:inline">
                      {info.label}
                    </span>
                  </div>
                </td>
                {ACTIONS.map(action => {
                  const allowed = actions[action.key as keyof typeof actions];
                  return (
                    <td key={action.key} className="text-center p-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {allowed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {allowed 
                            ? `${action.label} disponível em ${status}`
                            : `${action.label} bloqueado em ${status}. Disponível apenas após avaliação clínica + exames válidos (S2).`
                          }
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
