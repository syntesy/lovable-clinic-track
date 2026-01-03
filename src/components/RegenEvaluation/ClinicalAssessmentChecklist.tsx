/**
 * Clinical Assessment Checklist - Read-only panel
 * 
 * Shows completion status of clinical fields (source: Prontuário Clínico)
 * Provides CTA to navigate to Prontuário Clínico for editing
 * 
 * REGRA: Avaliação REGENAPP NÃO edita esses campos, apenas exibe status
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  AlertTriangle 
} from "lucide-react";

interface ClinicalAssessmentChecklistProps {
  patientId: string;
  clinicalData: {
    clinical_chief_complaint?: string | null;
    clinical_anamnesis?: string | null;
    clinical_physical_exam?: string | null;
    clinical_diagnosis?: string | null;
  };
  disabled?: boolean;
}

interface ChecklistItem {
  key: keyof ClinicalAssessmentChecklistProps["clinicalData"];
  label: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: "clinical_chief_complaint", label: "Queixa principal" },
  { key: "clinical_anamnesis", label: "Anamnese" },
  { key: "clinical_physical_exam", label: "Exame físico" },
  { key: "clinical_diagnosis", label: "Diagnóstico" }
];

/**
 * Regra objetiva de completude (determinística)
 * Considerar "completo" se: campo != null e String(campo).trim().length > 0
 */
function isFieldComplete(value: string | null | undefined): boolean {
  return value != null && String(value).trim().length > 0;
}

export function ClinicalAssessmentChecklist({
  patientId,
  clinicalData,
  disabled = false
}: ClinicalAssessmentChecklistProps) {
  const navigate = useNavigate();

  // Check each field completion status
  const fieldStatuses = CHECKLIST_ITEMS.map(item => ({
    ...item,
    isComplete: isFieldComplete(clinicalData[item.key])
  }));

  const allComplete = fieldStatuses.every(f => f.isComplete);
  const incompleteCount = fieldStatuses.filter(f => !f.isComplete).length;

  // Navigate to Prontuário Clínico
  const handleNavigateToProntuario = () => {
    navigate(`/pacientes/${patientId}/prontuario`);
  };

  return (
    <div className="space-y-4">
      {/* Banner de bloqueio quando incompleto */}
      {!allComplete && !disabled && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            🔴 Avaliação clínica incompleta — Complete o prontuário clínico para liberar a Avaliação REGENAPP.
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
            {!allComplete && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                PENDENTE
              </span>
            )}
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
        </CardContent>
      </Card>
    </div>
  );
}
