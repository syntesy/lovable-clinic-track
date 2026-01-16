/**
 * NextStepCard - Procedure-Locked Next Steps Display
 * 
 * Renders the "Próximo Passo" card using the procedure-locked generator.
 * This component REPLACES the generic LLM-generated next_steps from triagem-prp.
 * 
 * REGRA MÁXIMA: Output derivado SOMENTE do procedimento selecionado.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, AlertTriangle, Ban, FlaskConical, Info } from "lucide-react";
import {
  generateOrthoBioPlan,
  mapTaxonomyToProcedureCode,
  type ProcedureCode,
  type PatientFactors,
  type OrthoBioPlanOutput,
} from "@/domain/orthoBioProcedures";

interface NextStepCardProps {
  /** The selected procedure code (can be taxonomy code like AUTO_PRP or direct like PRP) */
  procedureCode: string | null | undefined;
  /** Patient factors that affect recommendations */
  patientFactors?: PatientFactors;
  /** Fallback: Legacy next_steps from LLM (used only if generator returns empty) */
  legacyNextSteps?: {
    what_to_do_now?: string;
    timeline?: string;
  };
  /** Show debug info */
  debug?: boolean;
}

/**
 * Maps common questionnaire values to PatientFactors
 */
export function mapQuestionnaireToPatientFactors(
  medicamentos?: string[],
  redFlags?: string[]
): PatientFactors {
  const factors: PatientFactors = {};

  if (medicamentos) {
    // Check for NSAID usage
    if (
      medicamentos.includes("aines_regulares") ||
      medicamentos.includes("aines_7d") ||
      medicamentos.includes("aine_14_dias")
    ) {
      factors.nsaid_recent = true;
    }

    // Check for anticoagulants
    if (medicamentos.includes("anticoagulantes")) {
      factors.anticoagulant_use = true;
    }

    // Check for antiplatelet
    if (
      medicamentos.includes("antiplaquetarios") ||
      medicamentos.includes("antiplaquetario_uso")
    ) {
      factors.antiplatelet_use = true;
    }
  }

  if (redFlags) {
    // Check for active infection
    if (redFlags.includes("infeccao_ativa") || redFlags.includes("infeccao_local")) {
      factors.active_infection = true;
    }

    // Check for severe anemia
    if (redFlags.includes("anemia_severa")) {
      factors.severe_anemia = true;
    }

    // Check for thrombocytopenia
    if (redFlags.includes("plaquetopenia") || redFlags.includes("trombocitopenia")) {
      factors.thrombocytopenia = true;
    }

    // Check for cancer
    if (redFlags.includes("cancer_ativo") || redFlags.includes("neoplasia_ativa")) {
      factors.cancer_active_uncontrolled = true;
    }

    // Check for coagulation disorders
    if (redFlags.includes("coagulopatia") || redFlags.includes("disturbio_coagulacao")) {
      factors.coagulation_disorder = true;
    }
  }

  return factors;
}

export function NextStepCard({
  procedureCode,
  patientFactors = {},
  legacyNextSteps,
  debug = false,
}: NextStepCardProps) {
  // Generate the procedure-locked plan
  const plan = useMemo<OrthoBioPlanOutput>(() => {
    // Map taxonomy code to procedure code if needed
    let procCode: ProcedureCode | null = null;

    if (procedureCode) {
      // Try direct mapping first
      const directCodes: ProcedureCode[] = ["PRP", "PRF", "BMA", "BMEC", "NANOFAT"];
      if (directCodes.includes(procedureCode.toUpperCase() as ProcedureCode)) {
        procCode = procedureCode.toUpperCase() as ProcedureCode;
      } else {
        // Try taxonomy mapping
        procCode = mapTaxonomyToProcedureCode(procedureCode);
      }
    }

    return generateOrthoBioPlan({
      procedure_codes: procCode ? [procCode] : [],
      patient_factors: patientFactors,
    });
  }, [procedureCode, patientFactors]);

  // If no procedure selected, show placeholder
  if (!procedureCode || plan.meta.procedures_used.length === 0) {
    return (
      <Card className="bg-card/95 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="w-4 h-4" />
            Próximo Passo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecione um procedimento ortobiológico para gerar o plano.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Next Step Card */}
      <Card className="bg-card/95 backdrop-blur border-border/50 border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2 text-primary">
            <ArrowRight className="w-4 h-4" />
            Próximo Passo
            {plan.eligibility_status === "BLOCKED" && (
              <Badge variant="destructive" className="ml-2">
                <Ban className="w-3 h-3 mr-1" />
                Bloqueado
              </Badge>
            )}
            {plan.eligibility_status === "ATTENTION" && (
              <Badge variant="secondary" className="ml-2 bg-yellow-500/20 text-yellow-700">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Atenção
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Next steps text */}
          <div className="text-sm font-medium whitespace-pre-line">
            {plan.next_steps_text}
          </div>

          {/* Required exams */}
          {plan.required_exams.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <FlaskConical className="w-4 h-4 text-primary" />
                Exames Obrigatórios
              </div>
              <ul className="space-y-1">
                {plan.required_exams.map((exam) => (
                  <li key={exam.exam_code} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      {exam.label}
                      {exam.reason && (
                        <span className="text-muted-foreground text-xs ml-1">
                          — {exam.reason}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Procedure badge */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            {plan.meta.procedures_used.map((proc) => (
              <Badge key={proc} variant="outline" className="text-xs">
                {proc}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground">
              {plan.meta.catalog_version}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Blocks */}
      {plan.blocks.length > 0 && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertTitle>Bloqueios Identificados</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {plan.blocks.map((block) => (
                <li key={block.code} className="text-sm">
                  <strong>{block.title}</strong>
                  {block.detail && <span className="block text-xs">{block.detail}</span>}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts */}
      {plan.alerts.length > 0 && (
        <div className="space-y-2">
          {plan.alerts
            .filter((a) => !plan.blocks.some((b) => b.code === a.code.replace("_ALERT", "").replace("_BLOCK", "")))
            .map((alert) => (
              <Alert
                key={alert.code}
                variant={alert.severity === "high" ? "destructive" : "default"}
                className={
                  alert.severity === "medium"
                    ? "border-yellow-500/50 bg-yellow-500/10"
                    : alert.severity === "low"
                    ? "border-blue-500/50 bg-blue-500/10"
                    : ""
                }
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                {alert.detail && (
                  <AlertDescription className="text-xs">{alert.detail}</AlertDescription>
                )}
              </Alert>
            ))}
        </div>
      )}

      {/* Debug info */}
      {debug && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Info className="w-3 h-3" />
              Debug Info
            </div>
            <pre className="text-xs overflow-auto max-h-32">
              {JSON.stringify(
                {
                  input_procedure: procedureCode,
                  mapped_procedures: plan.meta.procedures_used,
                  patient_factors: patientFactors,
                  catalog_version: plan.meta.catalog_version,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NextStepCard;
