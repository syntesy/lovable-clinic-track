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
          @page { margin: 20mm; }
          body { 
            font-family: 'Georgia', serif; 
            line-height: 1.6; 
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #1a5f4a; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          .header img { height: 50px; margin-bottom: 10px; }
          .header h1 { 
            font-size: 24px; 
            margin: 0; 
            color: #1a5f4a;
            letter-spacing: 2px;
          }
          .header p { margin: 5px 0; font-size: 12px; color: #666; }
          .patient-info {
            background: #f8f9fa;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .patient-info h2 { 
            margin: 0 0 5px 0; 
            font-size: 18px;
            color: #333;
          }
          .patient-info p { margin: 0; font-size: 13px; color: #666; }
          .prescription-type {
            display: inline-block;
            padding: 5px 15px;
            background: #1a5f4a;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
          }
          .prescription-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
          }
          .prescription-content {
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.8;
            padding: 20px;
            background: #fafafa;
            border-left: 4px solid #1a5f4a;
            margin-bottom: 25px;
          }
          .notes {
            font-style: italic;
            color: #666;
            font-size: 13px;
            padding: 15px;
            background: #fff9e6;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .notes strong { color: #333; }
          .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #ddd;
            text-align: center;
          }
          .signature-line {
            width: 250px;
            border-top: 1px solid #333;
            margin: 60px auto 10px;
          }
          .footer p { font-size: 12px; color: #666; margin: 5px 0; }
          .date { text-align: right; font-size: 13px; color: #666; margin-bottom: 20px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RECEITUÁRIO</h1>
          <p>Fisioterapia Regenerativa</p>
        </div>
        
        <div class="date">
          ${format(new Date(prescription.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        
        <div class="patient-info">
          <h2>Paciente: ${patientName}</h2>
        </div>
        
        <div class="prescription-type">${typeInfo?.label || prescription.prescription_type}</div>
        
        <div class="prescription-title">${prescription.title}</div>
        
        <div class="prescription-content">${prescription.content}</div>
        
        ${prescription.notes ? `<div class="notes"><strong>Observações:</strong> ${prescription.notes}</div>` : ""}
        
        <div class="footer">
          <div class="signature-line"></div>
          <p>Assinatura e Carimbo do Profissional</p>
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${typeInfo?.color}`} />
            Receituário
          </DialogTitle>
        </DialogHeader>

        <div id="prescription-print-content" className="space-y-6">
          {/* Cabeçalho do Receituário */}
          <div className="text-center border-b border-primary/30 pb-4">
            <img src={logoRegenapp} alt="Logo" className="h-12 mx-auto mb-2" />
            <h2 className="text-xl font-semibold text-primary tracking-wide">RECEITUÁRIO</h2>
            <p className="text-sm text-muted-foreground">Fisioterapia Regenerativa</p>
          </div>

          {/* Info do Paciente e Data */}
          <div className="flex justify-between items-start">
            <div className="bg-muted/50 px-4 py-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Paciente</p>
              <p className="font-medium text-foreground">{patientName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium text-foreground">
                {format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Tipo e Título */}
          <div className="space-y-3">
            <Badge variant="secondary" className="gap-1">
              <Icon className="w-3 h-3" />
              {typeInfo?.label || prescription.prescription_type}
            </Badge>
            <h3 className="text-lg font-semibold text-foreground">{prescription.title}</h3>
          </div>

          {/* Conteúdo da Prescrição */}
          <div className="bg-muted/30 p-5 rounded-lg border-l-4 border-primary">
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {prescription.content}
            </p>
          </div>

          {/* Observações */}
          {prescription.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
              <p className="text-sm">
                <span className="font-medium text-amber-700 dark:text-amber-400">Observações: </span>
                <span className="text-amber-800 dark:text-amber-300">{prescription.notes}</span>
              </p>
            </div>
          )}

          {/* Status de Visibilidade */}
          <div className="flex items-center gap-2 text-sm">
            {prescription.is_visible_to_patient ? (
              <>
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-green-700 dark:text-green-400">Visível na área do paciente</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Não visível para o paciente</span>
              </>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
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
