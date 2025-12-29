import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileDown, Send, Eye, EyeOff, Heart, Pill, Sparkles } from "lucide-react";
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

const prescriptionTypes = {
  cuidados_gerais: { label: "Cuidados Gerais", icon: Heart, color: "text-rose-600" },
  medicacoes: { label: "Medicações", icon: Pill, color: "text-blue-600" },
  suplementacoes: { label: "Suplementações", icon: Sparkles, color: "text-amber-600" },
  // Legacy types for backwards compatibility
  alimentar: { label: "Cuidados Gerais", icon: Heart, color: "text-rose-600" },
  medicamentosa: { label: "Medicações", icon: Pill, color: "text-blue-600" },
  suplementar: { label: "Suplementações", icon: Sparkles, color: "text-amber-600" },
};

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

  const typeInfo = prescriptionTypes[prescription.prescription_type as keyof typeof prescriptionTypes];

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
            line-height: 1.6; 
            color: #051F41;
            background: #FFFFFF;
            padding: 0;
            margin: 0;
            min-height: 100vh;
          }
          
          .document-container {
            width: 100%;
            min-height: 100vh;
            padding: 40px;
            display: flex;
            flex-direction: column;
          }
          
          /* HEADER */
          .header {
            text-align: center;
            padding-bottom: 24px;
            margin-bottom: 24px;
            border-bottom: 1px solid #797E88;
          }
          
          .header img {
            height: 60px;
            margin-bottom: 8px;
          }
          
          .header-app-name {
            font-size: 14px;
            color: #797E88;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          
          /* BLOCO IDENTIFICAÇÃO */
          .identification-block {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          
          .field-group label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #051F41;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .field-group span {
            display: block;
            font-size: 16px;
            color: #797E88;
            font-weight: 500;
          }
          
          /* BLOCO PRESCRIÇÃO */
          .section-title {
            font-size: 13px;
            font-weight: 600;
            color: #051F41;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          
          .prescription-block {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            flex: 1;
            min-height: 200px;
          }
          
          .prescription-content {
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.8;
            color: #051F41;
          }
          
          /* BLOCO OBSERVAÇÕES */
          .observations-block {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 24px;
          }
          
          .observations-content {
            font-size: 13px;
            line-height: 1.7;
            color: #797E88;
            font-style: italic;
          }
          
          /* BLOCO PROFISSIONAL */
          .professional-block {
            margin-bottom: 32px;
          }
          
          .professional-name {
            font-size: 16px;
            font-weight: 600;
            color: #051F41;
            margin-bottom: 4px;
          }
          
          .professional-specialty {
            font-size: 14px;
            color: #797E88;
          }
          
          /* AVISOS DE RESPONSABILIDADE */
          .disclaimer {
            margin-top: auto;
            padding-top: 24px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
          }
          
          .disclaimer p {
            font-size: 10px;
            color: #797E88;
            line-height: 1.6;
            max-width: 500px;
            margin: 0 auto;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .document-container {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="document-container">
          <!-- HEADER -->
          <div class="header">
            <img src="${logoRegenapp}" alt="REGENAPP Logo" />
            <div class="header-app-name">REGENAPP</div>
          </div>
          
          <!-- BLOCO IDENTIFICAÇÃO -->
          <div class="identification-block">
            <div class="field-group">
              <label>Nome</label>
              <span>${patientName}</span>
            </div>
            <div class="field-group">
              <label>Data</label>
              <span>${format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          </div>
          
          <!-- BLOCO PRESCRIÇÃO -->
          <div class="section-title">Prescrição</div>
          <div class="prescription-block">
            <div class="prescription-content">${prescription.content}</div>
          </div>
          
          ${prescription.notes ? `
          <!-- BLOCO OBSERVAÇÕES -->
          <div class="section-title">Observações</div>
          <div class="observations-block">
            <div class="observations-content">${prescription.notes}</div>
          </div>
          ` : ""}
          
          <!-- BLOCO PROFISSIONAL -->
          ${professionalName ? `
          <div class="professional-block">
            <div class="professional-name">${professionalName}</div>
            ${professionalSpecialty ? `<div class="professional-specialty">${professionalSpecialty}</div>` : ""}
          </div>
          ` : ""}
          
          <!-- AVISOS DE RESPONSABILIDADE -->
          <div class="disclaimer">
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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2" style={{ color: '#051F41' }}>
            Documento de Prescrição
          </DialogTitle>
        </DialogHeader>

        {/* Document Preview - A4 Format */}
        <div 
          className="mx-6 bg-white border rounded-xl shadow-sm overflow-hidden"
          style={{ 
            borderColor: '#E5E7EB',
          }}
        >
          {/* Header */}
          <div className="text-center py-6 border-b" style={{ borderColor: '#797E88' }}>
            <img src={logoRegenapp} alt="REGENAPP Logo" className="h-12 mx-auto mb-2" />
            <p className="text-xs tracking-widest uppercase" style={{ color: '#797E88' }}>
              REGENAPP
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Identification Block */}
            <div 
              className="grid grid-cols-2 gap-4 p-5 rounded-xl border"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#051F41' }}>
                  Nome
                </label>
                <span className="text-base font-medium" style={{ color: '#797E88' }}>
                  {patientName}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#051F41' }}>
                  Data
                </label>
                <span className="text-base font-medium" style={{ color: '#797E88' }}>
                  {format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Prescription Block */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#051F41' }}>
                Prescrição
              </h3>
              <div 
                className="p-5 rounded-xl border min-h-[150px]"
                style={{ borderColor: '#E5E7EB' }}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#051F41' }}>
                  {prescription.content}
                </p>
              </div>
            </div>

            {/* Observations Block */}
            {prescription.notes && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#051F41' }}>
                  Observações
                </h3>
                <div 
                  className="p-5 rounded-xl border"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <p className="text-sm italic leading-relaxed" style={{ color: '#797E88' }}>
                    {prescription.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Professional Block */}
            {professionalName && (
              <div className="pt-2">
                <p className="font-semibold" style={{ color: '#051F41' }}>
                  {professionalName}
                </p>
                {professionalSpecialty && (
                  <p className="text-sm" style={{ color: '#797E88' }}>
                    {professionalSpecialty}
                  </p>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="pt-4 border-t text-center" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-[10px] leading-relaxed max-w-md mx-auto" style={{ color: '#797E88' }}>
                Este documento foi gerado pelo REGENAPP como apoio à prática clínica.
                Siga exclusivamente as orientações do seu profissional de saúde.
                O REGENAPP não substitui a consulta ou o julgamento profissional.
              </p>
            </div>
          </div>
        </div>

        {/* Visibility Status */}
        <div className="mx-6 flex items-center justify-center gap-2 text-sm bg-muted/50 px-4 py-2 rounded-lg">
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

        <Separator className="mx-6" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 pt-0">
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            className="flex-1 gap-2"
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
