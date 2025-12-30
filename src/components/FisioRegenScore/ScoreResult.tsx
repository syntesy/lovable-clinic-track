import { ComputedResult, FisioRegenFormData } from "@/types/fisioregen-score";
import { ScoreReport } from "@/components/ScoreReport";
import { useRegistryConsent } from "@/hooks/useRegistryConsent";
import { RegistryEligibilityBadge } from "@/components/registry/RegistryEligibilityBadge";

interface ScoreResultProps {
  result: ComputedResult;
  formData: FisioRegenFormData;
  patientName?: string;
  patientId?: string;
  onReset: () => void;
  onSaveToPatientPortal?: (procedure: string | null) => Promise<void>;
}

export function ScoreResult({ 
  result, 
  formData, 
  patientName,
  patientId,
  onReset,
  onSaveToPatientPortal
}: ScoreResultProps) {
  // Registry: Verifica se caso é elegível para exibir badge discreto
  const { isEligible } = useRegistryConsent(patientId);
  
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Registry: Badge discreto se elegível */}
      {isEligible && (
        <div className="mb-4 flex justify-end">
          <RegistryEligibilityBadge isEligible={isEligible} />
        </div>
      )}
      
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
