import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { MethodRunData } from "./steps/StepSafetyChecklist";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2 } from "lucide-react";
import { 
  ClinicalStandardFormData,
  defaultFormData,
  defaultMaterial,
  defaultChecklist,
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  isStep4Complete,
  isStep5Complete,
} from "@/types/clinical-standard";
import type { SafetyChecklistData, MaterialTraceabilityData, AdverseEventData } from "@/types/clinical-standard";
import { useSaveClinicalStandard, useFullProcedureRecord, convertRecordToFormData } from "@/hooks/useClinicalStandard";
import { Step0ProtocolSelection } from "./steps/Step0ProtocolSelection";
import { Step1ClinicalContext } from "./steps/Step1ClinicalContext";
import { Step2Severity } from "./steps/Step2Severity";
import { Step3PRPProtocol } from "./steps/Step3PRPProtocol";
import { Step4Associations } from "./steps/Step4Associations";
import { Step5CoInterventions } from "./steps/Step5CoInterventions";
import { StepSafetyChecklist } from "./steps/StepSafetyChecklist";
import { ScientificModePanel, JustificationModal } from "./ScientificModePanel";

const STEPS = [
  { title: "Protocolo", description: "Selecione o protocolo clínico" },
  { title: "Contexto Clínico", description: "Patologia e região anatômica" },
  { title: "Classificação", description: "Gravidade da condição" },
  { title: "Protocolo PRP", description: "Parâmetros do procedimento" },
  { title: "Associações", description: "Ácido hialurônico e AINEs" },
  { title: "Cointervenções", description: "Terapias associadas" },
  { title: "Segurança", description: "Checklist, material e intercorrências" },
];

interface ClinicalStandardWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string;
}

export function ClinicalStandardWizard({ 
  open, 
  onOpenChange, 
  attendanceId 
}: ClinicalStandardWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ClinicalStandardFormData>(defaultFormData);
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>("");
  const [responsibleProfessionalId, setResponsibleProfessionalId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Safety/operational state
  const [checklist, setChecklist] = useState<SafetyChecklistData>(defaultChecklist);
  const [material, setMaterial] = useState<MaterialTraceabilityData>(defaultMaterial);
  const [adverseEvent, setAdverseEvent] = useState<AdverseEventData | null>(null);
  const [adverseEventStatus, setAdverseEventStatus] = useState<"NONE" | "REPORTED">("NONE");

  // Method tracking state
  const [methodRun, setMethodRun] = useState<MethodRunData | null>(null);
  const [methodDeviation, setMethodDeviation] = useState(false);
  const [methodDeviationReason, setMethodDeviationReason] = useState("");
  // Scientific mode state
  const [scientificModeEnabled, setScientificModeEnabled] = useState(false);
  const [scientificBadgeStatus, setScientificBadgeStatus] = useState("NONE");
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [pendingJustificationSave, setPendingJustificationSave] = useState(false);
  
  const saveMutation = useSaveClinicalStandard();
  const { data: fullRecord, isLoading: isLoadingRecord } = useFullProcedureRecord(attendanceId);

  // Pre-fill form data when editing an existing record
  useEffect(() => {
    if (open && !isInitialized) {
      if (fullRecord) {
        // Edit mode: pre-fill with existing data
        const prefillData = convertRecordToFormData(fullRecord);
        setFormData(prefillData);
        setSelectedProtocolId(fullRecord.record.protocol_id || "");
        setResponsibleProfessionalId((fullRecord.record as any).responsible_professional_user_id || "");
        // Pre-fill operational data from record
        const rec = fullRecord.record as any;
        if (rec.safety_checklist) {
          setChecklist(rec.safety_checklist as SafetyChecklistData);
        }
        if (rec.material_traceability) {
          setMaterial(rec.material_traceability as MaterialTraceabilityData);
        }
        if (rec.adverse_event_record) {
          setAdverseEvent(rec.adverse_event_record as AdverseEventData);
          setAdverseEventStatus("REPORTED");
        } else {
          setAdverseEvent(null);
          setAdverseEventStatus(rec.adverse_event_status === "REPORTED" ? "REPORTED" : "NONE");
        }
        // Method tracking
        setMethodRun(rec.method_run || null);
        setMethodDeviation(!!rec.method_deviation);
        setMethodDeviationReason(rec.method_deviation_reason || "");
        // Scientific mode
        setScientificModeEnabled(!!rec.scientific_mode_enabled);
        setScientificBadgeStatus(rec.scientific_badge_status || "NONE");
        // In edit mode, skip Step 0 (protocol already set)
        setCurrentStep(1);
      } else {
        // Create mode: start at Step 0
        setFormData(defaultFormData);
        setSelectedProtocolId("");
        setChecklist(defaultChecklist);
        setMaterial(defaultMaterial);
        setAdverseEvent(null);
        setAdverseEventStatus("NONE");
        setMethodRun(null);
        setMethodDeviation(false);
        setMethodDeviationReason("");
        setCurrentStep(0);
      }
      setIsInitialized(true);
    }
    
    if (!open) {
      setIsInitialized(false);
    }
  }, [open, fullRecord, isInitialized]);

  const updateFormData = <K extends keyof ClinicalStandardFormData>(
    section: K,
    data: Partial<ClinicalStandardFormData[K]>
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!selectedProtocolId && !!responsibleProfessionalId;
      case 1:
        return isStep1Complete(formData.clinical_context);
      case 2:
        return isStep2Complete(formData.severity, formData.clinical_context.pathology);
      case 3:
        return isStep3Complete(formData.prp_protocol);
      case 4:
        return isStep4Complete(formData.associations);
      case 5:
        return isStep5Complete(formData.co_interventions);
      case 6:
        return true; // Safety step is always navigable (checklist not required to proceed/save as draft)
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // In edit mode, don't go back to Step 0
      if (currentStep === 1 && fullRecord) return;
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async (justification?: string) => {
    // If record is VALIDATED and we're editing, require justification
    if (fullRecord && scientificBadgeStatus === "VALIDATED" && !justification) {
      setShowJustificationModal(true);
      return;
    }

    await saveMutation.mutateAsync({
      attendanceId,
      formData,
      protocolId: selectedProtocolId,
      responsibleProfessionalId,
      existingRecordId: fullRecord?.record.id,
      safetyChecklist: checklist,
      materialTraceability: material,
      adverseEventRecord: adverseEvent,
      adverseEventStatus,
      scientificEditJustification: justification || undefined,
      methodRun: methodRun || undefined,
      methodDeviation,
      methodDeviationReason: methodDeviation ? methodDeviationReason : "",
    });
    onOpenChange(false);
    setCurrentStep(0);
    setFormData(defaultFormData);
    setSelectedProtocolId("");
    setResponsibleProfessionalId("");
    setChecklist(defaultChecklist);
    setMaterial(defaultMaterial);
    setAdverseEvent(null);
    setAdverseEventStatus("NONE");
    setMethodRun(null);
    setMethodDeviation(false);
    setMethodDeviationReason("");
    setScientificModeEnabled(false);
    setScientificBadgeStatus("NONE");
    setIsInitialized(false);
  };

  const handleJustificationConfirm = async (justification: string) => {
    setPendingJustificationSave(true);
    try {
      await handleSave(justification);
      setShowJustificationModal(false);
    } finally {
      setPendingJustificationSave(false);
    }
  };

  const handleScientificStatusChange = () => {
    // Re-fetch the record to get updated status
    // queryClient will handle via invalidation in the edge function response
    if (fullRecord) {
      const rec = fullRecord.record as any;
      // Optimistic: toggle state
      if (!scientificModeEnabled) {
        setScientificModeEnabled(true);
        setScientificBadgeStatus("DRAFT");
      } else if (scientificBadgeStatus === "DRAFT") {
        setScientificBadgeStatus("VALIDATED");
      }
    }
  };

  const isEditMode = !!fullRecord;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
         <Step0ProtocolSelection
            selectedProtocolId={selectedProtocolId}
            onChange={setSelectedProtocolId}
            responsibleProfessionalId={responsibleProfessionalId}
            onResponsibleChange={setResponsibleProfessionalId}
          />
        );
      case 1:
        return (
          <Step1ClinicalContext
            data={formData.clinical_context}
            onChange={(data) => updateFormData('clinical_context', data)}
          />
        );
      case 2:
        return (
          <Step2Severity
            data={formData.severity}
            pathology={formData.clinical_context.pathology}
            onChange={(data) => updateFormData('severity', data)}
          />
        );
      case 3:
        return (
          <Step3PRPProtocol
            data={formData.prp_protocol}
            onChange={(data) => updateFormData('prp_protocol', data)}
          />
        );
      case 4:
        return (
          <Step4Associations
            data={formData.associations}
            onChange={(data) => updateFormData('associations', data)}
          />
        );
      case 5:
        return (
          <Step5CoInterventions
            data={formData.co_interventions}
            onChange={(data) => updateFormData('co_interventions', data)}
          />
        );
      case 6:
        return (
          <StepSafetyChecklist
            checklist={checklist}
            material={material}
            adverseEvent={adverseEvent}
            adverseEventStatus={adverseEventStatus}
            methodRun={methodRun}
            methodDeviation={methodDeviation}
            methodDeviationReason={methodDeviationReason}
            onChecklistChange={setChecklist}
            onMaterialChange={setMaterial}
            onAdverseEventChange={setAdverseEvent}
            onAdverseEventStatusChange={setAdverseEventStatus}
            onMethodRunChange={setMethodRun}
            onMethodDeviationChange={setMethodDeviation}
            onMethodDeviationReasonChange={setMethodDeviationReason}
          />
        );
      default:
        return null;
    }
  };

  if (isLoadingRecord && !isInitialized) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dados do protocolo...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-xl">
              Clinical Standard Engine — PRP {isEditMode && "(Edição)"}
            </DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Tempo estimado: ≈ 3 minutos
          </DialogDescription>
          {/* Scientific Mode Panel */}
          {isEditMode && (
            <div className="pt-2">
              <ScientificModePanel
                psrId={fullRecord?.record.id}
                scientificModeEnabled={scientificModeEnabled}
                scientificBadgeStatus={scientificBadgeStatus}
                onStatusChange={handleScientificStatusChange}
              />
            </div>
          )}
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Passo {currentStep + 1} de {STEPS.length}</span>
            <span>{STEPS[currentStep].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between px-2">
          {STEPS.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col items-center gap-1 ${
                index <= currentStep ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                  index < currentStep
                    ? "bg-primary text-primary-foreground border-primary"
                    : index === currentStep
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-[10px] text-center max-w-[60px] leading-tight hidden sm:block">
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-4">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || (currentStep === 1 && isEditMode)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSave()}
              disabled={!canProceed() || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                "Salvando..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isEditMode ? "Atualizar Protocolo" : "Salvar Protocolo Padronizado"}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Justification modal for validated scientific records */}
        <JustificationModal
          open={showJustificationModal}
          onOpenChange={setShowJustificationModal}
          onConfirm={handleJustificationConfirm}
          loading={pendingJustificationSave}
        />
      </DialogContent>
    </Dialog>
  );
}
