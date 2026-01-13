/**
 * Exam Request Modal - Gerar Solicitação de Exames
 * 
 * UNIFICADO: Usa o catálogo canônico de exames (exam-catalog.ts) como fonte única.
 * Exames são pré-selecionados com base no snapshot da triagem (recommendedExams prop).
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
import { Printer, FileText, AlertCircle } from "lucide-react";
import {
  normalizeExamList,
  getExamLabel,
  isCriticalExam,
  getCriticalExamCodes,
  getAdditionalExamCodes,
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

  // Normaliza os exames recomendados da triagem
  const normalizedRecommended = useMemo(() => {
    return normalizeExamList(recommendedExams);
  }, [recommendedExams]);

  // Códigos críticos e adicionais do catálogo
  const criticalCodes = useMemo(() => getCriticalExamCodes(), []);
  const additionalCodes = useMemo(() => getAdditionalExamCodes(), []);

  // Estado: inicia com críticos + recomendados da triagem
  const [selectedExams, setSelectedExams] = useState<Set<string>>(() => {
    const initial = new Set(criticalCodes);
    normalizedRecommended.forEach(code => initial.add(code));
    return initial;
  });

  // Atualiza seleção quando recommendedExams muda
  useEffect(() => {
    const newSet = new Set(criticalCodes);
    normalizedRecommended.forEach(code => newSet.add(code));
    setSelectedExams(newSet);
  }, [normalizedRecommended, criticalCodes]);

  // Exames adicionais que vieram da triagem (não-críticos)
  const triagemAdditionalExams = useMemo(() => {
    return normalizedRecommended.filter(code => !isCriticalExam(code));
  }, [normalizedRecommended]);

  // Exames opcionais que NÃO vieram da triagem
  const otherOptionalExams = useMemo(() => {
    return additionalCodes.filter(code => !normalizedRecommended.includes(code));
  }, [additionalCodes, normalizedRecommended]);

  const toggleExam = (examCode: string) => {
    const newSet = new Set(selectedExams);
    if (newSet.has(examCode)) {
      // Não permitir desmarcar exames críticos
      if (!isCriticalExam(examCode)) {
        newSet.delete(examCode);
      }
    } else {
      newSet.add(examCode);
    }
    setSelectedExams(newSet);
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
              const label = getExamLabel(code);
              const critical = isCriticalExam(code);
              const fromTriage = normalizedRecommended.includes(code) && !critical;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Solicitação de Exames
          </DialogTitle>
          <DialogDescription>
            Selecione os exames a serem solicitados. Os exames críticos são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Exames Críticos (sempre obrigatórios) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              Exames Críticos
              <Badge variant="secondary" className="text-xs">Obrigatórios</Badge>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {criticalCodes.map(code => (
                <div key={code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exam-${code}`}
                    checked={selectedExams.has(code)}
                    disabled={true}
                  />
                  <label
                    htmlFor={`exam-${code}`}
                    className="text-sm font-medium leading-none cursor-not-allowed opacity-70"
                  >
                    {getExamLabel(code)}
                  </label>
                </div>
              ))}
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
              <div className="grid grid-cols-2 gap-2">
                {triagemAdditionalExams.map(code => (
                  <div key={code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exam-${code}`}
                      checked={selectedExams.has(code)}
                      onCheckedChange={() => toggleExam(code)}
                    />
                    <label
                      htmlFor={`exam-${code}`}
                      className="text-sm leading-none cursor-pointer text-blue-700 dark:text-blue-400"
                    >
                      {getExamLabel(code)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exames Adicionais Opcionais */}
          {otherOptionalExams.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Exames Adicionais (Opcionais)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {otherOptionalExams.map(code => (
                  <div key={code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exam-${code}`}
                      checked={selectedExams.has(code)}
                      onCheckedChange={() => toggleExam(code)}
                    />
                    <label
                      htmlFor={`exam-${code}`}
                      className="text-sm leading-none cursor-pointer"
                    >
                      {getExamLabel(code)}
                    </label>
                  </div>
                ))}
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
