/**
 * Exam Request Modal - Gerar Solicitação de Exames
 */

import { useState } from "react";
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
import { Printer, FileText } from "lucide-react";
import { REQUIRED_CRITICAL_LABS, CRITICAL_LAB_LABELS, RequiredCriticalLab } from "@/types/regen-case-status";

interface ExamRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName?: string;
  onGenerate?: (selectedExams: string[], observations: string) => void;
}

// Exames adicionais opcionais
const OPTIONAL_EXAMS = [
  { id: "vitamin_d", label: "Vitamina D (25-OH)" },
  { id: "vitamin_b12", label: "Vitamina B12" },
  { id: "iron", label: "Ferro Sérico" },
  { id: "transferrin", label: "Transferrina" },
  { id: "tsh", label: "TSH" },
  { id: "urea", label: "Ureia" },
  { id: "creatinine", label: "Creatinina" },
  { id: "alt", label: "ALT (TGP)" },
  { id: "ast", label: "AST (TGO)" },
];

export function ExamRequestModal({
  open,
  onOpenChange,
  patientName,
  onGenerate
}: ExamRequestModalProps) {
  const [selectedExams, setSelectedExams] = useState<Set<string>>(() => {
    // Iniciar com exames críticos selecionados
    return new Set(REQUIRED_CRITICAL_LABS);
  });
  const [observations, setObservations] = useState("");

  const toggleExam = (examId: string) => {
    const newSet = new Set(selectedExams);
    if (newSet.has(examId)) {
      // Não permitir desmarcar exames críticos
      if (!REQUIRED_CRITICAL_LABS.includes(examId as RequiredCriticalLab)) {
        newSet.delete(examId);
      }
    } else {
      newSet.add(examId);
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
    
    // Criar documento para impressão
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
            ${exams.map(exam => {
              const isCritical = REQUIRED_CRITICAL_LABS.includes(exam as RequiredCriticalLab);
              const label = isCritical 
                ? CRITICAL_LAB_LABELS[exam as RequiredCriticalLab]
                : OPTIONAL_EXAMS.find(e => e.id === exam)?.label || exam;
              return `<li class="${isCritical ? 'critical' : ''}">${label}${isCritical ? ' (obrigatório)' : ''}</li>`;
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
      <DialogContent className="max-w-lg">
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
          {/* Exames Críticos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Exames Críticos (Obrigatórios)</Label>
            <div className="grid grid-cols-2 gap-2">
              {REQUIRED_CRITICAL_LABS.map(lab => (
                <div key={lab} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exam-${lab}`}
                    checked={selectedExams.has(lab)}
                    disabled={true}
                  />
                  <label
                    htmlFor={`exam-${lab}`}
                    className="text-sm font-medium leading-none cursor-not-allowed opacity-70"
                  >
                    {CRITICAL_LAB_LABELS[lab]}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Exames Opcionais */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Exames Adicionais (Opcionais)</Label>
            <div className="grid grid-cols-2 gap-2">
              {OPTIONAL_EXAMS.map(exam => (
                <div key={exam.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exam-${exam.id}`}
                    checked={selectedExams.has(exam.id)}
                    onCheckedChange={() => toggleExam(exam.id)}
                  />
                  <label
                    htmlFor={`exam-${exam.id}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {exam.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

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