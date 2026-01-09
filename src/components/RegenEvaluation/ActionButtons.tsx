/**
 * Action Buttons - Botões de ação baseados no estado
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  ClipboardList, 
  Zap, 
  RefreshCw,
  Download,
  Printer
} from "lucide-react";
import { 
  RegenCaseStatus, 
  getAllowedActions 
} from "@/types/regen-case-status";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface ActionButtonsProps {
  status: RegenCaseStatus;
  isLoading?: boolean;
  onGenerateExamRequest?: () => void;
  onGeneratePreReport?: () => void;
  onGenerateDefinitiveScore?: () => void;
  onRecalculate?: () => void;
  onPrint?: () => void;
  onExportPDF?: () => void;
}

export function ActionButtons({
  status,
  isLoading = false,
  onGenerateExamRequest,
  onGeneratePreReport,
  onGenerateDefinitiveScore,
  onRecalculate,
  onPrint,
  onExportPDF
}: ActionButtonsProps) {
  const actions = getAllowedActions(status);

  const BlockedTooltip = ({ children }: { children: React.ReactNode }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-not-allowed">{children}</span>
      </TooltipTrigger>
      <TooltipContent>
        Disponível apenas após avaliação clínica + exames válidos (S2).
      </TooltipContent>
    </Tooltip>
  );

  return (
    <Card className="bg-muted/30">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Solicitar Exames - S1, S2, S3 */}
          {actions.canGenerateExamRequest && onGenerateExamRequest && (
            <Button 
              variant="outline" 
              onClick={onGenerateExamRequest}
              disabled={isLoading}
              className="gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              Gerar Solicitação de Exames
            </Button>
          )}

          {/* Pré-Relatório - S1, S2, S3 */}
          {actions.canGeneratePreReport && onGeneratePreReport && (
            <Button 
              variant="outline" 
              onClick={onGeneratePreReport}
              disabled={isLoading}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Gerar Pré-Relatório de Triagem
            </Button>
          )}

          {/* Score Definitivo - S2 only */}
          {status === "S2" && actions.canGenerateDefinitiveScore && onGenerateDefinitiveScore && (
            <Button 
              onClick={onGenerateDefinitiveScore}
              disabled={isLoading}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Zap className="w-4 h-4" />
              {isLoading ? "Gerando..." : "Gerar Score Definitivo (SYNTESY)"}
            </Button>
          )}

          {/* Show blocked score button with tooltip in S0/S1 */}
          {(status === "S0" || status === "S1") && onGenerateDefinitiveScore && (
            <BlockedTooltip>
              <Button 
                variant="outline"
                disabled
                className="gap-2 opacity-50"
              >
                <Zap className="w-4 h-4" />
                Gerar Score Definitivo
              </Button>
            </BlockedTooltip>
          )}

          {/* Recalcular - S3 */}
          {actions.canRecalculate && onRecalculate && (
            <Button 
              variant="secondary"
              onClick={onRecalculate}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recalcular Resultado
            </Button>
          )}

          {/* Ações de exportação - sempre visíveis em S3 */}
          {status === "S3" && (
            <>
              {onPrint && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={onPrint}
                      disabled={isLoading}
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Imprimir</TooltipContent>
                </Tooltip>
              )}
              {onExportPDF && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={onExportPDF}
                      disabled={isLoading}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar PDF</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>

        {/* Mensagem contextual */}
        <div className="mt-3 text-xs text-muted-foreground">
          {status === "S0" && (
            "Complete a avaliação clínica para desbloquear as ações."
          )}
          {status === "S1" && (
            "Avaliação clínica concluída. Aguardando exames laboratoriais válidos."
          )}
          {status === "S2" && (
            "Pronto para gerar o Score Definitivo SYNTESY."
          )}
          {status === "S3" && (
            "Score Definitivo gerado. Você pode recalcular se os dados forem alterados."
          )}
        </div>
      </CardContent>
    </Card>
  );
}