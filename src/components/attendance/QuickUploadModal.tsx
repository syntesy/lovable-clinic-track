import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { useUploadAttendanceFile } from "@/hooks/useAttendance";

interface QuickUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string;
  patientId: string;
}

type FileType = 'exam' | 'report' | 'image' | 'photo' | 'other';

interface PendingFile {
  file: File;
  customName: string;
  fileType: FileType;
}

export function QuickUploadModal({
  open,
  onOpenChange,
  attendanceId,
  patientId,
}: QuickUploadModalProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = useUploadAttendanceFile();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    const newFiles: PendingFile[] = Array.from(selectedFiles).map((file) => ({
      file,
      customName: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for display
      fileType: 'other' as FileType,
    }));

    setPendingFiles((prev) => [...prev, ...newFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updatePendingFile = (index: number, updates: Partial<PendingFile>) => {
    setPendingFiles((prev) =>
      prev.map((pf, i) => (i === index ? { ...pf, ...updates } : pf))
    );
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const pf of pendingFiles) {
        // Create a new file with the custom name + original extension
        const ext = pf.file.name.split('.').pop() || '';
        const finalName = pf.customName + (ext ? `.${ext}` : '');
        
        await uploadMutation.mutateAsync({
          attendanceId,
          patientId,
          file: pf.file,
          fileType: pf.fileType,
          description: pf.customName,
          customFileName: finalName,
        });
      }

      setPendingFiles([]);
      onOpenChange(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setPendingFiles([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Arquivos
          </DialogTitle>
          <DialogDescription>
            Selecione arquivos e dê um nome personalizado para cada um
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* File selector */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Clique para selecionar arquivos
              </p>
              <p className="text-xs text-muted-foreground">
                Imagens, PDFs, documentos
              </p>
            </div>
          </div>

          {/* Pending files list */}
          {pendingFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Arquivos selecionados ({pendingFiles.length})
              </Label>
              
              {pendingFiles.map((pf, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted/50 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        Original: {pf.file.name}
                      </p>
                      <div className="space-y-2">
                        <Input
                          value={pf.customName}
                          onChange={(e) =>
                            updatePendingFile(index, { customName: e.target.value })
                          }
                          placeholder="Nome do arquivo"
                          className="h-8 text-sm"
                          disabled={isUploading}
                        />
                        <Select
                          value={pf.fileType}
                          onValueChange={(v) =>
                            updatePendingFile(index, { fileType: v as FileType })
                          }
                          disabled={isUploading}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exam">Exame</SelectItem>
                            <SelectItem value="report">Relatório</SelectItem>
                            <SelectItem value="image">Imagem</SelectItem>
                            <SelectItem value="photo">Foto</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removePendingFile(index)}
                      disabled={isUploading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={pendingFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ""}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
