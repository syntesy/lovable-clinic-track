import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ClinicalStandardFormData,
  defaultFormData,
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  isStep4Complete,
  isStep5Complete,
} from "@/types/clinical-standard";
import { useSaveClinicalStandard, useFullProcedureRecord, convertRecordToFormData } from "@/hooks/useClinicalStandard";
import { Step1ClinicalContext } from "./steps/Step1ClinicalContext";
import { Step2Severity } from "./steps/Step2Severity";
import { Step3PRPProtocol } from "./steps/Step3PRPProtocol";
import { Step4Associations } from "./steps/Step4Associations";
import { Step5CoInterventions } from "./steps/Step5CoInterventions";

const STEPS = [
  { title: "Contexto Clínico", description: "Patologia e região anatômica" },
  { title: "Classificação", description: "Gravidade da condição" },
  { title: "Protocolo PRP", description: "Parâmetros do procedimento" },
  { title: "Associações", description: "Ácido hialurônico e AINEs" },
  { title: "Cointervenções", description: "Terapias associadas" },
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
  const [isInitialized, setIsInitialized] = useState(false);
  
  const saveMutation = useSaveClinicalStandard();
  const { data: fullRecord, isLoading: isLoadingRecord } = useFullProcedureRecord(attendanceId);

  // Pre-fill form data when editing an existing record
  useEffect(() => {
    if (open && !isInitialized) {
      if (fullRecord) {
        // Edit mode: pre-fill with existing data
        const prefillData = convertRecordToFormData(fullRecord);
        setFormData(prefillData);
      } else {
        // Create mode: use default data
        setFormData(defaultFormData);
      }
      setCurrentStep(0);
      setIsInitialized(true);
    }
    
    // Reset initialization flag when dialog closes
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
        return isStep1Complete(formData.clinical_context);
      case 1:
        return isStep2Complete(formData.severity, formData.clinical_context.pathology);
      case 2:
        return isStep3Complete(formData.prp_protocol);
      case 3:
        return isStep4Complete(formData.associations);
      case 4:
        return isStep5Complete(formData.co_interventions);
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
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      attendanceId,
      formData,
      existingRecordId: fullRecord?.record.id, // Pass existing ID for UPDATE
    });
    onOpenChange(false);
    setCurrentStep(0);
    setFormData(defaultFormData);
    setIsInitialized(false);
  };

  const isEditMode = !!fullRecord;

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1ClinicalContext
            data={formData.clinical_context}
            onChange={(data) => updateFormData('clinical_context', data)}
          />
        );
      case 1:
        return (
          <Step2Severity
            data={formData.severity}
            pathology={formData.clinical_context.pathology}
            onChange={(data) => updateFormData('severity', data)}
          />
        );
      case 2:
        return (
          <Step3PRPProtocol
            data={formData.prp_protocol}
            onChange={(data) => updateFormData('prp_protocol', data)}
          />
        );
      case 3:
        return (
          <Step4Associations
            data={formData.associations}
            onChange={(data) => updateFormData('associations', data)}
          />
        );
      case 4:
        return (
          <Step5CoInterventions
            data={formData.co_interventions}
            onChange={(data) => updateFormData('co_interventions', data)}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state while fetching existing record
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
          <DialogTitle className="text-xl">
            Clinical Standard Engine — PRP {isEditMode && "(Edição)"}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Tempo estimado: ≈ 2 minutos
          </DialogDescription>
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
            disabled={currentStep === 0}
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
              onClick={handleSave}
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
      </DialogContent>
    </Dialog>
  );
}
