import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrintPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "exams" | "orientations";
  patientName: string;
  content: string[] | string;
  date?: Date;
}

export function PrintPreviewModal({
  open,
  onOpenChange,
  type,
  patientName,
  content,
  date = new Date()
}: PrintPreviewModalProps) {
  const formattedDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedDateShort = format(date, "dd/MM/yyyy");

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = type === "exams" 
      ? generateExamsPrintHTML(patientName, content as string[], formattedDateShort)
      : generateOrientationsPrintHTML(patientName, content as string, formattedDateShort);

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            {type === "exams" ? "Conferência - Solicitação de Exames" : "Conferência - Orientações ao Paciente"}
          </DialogTitle>
        </DialogHeader>

        {/* Informações de Conferência */}
        <div className="px-6 py-4 bg-muted/30 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Paciente:</span>
              <p className="font-semibold text-foreground">{patientName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Data:</span>
              <p className="font-semibold text-foreground">{formattedDate}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Clínica:</span>
              <p className="font-semibold text-foreground">Fisioterapia Regenerativa</p>
            </div>
          </div>
        </div>

        {/* Preview do Documento */}
        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="p-6">
            {type === "exams" ? (
              <ExamsPreview exams={content as string[]} patientName={patientName} date={formattedDateShort} />
            ) : (
              <OrientationsPreview orientations={content as string} patientName={patientName} date={formattedDateShort} />
            )}
          </div>
        </ScrollArea>

        {/* Botões de Ação */}
        <div className="p-6 border-t bg-background flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar / Editar
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Confirmar e Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Preview Components
function ExamsPreview({ exams, patientName, date }: { exams: string[]; patientName: string; date: string }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-8 text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-primary pb-4 mb-6">
        <h1 className="text-xl font-bold text-primary">FISIOTERAPIA REGENERATIVA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solicitação de Exames – Triagem Biológica Pré-PRP
        </p>
      </div>

      {/* Patient Info */}
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Nome do Paciente:</span>
            <p className="font-semibold">{patientName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data da Solicitação:</span>
            <p className="font-semibold">{date}</p>
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="mb-6">
        <h3 className="font-semibold text-primary border-b pb-2 mb-4">EXAMES SOLICITADOS</h3>
        <div className="space-y-2">
          {exams.map((exam, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2 border-b border-dashed last:border-0">
              <span className="text-primary text-lg">☐</span>
              <span className="text-sm">{exam}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Standard Text */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-muted-foreground italic">
        Exames solicitados como investigação complementar para avaliação biológica prévia a procedimentos regenerativos.
      </div>

      {/* Footer */}
      <div className="border-t pt-6">
        <div className="text-center mb-8">
          <div className="w-64 mx-auto border-t border-foreground pt-2">
            <p className="text-sm">Assinatura e Carimbo do Profissional</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p className="font-medium">OBSERVAÇÃO IMPORTANTE:</p>
          <p>Este documento não substitui avaliação médica.</p>
          <p>A decisão terapêutica final depende da análise clínica completa.</p>
        </div>
      </div>
    </div>
  );
}

function OrientationsPreview({ orientations, patientName, date }: { orientations: string; patientName: string; date: string }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-8 text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-primary pb-4 mb-6">
        <h1 className="text-xl font-bold text-primary">FISIOTERAPIA REGENERATIVA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Orientações ao Paciente – Triagem Biológica Pré-PRP
        </p>
      </div>

      {/* Patient Info */}
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Nome do Paciente:</span>
            <p className="font-semibold">{patientName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data:</span>
            <p className="font-semibold">{date}</p>
          </div>
        </div>
      </div>

      {/* Orientations Content */}
      <div className="mb-6">
        <h3 className="font-semibold text-primary border-b pb-2 mb-4">ORIENTAÇÕES</h3>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {orientations}
        </div>
      </div>

      {/* Safety Warning */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm">
        <p className="font-semibold text-amber-800 mb-2">⚠️ AVISO DE SEGURANÇA:</p>
        <p className="text-amber-700">
          As orientações acima não substituem acompanhamento profissional.
          Em caso de dúvidas ou sintomas novos, procure seu profissional de saúde.
        </p>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
        <p>Fisioterapia Regenerativa</p>
        <p>Documento gerado em: {date}</p>
      </div>
    </div>
  );
}

// HTML Generators for Print
function generateExamsPrintHTML(patientName: string, exams: string[], date: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Solicitação de Exames - ${patientName}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background: white;
        }
        .page {
          max-width: 190mm;
          margin: 0 auto;
          padding: 10mm 0;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0;
          font-size: 22pt;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .header .subtitle {
          color: #4b5563;
          margin: 8px 0 0;
          font-size: 11pt;
        }
        .patient-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px 20px;
          margin-bottom: 25px;
        }
        .patient-box table {
          width: 100%;
          border-collapse: collapse;
        }
        .patient-box td {
          padding: 5px 0;
        }
        .patient-box .label {
          color: #6b7280;
          font-size: 10pt;
          width: 150px;
        }
        .patient-box .value {
          font-weight: bold;
          font-size: 11pt;
        }
        .section-title {
          color: #1e40af;
          font-size: 12pt;
          font-weight: bold;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .exams-list {
          margin-bottom: 25px;
        }
        .exam-item {
          display: flex;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px dashed #d1d5db;
        }
        .exam-item:last-child {
          border-bottom: none;
        }
        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #1e40af;
          border-radius: 3px;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .exam-name {
          font-size: 11pt;
        }
        .note-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 12px 15px;
          font-size: 10pt;
          font-style: italic;
          color: #1e40af;
          margin-bottom: 40px;
        }
        .signature-area {
          text-align: center;
          margin: 50px 0 30px;
        }
        .signature-line {
          width: 250px;
          border-top: 1px solid #1a1a1a;
          margin: 0 auto;
          padding-top: 8px;
          font-size: 10pt;
        }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          text-align: center;
        }
        .footer .warning {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 15px;
        }
        .footer .warning-title {
          font-weight: bold;
          color: #92400e;
          font-size: 10pt;
          margin-bottom: 5px;
        }
        .footer .warning-text {
          color: #a16207;
          font-size: 9pt;
          line-height: 1.4;
        }
        .footer .clinic {
          font-size: 9pt;
          color: #6b7280;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <h1>FISIOTERAPIA REGENERATIVA</h1>
          <p class="subtitle">Solicitação de Exames – Triagem Biológica Pré-PRP</p>
        </div>
        
        <div class="patient-box">
          <table>
            <tr>
              <td class="label">Nome do Paciente:</td>
              <td class="value">${patientName}</td>
            </tr>
            <tr>
              <td class="label">Data da Solicitação:</td>
              <td class="value">${date}</td>
            </tr>
            <tr>
              <td class="label">Profissional Responsável:</td>
              <td class="value">_________________________________</td>
            </tr>
          </table>
        </div>
        
        <div class="section-title">EXAMES SOLICITADOS</div>
        
        <div class="exams-list">
          ${exams.map(exam => `
            <div class="exam-item">
              <div class="checkbox"></div>
              <span class="exam-name">${exam}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="note-box">
          Exames solicitados como investigação complementar para avaliação biológica prévia a procedimentos regenerativos.
        </div>
        
        <div class="signature-area">
          <div class="signature-line">
            Assinatura e Carimbo do Profissional
          </div>
        </div>
        
        <div class="footer">
          <div class="warning">
            <div class="warning-title">OBSERVAÇÃO IMPORTANTE</div>
            <div class="warning-text">
              Este documento não substitui avaliação médica.<br>
              A decisão terapêutica final depende da análise clínica completa.
            </div>
          </div>
          <div class="clinic">
            Fisioterapia Regenerativa • Documento gerado em: ${date}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOrientationsPrintHTML(patientName: string, orientations: string, date: string): string {
  // Format orientations for better readability
  const formattedOrientations = orientations
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => `<p style="margin: 8px 0;">${line}</p>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orientações ao Paciente - ${patientName}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background: white;
        }
        .page {
          max-width: 190mm;
          margin: 0 auto;
          padding: 10mm 0;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0;
          font-size: 22pt;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .header .subtitle {
          color: #4b5563;
          margin: 8px 0 0;
          font-size: 11pt;
        }
        .patient-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px 20px;
          margin-bottom: 25px;
        }
        .patient-box table {
          width: 100%;
          border-collapse: collapse;
        }
        .patient-box td {
          padding: 5px 0;
        }
        .patient-box .label {
          color: #6b7280;
          font-size: 10pt;
          width: 150px;
        }
        .patient-box .value {
          font-weight: bold;
          font-size: 11pt;
        }
        .section-title {
          color: #1e40af;
          font-size: 12pt;
          font-weight: bold;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .content {
          margin-bottom: 30px;
          font-size: 11pt;
        }
        .content p {
          margin: 8px 0;
        }
        .warning-box {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 15px 20px;
          margin-bottom: 25px;
        }
        .warning-box .warning-icon {
          font-size: 16pt;
          margin-bottom: 8px;
        }
        .warning-box .warning-title {
          font-weight: bold;
          color: #92400e;
          font-size: 11pt;
          margin-bottom: 8px;
        }
        .warning-box .warning-text {
          color: #a16207;
          font-size: 10pt;
          line-height: 1.5;
        }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          text-align: center;
        }
        .footer .clinic {
          font-size: 10pt;
          color: #4b5563;
          font-weight: 500;
        }
        .footer .date {
          font-size: 9pt;
          color: #6b7280;
          margin-top: 5px;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <h1>FISIOTERAPIA REGENERATIVA</h1>
          <p class="subtitle">Orientações ao Paciente – Triagem Biológica Pré-PRP</p>
        </div>
        
        <div class="patient-box">
          <table>
            <tr>
              <td class="label">Nome do Paciente:</td>
              <td class="value">${patientName}</td>
            </tr>
            <tr>
              <td class="label">Data:</td>
              <td class="value">${date}</td>
            </tr>
          </table>
        </div>
        
        <div class="section-title">ORIENTAÇÕES</div>
        
        <div class="content">
          ${formattedOrientations}
        </div>
        
        <div class="warning-box">
          <div class="warning-icon">⚠️</div>
          <div class="warning-title">AVISO DE SEGURANÇA</div>
          <div class="warning-text">
            As orientações acima não substituem acompanhamento profissional.<br>
            Em caso de dúvidas ou sintomas novos, procure seu profissional de saúde.
          </div>
        </div>
        
        <div class="footer">
          <div class="clinic">Fisioterapia Regenerativa</div>
          <div class="date">Documento gerado em: ${date}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
