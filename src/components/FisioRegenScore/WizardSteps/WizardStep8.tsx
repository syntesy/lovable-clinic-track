/**
 * WIZARD STEP 8 — Resultado REGENAPP
 * 
 * Step FINAL do wizard que renderiza o RegenResultView.
 * READ-ONLY - consome regen_engine_outputs para exibição.
 * 
 * Comportamento:
 * - Se regen_engine_outputs não existe: mostra empty state com CTA "Gerar Resultado"
 * - Se existe: renderiza todos os cards
 * - Botão "Gerar Resultado" executa o motor e salva em questionnaire_responses.regen_engine_outputs
 */

import { useState, useCallback } from "react";
import { RegenResultView } from "@/components/RegenResult";
import { RegenEngineOutputs } from "@/types/regen-engine";
import { RegenCanonical } from "@/types/regen-canonical";
import { runRegenEngine } from "@/lib/regen-engine";
import { buildRegenCanonicalFromTriagem } from "@/lib/regen-canonical-adapter";
import { FisioRegenFormData } from "@/types/fisioregen-score";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface WizardStep8Props {
  patientId?: string;
  patientName?: string;
  screeningId?: string;
  formData: FisioRegenFormData;
  onReset: () => void;
  
  // Data from existing screening if available
  existingEngineOutputs?: RegenEngineOutputs | null;
  existingCanonical?: RegenCanonical | null;
  canonicalUpdatedAt?: string;
  onEngineOutputsGenerated?: (outputs: RegenEngineOutputs) => void;
}

export function WizardStep8({
  patientId,
  patientName,
  screeningId,
  formData,
  onReset,
  existingEngineOutputs,
  existingCanonical,
  canonicalUpdatedAt,
  onEngineOutputsGenerated,
}: WizardStep8Props) {
  const [engineOutputs, setEngineOutputs] = useState<RegenEngineOutputs | null>(
    existingEngineOutputs || null
  );
  const [canonical, setCanonical] = useState<RegenCanonical | null>(
    existingCanonical || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gera o resultado executando o motor e salvando no banco
   */
  const handleGenerateResult = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Construir o canonical a partir do formData atual
      // Criamos um objeto de respostas compatível com o adapter
      // O formData do wizard já contém os dados necessários
      const questionnaireResponses = {
        answers: {},
        provided_exams: {},
      };
      
      const newCanonical = buildRegenCanonicalFromTriagem(
        questionnaireResponses as Parameters<typeof buildRegenCanonicalFromTriagem>[0],
        formData
      );
      setCanonical(newCanonical);

      // 2. Executar o motor
      const outputs = runRegenEngine(newCanonical);
      setEngineOutputs(outputs);

      // 3. Se temos screeningId, salvar no banco
      if (screeningId) {
        const { error: updateError } = await supabase
          .from("prp_screenings")
          .update({
            questionnaire_responses: {
              regen_canonical: newCanonical,
              regen_engine_outputs: outputs,
            } as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("id", screeningId);

        if (updateError) {
          console.error("Error saving engine outputs:", updateError);
          toast({
            title: "Aviso",
            description: "Resultado gerado, mas não foi possível salvar no banco.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Resultado gerado",
            description: "O resultado foi calculado e salvo com sucesso.",
          });
        }
      } else {
        toast({
          title: "Resultado gerado",
          description: "O resultado foi calculado com sucesso.",
        });
      }

      // 4. Notificar o parent se callback fornecido
      if (onEngineOutputsGenerated) {
        onEngineOutputsGenerated(outputs);
      }
    } catch (err) {
      console.error("Error generating result:", err);
      setError(err instanceof Error ? err.message : "Erro ao gerar resultado");
      toast({
        title: "Erro",
        description: "Não foi possível gerar o resultado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, screeningId, onEngineOutputsGenerated]);

  /**
   * Recalcula o resultado (mesmo fluxo de gerar)
   */
  const handleRecalculate = useCallback(() => {
    handleGenerateResult();
  }, [handleGenerateResult]);

  /**
   * Salvar nota clínica (placeholder - pode ser integrado com patient_events ou clinical_records)
   */
  const handleSaveNote = useCallback(async (noteContent: string) => {
    if (!patientId) {
      toast({
        title: "Erro",
        description: "ID do paciente não disponível.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Salvar como evento do paciente
      const { error: insertError } = await supabase
        .from("patient_events")
        .insert({
          patient_id: patientId,
          event_name: "regenapp_clinical_note",
          event_data: {
            note_content: noteContent,
            engine_version: engineOutputs?.engine_version,
            ruleset_version: engineOutputs?.ruleset_version,
            computed_at: engineOutputs?.computed_at,
          },
        });

      if (insertError) {
        throw insertError;
      }
    } catch (err) {
      console.error("Error saving clinical note:", err);
      throw err;
    }
  }, [patientId, engineOutputs]);

  return (
    <RegenResultView
      engineOutputs={engineOutputs}
      canonical={canonical}
      canonicalUpdatedAt={canonicalUpdatedAt}
      patientName={patientName}
      isLoading={isLoading}
      error={error}
      onGenerateResult={handleGenerateResult}
      onRecalculate={handleRecalculate}
      onSaveNote={patientId ? handleSaveNote : undefined}
    />
  );
}
