/**
 * Dynamic Labs Checklist - Checklist visual de exames vindos da triagem
 * 
 * REGRA: Mostra apenas os exames definidos pela Triagem de Ortobiológicos.
 * Componente somente leitura - NÃO ALTERA DADOS.
 * 
 * UX FINAL:
 * - Badge S2 no topo (APTO/PENDENTE/INDISPONÍVEL)
 * - Microlegendas por exame (CRÍTICO, DESATUALIZADO, PENDENTE, VÁLIDO)
 * - Resumo automático de exames
 */

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Info,
  Shield,
  ShieldAlert,
  ShieldX
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { formatInTimeZone } from "date-fns-tz";
import { TriageExamItem, areAllCriticalExamsValid, getCriticalExams, hasTriageExams } from "@/types/triage-exams";

const SAO_PAULO_TZ = "America/Sao_Paulo";

interface DynamicLabsChecklistProps {
  triageExams: TriageExamItem[];
  labsValidated?: Record<string, { status: string; value?: number | null; date?: string | null }> | null;
  showStaleDate?: string | null;
}

/**
 * Badge S2 Component - Exibe status de aptidão para Score Definitivo
 */
function S2StatusBadge({ triageExams }: { triageExams: TriageExamItem[] }) {
  // Sem triagem = indisponível
  if (!hasTriageExams(triageExams)) {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground border-muted">
        <ShieldX className="h-3.5 w-3.5" />
        S2: INDISPONÍVEL
      </Badge>
    );
  }

  const allCriticalValid = areAllCriticalExamsValid(triageExams);

  if (allCriticalValid) {
    return (
      <Badge className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
        <Shield className="h-3.5 w-3.5" />
        S2: APTO
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700">
      <ShieldAlert className="h-3.5 w-3.5" />
      S2: PENDENTE
    </Badge>
  );
}

/**
 * Resumo de exames - linha única
 */
function ExamsSummary({ triageExams }: { triageExams: TriageExamItem[] }) {
  if (!hasTriageExams(triageExams)) return null;

  const criticalExams = getCriticalExams(triageExams);
  const optionalExams = triageExams.filter(e => !e.is_critical);

  const validCritical = criticalExams.filter(e => e.status === "válido").length;
  const validOptional = optionalExams.filter(e => e.status === "válido").length;

  const parts: string[] = [];
  
  if (criticalExams.length > 0) {
    parts.push(`Críticos: ${validCritical} válidos de ${criticalExams.length}`);
  }
  
  if (optionalExams.length > 0) {
    parts.push(`Opcionais: ${validOptional} de ${optionalExams.length}`);
  }

  return (
    <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
      {parts.join(" · ")}
    </div>
  );
}

/**
 * Microlegenda por exame
 */
function ExamMicroBadges({ exam }: { exam: TriageExamItem }) {
  return (
    <div className="flex flex-wrap gap-1">
      {/* Badge CRÍTICO */}
      {exam.is_critical && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700">
              CRÍTICO
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            Necessário para avançar no preparo.
          </TooltipContent>
        </Tooltip>
      )}

      {/* Badge DESATUALIZADO */}
      {exam.status === "desatualizado" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700">
              DESATUALIZADO
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            Coletado há mais de 90 dias — repetir exame.
          </TooltipContent>
        </Tooltip>
      )}

      {/* Badge PENDENTE */}
      {exam.status === "pendente" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700">
              PENDENTE
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            Aguardando inserção do resultado.
          </TooltipContent>
        </Tooltip>
      )}

      {/* Badge VÁLIDO (discreto) */}
      {exam.status === "válido" && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700">
          <CheckCircle2 className="h-3 w-3 mr-0.5" />
          OK
        </Badge>
      )}
    </div>
  );
}

export function DynamicLabsChecklist({ 
  triageExams,
  labsValidated,
  showStaleDate 
}: DynamicLabsChecklistProps) {
  
  // Estado vazio: nenhuma triagem
  if (!hasTriageExams(triageExams)) {
    return (
      <div className="space-y-3">
        {/* Badge S2 mesmo sem triagem */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status de Aptidão</span>
          <S2StatusBadge triageExams={triageExams} />
        </div>
        
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Nenhuma triagem de ortobiológicos encontrada.</strong>
            <br />
            <span className="text-sm">
              Crie uma triagem de ortobiológicos para definir os exames.
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return formatInTimeZone(new Date(dateStr), SAO_PAULO_TZ, "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

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
            ? formatDate(validation.date) 
            : exam.collected_at 
              ? formatDate(exam.collected_at)
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

  return (
    <div className="space-y-3">
      {/* Header com Badge S2 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Checklist de Exames
        </span>
        <S2StatusBadge triageExams={triageExams} />
      </div>

      {/* Resumo automático */}
      <ExamsSummary triageExams={triageExams} />

      {/* Mensagem de bloqueio S2 pendente */}
      {!allCriticalValid && criticalExams.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-sm">
          <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-amber-700 dark:text-amber-300">
            Preencha e valide todos os exames críticos para avançar.
          </span>
        </div>
      )}

      {/* STALE Banner */}
      {showStaleDate && (
        <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded text-sm">
          <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
          <span className="text-orange-700 dark:text-orange-300">
            Exames desatualizados (coletados em {formatDate(showStaleDate)}).
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
                  <ExamMicroBadges exam={exam} />
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
