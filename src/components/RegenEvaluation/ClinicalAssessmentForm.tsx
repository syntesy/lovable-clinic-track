/**
 * @deprecated Este componente foi REMOVIDO do fluxo.
 * 
 * NÃO UTILIZAR - Os campos clínicos agora são editados APENAS no Prontuário Clínico.
 * A Avaliação REGENAPP usa ClinicalAssessmentChecklist (read-only) em vez deste form.
 * 
 * Este arquivo é mantido apenas para evitar erros de import em código legado.
 * Todas as funcionalidades foram desativadas - não há mais escrita em prp_screenings.clinical_*.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, AlertTriangle } from "lucide-react";

interface ClinicalAssessmentFormProps {
  screeningId: string;
  initialData?: {
    clinical_chief_complaint?: string | null;
    clinical_anamnesis?: string | null;
    clinical_physical_exam?: string | null;
    clinical_diagnosis?: string | null;
    clinical_assessment_completed_at?: string | null;
  };
  onSave?: () => void;
  disabled?: boolean;
}

/**
 * @deprecated Use ClinicalAssessmentChecklist instead
 * Este componente não executa mais nenhuma operação de escrita.
 */
export function ClinicalAssessmentForm({
  screeningId,
  initialData,
  onSave,
  disabled = false
}: ClinicalAssessmentFormProps) {
  // COMPONENTE DESATIVADO - Apenas exibe aviso
  console.warn("[DEPRECATED] ClinicalAssessmentForm foi chamado mas está desativado. Use ClinicalAssessmentChecklist.");
  
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Componente Desativado
        </CardTitle>
        <CardDescription>
          Este formulário foi substituído pelo Prontuário Clínico.
          Use o ClinicalAssessmentChecklist para visualização.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Os campos clínicos agora são editados apenas no Prontuário Clínico (fonte única).
        </p>
      </CardContent>
    </Card>
  );
}
