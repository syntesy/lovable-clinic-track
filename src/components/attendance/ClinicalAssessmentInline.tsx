import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
  attendanceId,
  patientId,
  clinicalRecord,
  isClosed,
  isBusy,
  onEnsureRecord,
  onSaved,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Track if we've already auto-opened to prevent loops
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Sync form when record changes
  useEffect(() => {
    if (!clinicalRecord) return;

    setChiefComplaint(clinicalRecord.chief_complaint ?? "");
    setAnamnesis(clinicalRecord.anamnesis ?? "");
    setPhysicalExam(clinicalRecord.physical_exam ?? "");
    setClinicalDiagnosis(clinicalRecord.clinical_diagnosis ?? "");

    // Auto-open editor for brand new/empty record (runs once)
    if (!hasAutoOpened && !isClosed) {
      const hasAny =
        !!clinicalRecord.chief_complaint?.trim() ||
        !!clinicalRecord.anamnesis?.trim() ||
        !!clinicalRecord.physical_exam?.trim() ||
        !!clinicalRecord.clinical_diagnosis?.trim();

      if (!hasAny) {
        setIsEditing(true);
        setHasAutoOpened(true);
      }
    }
  }, [clinicalRecord, isClosed, hasAutoOpened]);

  const handleSave = async () => {
    if (!clinicalRecord) return;
    if (isClosed) return;

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
      await onSaved();
      setIsEditing(false);
    } catch (e) {
      toast.error("Erro ao salvar avaliação clínica");
    } finally {
      setIsSaving(false);
    }
  };

  // If no record yet, auto-create immediately (don't wait for user click)
  useEffect(() => {
    if (clinicalRecord) {
      console.log("[ClinicalAssessmentInline] Record exists:", clinicalRecord.id);
      return; // already have it
    }
    if (isClosed) {
      console.log("[ClinicalAssessmentInline] Closed, skipping create");
      return;
    }
    if (isBusy) {
      console.log("[ClinicalAssessmentInline] Already busy creating...");
      return; // already creating
    }

    // Trigger creation automatically
    console.log("[ClinicalAssessmentInline] Triggering auto-create...");
    onEnsureRecord();
  }, [clinicalRecord, isClosed, isBusy, onEnsureRecord]);

  if (!clinicalRecord) {
    // Show loading state while creating/fetching
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Preparando avaliação clínica...</span>
        </div>
      </div>
    );
  }

  if (isClosed || !isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground">Queixa Principal</Label>
          <p className="mt-1">{clinicalRecord.chief_complaint || "Não informado"}</p>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Anamnese</Label>
          <p className="mt-1 whitespace-pre-wrap">{clinicalRecord.anamnesis || "Não informado"}</p>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Exame Físico</Label>
          <p className="mt-1 whitespace-pre-wrap">{clinicalRecord.physical_exam || "Não informado"}</p>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Diagnóstico Clínico</Label>
          <p className="mt-1">{clinicalRecord.clinical_diagnosis || "Não informado"}</p>
        </div>

        {!isClosed && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Editar Avaliação Clínica
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Queixa Principal</Label>
        <Textarea value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} className="min-h-[70px]" />
      </div>
      <div className="space-y-2">
        <Label>Anamnese</Label>
        <Textarea value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} className="min-h-[140px]" />
      </div>
      <div className="space-y-2">
        <Label>Exame Físico</Label>
        <Textarea value={physicalExam} onChange={(e) => setPhysicalExam(e.target.value)} className="min-h-[120px]" />
      </div>
      <div className="space-y-2">
        <Label>Diagnóstico Clínico</Label>
        <Textarea value={clinicalDiagnosis} onChange={(e) => setClinicalDiagnosis(e.target.value)} className="min-h-[80px]" />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
          Cancelar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Atendimento: {attendanceId}
      </p>
    </div>
  );
}
