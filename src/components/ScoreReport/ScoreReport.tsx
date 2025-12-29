import { useState, useRef } from "react";
import { FileDown, Share2, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComputedResult, FisioRegenFormData } from "@/types/fisioregen-score";
import { ScoreReportHeader } from "./ScoreReportHeader";
import { ScoreGauge } from "./ScoreGauge";
import { ScoreFactors } from "./ScoreFactors";
import { ScoreRecommendations } from "./ScoreRecommendations";
import { ScoreAptitudeStatus } from "./ScoreAptitudeStatus";
import { ProcedureSelection } from "./ProcedureSelection";
import { ScoreDisclaimer } from "./ScoreDisclaimer";
import { toast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";

interface ScoreReportProps {
  result: ComputedResult;
  formData: FisioRegenFormData;
  patientName?: string;
  onReset: () => void;
  onSaveToPatientPortal?: (procedure: string | null) => Promise<void>;
  isProfessionalView?: boolean;
}

export function ScoreReport({ 
  result, 
  formData, 
  patientName,
  onReset,
  onSaveToPatientPortal,
  isProfessionalView = true
}: ScoreReportProps) {
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const isApt = !result.bloqueio && result.biological_readiness_score >= 40;

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `relatorio-score-clinico${patientName ? `-${patientName.replace(/\s/g, '-')}` : ''}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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

  const handleSaveToPatientPortal = async () => {
    if (!onSaveToPatientPortal) return;
    
    setIsSaving(true);
    try {
      await onSaveToPatientPortal(selectedProcedure);
      toast({
        title: "Relatório compartilhado",
        description: "O relatório está disponível na área do paciente.",
      });
    } catch (error) {
      console.error("Error saving to patient portal:", error);
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getProcedureLabel = () => {
    if (!selectedProcedure) return null;
    switch (selectedProcedure) {
      case "prp": return "PRP (Plasma Rico em Plaquetas)";
      case "prf": return "PRF (Fibrina Rica em Plaquetas)";
      case "ortobiologicos": return "Ortobiológicos";
      default: return selectedProcedure;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action buttons - only visible for professionals */}
      {isProfessionalView && (
        <div className="flex flex-wrap gap-3 mb-6 print:hidden">
          <Button onClick={handleExportPDF} variant="outline" className="gap-2" disabled={isExporting}>
            <FileDown className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar PDF"}
          </Button>
          
          {onSaveToPatientPortal && (
            <Button onClick={handleSaveToPatientPortal} variant="outline" className="gap-2" disabled={isSaving}>
              <Share2 className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Compartilhar com Paciente"}
            </Button>
          )}
          
          <Button onClick={onReset} variant="secondary" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Nova Avaliação
          </Button>
        </div>
      )}

      {/* Report content */}
      <div 
        ref={reportRef} 
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 print:shadow-none print:p-4"
      >
        <ScoreReportHeader />
        
        {patientName && (
          <div className="mb-6 text-center">
            <p className="text-[#797E88]">Paciente:</p>
            <p className="text-lg font-semibold text-[#051F41]">{patientName}</p>
          </div>
        )}

        <ScoreGauge result={result} />
        
        <ScoreFactors result={result} formData={formData} />
        
        <ScoreRecommendations result={result} formData={formData} />
        
        <ScoreAptitudeStatus result={result} />

        {/* Procedure shown in report if selected */}
        {selectedProcedure && (
          <div className="mt-6 rounded-xl p-4 bg-blue-50 border border-blue-200 print:block">
            <p className="text-sm text-[#797E88]">Procedimento planejado:</p>
            <p className="font-semibold text-[#051F41]">{getProcedureLabel()}</p>
          </div>
        )}
        
        <ScoreDisclaimer />
        
        {/* Report date */}
        <div className="mt-6 text-center text-sm text-[#797E88]">
          Relatório gerado em: {new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Procedure selection - only for professionals */}
      {isProfessionalView && (
        <ProcedureSelection
          isApt={isApt}
          selectedProcedure={selectedProcedure}
          onProcedureChange={setSelectedProcedure}
          onSave={() => {}}
        />
      )}

      {/* Patient view button */}
      {!isProfessionalView && (
        <div className="mt-6 flex justify-center print:hidden">
          <Button onClick={handleExportPDF} className="gap-2" disabled={isExporting}>
            <FileDown className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Baixar PDF"}
          </Button>
        </div>
      )}
    </div>
  );
}
