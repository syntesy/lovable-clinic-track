import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, FileText, Play } from "lucide-react";
import { FisioRegenFormData, ComputedResult, initialFormData } from "@/types/fisioregen-score";
import { calculateFisioRegenScore } from "@/lib/fisioregen-score-calculator";
import { WizardStep0 } from "./WizardSteps/WizardStep0";
import { WizardStep1 } from "./WizardSteps/WizardStep1";
import { WizardStep2 } from "./WizardSteps/WizardStep2";
import { WizardStep3 } from "./WizardSteps/WizardStep3";
import { WizardStep4 } from "./WizardSteps/WizardStep4";
import { WizardStep5 } from "./WizardSteps/WizardStep5";
import { WizardStep6 } from "./WizardSteps/WizardStep6";
import { WizardStep7 } from "./WizardSteps/WizardStep7";
import { ScoreResult } from "./ScoreResult";

const STEP_TITLES = [
  "Introdução",
  "Bloqueios Clínicos",
  "Medicações",
  "Exames Laboratoriais",
  "Tabagismo",
  "Prontidão Tecidual",
  "Execução e Adesão",
  "Revisão",
];

export function FisioRegenScoreWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FisioRegenFormData>(initialFormData);
  const [result, setResult] = useState<ComputedResult | null>(null);

  const totalSteps = 8;
  const progress = ((step + 1) / totalSteps) * 100;

  const updateFormData = <K extends keyof FisioRegenFormData>(
    field: K,
    value: FisioRegenFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const handleGenerateScore = () => {
    const computed = calculateFisioRegenScore(formData);
    setResult(computed);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResult(null);
    setStep(0);
  };

  if (result) {
    return <ScoreResult result={result} formData={formData} onReset={handleReset} />;
  }

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return <WizardStep0 />;
      case 1:
        return <WizardStep1 formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <WizardStep2 formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <WizardStep3 formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <WizardStep4 formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <WizardStep5 formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <WizardStep6 formData={formData} updateFormData={updateFormData} />;
      case 7:
        return <WizardStep7 formData={formData} onGenerate={handleGenerateScore} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-6 px-4">
      <Card className="shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">FISIOREGEN SCORE</CardTitle>
              <CardDescription>
                Passo {step + 1} de {totalSteps}: {STEP_TITLES[step]}
              </CardDescription>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStepContent()}

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>

            {step < totalSteps - 1 ? (
              <Button onClick={handleNext} className="gap-2">
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleGenerateScore} className="gap-2 bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4" />
                Gerar Score/Relatório
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
