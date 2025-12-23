import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, ArrowLeft, FileText, Ban } from "lucide-react";
import { format } from "date-fns";

interface ExamGroup {
  axis: string;
  exams: string[];
  justification: string;
}

export interface RequestedExam {
  name: string;
  justification?: string;
  type: "required" | "optional";
}

interface PrintPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "exams" | "orientations";
  patientName: string;
  content: ExamGroup[] | RequestedExam[] | string;
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
  const formattedDate = format(date, "dd 'de' MMMM 'de' yyyy");
  const formattedDateShort = format(date, "dd/MM/yyyy");

  // Check if content is the new RequestedExam[] format
  const isRequestedExamFormat = (c: any): c is RequestedExam[] => {
    return Array.isArray(c) && c.length > 0 && 'name' in c[0] && 'type' in c[0];
  };

  // Check if content is the legacy ExamGroup[] format
  const isExamGroupFormat = (c: any): c is ExamGroup[] => {
    return Array.isArray(c) && c.length > 0 && 'axis' in c[0] && 'exams' in c[0];
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let htmlContent: string;
    
    if (type === "exams") {
      if (isRequestedExamFormat(content)) {
        htmlContent = generateRequestedExamsPrintHTML(patientName, content, formattedDateShort);
      } else if (isExamGroupFormat(content)) {
        htmlContent = generateExamsPrintHTML(patientName, content, formattedDateShort);
      } else {
        htmlContent = generateEmptyExamsHTML(patientName, formattedDateShort);
      }
    } else {
      htmlContent = generateOrientationsPrintHTML(patientName, content as string, formattedDateShort);
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const hasExams = type === "exams" && (
    (isRequestedExamFormat(content) && content.length > 0) ||
    (isExamGroupFormat(content) && content.length > 0)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            {type === "exams" ? "Conferência - Solicitação de Exames" : "Conferência - Orientações ao Paciente"}
          </DialogTitle>
        </DialogHeader>

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

        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="p-6">
            {type === "exams" ? (
              isRequestedExamFormat(content) ? (
                <RequestedExamsPreview exams={content} patientName={patientName} date={formattedDateShort} />
              ) : isExamGroupFormat(content) ? (
                <ExamsPreview examGroups={content} patientName={patientName} date={formattedDateShort} />
              ) : (
                <EmptyExamsPreview />
              )
            ) : (
              <OrientationsPreview orientations={content as string} patientName={patientName} date={formattedDateShort} />
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-background flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar / Editar
          </Button>
          <Button 
            onClick={handlePrint} 
            className="gap-2"
            disabled={type === "exams" && !hasExams}
          >
            <Printer className="w-4 h-4" />
            Confirmar e Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyExamsPreview() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
      <Ban className="w-12 h-12 text-amber-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-amber-800 mb-2">Nenhum Exame Indicado</h3>
      <p className="text-amber-700">
        A triagem biológica não indicou exames laboratoriais para este paciente.
      </p>
    </div>
  );
}

function RequestedExamsPreview({ exams, patientName, date }: { exams: RequestedExam[]; patientName: string; date: string }) {
  const requiredExams = exams.filter(e => e.type === "required");
  const optionalExams = exams.filter(e => e.type === "optional");

  return (
    <div className="bg-white border rounded-lg shadow-sm p-8 text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center border-b-2 border-primary pb-4 mb-6">
        <h1 className="text-xl font-bold text-primary">FISIOTERAPIA REGENERATIVA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solicitação de Exames – Triagem Biológica Pré-PRP
        </p>
      </div>

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

      <div className="mb-6">
        <h3 className="font-semibold text-primary border-b pb-2 mb-4">EXAMES SOLICITADOS</h3>
        <div className="space-y-4">
          {requiredExams.length > 0 && (
            <div className="border-l-2 border-red-500 pl-3 py-2">
              <h4 className="font-semibold text-sm text-red-600 mb-2">OBRIGATÓRIOS</h4>
              <div className="space-y-2">
                {requiredExams.map((exam, idx) => (
                  <div key={idx} className="py-1">
                    <div className="flex items-start gap-3">
                      <span className="text-primary text-lg mt-0.5">☐</span>
                      <div>
                        <span className="text-sm font-medium">{exam.name}</span>
                        {exam.justification && (
                          <span className="text-sm text-muted-foreground"> — {exam.justification}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {optionalExams.length > 0 && (
            <div className="border-l-2 border-amber-500 pl-3 py-2">
              <h4 className="font-semibold text-sm text-amber-600 mb-2">OPCIONAIS</h4>
              <div className="space-y-2">
                {optionalExams.map((exam, idx) => (
                  <div key={idx} className="py-1">
                    <div className="flex items-start gap-3">
                      <span className="text-amber-500 text-lg mt-0.5">☐</span>
                      <div>
                        <span className="text-sm font-medium">{exam.name}</span>
                        {exam.justification && (
                          <span className="text-sm text-muted-foreground"> — {exam.justification}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-muted-foreground italic">
        Exames solicitados como investigação complementar para avaliação biológica prévia a procedimentos regenerativos.
      </div>

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

function ExamsPreview({ examGroups, patientName, date }: { examGroups: ExamGroup[]; patientName: string; date: string }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-8 text-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center border-b-2 border-primary pb-4 mb-6">
        <h1 className="text-xl font-bold text-primary">FISIOTERAPIA REGENERATIVA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solicitação de Exames – Triagem Biológica Pré-PRP
        </p>
      </div>

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

      <div className="mb-6">
        <h3 className="font-semibold text-primary border-b pb-2 mb-4">EXAMES SOLICITADOS</h3>
        <div className="space-y-4">
          {examGroups.map((group, idx) => (
            <div key={idx} className="border-l-2 border-primary pl-3 py-2">
              <h4 className="font-semibold text-sm text-primary mb-2">{group.axis}</h4>
              <div className="space-y-1 mb-2">
                {group.exams.map((exam, examIdx) => (
                  <div key={examIdx} className="flex items-center gap-3 py-1">
                    <span className="text-primary text-lg">☐</span>
                    <span className="text-sm">{exam}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic pl-6">
                Justificativa: {group.justification}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-muted-foreground italic">
        Exames solicitados como investigação complementar para avaliação biológica prévia a procedimentos regenerativos.
      </div>

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
      <div className="text-center border-b-2 border-primary pb-4 mb-6">
        <h1 className="text-xl font-bold text-primary">FISIOTERAPIA REGENERATIVA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Orientações ao Paciente – Triagem Biológica Pré-PRP
        </p>
      </div>

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

      <div className="mb-6">
        <h3 className="font-semibold text-primary border-b pb-2 mb-4">ORIENTAÇÕES</h3>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {orientations}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm">
        <p className="font-semibold text-amber-800 mb-2">⚠️ AVISO DE SEGURANÇA:</p>
        <p className="text-amber-700">
          As orientações acima não substituem acompanhamento profissional.
          Em caso de dúvidas ou sintomas novos, procure seu profissional de saúde.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
        <p>Fisioterapia Regenerativa</p>
        <p>Documento gerado em: {date}</p>
      </div>
    </div>
  );
}

function generateRequestedExamsPrintHTML(patientName: string, exams: RequestedExam[], date: string): string {
  const requiredExams = exams.filter(e => e.type === "required");
  const optionalExams = exams.filter(e => e.type === "optional");

  const requiredHTML = requiredExams.length > 0 ? `
    <div class="exam-group required">
      <h4 class="axis-title required">OBRIGATÓRIOS</h4>
      <div class="exams-list">
        ${requiredExams.map(exam => `
          <div class="exam-item">
            <div class="checkbox required"></div>
            <div class="exam-content">
              <span class="exam-name">${exam.name}</span>
              ${exam.justification ? `<span class="exam-justification"> — ${exam.justification}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const optionalHTML = optionalExams.length > 0 ? `
    <div class="exam-group optional">
      <h4 class="axis-title optional">OPCIONAIS</h4>
      <div class="exams-list">
        ${optionalExams.map(exam => `
          <div class="exam-item">
            <div class="checkbox optional"></div>
            <div class="exam-content">
              <span class="exam-name">${exam.name}</span>
              ${exam.justification ? `<span class="exam-justification"> — ${exam.justification}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Solicitação de Exames - ${patientName}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        * { box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background: white;
        }
        .page { max-width: 190mm; margin: 0 auto; padding: 10mm 0; }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 { color: #1e40af; margin: 0; font-size: 22pt; font-weight: bold; letter-spacing: 1px; }
        .header .subtitle { color: #4b5563; margin: 8px 0 0; font-size: 11pt; }
        .patient-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px 20px;
          margin-bottom: 25px;
        }
        .patient-box table { width: 100%; border-collapse: collapse; }
        .patient-box td { padding: 5px 0; }
        .patient-box .label { color: #6b7280; font-size: 10pt; width: 150px; }
        .patient-box .value { font-weight: bold; font-size: 11pt; }
        .section-title {
          color: #1e40af;
          font-size: 12pt;
          font-weight: bold;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .exam-group {
          padding-left: 15px;
          margin-bottom: 20px;
        }
        .exam-group.required { border-left: 3px solid #dc2626; }
        .exam-group.optional { border-left: 3px solid #f59e0b; }
        .axis-title {
          font-size: 11pt;
          font-weight: bold;
          margin: 0 0 10px 0;
        }
        .axis-title.required { color: #dc2626; }
        .axis-title.optional { color: #f59e0b; }
        .exams-list { margin-bottom: 8px; }
        .exam-item {
          display: flex;
          align-items: flex-start;
          padding: 6px 0;
        }
        .checkbox {
          width: 16px;
          height: 16px;
          border: 2px solid #1e40af;
          border-radius: 3px;
          margin-right: 12px;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .checkbox.required { border-color: #dc2626; }
        .checkbox.optional { border-color: #f59e0b; }
        .exam-content { flex: 1; }
        .exam-name { font-size: 11pt; font-weight: 500; }
        .exam-justification { font-size: 10pt; color: #6b7280; }
        .note-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 12px 15px;
          font-size: 10pt;
          font-style: italic;
          color: #1e40af;
          margin: 25px 0 40px;
        }
        .signature-area { text-align: center; margin: 50px 0 30px; }
        .signature-line {
          width: 250px;
          border-top: 1px solid #1a1a1a;
          margin: 0 auto;
          padding-top: 8px;
          font-size: 10pt;
        }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; }
        .footer .warning {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 15px;
        }
        .footer .warning-title { font-weight: bold; color: #92400e; font-size: 10pt; margin-bottom: 5px; }
        .footer .warning-text { color: #a16207; font-size: 9pt; line-height: 1.4; }
        .footer .clinic { font-size: 9pt; color: #6b7280; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
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
        
        ${requiredHTML}
        ${optionalHTML}
        
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

function generateEmptyExamsHTML(patientName: string, date: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Solicitação de Exames - ${patientName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
        .warning { color: #f59e0b; font-size: 18pt; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="warning">⚠️ Nenhum exame indicado pela triagem</div>
      <p>A triagem biológica não indicou exames laboratoriais para ${patientName}.</p>
      <p>Data: ${date}</p>
    </body>
    </html>
  `;
}

function generateExamsPrintHTML(patientName: string, examGroups: ExamGroup[], date: string): string {
  const examGroupsHTML = examGroups.map(group => `
    <div class="exam-group">
      <h4 class="axis-title">${group.axis}</h4>
      <div class="exams-list">
        ${group.exams.map(exam => `
          <div class="exam-item">
            <div class="checkbox"></div>
            <span class="exam-name">${exam}</span>
          </div>
        `).join('')}
      </div>
      <p class="justification">Justificativa: ${group.justification}</p>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Solicitação de Exames - ${patientName}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        * { box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background: white;
        }
        .page { max-width: 190mm; margin: 0 auto; padding: 10mm 0; }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 { color: #1e40af; margin: 0; font-size: 22pt; font-weight: bold; letter-spacing: 1px; }
        .header .subtitle { color: #4b5563; margin: 8px 0 0; font-size: 11pt; }
        .patient-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px 20px;
          margin-bottom: 25px;
        }
        .patient-box table { width: 100%; border-collapse: collapse; }
        .patient-box td { padding: 5px 0; }
        .patient-box .label { color: #6b7280; font-size: 10pt; width: 150px; }
        .patient-box .value { font-weight: bold; font-size: 11pt; }
        .section-title {
          color: #1e40af;
          font-size: 12pt;
          font-weight: bold;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .exam-group {
          border-left: 3px solid #1e40af;
          padding-left: 15px;
          margin-bottom: 20px;
        }
        .axis-title {
          color: #1e40af;
          font-size: 11pt;
          font-weight: bold;
          margin: 0 0 10px 0;
        }
        .exams-list { margin-bottom: 8px; }
        .exam-item {
          display: flex;
          align-items: center;
          padding: 6px 0;
        }
        .checkbox {
          width: 16px;
          height: 16px;
          border: 2px solid #1e40af;
          border-radius: 3px;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .exam-name { font-size: 11pt; }
        .justification {
          font-size: 9pt;
          font-style: italic;
          color: #6b7280;
          margin: 5px 0 0 28px;
        }
        .note-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 12px 15px;
          font-size: 10pt;
          font-style: italic;
          color: #1e40af;
          margin: 25px 0 40px;
        }
        .signature-area { text-align: center; margin: 50px 0 30px; }
        .signature-line {
          width: 250px;
          border-top: 1px solid #1a1a1a;
          margin: 0 auto;
          padding-top: 8px;
          font-size: 10pt;
        }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; }
        .footer .warning {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 15px;
        }
        .footer .warning-title { font-weight: bold; color: #92400e; font-size: 10pt; margin-bottom: 5px; }
        .footer .warning-text { color: #a16207; font-size: 9pt; line-height: 1.4; }
        .footer .clinic { font-size: 9pt; color: #6b7280; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
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
        
        ${examGroupsHTML}
        
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
        @page { size: A4; margin: 20mm; }
        * { box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #1a1a1a;
          margin: 0;
          padding: 0;
          background: white;
        }
        .page { max-width: 190mm; margin: 0 auto; padding: 10mm 0; }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 { color: #1e40af; margin: 0; font-size: 22pt; font-weight: bold; letter-spacing: 1px; }
        .header .subtitle { color: #4b5563; margin: 8px 0 0; font-size: 11pt; }
        .patient-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px 20px;
          margin-bottom: 25px;
        }
        .patient-box table { width: 100%; border-collapse: collapse; }
        .patient-box td { padding: 5px 0; }
        .patient-box .label { color: #6b7280; font-size: 10pt; width: 150px; }
        .patient-box .value { font-weight: bold; font-size: 11pt; }
        .section-title {
          color: #1e40af;
          font-size: 12pt;
          font-weight: bold;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .content { margin-bottom: 25px; font-size: 11pt; line-height: 1.6; }
        .safety-box {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .safety-title { font-weight: bold; color: #92400e; font-size: 11pt; margin-bottom: 8px; }
        .safety-text { color: #a16207; font-size: 10pt; line-height: 1.5; }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          text-align: center;
          font-size: 9pt;
          color: #6b7280;
        }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
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
        
        <div class="safety-box">
          <div class="safety-title">⚠️ AVISO DE SEGURANÇA</div>
          <div class="safety-text">
            As orientações acima não substituem acompanhamento profissional.<br>
            Em caso de dúvidas ou sintomas novos, procure seu profissional de saúde.
          </div>
        </div>
        
        <div class="footer">
          <p>Fisioterapia Regenerativa</p>
          <p>Documento gerado em: ${date}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
