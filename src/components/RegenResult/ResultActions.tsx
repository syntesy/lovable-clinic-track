/**
 * REGEN RESULT ACTIONS
 * Ações: Exportar PDF, Copiar Resumo, Salvar Nota
 */

import { useState, RefObject } from "react";
import { FileDown, Copy, Save, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";
import { RegenEngineOutputs } from "@/types/regen-engine";
import { RegenCanonical } from "@/types/regen-canonical";
import { RESULT_MESSAGES, LAB_STATUS_LABELS, CLASSIFICATION_LABELS, CONFIDENCE_LABELS } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ResultActionsProps {
  engineOutputs: RegenEngineOutputs;
  canonical?: RegenCanonical;
  patientName?: string;
  caseId?: string;
  reportRef: RefObject<HTMLDivElement>;
  onSaveNote?: (noteContent: string) => Promise<void>;
  onRecalculate?: () => void;
}

/**
 * Gera o resumo clínico padronizado (TEMPLATE FIXO)
 */
function generateClinicalSummary(
  engineOutputs: RegenEngineOutputs,
  canonical?: RegenCanonical,
  patientName?: string
): string {
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const computedAt = engineOutputs.computed_at
    ? format(new Date(engineOutputs.computed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : "—";

  let summary = `
=== RESUMO REGENAPP ===
Gerado em: ${now}
Calculado em: ${computedAt}
${patientName ? `Paciente: ${patientName}` : ""}

--- VERSÕES ---
Motor: ${engineOutputs.engine_version}
Regras: ${engineOutputs.ruleset_version}
${canonical?.schema_version ? `Schema: ${canonical.schema_version}` : ""}

--- SEGURANÇA ---
Status: ${engineOutputs.safety.block ? "BLOQUEADO" : engineOutputs.safety.alert ? "ALERTA" : "OK"}
${engineOutputs.safety.reasons.length > 0 ? `Motivos: ${engineOutputs.safety.reasons.join("; ")}` : ""}
`;

  if (!engineOutputs.safety.block) {
    // CRS
    if (engineOutputs.crs) {
      summary += `
--- CRS (Prontidão Clínica) ---
Score: ${engineOutputs.crs.score}/100
Classificação: ${CLASSIFICATION_LABELS[engineOutputs.crs.classification] || engineOutputs.crs.classification}
Confiança: ${CONFIDENCE_LABELS[engineOutputs.crs.confidence] || engineOutputs.crs.confidence}
${engineOutputs.crs.missing.length > 0 ? `Dados ausentes: ${engineOutputs.crs.missing.join(", ")}` : ""}
`;
    }

    // DIE
    if (engineOutputs.die) {
      const useLabs = engineOutputs.die.lab_recommendations.filter(l => l.status === "USE");
      const repeatLabs = engineOutputs.die.lab_recommendations.filter(l => l.status === "REPEAT");
      const requestLabs = engineOutputs.die.lab_recommendations.filter(l => l.status === "REQUEST");

      summary += `
--- DIE (Exames) ---
USAR: ${useLabs.length > 0 ? useLabs.map(l => l.lab_code).join(", ") : "Nenhum"}
REPETIR: ${repeatLabs.length > 0 ? repeatLabs.map(l => l.lab_code).join(", ") : "Nenhum"}
SOLICITAR: ${requestLabs.length > 0 ? requestLabs.map(l => l.lab_code).join(", ") : "Nenhum"}
`;
    }

    // BRS
    if (engineOutputs.brs) {
      summary += `
--- BRS (Prontidão Biológica) ---
Score: ${engineOutputs.brs.score}/100
Confiança: ${CONFIDENCE_LABELS[engineOutputs.brs.confidence] || engineOutputs.brs.confidence}
${engineOutputs.brs.reason_codes.length > 0 ? `Reason Codes: ${engineOutputs.brs.reason_codes.join(", ")}` : ""}
${engineOutputs.brs.alerts.length > 0 ? `Alertas: ${engineOutputs.brs.alerts.join("; ")}` : ""}
`;
    }

    // PEE
    if (engineOutputs.pee) {
      summary += `
--- PEE (Elegibilidade) ---
`;
      for (const item of engineOutputs.pee.eligibility) {
        summary += `${item.procedure_type}: ${CLASSIFICATION_LABELS[item.eligibility] || item.eligibility}`;
        if (item.gates_triggered.length > 0) {
          summary += ` (Gates: ${item.gates_triggered.join(", ")})`;
        }
        summary += "\n";
      }
    }
  }

  summary += `
--- QUALIDADE DOS DADOS ---
Completude: ${engineOutputs.data_quality.completeness_percent}%
${engineOutputs.data_quality.alerts.length > 0 ? `Alertas: ${engineOutputs.data_quality.alerts.join("; ")}` : "Sem alertas"}

--- DISCLAIMER ---
${RESULT_MESSAGES.PROFESSIONAL_USE}

=== FIM DO RESUMO ===
`;

  return summary.trim();
}

export function ResultActions({
  engineOutputs,
  canonical,
  patientName,
  caseId,
  reportRef,
  onSaveNote,
  onRecalculate,
}: ResultActionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    setIsExporting(true);
    try {
      const element = reportRef.current;
      const filename = `regenapp-resultado${patientName ? `-${patientName.replace(/\s/g, "-")}` : ""}${caseId ? `-${caseId}` : ""}.pdf`;

      const opt = {
        margin: [10, 10, 15, 10],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: "avoid-all" },
      };

      await html2pdf().set(opt).from(element).save();

      toast({
        title: "PDF exportado",
        description: "O relatório foi salvo como PDF.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySummary = async () => {
    setIsCopying(true);
    try {
      const summary = generateClinicalSummary(engineOutputs, canonical, patientName);
      await navigator.clipboard.writeText(summary);

      toast({
        title: "Resumo copiado",
        description: "O resumo foi copiado para a área de transferência.",
      });
    } catch (error) {
      console.error("Error copying summary:", error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o resumo.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  const handleSaveNote = async () => {
    if (!onSaveNote) return;

    setIsSaving(true);
    try {
      const summary = generateClinicalSummary(engineOutputs, canonical, patientName);
      await onSaveNote(summary);

      toast({
        title: "Nota salva",
        description: "A nota clínica foi salva no prontuário.",
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a nota clínica.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      {/* Recalcular - primeiro botão quando resultado existe */}
      {onRecalculate && (
        <Button 
          onClick={onRecalculate} 
          variant="default" 
          className="gap-2 bg-primary"
          disabled={isRecalculating}
        >
          <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? "Recalculando..." : "Recalcular Resultado"}
        </Button>
      )}

      <Button onClick={handleExportPDF} variant="outline" className="gap-2" disabled={isExporting}>
        <FileDown className="h-4 w-4" />
        {isExporting ? "Exportando..." : "Exportar PDF"}
      </Button>

      <Button onClick={handleCopySummary} variant="outline" className="gap-2" disabled={isCopying}>
        <Copy className="h-4 w-4" />
        {isCopying ? "Copiando..." : "Copiar Resumo"}
      </Button>

      {onSaveNote && (
        <Button onClick={handleSaveNote} variant="outline" className="gap-2" disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Nota Clínica"}
        </Button>
      )}

      <Button onClick={handlePrint} variant="secondary" className="gap-2">
        <Printer className="h-4 w-4" />
        Imprimir
      </Button>
    </div>
  );
}

// Export the summary generator for external use
export { generateClinicalSummary };
