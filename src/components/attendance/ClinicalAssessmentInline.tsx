import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ClinicalRecordBasic } from "@/services/clinicalRecordsService";

type Props = {
  attendanceId: string;
  patientId: string;
  clinicalRecord: ClinicalRecordBasic | null | undefined;
  isClosed: boolean;
  isBusy: boolean;
  onEnsureRecord: () => Promise<void>;
  onSaved: () => Promise<void>;
};

export function ClinicalAssessmentInline({
  attendanceId: _attendanceId,
  patientId,
  clinicalRecord,
  isClosed,
  isBusy,
  onEnsureRecord,
  onSaved,
}: Props) {
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sync fields when record loads
  useEffect(() => {
    if (!clinicalRecord) return;
    setChiefComplaint(clinicalRecord.chief_complaint ?? "");
    setAnamnesis(clinicalRecord.anamnesis ?? "");
    setPhysicalExam(clinicalRecord.physical_exam ?? "");
    setClinicalDiagnosis(clinicalRecord.clinical_diagnosis ?? "");
  }, [clinicalRecord]);

  // Auto-create record if missing
  useEffect(() => {
    if (clinicalRecord || isClosed || isBusy) return;
    onEnsureRecord();
  }, [clinicalRecord, isClosed, isBusy, onEnsureRecord]);

  const handleSave = async () => {
    if (!clinicalRecord || isClosed) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("clinical_records")
        .update({
          chief_complaint: chiefComplaint.trim() || null,
          anamnesis: anamnesis.trim() || null,
          physical_exam: physicalExam.trim() || null,
          clinical_diagnosis: clinicalDiagnosis.trim() || null,
        })
        .eq("id", clinicalRecord.id)
        .eq("patient_id", patientId);

      if (error) throw error;

      toast.success("Avaliação clínica salva");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      await onSaved();
    } catch {
      toast.error("Erro ao salvar avaliação clínica");
    } finally {
      setIsSaving(false);
    }
  };

  if (!clinicalRecord) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Preparando avaliação clínica...</span>
      </div>
    );
  }

  // Read-only view when closed
  if (isClosed) {
    return (
      <div className="space-y-5">
        <FieldView label="Queixa Principal" value={clinicalRecord.chief_complaint} />
        <FieldView label="Anamnese" value={clinicalRecord.anamnesis} multiline />
        <FieldView label="Exame Físico" value={clinicalRecord.physical_exam} multiline />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Row 1: Queixa Principal */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Queixa Principal</Label>
        <Textarea
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="Descreva a queixa principal do paciente..."
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Row 2: Anamnese (long) */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Anamnese</Label>
        <Textarea
          value={anamnesis}
          onChange={(e) => setAnamnesis(e.target.value)}
          placeholder="História clínica detalhada, início dos sintomas, fatores agravantes e atenuantes, medicamentos em uso..."
          className="min-h-[120px] resize-y"
        />
      </div>

      {/* Row 3: Exame Físico */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Exame Físico</Label>
        <Textarea
          value={physicalExam}
          onChange={(e) => setPhysicalExam(e.target.value)}
          placeholder="Achados ao exame físico, testes ortopédicos, mobilidade, dor à palpação..."
          className="min-h-[100px] resize-y"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={cn("gap-2 transition-colors", isSaved && "bg-green-600 hover:bg-green-700")}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
          ) : isSaved ? (
            <><CheckCircle2 className="w-4 h-4" />Salvo!</>
          ) : (
            <><Save className="w-4 h-4" />Salvar Avaliação</>
          )}
        </Button>
      </div>
    </div>
  );
}

function FieldView({ label, value, multiline }: { label: string; value: string | null | undefined; multiline?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-sm text-foreground", multiline && "whitespace-pre-wrap")}>
        {value?.trim() || <span className="text-muted-foreground italic">Não informado</span>}
      </p>
    </div>
  );
}
