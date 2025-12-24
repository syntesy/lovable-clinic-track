import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X, User } from "lucide-react";
import { toast } from "sonner";

interface PatientPhotoUploadProps {
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  patientName?: string;
}

export const PatientPhotoUpload = ({
  photoUrl,
  onPhotoChange,
  patientName = "",
}: PatientPhotoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas imagens");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("patient-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("patient-photos")
        .getPublicUrl(filePath);

      onPhotoChange(urlData.publicUrl);
      toast.success("Foto enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar foto");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split("/patient-photos/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("patient-photos").remove([filePath]);
      }

      onPhotoChange(null);
      toast.success("Foto removida");
    } catch (error) {
      console.error("Erro ao remover foto:", error);
      toast.error("Erro ao remover foto");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32 border-4 border-primary/20">
          <AvatarImage src={photoUrl || undefined} alt={patientName} />
          <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
            {patientName ? getInitials(patientName) : <User className="h-12 w-12" />}
          </AvatarFallback>
        </Avatar>

        {photoUrl && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
            onClick={handleRemovePhoto}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Upload className="h-4 w-4 animate-pulse" />
            Enviando...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            {photoUrl ? "Alterar Foto" : "Adicionar Foto"}
          </>
        )}
      </Button>
    </div>
  );
};
