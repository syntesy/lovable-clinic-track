import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileDown, Send, Eye, EyeOff } from "lucide-react";
import logoRegenapp from "@/assets/logo-regenapp.png";

interface PrescriptionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: {
    id: string;
    title: string;
    content: string;
    prescription_type: string;
    notes?: string | null;
    is_visible_to_patient?: boolean;
    created_at: string;
  } | null;
  patientName: string;
  professionalName?: string;
  professionalSpecialty?: string;
  onVisibilityChange?: () => void;
}

export function PrescriptionDetailModal({
  open,
  onOpenChange,
  prescription,
  patientName,
  professionalName = "",
  professionalSpecialty = "",
  onVisibilityChange,
}: PrescriptionDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!prescription) return null;

  const formattedDate = format(new Date(prescription.created_at), "dd / MM / yyyy", { locale: ptBR });

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescrição - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page { 
            margin: 20mm; 
            size: A4;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #051F41;
            background: #FFFFFF;
            padding: 0;
            margin: 0;
          }
          
          .document {
            width: 100%;
            min-height: 100vh;
            padding: 50px 60px;
            display: flex;
            flex-direction: column;
          }
          
          /* CABEÇALHO */
          .header {
            text-align: center;
            padding-bottom: 30px;
            margin-bottom: 40px;
            border-bottom: 1px solid #797E88;
          }
          
          .header img {
            height: 80px;
            margin-bottom: 12px;
          }
          
          .header-app-name {
            font-size: 16px;
            color: #051F41;
            font-weight: 600;
            letter-spacing: 4px;
            text-transform: uppercase;
          }
          
          /* IDENTIFICAÇÃO */
          .identification {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 50px;
            gap: 40px;
          }
          
          .field {
            display: flex;
            align-items: baseline;
            gap: 8px;
          }
          
          .field-label {
            font-size: 14px;
            font-weight: 600;
            color: #051F41;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
          }
          
          .field-value {
            font-size: 16px;
            color: #797E88;
            padding-bottom: 2px;
            border-bottom: 1px solid #797E88;
            min-width: 200px;
          }
          
          .field-value.name {
            flex: 1;
            min-width: 300px;
          }
          
          /* PRESCRIÇÃO */
          .section {
            margin-bottom: 40px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #051F41;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 20px;
          }
          
          .section-content {
            font-size: 15px;
            line-height: 2;
            color: #051F41;
            white-space: pre-wrap;
          }
          
          /* OBSERVAÇÕES */
          .observations-content {
            font-size: 14px;
            line-height: 1.8;
            color: #797E88;
          }
          
          /* ASSINATURA */
          .signature {
            margin-top: auto;
            padding-top: 60px;
            text-align: left;
          }
          
          .signature-line {
            width: 280px;
            border-top: 1px solid #051F41;
            padding-top: 12px;
          }
          
          .signature-name {
            font-size: 16px;
            font-weight: 600;
            color: #051F41;
          }
          
          .signature-specialty {
            font-size: 14px;
            color: #797E88;
            margin-top: 4px;
          }
          
          /* RODAPÉ */
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #797E88;
            text-align: center;
          }
          
          .footer p {
            font-size: 10px;
            color: #797E88;
            line-height: 1.6;
            max-width: 450px;
            margin: 0 auto;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .document {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="document">
          <!-- CABEÇALHO -->
          <div class="header">
            <img src="${logoRegenapp}" alt="REGENAPP" />
            <div class="header-app-name">REGENAPP</div>
          </div>
          
          <!-- IDENTIFICAÇÃO -->
          <div class="identification">
            <div class="field" style="flex: 1;">
              <span class="field-label">NOME:</span>
              <span class="field-value name">${patientName}</span>
            </div>
            <div class="field">
              <span class="field-label">DATA:</span>
              <span class="field-value">${formattedDate}</span>
            </div>
          </div>
          
          <!-- PRESCRIÇÃO -->
          <div class="section">
            <h2 class="section-title">Prescrição</h2>
            <div class="section-content">${prescription.content}</div>
          </div>
          
          ${prescription.notes ? `
          <!-- OBSERVAÇÕES -->
          <div class="section">
            <h2 class="section-title">Observações</h2>
            <div class="observations-content">${prescription.notes}</div>
          </div>
          ` : ""}
          
          <!-- ASSINATURA -->
          ${professionalName ? `
          <div class="signature">
            <div class="signature-line">
              <div class="signature-name">${professionalName}</div>
              ${professionalSpecialty ? `<div class="signature-specialty">${professionalSpecialty}</div>` : ""}
            </div>
          </div>
          ` : ""}
          
          <!-- RODAPÉ -->
          <div class="footer">
            <p>
              Este documento foi gerado pelo REGENAPP como apoio à prática clínica.
              Siga exclusivamente as orientações do seu profissional de saúde.
              O REGENAPP não substitui a consulta ou o julgamento profissional.
            </p>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleToggleVisibility = async () => {
    setIsUpdating(true);
    try {
      const newVisibility = !prescription.is_visible_to_patient;
      const { error } = await supabase
        .from("patient_prescriptions")
        .update({ is_visible_to_patient: newVisibility })
        .eq("id", prescription.id);

      if (error) throw error;

      toast.success(
        newVisibility
          ? "Prescrição enviada para área do paciente"
          : "Prescrição removida da área do paciente"
      );
      onVisibilityChange?.();
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Erro ao atualizar visibilidade");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 bg-[#f5f5f5]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-[#051F41]">
            Documento de Prescrição
          </DialogTitle>
        </DialogHeader>

        {/* Paper Document - A4 Style */}
        <div className="mx-6 my-4">
          <div 
            className="bg-white mx-auto"
            style={{ 
              maxWidth: '680px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              aspectRatio: '210 / 297',
              padding: '48px 56px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="text-center pb-6 mb-8" style={{ borderBottom: '1px solid #797E88' }}>
              <img src={logoRegenapp} alt="REGENAPP" className="h-16 mx-auto mb-3" />
              <p 
                className="text-sm font-semibold tracking-[4px] uppercase"
                style={{ color: '#051F41' }}
              >
                REGENAPP
              </p>
            </div>

            {/* Identification - Paper Style */}
            <div className="flex justify-between items-end mb-10 gap-8">
              <div className="flex items-baseline gap-2 flex-1">
                <span 
                  className="text-sm font-semibold uppercase whitespace-nowrap"
                  style={{ color: '#051F41' }}
                >
                  NOME:
                </span>
                <span 
                  className="text-base pb-0.5 flex-1"
                  style={{ 
                    color: '#797E88',
                    borderBottom: '1px solid #797E88',
                    minWidth: '180px'
                  }}
                >
                  {patientName}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-sm font-semibold uppercase whitespace-nowrap"
                  style={{ color: '#051F41' }}
                >
                  DATA:
                </span>
                <span 
                  className="text-base pb-0.5"
                  style={{ 
                    color: '#797E88',
                    borderBottom: '1px solid #797E88',
                    minWidth: '120px'
                  }}
                >
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Prescription Section */}
            <div className="mb-8 flex-1">
              <h2 
                className="text-sm font-bold uppercase tracking-[2px] mb-4"
                style={{ color: '#051F41' }}
              >
                Prescrição
              </h2>
              <p 
                className="text-[15px] leading-8 whitespace-pre-wrap"
                style={{ color: '#051F41' }}
              >
                {prescription.content}
              </p>
            </div>

            {/* Observations Section */}
            {prescription.notes && (
              <div className="mb-8">
                <h2 
                  className="text-sm font-bold uppercase tracking-[2px] mb-4"
                  style={{ color: '#051F41' }}
                >
                  Observações
                </h2>
                <p 
                  className="text-sm leading-7"
                  style={{ color: '#797E88' }}
                >
                  {prescription.notes}
                </p>
              </div>
            )}

            {/* Signature */}
            {professionalName && (
              <div className="mt-auto pt-12">
                <div 
                  className="pt-3"
                  style={{ 
                    borderTop: '1px solid #051F41',
                    width: '240px'
                  }}
                >
                  <p className="font-semibold" style={{ color: '#051F41' }}>
                    {professionalName}
                  </p>
                  {professionalSpecialty && (
                    <p className="text-sm mt-1" style={{ color: '#797E88' }}>
                      {professionalSpecialty}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Footer Disclaimer */}
            <div 
              className="mt-auto pt-6 text-center"
              style={{ borderTop: '1px solid #797E88' }}
            >
              <p 
                className="text-[10px] leading-5 max-w-md mx-auto"
                style={{ color: '#797E88' }}
              >
                Este documento foi gerado pelo REGENAPP como apoio à prática clínica.
                Siga exclusivamente as orientações do seu profissional de saúde.
                O REGENAPP não substitui a consulta ou o julgamento profissional.
              </p>
            </div>
          </div>
        </div>

        {/* Status and Actions - Outside the document */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-center gap-2 text-sm bg-white/80 px-4 py-2 rounded-lg">
            {prescription.is_visible_to_patient ? (
              <>
                <Eye className="w-4 h-4" style={{ color: '#051F41' }} />
                <span className="font-medium" style={{ color: '#051F41' }}>Visível na área do paciente</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Não visível para o paciente</span>
              </>
            )}
          </div>
        </div>

        {/* Actions - Outside the document */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 pt-2 bg-[#f5f5f5]">
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            className="flex-1 gap-2 bg-white hover:bg-gray-50"
            style={{ borderColor: '#051F41', color: '#051F41' }}
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button
            onClick={handleToggleVisibility}
            disabled={isUpdating}
            variant={prescription.is_visible_to_patient ? "secondary" : "default"}
            className="flex-1 gap-2"
            style={!prescription.is_visible_to_patient ? { backgroundColor: '#051F41' } : {}}
          >
            {prescription.is_visible_to_patient ? (
              <>
                <EyeOff className="w-4 h-4" />
                Remover da Área do Paciente
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar para Área do Paciente
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
