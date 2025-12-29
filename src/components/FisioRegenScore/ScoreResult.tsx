import { ComputedResult, FisioRegenFormData } from "@/types/fisioregen-score";
import { ScoreReport } from "@/components/ScoreReport";

interface ScoreResultProps {
  result: ComputedResult;
  formData: FisioRegenFormData;
  patientName?: string;
  onReset: () => void;
  onSaveToPatientPortal?: (procedure: string | null) => Promise<void>;
}

export function ScoreResult({ 
  result, 
  formData, 
  patientName,
  onReset,
  onSaveToPatientPortal
}: ScoreResultProps) {
  return (
    <div className="container mx-auto py-6 px-4">
      <ScoreReport
        result={result}
        formData={formData}
        patientName={patientName}
        onReset={onReset}
        onSaveToPatientPortal={onSaveToPatientPortal}
        isProfessionalView={true}
      />
    </div>
  );
}
