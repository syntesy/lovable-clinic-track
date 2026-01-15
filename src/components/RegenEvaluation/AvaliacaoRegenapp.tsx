/**
 * Avaliação REGENAPP - Aba Unificada
 * 
 * Fluxo completo: Status → Triagem (read-only) → Prontuário → Exames → Ações → Resultado
 * Implementa máquina de estados S0 → S1 → S2 → S3
 * 
 * NOTA: Este componente é Tipo A (permitido usar getLatestClinicalRecord)
 * porque exibe "status geral" da avaliação, não um prontuário específico para edição.
 */

import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  TriageSummary,
  ActionButtons,
  ExamRequestModal,
  PreReportModal
} from "@/components/RegenEvaluation";
import { ClinicalAssessmentChecklist } from "@/components/RegenEvaluation/ClinicalAssessmentChecklist";
import { DynamicLabsPanel } from "@/components/RegenEvaluation/DynamicLabsPanel";
import { 
  extractExamsFromTriage, 
  updateExamsWithValidation,
  areAllCriticalExamsValid,
  hasTriageExams
} from "@/types/triage-exams";
import { ExamGroup } from "@/types/screening";

import { RegenResultView } from "@/components/RegenResult";
import { ObservationalRegistryCard } from "@/components/registry/ObservationalRegistryCard";
import { RegenCanonical } from "@/types/regen-canonical";
import { RegenEngineOutputs } from "@/types/regen-engine";
import { 
  RegenCaseStatus, 
  isClinicalAssessmentComplete,
} from "@/types/regen-case-status";
import { runRegenEngine } from "@/lib/regen-engine";
import { buildRegenCanonicalFromTriagem } from "@/lib/regen-canonical-adapter";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Json } from "@/integrations/supabase/types";
import { getLatestClinicalRecord } from "@/lib/clinical-record-helpers";

interface AvaliacaoRegenappProps {
  patientId: string;
  patientName?: string;
  screeningId?: string;
}

export function AvaliacaoRegenapp({
  patientId,
  patientName,
  screeningId: propScreeningId
}: AvaliacaoRegenappProps) {
  const queryClient = useQueryClient();
  const reportRef = useRef<HTMLDivElement>(null);
  const { logAction } = useAuditLog();
  
  const [examRequestModalOpen, setExamRequestModalOpen] = useState(false);
  const [preReportModalOpen, setPreReportModalOpen] = useState(false);
  const [isGeneratingScore, setIsGeneratingScore] = useState(false);

  // Buscar triagem mais recente do paciente (ou usar a fornecida)
  const { data: screening, isLoading: loadingScreening, refetch } = useQuery({
    queryKey: ["screening-for-evaluation", patientId, propScreeningId],
    queryFn: async () => {
      let query = supabase
        .from("prp_screenings")
        .select("*");
      
      if (propScreeningId) {
        query = query.eq("id", propScreeningId);
      } else {
        query = query.eq("patient_id", patientId).order("created_at", { ascending: false }).limit(1);
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId
  });

  // Tipo A: Buscar clinical_records mais recente (VISÃO GERAL para status da avaliação)
  // Permitido usar getLatestClinicalRecord porque é para calcular status, não para editar/visualizar
  const { data: clinicalRecord } = useQuery({
    queryKey: ["clinical-record", "latest", patientId],
    queryFn: async () => {
      console.log("[AvaliacaoRegenapp] Using getLatestClinicalRecord for status calculation");
      return await getLatestClinicalRecord(patientId);
    },
    enabled: !!patientId
  });

  // Extrair dados do screening
  const screeningId = screening?.id;
  const questionnaireResponses = screening?.questionnaire_responses as Record<string, unknown> | null;
  const canonical = (questionnaireResponses?.regen_canonical as RegenCanonical) || null;
  const engineOutputs = (questionnaireResponses?.regen_engine_outputs as RegenEngineOutputs) || null;
  
  // Extrair exames recomendados da triagem (para passar ao modal)
  const recommendedExamsFromTriage = (() => {
    try {
      if (screening?.analysis_result) {
        const parsed = JSON.parse(screening.analysis_result);
        const required = parsed?.requested_exams?.required || [];
        const optional = parsed?.requested_exams?.optional || [];
        return [...required, ...optional];
      }
    } catch {
      // Fallback para recommended_exams JSONB se analysis_result não tiver exames
    }
    
    // Tentar recommended_exams como fallback
    const recommendedExams = screening?.recommended_exams;
    if (Array.isArray(recommendedExams)) {
      return recommendedExams.flatMap((group: unknown) => {
        if (typeof group === "object" && group !== null && "exams" in group) {
          return (group as { exams: string[] }).exams || [];
        }
        return [];
      });
    }
    return [];
  })();
  
  // Usar tipo direto do helper (não precisa de cast)
  const clinicalRecordData = clinicalRecord;

  // Extrair exames da triagem (fonte única)
  const triageExams = useMemo(() => {
    const exams = extractExamsFromTriage(
      screening?.analysis_result || null,
      screening?.recommended_exams as unknown as ExamGroup[] | null
    );
    return updateExamsWithValidation(
      exams,
      screening?.labs_validated as Record<string, { status: string; value?: number | null; date?: string | null }> | null,
      screening?.labs_collected_date || null
    );
  }, [screening?.analysis_result, screening?.recommended_exams, screening?.labs_validated, screening?.labs_collected_date]);

  // Calcular status atual - USANDO DADOS DINÂMICOS DA TRIAGEM
  const currentStatus: RegenCaseStatus = useMemo(() => {
    if (!screening) return "S0";
    
    // S3: Score definitivo já existe
    if (engineOutputs) return "S3";
    
    // Verificar avaliação clínica
    const clinicalComplete = isClinicalAssessmentComplete({
      clinical_chief_complaint: clinicalRecordData?.chief_complaint ?? null,
      clinical_anamnesis: clinicalRecordData?.anamnesis ?? null,
      clinical_physical_exam: clinicalRecordData?.physical_exam ?? null,
      clinical_diagnosis: clinicalRecordData?.clinical_diagnosis ?? null
    });
    
    // S2: Avaliação clínica completa + exames CRÍTICOS da triagem válidos
    if (clinicalComplete && areAllCriticalExamsValid(triageExams)) {
      return "S2";
    }
    
    // S1: Avaliação clínica completa, mas exames pendentes
    if (clinicalComplete) return "S1";
    
    // S0: Apenas triagem concluída
    return "S0";
  }, [screening, engineOutputs, clinicalRecordData, triageExams]);

  // Detectar se resultado está desatualizado (stale)
  const isStale = screening && engineOutputs && 
    screening.canonical_updated_at && screening.engine_computed_at &&
    new Date(screening.canonical_updated_at) > new Date(screening.engine_computed_at);

  /**
   * Gera hash do canonical para auditoria
   */
  const generateCanonicalHash = useCallback((canonical: RegenCanonical): string => {
    try {
      return btoa(JSON.stringify(canonical)).slice(0, 64);
    } catch {
      return `hash_${Date.now()}`;
    }
  }, []);

  // Handler para gerar Score Definitivo
  const handleGenerateDefinitiveScore = useCallback(async () => {
    // Validação de UI + Backend: só permite se status === S2
    if (!screeningId || currentStatus !== "S2") {
      toast.error("Não é possível gerar Score Definitivo neste momento.");
      console.error("[SCORE_BLOCKED] Tentativa de gerar score com status:", currentStatus);
      return;
    }

    setIsGeneratingScore(true);
    try {
      // 1. Buscar dados atualizados
      const { data: currentScreening, error: fetchError } = await supabase
        .from("prp_screenings")
        .select("*")
        .eq("id", screeningId)
        .single();
      
      if (fetchError) throw fetchError;

      // 2. VALIDAÇÃO DE BACKEND: Recusar se status !== S2
      const dbStatus = currentScreening.regen_case_status;
      if (dbStatus !== "S2") {
        toast.error(`Operação recusada pelo backend. Status atual: ${dbStatus}`);
        console.error("[BACKEND_BLOCK] Score recusado. DB status:", dbStatus, "Expected: S2");
        return;
      }

      // 2. Construir canonical completo
      const responses = currentScreening.questionnaire_responses as Record<string, unknown>;
      const existingCanonical = (responses?.regen_canonical as RegenCanonical) || null;
      
      // Atualizar canonical com dados clínicos
      const updatedCanonical: RegenCanonical = {
        ...(existingCanonical || {} as RegenCanonical),
        schema_version: "regen_canonical_v1",
        captured_at: new Date().toISOString(),
        diagnosis: {
          ...(existingCanonical?.diagnosis || { tissue_type: "unknown", lesion_severity: null }),
          primary_clinical_diagnosis: currentScreening.clinical_diagnosis
        }
      };

      // 3. Executar motor
      const outputs = runRegenEngine(updatedCanonical);

      // 4. Gerar hash do canonical
      const canonicalHash = btoa(JSON.stringify(updatedCanonical)).slice(0, 32);

      // 5. Salvar resultados
      const mergedResponses = {
        ...responses,
        regen_canonical: updatedCanonical,
        regen_engine_outputs: outputs
      };

      const { error: updateError } = await supabase
        .from("prp_screenings")
        .update({
          questionnaire_responses: mergedResponses as unknown as Json,
          regen_case_status: "S3",
          engine_computed_at: new Date().toISOString(),
          canonical_hash: canonicalHash,
          updated_at: new Date().toISOString()
        })
        .eq("id", screeningId);

      if (updateError) throw updateError;

      // 6. Log de auditoria
      await logAction({
        action: "SCORE_FINAL",
        tableName: "prp_screenings",
        recordId: screeningId,
        additionalInfo: {
          engine_version: outputs.engine_version,
          ruleset_version: outputs.ruleset_version,
          regen_case_status: "S3",
          canonical_hash: canonicalHash
        }
      });

      toast.success("Score Definitivo rhegen gerado com sucesso!");
      refetch();
    } catch (error) {
      console.error("Error generating definitive score:", error);
      toast.error("Erro ao gerar Score Definitivo");
    } finally {
      setIsGeneratingScore(false);
    }
  }, [screeningId, currentStatus, logAction, refetch]);

  // Handler para recalcular
  const handleRecalculate = useCallback(async () => {
    if (!screeningId) return;
    
    setIsGeneratingScore(true);
    try {
      // Similar ao handleGenerateDefinitiveScore, mas sem verificação de status
      const { data: currentScreening, error: fetchError } = await supabase
        .from("prp_screenings")
        .select("*")
        .eq("id", screeningId)
        .single();
      
      if (fetchError) throw fetchError;

      const responses = currentScreening.questionnaire_responses as Record<string, unknown>;
      const existingCanonical = (responses?.regen_canonical as RegenCanonical) || null;
      
      const updatedCanonical: RegenCanonical = {
        ...(existingCanonical || {} as RegenCanonical),
        schema_version: "regen_canonical_v1",
        captured_at: new Date().toISOString(),
        diagnosis: {
          ...(existingCanonical?.diagnosis || { tissue_type: "unknown", lesion_severity: null }),
          primary_clinical_diagnosis: currentScreening.clinical_diagnosis
        }
      };

      const outputs = runRegenEngine(updatedCanonical);
      const canonicalHash = btoa(JSON.stringify(updatedCanonical)).slice(0, 32);

      const mergedResponses = {
        ...responses,
        regen_canonical: updatedCanonical,
        regen_engine_outputs: outputs
      };

      const { error: updateError } = await supabase
        .from("prp_screenings")
        .update({
          questionnaire_responses: mergedResponses as unknown as Json,
          engine_computed_at: new Date().toISOString(),
          canonical_hash: canonicalHash,
          updated_at: new Date().toISOString()
        })
        .eq("id", screeningId);

      if (updateError) throw updateError;

      await logAction({
        action: "RECALC",
        tableName: "prp_screenings",
        recordId: screeningId,
        additionalInfo: {
          engine_version: outputs.engine_version,
          ruleset_version: outputs.ruleset_version,
          canonical_hash: canonicalHash,
          regen_case_status: "S3"
        }
      });

      toast.success("Resultado recalculado com sucesso!");
      refetch();
    } catch (error) {
      console.error("Error recalculating:", error);
      toast.error("Erro ao recalcular resultado");
    } finally {
      setIsGeneratingScore(false);
    }
  }, [screeningId, logAction, refetch]);

  // Handler para gerar solicitação de exames
  const handleGenerateExamRequest = useCallback(async (selectedExams: string[], observations: string) => {
    // Gerar hash do canonical atual para auditoria
    const currentCanonicalHash = canonical ? generateCanonicalHash(canonical) : undefined;
    
    await logAction({
      action: "EXAMS_REQUEST",
      tableName: "prp_screenings",
      recordId: screeningId || undefined,
      additionalInfo: {
        exams_requested: selectedExams,
        observations,
        regen_case_status: currentStatus,
        canonical_hash: currentCanonicalHash,
        engine_version: "regen_engine_v1.0.0",
        ruleset_version: "regen_rules_v1"
      }
    });
    toast.success("Solicitação de exames gerada!");
  }, [screeningId, currentStatus, logAction, canonical, generateCanonicalHash]);

  // Handler para gerar pré-relatório
  const handleGeneratePreReport = useCallback(async () => {
    const currentCanonicalHash = canonical ? generateCanonicalHash(canonical) : undefined;
    
    await logAction({
      action: "PRE_REPORT",
      tableName: "prp_screenings",
      recordId: screeningId || undefined,
      additionalInfo: {
        regen_case_status: currentStatus,
        canonical_hash: currentCanonicalHash,
        engine_version: "regen_engine_v1.0.0",
        ruleset_version: "regen_rules_v1"
      }
    });
  }, [screeningId, currentStatus, logAction, canonical, generateCanonicalHash]);

  // Handler removido - Avaliação REGENAPP não salva mais campos clínicos
  // Os campos são editados apenas no Prontuário Clínico (fonte única)

  const handleLabsSave = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loadingScreening) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Nenhuma triagem encontrada para este paciente.</p>
        <p className="text-sm mt-2">Inicie uma nova triagem para começar a avaliação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* (B) RESUMO DA TRIAGEM (READ-ONLY) - PRIMEIRO BLOCO */}
      <TriageSummary 
        canonical={canonical}
        rawAnswers={questionnaireResponses?.answers as Record<string, unknown> | null}
      />

      {/* (C) AVALIAÇÃO CLÍNICA - CHECKLIST READ-ONLY (Fonte: Prontuário Clínico) */}
      <ClinicalAssessmentChecklist
        patientId={patientId}
        screeningId={screeningId}
        disabled={currentStatus === "S3"}
      />

      {/* (D) EXAMES - Dinâmico da Triagem */}
      <DynamicLabsPanel
        screeningId={screeningId}
        canonical={canonical}
        analysisResult={screening.analysis_result}
        recommendedExams={screening.recommended_exams as unknown as ExamGroup[] | null}
        labsValidated={screening.labs_validated as Record<string, { status: string; value?: number | null; date?: string | null }> | null}
        labsCollectedDate={screening.labs_collected_date}
        onSave={handleLabsSave}
        disabled={currentStatus === "S3"}
        patientName={patientName}
      />

      {/* (E) AÇÕES */}
      <ActionButtons
        status={currentStatus}
        isLoading={isGeneratingScore}
        onGenerateExamRequest={() => setExamRequestModalOpen(true)}
        onGeneratePreReport={() => setPreReportModalOpen(true)}
        onGenerateDefinitiveScore={handleGenerateDefinitiveScore}
        onRecalculate={handleRecalculate}
      />

      {/* (G) REGISTRO OBSERVACIONAL - Camada paralela opt-in */}
      <ObservationalRegistryCard
        patientId={patientId}
        screeningId={screeningId}
        caseStatus={currentStatus}
      />

      {/* (F) RESULTADO DEFINITIVO (CARDS) - Só exibe em S3 */}
      {currentStatus === "S3" && engineOutputs && (
        <div ref={reportRef}>
          <RegenResultView
            engineOutputs={engineOutputs}
            canonical={canonical}
            patientName={patientName}
            isLoading={false}
          />
        </div>
      )}

      {/* MODAIS */}
      <ExamRequestModal
        open={examRequestModalOpen}
        onOpenChange={setExamRequestModalOpen}
        patientName={patientName}
        recommendedExams={recommendedExamsFromTriage}
        onGenerate={handleGenerateExamRequest}
      />

      <PreReportModal
        open={preReportModalOpen}
        onOpenChange={setPreReportModalOpen}
        patientName={patientName}
        canonical={canonical}
        clinicalAssessment={{
          chief_complaint: screening.clinical_chief_complaint,
          anamnesis: screening.clinical_anamnesis,
          physical_exam: screening.clinical_physical_exam,
          diagnosis: screening.clinical_diagnosis
        }}
      />
    </div>
  );
}