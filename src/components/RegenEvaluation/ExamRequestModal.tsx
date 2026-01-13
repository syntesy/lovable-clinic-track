/**
 * Exam Request Modal - Gerar Solicitação de Exames
 * 
 * UNIFICADO: Usa o catálogo canônico de exames (exam-catalog.ts) como fonte única.
 * Exames são pré-selecionados com base no snapshot da triagem (recommendedExams prop).
 * 
 * AGRUPAMENTO: Exibe painéis (ex: Hemograma Completo) com expand/collapse para analitos.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Printer, FileText, AlertCircle, ChevronDown, ChevronRight, Beaker } from "lucide-react";
import {
  normalizeExamListGrouped,
  getExamLabel,
  isCriticalExam,
  isLabPanel,
  getPanelComponents,
  getPanelDetailedLabel,
  getCriticalPanelCodes,
  getAdditionalExamCodes,
  getAdditionalPanelCodes,
  LAB_PANELS,
  EXAM_CATALOG,
} from "@/lib/exam-catalog";

interface ExamRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName?: string;
  /** Exames recomendados pelo snapshot da triagem (fonte: analysis_result ou recommended_exams) */
  recommendedExams?: string[];
  onGenerate?: (selectedExams: string[], observations: string) => void;
}

export function ExamRequestModal({
  open,
  onOpenChange,
  patientName,
  recommendedExams,
  onGenerate
}: ExamRequestModalProps) {
  const [observations, setObservations] = useState("");
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

  // Normaliza os exames recomendados da triagem (AGRUPADOS)
  const normalizedRecommended = useMemo(() => {
    return normalizeExamListGrouped(recommendedExams);
  }, [recommendedExams]);

  // Painéis críticos (sempre obrigatórios)
  const criticalPanels = useMemo(() => getCriticalPanelCodes(), []);
  
  // Exames e painéis adicionais
  const additionalExams = useMemo(() => getAdditionalExamCodes(), []);
  const additionalPanels = useMemo(() => getAdditionalPanelCodes(), []);

  // Estado: inicia com painéis críticos + recomendados da triagem
  const [selectedExams, setSelectedExams] = useState<Set<string>>(() => {
    const initial = new Set(criticalPanels);
    normalizedRecommended.forEach(code => initial.add(code));
    return initial;
  });

  // Atualiza seleção quando recommendedExams muda
  useEffect(() => {
    const newSet = new Set(criticalPanels);
    normalizedRecommended.forEach(code => newSet.add(code));
    setSelectedExams(newSet);
  }, [normalizedRecommended, criticalPanels]);

  // Exames/painéis adicionais que vieram da triagem (não-críticos)
  const triagemAdditionalExams = useMemo(() => {
    return normalizedRecommended.filter(code => !isCriticalExam(code));
  }, [normalizedRecommended]);

  // Exames opcionais que NÃO vieram da triagem (e não são componentes de painéis já selecionados)
  const otherOptionalItems = useMemo(() => {
    const allOptional = [...additionalExams, ...additionalPanels];
    return allOptional.filter(code => !normalizedRecommended.includes(code));
  }, [additionalExams, additionalPanels, normalizedRecommended]);

  const toggleExam = (examCode: string) => {
    const newSet = new Set(selectedExams);
    if (newSet.has(examCode)) {
      // Não permitir desmarcar exames/painéis críticos
      if (!isCriticalExam(examCode)) {
        newSet.delete(examCode);
      }
    } else {
      newSet.add(examCode);
    }
    setSelectedExams(newSet);
  };

  const togglePanelExpand = (panelCode: string) => {
    const newSet = new Set(expandedPanels);
    if (newSet.has(panelCode)) {
      newSet.delete(panelCode);
    } else {
      newSet.add(panelCode);
    }
    setExpandedPanels(newSet);
  };

  const handleGenerate = () => {
    const exams = Array.from(selectedExams);
    onGenerate?.(exams, observations);
    onOpenChange(false);
  };

  const handlePrint = () => {
    const exams = Array.from(selectedExams);
    
    // Ordenar: críticos primeiro
    const sortedExams = exams.sort((a, b) => {
      if (isCriticalExam(a) && !isCriticalExam(b)) return -1;
      if (!isCriticalExam(a) && isCriticalExam(b)) return 1;
      return getExamLabel(a).localeCompare(getExamLabel(b), "pt-BR");
    });
    
    const printContent = `
      <html>
        <head>
          <title>Solicitação de Exames - REGENAPP</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; font-size: 14px; margin-top: 20px; }
            .patient { margin: 20px 0; padding: 10px; background: #f5f5f5; }
            .exam-list { list-style: none; padding: 0; }
            .exam-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
            .critical { font-weight: bold; }
            .from-triage { color: #0066cc; }
            .panel-detail { font-size: 12px; color: #666; font-style: italic; }
            .disclaimer { margin-top: 30px; padding: 15px; background: #fff3cd; font-size: 12px; }
            .footer { margin-top: 40px; font-size: 11px; color: #666; }
            .observations { margin-top: 20px; padding: 10px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>SOLICITAÇÃO DE EXAMES LABORATORIAIS</h1>
          <h2>Avaliação REGENAPP</h2>
          
          ${patientName ? `<div class="patient"><strong>Paciente:</strong> ${patientName}</div>` : ''}
          
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          
          <h2>Exames Solicitados:</h2>
          <ul class="exam-list">
            ${sortedExams.map(code => {
              const critical = isCriticalExam(code);
              const panel = isLabPanel(code);
              const fromTriage = normalizedRecommended.includes(code) && !critical;
              
              // Para painéis, usa o label detalhado na impressão
              const label = panel 
                ? (getPanelDetailedLabel(code) || getExamLabel(code))
                : getExamLabel(code);
              
              return `<li class="${critical ? 'critical' : ''} ${fromTriage ? 'from-triage' : ''}">${label}${critical ? ' (crítico)' : ''}${fromTriage ? ' (recomendado pela triagem)' : ''}</li>`;
            }).join('')}
          </ul>
          
          ${observations ? `
            <div class="observations">
              <strong>Observações:</strong><br/>
              ${observations}
            </div>
          ` : ''}
          
          <div class="disclaimer">
            <strong>AVISO:</strong> Avaliação em andamento. Exames necessários para completar 
            avaliação biológica. Este documento não constitui indicação de procedimento.
          </div>
          
          <div class="footer">
            <p>Documento gerado pelo sistema REGENAPP</p>
            <p>Este documento é informativo e faz parte do processo de avaliação.</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Renderiza um item de exame (painel ou exame avulso)
  const renderExamItem = (code: string, options: { disabled?: boolean; highlight?: boolean } = {}) => {
    const { disabled = false, highlight = false } = options;
    const isPanel = isLabPanel(code);
    const critical = isCriticalExam(code);
    const isExpanded = expandedPanels.has(code);
    const components = isPanel ? getPanelComponents(code) : [];

    if (isPanel && components.length > 0) {
      return (
        <Collapsible key={code} open={isExpanded} onOpenChange={() => togglePanelExpand(code)}>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`exam-${code}`}
              checked={selectedExams.has(code)}
              disabled={disabled || critical}
              onCheckedChange={() => !disabled && toggleExam(code)}
            />
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={`text-sm leading-none flex items-center gap-1 ${
                  disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:underline'
                } ${highlight ? 'text-blue-700 dark:text-blue-400' : ''} ${critical ? 'font-medium' : ''}`}
              >
                <Beaker className="w-3 h-3" />
                {getExamLabel(code)}
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="ml-6 mt-1 pl-2 border-l-2 border-muted">
            <p className="text-xs text-muted-foreground mb-1">Inclui:</p>
            <ul className="space-y-0.5">
              {components.map(comp => (
                <li key={comp} className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                  {getExamLabel(comp)}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div key={code} className="flex items-center space-x-2">
        <Checkbox
          id={`exam-${code}`}
          checked={selectedExams.has(code)}
          disabled={disabled || critical}
          onCheckedChange={() => !disabled && toggleExam(code)}
        />
        <label
          htmlFor={`exam-${code}`}
          className={`text-sm leading-none ${
            disabled || critical ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
          } ${highlight ? 'text-blue-700 dark:text-blue-400' : ''} ${critical ? 'font-medium' : ''}`}
        >
          {getExamLabel(code)}
        </label>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Solicitação de Exames
          </DialogTitle>
          <DialogDescription>
            Selecione os exames a serem solicitados. Painéis críticos são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Painéis Críticos (sempre obrigatórios) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              Exames Críticos
              <Badge variant="secondary" className="text-xs">Obrigatórios</Badge>
            </Label>
            <div className="space-y-2">
              {criticalPanels.map(code => renderExamItem(code, { disabled: true }))}
            </div>
          </div>

          {/* Exames Recomendados pela Triagem (se houver) */}
          {triagemAdditionalExams.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                Recomendados pela Triagem
                <Badge className="text-xs bg-blue-500/20 text-blue-700 border-blue-500/30">
                  Pré-selecionados
                </Badge>
              </Label>
              <div className="space-y-2">
                {triagemAdditionalExams.map(code => renderExamItem(code, { highlight: true }))}
              </div>
            </div>
          )}

          {/* Exames Adicionais Opcionais */}
          {otherOptionalItems.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Exames Adicionais (Opcionais)</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {otherOptionalItems.map(code => renderExamItem(code))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              placeholder="Observações adicionais para o laboratório..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button onClick={handleGenerate} className="gap-2">
            <FileText className="w-4 h-4" />
            Confirmar e Gerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
