/**
 * Dynamic Labs Checklist - Checklist visual de exames vindos da triagem
 * 
 * REGRA: Mostra apenas os exames definidos pela Triagem de Ortobiológicos.
 * Componente somente leitura - NÃO ALTERA DADOS.
 */

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TriageExamItem, areAllCriticalExamsValid, getCriticalExams } from "@/types/triage-exams";

interface DynamicLabsChecklistProps {
  triageExams: TriageExamItem[];
  labsValidated?: Record<string, { status: string; value?: number | null; date?: string | null }> | null;
  showStaleDate?: string | null;
}

export function DynamicLabsChecklist({ 
  triageExams,
  labsValidated,
  showStaleDate 
}: DynamicLabsChecklistProps) {
  
  // Estado vazio: nenhuma triagem
  if (triageExams.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Nenhuma triagem de ortobiológicos encontrada para este paciente.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusInfo = (exam: TriageExamItem) => {
    const validation = labsValidated?.[exam.code];
    
    // Caso 1: Pendente (sem dados)
    if (exam.status === "pendente" || !validation) {
      return {
        status: "pending" as const,
        icon: AlertTriangle,
        color: "text-yellow-600",
        bgColor: exam.is_critical 
          ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800" 
          : "bg-yellow-50 dark:bg-yellow-950/20",
        label: "Pendente",
        tooltip: exam.is_critical 
          ? "Exame CRÍTICO ainda não foi inserido" 
          : "Exame ainda não foi inserido"
      };
    }

    // Caso 2: Válido
    if (exam.status === "válido") {
      return {
        status: "valid" as const,
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
        label: "Válido",
        tooltip: `Valor: ${validation.value ?? '-'} | Data: ${
          validation.date 
            ? format(new Date(validation.date), "dd/MM/yyyy", { locale: ptBR }) 
            : exam.collected_at 
              ? format(new Date(exam.collected_at), "dd/MM/yyyy", { locale: ptBR })
              : "-"
        }`
      };
    }

    // Caso 3: Desatualizado
    if (exam.status === "desatualizado") {
      return {
        status: "stale" as const,
        icon: Clock,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/20",
        label: "Desatualizado",
        tooltip: "Exame precisa ser atualizado (fora da validade ou valor inadequado)"
      };
    }

    // Fallback: Pendente
    return {
      status: "pending" as const,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      label: "Pendente",
      tooltip: "Dados incompletos"
    };
  };

  const criticalExams = getCriticalExams(triageExams);
  const allCriticalValid = areAllCriticalExamsValid(triageExams);
  const validCriticalCount = criticalExams.filter(e => e.status === "válido").length;

  return (
    <div className="space-y-3">
      {/* Header com progresso */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Exames Críticos ({criticalExams.length} da triagem)
        </span>
        <Badge variant={allCriticalValid ? "default" : "secondary"}>
          {validCriticalCount}/{criticalExams.length} válidos
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

      {/* Lista de exames (apenas críticos no checklist) */}
      <div className="grid gap-2">
        {criticalExams.map(exam => {
          const info = getStatusInfo(exam);
          const Icon = info.icon;
          
          return (
            <Tooltip key={exam.code}>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-2 p-2 rounded ${info.bgColor}`}>
                  <Icon className={`h-4 w-4 ${info.color} flex-shrink-0`} />
                  <span className="text-sm flex-1">{exam.label}</span>
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

      {/* Exames opcionais resumo */}
      {triageExams.filter(e => !e.is_critical).length > 0 && (
        <div className="text-xs text-muted-foreground pt-1">
          + {triageExams.filter(e => !e.is_critical).length} exames complementares
        </div>
      )}

      {/* Legenda */}
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
