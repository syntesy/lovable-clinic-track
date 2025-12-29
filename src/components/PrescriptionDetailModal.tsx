import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, Send, Eye, EyeOff, Salad, Pill, Sparkles } from "lucide-react";
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
  onVisibilityChange?: () => void;
}

const prescriptionTypes = {
  alimentar: { label: "Cuidados Alimentares", icon: Salad, color: "text-green-600" },
  medicamentosa: { label: "Medicações", icon: Pill, color: "text-blue-600" },
  suplementar: { label: "Suplementos", icon: Sparkles, color: "text-purple-600" },
};

export function PrescriptionDetailModal({
  open,
  onOpenChange,
  prescription,
  patientName,
  onVisibilityChange,
}: PrescriptionDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!prescription) return null;

  const typeInfo = prescriptionTypes[prescription.prescription_type as keyof typeof prescriptionTypes];
  const Icon = typeInfo?.icon || Pill;

  const handlePrint = () => {
    const printContent = document.getElementById("prescription-print-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receituário - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page { 
            margin: 15mm; 
            size: A4;
          }
          
          * {
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #1e293b;
            max-width: 100%;
            margin: 0;
            padding: 30px;
            background: #fff;
          }
          
          .prescription-container {
            border: 2px solid #4B705D;
            border-radius: 12px;
            padding: 30px;
            position: relative;
            min-height: calc(100vh - 60px);
          }
          
          .header { 
            text-align: center; 
            padding-bottom: 20px; 
            margin-bottom: 25px;
            border-bottom: 2px solid #4B705D;
          }
          
          .header img { 
            height: 70px; 
          }
          
          .date-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4B705D 0%, #5d8a6f 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          
          .patient-section {
            background: linear-gradient(135deg, #f0f4f2 0%, #e8eeeb 100%);
            padding: 20px 24px;
            border-radius: 10px;
            margin-bottom: 25px;
            border-left: 4px solid #4B705D;
          }
          
          .patient-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #4B705D;
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .patient-name { 
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
          }
          
          .prescription-type-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 18px;
            background: #4B705D;
            color: white;
            border-radius: 25px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          
          .prescription-title {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #1e293b;
            padding-bottom: 10px;
            border-bottom: 1px dashed #cbd5e1;
          }
          
          .prescription-content {
            white-space: pre-wrap;
            font-size: 15px;
            line-height: 1.9;
            padding: 24px;
            background: #fafbfc;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            margin-bottom: 25px;
            color: #334155;
          }
          
          .notes-section {
            background: linear-gradient(135deg, #fef9e7 0%, #fdf6e3 100%);
            border: 1px solid #f0d78c;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 25px;
          }
          
          .notes-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #b8860b;
            font-weight: 600;
            margin-bottom: 6px;
          }
          
          .notes-content {
            font-size: 14px;
            color: #6b5a00;
            font-style: italic;
          }
          
          .footer {
            margin-top: auto;
            padding-top: 40px;
            text-align: center;
          }
          
          .signature-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          
          .signature-line {
            width: 280px;
            height: 1px;
            background: linear-gradient(90deg, transparent, #4B705D, #4B705D, transparent);
            margin-top: 50px;
          }
          
          .signature-text {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .footer-badge {
            margin-top: 20px;
            padding: 8px 20px;
            background: #f1f5f3;
            border-radius: 20px;
            font-size: 10px;
            color: #4B705D;
            font-weight: 500;
            letter-spacing: 0.5px;
          }
          
          @media print {
            body { 
              padding: 0; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .prescription-container {
              border: 2px solid #4B705D;
              min-height: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="prescription-container">
          <div class="date-badge">
            ${format(new Date(prescription.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          
          <div class="header">
            <img src="${logoRegenapp}" alt="RegenApp Logo" />
          </div>
          
          <div class="patient-section">
            <div class="patient-label">Paciente</div>
            <h2 class="patient-name">${patientName}</h2>
          </div>
          
          <div class="prescription-type-badge">
            ${typeInfo?.label || prescription.prescription_type}
          </div>
          
          <div class="prescription-title">${prescription.title}</div>
          
          <div class="prescription-content">${prescription.content}</div>
          
          ${prescription.notes ? `
            <div class="notes-section">
              <div class="notes-label">Observações</div>
              <div class="notes-content">${prescription.notes}</div>
            </div>
          ` : ""}
          
          <div class="footer">
            <div class="signature-area">
              <div class="signature-line"></div>
              <div class="signature-text">Assinatura e Carimbo do Profissional</div>
            </div>
            <div class="footer-badge">Documento gerado pelo Sistema RegenApp</div>
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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto border-2 border-primary/20 p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Icon className={`w-5 h-5`} />
            Receituário
          </DialogTitle>
        </DialogHeader>

        {/* A4 Paper Preview - 210mm x 297mm ratio (1:1.414) */}
        <div 
          id="prescription-print-content" 
          className="bg-white border-2 border-primary/30 rounded-lg shadow-lg mx-auto"
          style={{ 
            width: '100%',
            maxWidth: '595px', // A4 width in pixels at 72dpi
            aspectRatio: '210 / 297',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Cabeçalho do Receituário */}
          <div className="text-center border-b-2 border-primary/30 pb-4 mb-5 relative">
            <img src={logoRegenapp} alt="RegenApp Logo" className="h-14 mx-auto" />
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs">
              {format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>

          {/* Info do Paciente */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 rounded-lg border-l-4 border-primary mb-4">
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-0.5">Paciente</p>
            <p className="font-bold text-base text-foreground">{patientName}</p>
          </div>

          {/* Tipo e Título */}
          <div className="space-y-2 mb-4">
            <Badge className="gap-1 bg-primary text-primary-foreground px-3 py-1 text-[10px] uppercase tracking-wide">
              <Icon className="w-3 h-3" />
              {typeInfo?.label || prescription.prescription_type}
            </Badge>
            <h3 className="text-lg font-bold text-foreground border-b border-dashed border-border pb-2">
              {prescription.title}
            </h3>
          </div>

          {/* Conteúdo da Prescrição */}
          <div className="bg-secondary/30 p-4 rounded-lg border border-border flex-1 mb-4 overflow-y-auto">
            <p className="whitespace-pre-wrap text-foreground leading-relaxed text-sm">
              {prescription.content}
            </p>
          </div>

          {/* Observações */}
          {prescription.notes && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
              <p className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold mb-0.5">
                Observações
              </p>
              <p className="text-xs text-amber-900 dark:text-amber-200 italic">
                {prescription.notes}
              </p>
            </div>
          )}

          {/* Rodapé com assinatura */}
          <div className="mt-auto pt-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-56 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Assinatura e Carimbo do Profissional
              </p>
            </div>
            <div className="mt-4 inline-block bg-muted/50 px-4 py-1.5 rounded-full">
              <p className="text-[9px] text-muted-foreground tracking-wide">
                Documento gerado pelo Sistema RegenApp
              </p>
            </div>
          </div>
        </div>

        {/* Status de Visibilidade - fora do paper */}
        <div className="flex items-center justify-center gap-2 text-sm bg-muted/50 px-4 py-2 rounded-lg mt-4">
          {prescription.is_visible_to_patient ? (
            <>
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Visível na área do paciente</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Não visível para o paciente</span>
            </>
          )}
        </div>

        <Separator className="my-4" />

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2 border-primary/30 hover:bg-primary/5">
            <Printer className="w-4 h-4" />
            Imprimir PDF
          </Button>
          <Button
            onClick={handleToggleVisibility}
            disabled={isUpdating}
            variant={prescription.is_visible_to_patient ? "secondary" : "default"}
            className="flex-1 gap-2"
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
