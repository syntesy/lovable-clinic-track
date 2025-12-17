import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, Image, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  type: "image" | "pdf";
}

interface ExamFileUploadProps {
  patientId: string;
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
}

const ACCEPTED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf"
};

export function ExamFileUpload({ patientId, onFilesChange, files }: ExamFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        // Validate file type
        if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
          toast.error(`Tipo de arquivo não suportado: ${file.name}`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Arquivo muito grande: ${file.name} (máx. 10MB)`);
          continue;
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${patientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('exam-files')
          .upload(fileName, file);

        if (error) {
          console.error("Upload error:", error);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('exam-files')
          .getPublicUrl(fileName);

        // For private bucket, we need signed URL
        const { data: signedData } = await supabase.storage
          .from('exam-files')
          .createSignedUrl(fileName, 3600 * 24); // 24 hours

        const fileUrl = signedData?.signedUrl || urlData.publicUrl;

        newFiles.push({
          id: data.path,
          name: file.name,
          url: fileUrl,
          uploadedAt: new Date(),
          type: file.type.startsWith('image/') ? 'image' : 'pdf'
        });
      }

      onFilesChange([...files, ...newFiles]);
      
      if (newFiles.length > 0) {
        toast.success(`${newFiles.length} arquivo(s) enviado(s) com sucesso`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivos");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    try {
      // Remove from storage
      const { error } = await supabase.storage
        .from('exam-files')
        .remove([fileId]);

      if (error) {
        console.error("Delete error:", error);
        toast.error("Erro ao remover arquivo");
        return;
      }

      onFilesChange(files.filter(f => f.id !== fileId));
      toast.success("Arquivo removido");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao remover arquivo");
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-6 hover:border-primary/50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="exam-file-input"
        />
        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2 text-center">
          Arraste ou clique para anexar exames
        </p>
        <p className="text-xs text-muted-foreground/70 mb-3 text-center">
          Formatos aceitos: JPG, PNG, WEBP, PDF (máx. 10MB)
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivos
            </>
          )}
        </Button>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Card className="bg-background/50">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-3">
              Arquivos anexados ({files.length})
            </p>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {file.type === 'image' ? (
                        <Image className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(file.uploadedAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          O sistema irá extrair automaticamente os valores dos exames das imagens e PDFs usando OCR/Vision.
          Valores ilegíveis serão sinalizados para conferência manual.
        </p>
      </div>
    </div>
  );
}
