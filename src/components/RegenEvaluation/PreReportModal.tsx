/**
 * Pre-Report Modal - Gerar Pré-Relatório de Triagem
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
import { Printer, FileText, AlertTriangle } from "lucide-react";
import { RegenCanonical } from "@/types/regen-canonical";
import { REQUIRED_CRITICAL_LABS, CRITICAL_LAB_LABELS } from "@/types/regen-case-status";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PreReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName?: string;
  canonical: RegenCanonical | null;
  clinicalAssessment?: {
    chief_complaint?: string | null;
    anamnesis?: string | null;
    physical_exam?: string | null;
    diagnosis?: string | null;
  };
}

export function PreReportModal({
  open,
  onOpenChange,
  patientName,
  canonical,
  clinicalAssessment
}: PreReportModalProps) {

  const handlePrint = () => {
    // Construir conteúdo do pré-relatório
    const printContent = `
      <html>
        <head>
          <title>Pré-Relatório de Triagem - REGENAPP</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { color: #333; font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; font-size: 14px; margin-top: 20px; margin-bottom: 10px; }
            .patient { margin: 20px 0; padding: 10px; background: #f5f5f5; }
            .section { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
            .warning { background: #fff3cd; border-color: #ffc107; }
            .info { background: #e7f3ff; border-color: #0066cc; }
            .disclaimer { margin-top: 30px; padding: 15px; background: #f8d7da; border: 1px solid #f5c6cb; font-size: 12px; }
            .footer { margin-top: 40px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>PRÉ-RELATÓRIO DE TRIAGEM</h1>
          <h2 style="color: #ff6600; font-size: 16px;">AVALIAÇÃO EM ANDAMENTO</h2>
          
          ${patientName ? `<div class="patient"><strong>Paciente:</strong> ${patientName}</div>` : ''}
          
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          
          <div class="section warning">
            <h2>⚠️ LIMITAÇÕES DESTE DOCUMENTO</h2>
            <ul>
              <li>Os dados de triagem são baseados em <strong>AUTORRELATO</strong> do paciente</li>
              <li>Red flags reportados <strong>NÃO ESTÃO CONFIRMADOS CLINICAMENTE</strong></li>
              <li>Este documento <strong>NÃO CONSTITUI RELATÓRIO FINAL</strong></li>
              <li>Decisões clínicas requerem <strong>AVALIAÇÃO PROFISSIONAL COMPLETA</strong></li>
            </ul>
          </div>

          ${canonical?.complaint ? `
          <div class="section">
            <h2>QUEIXA PRINCIPAL (Autorrelato)</h2>
            <p><span class="label">Região:</span><span class="value">${canonical.complaint.pain_region || canonical.complaint.pain_region_text || 'Não informado'}</span></p>
            <p><span class="label">Intensidade da Dor (EVA):</span><span class="value">${canonical.complaint.pain_nrs ?? 'Não informado'}/10</span></p>
            <p><span class="label">Duração dos Sintomas:</span><span class="value">${
              canonical.complaint.symptom_duration_bucket === 'lt_3m' ? 'Menos de 3 meses' :
              canonical.complaint.symptom_duration_bucket === 'm3_6' ? '3 a 6 meses' :
              canonical.complaint.symptom_duration_bucket === 'gt_6m' ? 'Mais de 6 meses' : 'Não informado'
            }</span></p>
            <p><span class="label">Diagnóstico Suspeito:</span><span class="value">${canonical.complaint.suspected_diagnosis || 'Não informado'}</span></p>
          </div>
          ` : ''}

          ${clinicalAssessment?.diagnosis ? `
          <div class="section info">
            <h2>AVALIAÇÃO CLÍNICA PROFISSIONAL</h2>
            <p><span class="label">Queixa Principal:</span></p>
            <p>${clinicalAssessment.chief_complaint || 'Não registrado'}</p>
            <p><span class="label">Anamnese:</span></p>
            <p>${clinicalAssessment.anamnesis || 'Não registrado'}</p>
            <p><span class="label">Exame Físico:</span></p>
            <p>${clinicalAssessment.physical_exam || 'Não registrado'}</p>
            <p><span class="label">Diagnóstico:</span></p>
            <p>${clinicalAssessment.diagnosis || 'Não registrado'}</p>
          </div>
          ` : ''}

          <div class="section">
            <h2>EXAMES LABORATORIAIS NECESSÁRIOS</h2>
            <p>Para completar a avaliação biológica e gerar o Score REGENAPP, são necessários os seguintes exames:</p>
            <ul>
              ${REQUIRED_CRITICAL_LABS.map(lab => `<li><strong>${CRITICAL_LAB_LABELS[lab]}</strong></li>`).join('')}
            </ul>
            <p style="margin-top: 15px;"><strong>Justificativa Científica:</strong></p>
            <p style="font-size: 12px;">
              Os exames acima são fundamentais para avaliação do perfil biológico do paciente, 
              permitindo identificar condições que podem afetar a resposta a terapias regenerativas:
            </p>
            <ul style="font-size: 12px;">
              <li><strong>Hemoglobina/Leucócitos/Plaquetas:</strong> Avaliam capacidade regenerativa celular</li>
              <li><strong>PCR:</strong> Marcador inflamatório sistêmico</li>
              <li><strong>HbA1c:</strong> Controle metabólico e glicação tecidual</li>
              <li><strong>Ferritina:</strong> Reserva de ferro e estado inflamatório crônico</li>
            </ul>
          </div>

          <div class="disclaimer">
            <strong>⚠️ AVISO LEGAL:</strong><br/>
            Este documento é informativo, não é relatório final e não constitui recomendação terapêutica.
            O REGENAPP é um sistema de suporte informacional que não prescreve, não decide e não 
            substitui o julgamento clínico profissional.
          </div>
          
          <div class="footer">
            <p>Documento gerado pelo sistema REGENAPP</p>
            <p>Este pré-relatório faz parte do processo de avaliação e não deve ser utilizado isoladamente para decisões clínicas.</p>
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
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pré-Relatório de Triagem
          </DialogTitle>
          <DialogDescription>
            Documento informativo sobre o status da avaliação em andamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              <strong>AVALIAÇÃO EM ANDAMENTO</strong><br/>
              Este pré-relatório contém dados preliminares baseados em autorrelato. 
              Não constitui relatório final e não deve ser usado para decisões terapêuticas.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>O documento incluirá:</strong></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Resumo da triagem (autorrelato)</li>
              <li>Limitações explícitas do documento</li>
              <li>Justificativa científica dos exames necessários</li>
              <li>Lista de exames solicitados</li>
              <li>Avaliação clínica profissional (se disponível)</li>
            </ul>
          </div>

          <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
            <strong>Disclaimer obrigatório incluído:</strong><br/>
            "Este documento é informativo, não é relatório final e não constitui recomendação terapêutica."
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Gerar e Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}