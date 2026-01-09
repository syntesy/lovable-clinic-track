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
import logoRegenapp from "@/assets/logo-regenapp-new.png";

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

  const formattedDate = format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR });
  const displayPatientName = patientName || "—";
  const displayDate = formattedDate || "—";
  const displayProfessionalName = professionalName || "Nome do Profissional";
  const displayProfessionalSpecialty = professionalSpecialty || "Especialidade";

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
        <title>Prescrição - ${displayPatientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
          
          @page { 
            margin: 15mm; 
            size: A4;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.5; 
            color: #051F41;
            background: #FFFFFF;
            padding: 0;
            margin: 0;
          }
          
          .paper {
            width: 100%;
            min-height: 100vh;
            padding: 48px;
            display: flex;
            flex-direction: column;
            background: #FFFFFF;
          }
          
          /* LOGO */
          .logo-section {
            text-align: center;
            padding-bottom: 18px;
            margin-bottom: 28px;
            border-bottom: 1px solid #D6D9DE;
          }
          
          .logo-section img {
            height: 56px;
          }
          
          /* CAIXA IDENTIFICAÇÃO */
          .identification-box {
            background: #F2F3F5;
            border: 1px solid #D6D9DE;
            border-radius: 24px;
            padding: 22px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          
          .id-column {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .id-label {
            font-size: 13px;
            font-weight: 600;
            color: #051F41;
          }
          
          .id-value {
            font-size: 13px;
            font-weight: 400;
            color: #797E88;
          }
          
          /* SEÇÕES */
          .section-title {
            font-size: 13px;
            font-weight: 600;
            color: #051F41;
            margin-bottom: 12px;
          }
          
          .content-box {
            background: #F2F3F5;
            border: 1px solid #D6D9DE;
            border-radius: 24px;
            padding: 22px;
            margin-bottom: 24px;
          }
          
          .prescription-box {
            min-height: 260px;
          }
          
          .observations-box {
            min-height: 120px;
          }
          
          .content-text {
            font-size: 13px;
            font-weight: 400;
            color: #797E88;
            white-space: pre-wrap;
            line-height: 1.6;
          }
          
          /* PROFISSIONAL */
          .professional-section {
            margin-top: 26px;
          }
          
          .professional-name {
            font-size: 13px;
            font-weight: 400;
            color: #051F41;
          }
          
          .professional-specialty {
            font-size: 13px;
            font-weight: 400;
            color: #797E88;
            margin-top: 2px;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .paper {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="paper">
          <!-- LOGO -->
          <div class="logo-section">
            <img src="${logoRegenapp}" alt="SYNTESY" />
          </div>
          
          <!-- IDENTIFICAÇÃO -->
          <div class="identification-box">
            <div class="id-column">
              <span class="id-label">NOME:</span>
              <span class="id-value">${displayPatientName}</span>
            </div>
            <div class="id-column" style="text-align: right;">
              <span class="id-label">DATA:</span>
              <span class="id-value">${displayDate}</span>
            </div>
          </div>
          
          <!-- PRESCRIÇÃO -->
          <div class="section-title">PRESCRIÇÃO</div>
          <div class="content-box prescription-box">
            <div class="content-text">${prescription.content || ""}</div>
          </div>
          
          <!-- OBSERVAÇÕES -->
          <div class="section-title">OBSERVAÇÕES</div>
          <div class="content-box observations-box">
            <div class="content-text">${prescription.notes || ""}</div>
          </div>
          
          <!-- PROFISSIONAL -->
          <div class="professional-section">
            <div class="professional-name">${displayProfessionalName}</div>
            <div class="professional-specialty">${displayProfessionalSpecialty}</div>
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
        <div className="mx-4 sm:mx-6 my-4">
          <div 
            className="bg-white mx-auto"
            style={{ 
              maxWidth: '680px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              borderRadius: '20px',
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* LOGO */}
            <div 
              className="text-center pb-[18px] mb-[28px]"
              style={{ borderBottom: '1px solid #D6D9DE' }}
            >
              <img src={logoRegenapp} alt="SYNTESY" className="h-14 mx-auto" />
            </div>

            {/* CAIXA IDENTIFICAÇÃO */}
            <div 
              className="flex justify-between mb-6"
              style={{ 
                background: '#F2F3F5',
                border: '1px solid #D6D9DE',
                borderRadius: '24px',
                padding: '22px',
              }}
            >
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#051F41' }}>
                  NOME:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 400, color: '#797E88' }}>
                  {displayPatientName}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#051F41' }}>
                  DATA:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 400, color: '#797E88' }}>
                  {displayDate}
                </span>
              </div>
            </div>

            {/* PRESCRIÇÃO */}
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#051F41', marginBottom: '12px' }}>
              PRESCRIÇÃO
            </div>
            <div 
              style={{ 
                background: '#F2F3F5',
                border: '1px solid #D6D9DE',
                borderRadius: '24px',
                padding: '22px',
                minHeight: '260px',
                marginBottom: '24px',
              }}
            >
              <p style={{ fontSize: '13px', fontWeight: 400, color: '#797E88', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {prescription.content || ""}
              </p>
            </div>

            {/* OBSERVAÇÕES */}
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#051F41', marginBottom: '12px' }}>
              OBSERVAÇÕES
            </div>
            <div 
              style={{ 
                background: '#F2F3F5',
                border: '1px solid #D6D9DE',
                borderRadius: '24px',
                padding: '22px',
                minHeight: '120px',
                marginBottom: '26px',
              }}
            >
              <p style={{ fontSize: '13px', fontWeight: 400, color: '#797E88', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {prescription.notes || ""}
              </p>
            </div>

            {/* PROFISSIONAL - SEM CAIXA, SEM CONTORNO */}
            <div>
              <p style={{ fontSize: '13px', fontWeight: 400, color: '#051F41' }}>
                {displayProfessionalName}
              </p>
              <p style={{ fontSize: '13px', fontWeight: 400, color: '#797E88', marginTop: '2px' }}>
                {displayProfessionalSpecialty}
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
