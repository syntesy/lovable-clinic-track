import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Edit2, FileText, Send } from "lucide-react";

interface ExtractedText {
  fileName: string;
  text: string;
  success: boolean;
  error?: string;
}

interface ExtractedTextPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedTexts: ExtractedText[];
  consolidatedText: string;
  warnings: string[];
  onConfirm: (finalText: string) => void;
  manualText: string;
}

export function ExtractedTextPreviewModal({
  open,
  onOpenChange,
  extractedTexts,
  consolidatedText,
  warnings,
  onConfirm,
  manualText,
}: ExtractedTextPreviewModalProps) {
  const [editableText, setEditableText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Initialize editable text when modal opens
  useState(() => {
    const combined = manualText 
      ? `${manualText}\n\n--- EXTRAÍDO DE ARQUIVOS ---\n\n${consolidatedText}`
      : consolidatedText;
    setEditableText(combined);
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      const combined = manualText 
        ? `${manualText}\n\n--- EXTRAÍDO DE ARQUIVOS ---\n\n${consolidatedText}`
        : consolidatedText;
      setEditableText(combined);
      setIsEditing(false);
    }
    onOpenChange(isOpen);
  };

  const successCount = extractedTexts.filter(e => e.success).length;
  const failCount = extractedTexts.filter(e => !e.success).length;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Conferência do Texto Extraído
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Summary */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {successCount} arquivo(s) processado(s)
            </Badge>
            {failCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {failCount} arquivo(s) com erro
              </Badge>
            )}
            {manualText && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                + Texto digitado
              </Badge>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
              <p className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Atenção - Conferir manualmente:
              </p>
              <ul className="text-sm text-amber-700/80 list-disc list-inside space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Extracted Text Preview/Edit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">
                Texto que será enviado para análise:
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                {isEditing ? "Visualizar" : "Editar"}
              </Button>
            </div>

            {isEditing ? (
              <Textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Edite o texto extraído se necessário..."
              />
            ) : (
              <ScrollArea className="h-[300px] border rounded-md p-3 bg-muted/20">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {editableText || consolidatedText || "Nenhum texto extraído"}
                </pre>
              </ScrollArea>
            )}
          </div>

          {/* Individual Files Status */}
          {extractedTexts.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Detalhes por arquivo:</p>
              <ScrollArea className="max-h-[150px]">
                <div className="space-y-2">
                  {extractedTexts.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-md text-sm ${
                        item.success 
                          ? "bg-emerald-500/10 text-emerald-700" 
                          : "bg-red-500/10 text-red-700"
                      }`}
                    >
                      <span className="truncate">{item.fileName}</span>
                      {item.success ? (
                        <Badge variant="outline" className="bg-emerald-500/20 border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/20 border-red-500/30">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Erro
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar / Editar
          </Button>
          <Button 
            onClick={() => onConfirm(editableText || consolidatedText)}
            disabled={!editableText && !consolidatedText}
          >
            <Send className="w-4 h-4 mr-2" />
            Confirmar e Enviar para Análise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
