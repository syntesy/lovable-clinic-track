/**
 * @deprecated Este componente está DESATIVADO.
 * 
 * NÃO UTILIZAR - Os campos clínicos agora são editados APENAS no Prontuário Clínico.
 * A Avaliação REGENAPP usa ClinicalAssessmentChecklist (read-only) em vez deste form.
 * 
 * Se este componente for usado, ele ainda tentará escrever em prp_screenings.clinical_*,
 * o que viola a regra de FONTE ÚNICA (clinical_records).
 * 
 * Mantido apenas para referência histórica. Será removido em versão futura.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Stethoscope, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isClinicalAssessmentComplete } from "@/types/regen-case-status";

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

export function ClinicalAssessmentForm({
  screeningId,
  initialData,
  onSave,
  disabled = false
}: ClinicalAssessmentFormProps) {
  const [chiefComplaint, setChiefComplaint] = useState(initialData?.clinical_chief_complaint || "");
  const [anamnesis, setAnamnesis] = useState(initialData?.clinical_anamnesis || "");
  const [physicalExam, setPhysicalExam] = useState(initialData?.clinical_physical_exam || "");
  const [diagnosis, setDiagnosis] = useState(initialData?.clinical_diagnosis || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isComplete = isClinicalAssessmentComplete({
    clinical_chief_complaint: chiefComplaint,
    clinical_anamnesis: anamnesis,
    clinical_physical_exam: physicalExam,
    clinical_diagnosis: diagnosis
  });

  // Track changes
  useEffect(() => {
    const changed = 
      chiefComplaint !== (initialData?.clinical_chief_complaint || "") ||
      anamnesis !== (initialData?.clinical_anamnesis || "") ||
      physicalExam !== (initialData?.clinical_physical_exam || "") ||
      diagnosis !== (initialData?.clinical_diagnosis || "");
    setHasChanges(changed);
  }, [chiefComplaint, anamnesis, physicalExam, diagnosis, initialData]);

  const handleSave = async () => {
    if (!screeningId) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: Record<string, unknown> = {
        clinical_chief_complaint: chiefComplaint.trim() || null,
        clinical_anamnesis: anamnesis.trim() || null,
        clinical_physical_exam: physicalExam.trim() || null,
        clinical_diagnosis: diagnosis.trim() || null,
        canonical_updated_at: new Date().toISOString()
      };
      
      // Se a avaliação clínica está completa, marca o timestamp
      if (isComplete && !initialData?.clinical_assessment_completed_at) {
        updateData.clinical_assessment_completed_at = new Date().toISOString();
        updateData.clinical_assessment_by = user?.id || null;
        updateData.regen_case_status = "S1";
      }
      
      const { error } = await supabase
        .from("prp_screenings")
        .update(updateData)
        .eq("id", screeningId);
      
      if (error) throw error;
      
      toast.success("Avaliação clínica salva com sucesso");
      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error("Error saving clinical assessment:", error);
      toast.error("Erro ao salvar avaliação clínica");
    } finally {
      setIsSaving(false);
    }
  };

  const completedAt = initialData?.clinical_assessment_completed_at;

  return (
    <Card className={completedAt ? "border-green-500/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Prontuário do Profissional
              {completedAt && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </CardTitle>
            <CardDescription>
              {completedAt 
                ? "Avaliação clínica concluída" 
                : "Preencha todos os campos para concluir a avaliação clínica"}
            </CardDescription>
          </div>
          {!isComplete && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              OBRIGATÓRIO
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chief-complaint" className="flex items-center gap-2">
            Queixa Principal
            {!chiefComplaint.trim() && <span className="text-destructive text-xs">*</span>}
          </Label>
          <Textarea
            id="chief-complaint"
            placeholder="Descreva a queixa principal do paciente..."
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            disabled={disabled}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="anamnesis" className="flex items-center gap-2">
            Anamnese
            {!anamnesis.trim() && <span className="text-destructive text-xs">*</span>}
          </Label>
          <Textarea
            id="anamnesis"
            placeholder="Histórico clínico, antecedentes, evolução..."
            value={anamnesis}
            onChange={(e) => setAnamnesis(e.target.value)}
            disabled={disabled}
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="physical-exam" className="flex items-center gap-2">
            Exame Físico
            {!physicalExam.trim() && <span className="text-destructive text-xs">*</span>}
          </Label>
          <Textarea
            id="physical-exam"
            placeholder="Achados do exame físico..."
            value={physicalExam}
            onChange={(e) => setPhysicalExam(e.target.value)}
            disabled={disabled}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosis" className="flex items-center gap-2">
            Diagnóstico
            {!diagnosis.trim() && <span className="text-destructive text-xs">*</span>}
          </Label>
          <Textarea
            id="diagnosis"
            placeholder="Diagnóstico clínico..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            disabled={disabled}
            className="min-h-[80px]"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {isComplete ? (
              <span className="text-green-600">✓ Todos os campos preenchidos</span>
            ) : (
              <span className="text-yellow-600">Preencha todos os campos obrigatórios</span>
            )}
          </div>
          <Button 
            onClick={handleSave} 
            disabled={disabled || isSaving || !hasChanges}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Salvando..." : "Salvar Avaliação Clínica"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}