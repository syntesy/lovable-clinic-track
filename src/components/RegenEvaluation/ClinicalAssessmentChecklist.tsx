/**
 * Clinical Assessment Checklist - Read-only panel
 * 
 * Lê os 4 campos clínicos EXCLUSIVAMENTE da fonte única (clinical_records)
 * NÃO lê de prp_screenings.clinical_*
 * 
 * Campos:
 * - Queixa principal: clinical_records.chief_complaint
 * - Anamnese: clinical_records.anamnesis
 * - Exame físico: clinical_records.physical_exam
 * - Diagnóstico: clinical_records.clinical_diagnosis
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useClinicalRecordMigration } from "@/hooks/useClinicalRecordMigration";

interface ClinicalAssessmentChecklistProps {
  patientId: string;
  screeningId?: string;
  disabled?: boolean;
  onCompletionChange?: (isComplete: boolean) => void;
}

interface ChecklistItem {
  key: string;
  label: string;
  value: string | null | undefined;
}

/**
 * Regra objetiva de completude (determinística)
 * Considerar "completo" se: campo != null e String(campo).trim().length > 0
 */
function isFieldComplete(value: string | null | undefined): boolean {
  return value != null && String(value).trim().length > 0;
}

export function ClinicalAssessmentChecklist({
  patientId,
  screeningId,
  disabled = false,
  onCompletionChange
}: ClinicalAssessmentChecklistProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { migrateIfNeeded } = useClinicalRecordMigration();

  // Buscar dados do clinical_records (FONTE ÚNICA)
  const { data: clinicalRecord, isLoading, refetch } = useQuery({
    queryKey: ["clinical-record-checklist", patientId],
    queryFn: async () => {
      // Primeiro, tentar migrar dados legados se necessário
      const { migrated } = await migrateIfNeeded(patientId, screeningId);
      
      if (migrated) {
        console.log("[CHECKLIST] Dados legados migrados com sucesso");
      }

      // Buscar clinical_record atualizado
      const { data, error } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("patient_id", patientId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!patientId
  });

  // Cast para acessar campos novos
  const record = clinicalRecord as Record<string, unknown> | null;

  // Montar checklist com dados do prontuário
  const checklistItems: ChecklistItem[] = [
    { 
      key: "chief_complaint", 
      label: "Queixa principal",
      value: record?.chief_complaint as string | null | undefined
    },
    { 
      key: "anamnesis", 
      label: "Anamnese",
      value: record?.anamnesis as string | null | undefined
    },
    { 
      key: "physical_exam", 
      label: "Exame físico",
      value: record?.physical_exam as string | null | undefined
    },
    { 
      key: "clinical_diagnosis", 
      label: "Diagnóstico",
      value: record?.clinical_diagnosis as string | null | undefined
    }
  ];

  const fieldStatuses = checklistItems.map(item => ({
    ...item,
    isComplete: isFieldComplete(item.value)
  }));

  const allComplete = fieldStatuses.every(f => f.isComplete);
  const incompleteCount = fieldStatuses.filter(f => !f.isComplete).length;

  // Notificar parent sobre mudança de completude
  useEffect(() => {
    onCompletionChange?.(allComplete);
  }, [allComplete, onCompletionChange]);

  // Navigate to Prontuário Clínico
  const handleNavigateToProntuario = () => {
    navigate(`/prontuario/${patientId}`);
  };

  // Refresh data
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["clinical-record-checklist", patientId] });
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner de bloqueio quando incompleto */}
      {!allComplete && !disabled && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            🔴 Avaliação clínica incompleta — Complete o prontuário clínico para liberar a Avaliação SYNTESY.
          </AlertDescription>
        </Alert>
      )}

      <Card className={allComplete ? "border-green-500/50" : "border-yellow-500/50"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Avaliação Clínica (Fonte: Prontuário Clínico)
                {allComplete && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </CardTitle>
              <CardDescription>
                {allComplete 
                  ? "Avaliação clínica concluída" 
                  : `${incompleteCount} campo(s) pendente(s) no Prontuário Clínico`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleRefresh}
                title="Atualizar dados"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              {!allComplete && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                  PENDENTE
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Checklist read-only */}
          <div className="grid gap-3">
            {fieldStatuses.map(({ key, label, isComplete }) => (
              <div 
                key={key}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isComplete 
                    ? "bg-green-500/5 border-green-500/20" 
                    : "bg-yellow-500/5 border-yellow-500/20"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                )}
                <span className={`text-sm ${isComplete ? "text-green-700 dark:text-green-300" : "text-yellow-700 dark:text-yellow-300"}`}>
                  {label}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {isComplete ? "✓ Preenchido" : "Pendente"}
                </span>
              </div>
            ))}
          </div>

          {/* CTA único - só aparece se há campos incompletos */}
          {!allComplete && !disabled && (
            <div className="pt-2">
              <Button 
                onClick={handleNavigateToProntuario}
                className="w-full gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Editar no Prontuário Clínico
              </Button>
            </div>
          )}

          {/* Mensagem de conclusão */}
          {allComplete && (
            <div className="text-sm text-green-600 dark:text-green-400 text-center pt-2">
              ✓ Todos os campos clínicos preenchidos
            </div>
          )}

          {/* Indicador de migração */}
          {record?.legacy_migrated_at && (
            <div className="text-xs text-muted-foreground text-center border-t pt-2 mt-2">
              ⚡ Dados migrados de avaliação anterior em {new Date(record.legacy_migrated_at as string).toLocaleDateString("pt-BR")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
