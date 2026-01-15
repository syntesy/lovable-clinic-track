import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  FileText, 
  Image, 
  Trash2, 
  Download,
  Loader2,
  File,
  Camera,
  TestTube,
  ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAttendanceFiles, useUploadAttendanceFile, useDeleteAttendanceFile } from "@/hooks/useAttendance";
import { AttendanceFile } from "@/types/attendance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AttendanceDocumentsStepProps {
  attendanceId: string;
  patientId: string;
  disabled?: boolean;
}

const fileTypeLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  exam: { label: "Exame", icon: TestTube },
  report: { label: "Relatório", icon: ClipboardList },
  image: { label: "Imagem", icon: Image },
  photo: { label: "Foto", icon: Camera },
  other: { label: "Outro", icon: File },
};

export function AttendanceDocumentsStep({
  attendanceId,
  patientId,
  disabled,
}: AttendanceDocumentsStepProps) {
  const [selectedFileType, setSelectedFileType] = useState<'exam' | 'report' | 'image' | 'photo' | 'other'>('other');
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: files = [], isLoading } = useAttendanceFiles(attendanceId);
  const uploadMutation = useUploadAttendanceFile();
  const deleteMutation = useDeleteAttendanceFile();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    for (const file of Array.from(selectedFiles)) {
      await uploadMutation.mutateAsync({
        attendanceId,
        patientId,
        file,
        fileType: selectedFileType,
        description: description || undefined,
      });
    }

    setDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (file: AttendanceFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("attendance-files")
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleDelete = async (file: AttendanceFile) => {
    if (!confirm("Tem certeza que deseja remover este arquivo?")) return;
    await deleteMutation.mutateAsync(file);
  };

  const groupedFiles = files.reduce((acc, file) => {
    const type = file.file_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(file);
    return acc;
  }, {} as Record<string, AttendanceFile[]>);

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Documentos
          </CardTitle>
          <CardDescription>
            Anexe exames, imagens, fotos ou outros documentos relacionados a este atendimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Arquivo</Label>
              <Select
                value={selectedFileType}
                onValueChange={(v) => setSelectedFileType(v as typeof selectedFileType)}
                disabled={disabled}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Ressonância do joelho direito"
                disabled={disabled}
              />
            </div>
          </div>

          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
              disabled={disabled || uploadMutation.isPending}
            />
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Enviando...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique ou arraste arquivos aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  Imagens, PDFs, documentos Word (máx. 50MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Arquivos Anexados
            <Badge variant="secondary" className="ml-2">
              {files.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum arquivo anexado</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFiles).map(([type, typeFiles]) => {
                const typeInfo = fileTypeLabels[type] || fileTypeLabels.other;
                const Icon = typeInfo.icon;

                return (
                  <div key={type}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {typeInfo.label}s ({typeFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {typeFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.file_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {format(new Date(file.uploaded_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </span>
                              {file.description && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{file.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(file)}
                              className="h-8 w-8"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {!disabled && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(file)}
                                disabled={deleteMutation.isPending}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
