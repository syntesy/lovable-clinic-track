/**
 * LabUploadPanel
 *
 * Componente de upload de PDF/imagem de exames laboratoriais.
 * Faz upload para o bucket "exam-files", chama analyze-labs e
 * abre o LabReviewModal com os dados extraídos para revisão antes de salvar.
 *
 * Suporta múltiplos PDFs: mescla com labs já existentes via mergeCanonicalLabs.
 */

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  mapAnalyzeLabsToCanonical,
  mergeCanonicalLabs,
  MappedCanonicalLabs,
} from "@/lib/mapAnalyzeLabsToCanonical";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 20;

interface LabUploadPanelProps {
  screeningId: string;
  patientId?: string;
  existingMappedLabs?: MappedCanonicalLabs | null;
  onLabsExtracted: (labs: MappedCanonicalLabs) => void;
  disabled?: boolean;
}

export function LabUploadPanel({
  screeningId,
  patientId,
  existingMappedLabs,
  onLabsExtracted,
  disabled = false,
}: LabUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Use PDF, JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande (máx. ${MAX_SIZE_MB}MB).`);
      return;
    }

    // Reset input para permitir reenvio do mesmo arquivo
    e.target.value = "";

    setIsUploading(true);
    try {
      // 1. Upload para Supabase Storage
      const ext = file.name.split(".").pop();
      const folder = patientId ?? screeningId;
      const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("exam-files")
        .upload(storagePath, file);

      if (uploadError) {
        toast.error("Erro ao enviar o arquivo.");
        return;
      }

      setIsUploading(false);
      setIsAnalyzing(true);

      // 2. Chamar analyze-labs (já inclui extract-file-text internamente)
      const { data, error: fnError } = await supabase.functions.invoke("analyze-labs", {
        body: {
          screening_id: screeningId,
          patient_id: patientId ?? null,
          bucket: "exam-files",
          storage_path: storagePath,
          mime_type: file.type,
          file_name: file.name,
        },
      });

      if (fnError || !data?.ok) {
        const code = data?.error_code ?? "UNKNOWN";
        const msg = data?.message ?? fnError?.message ?? "Erro na análise.";
        toast.error(`Falha na extração (${code}): ${msg}`);
        return;
      }

      // 3. Mapear para formato canônico
      const normalizedLabs = data.normalized?.labs ?? [];
      const collectedDate = data.normalized?.collection_date ?? null;
      const runId = data.run_id ?? null;

      const newMapped = mapAnalyzeLabsToCanonical(normalizedLabs, collectedDate, runId);

      // 4. Mesclar com labs existentes (se houver — múltiplos PDFs)
      const merged = existingMappedLabs
        ? mergeCanonicalLabs(existingMappedLabs, newMapped)
        : newMapped;

      // 5. Repassar para o pai abrir o modal de revisão
      onLabsExtracted(merged);

      const foundCount = Object.values(newMapped).filter(
        (v) => v && typeof v === "object" && "confidence" in v && (v as { confidence: string }).confidence !== "not_found"
      ).length;

      toast.success(
        `PDF analisado: ${foundCount} de 8 exames encontrados. Revise antes de salvar.`
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Erro inesperado.");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const isLoading = isUploading || isAnalyzing;

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isLoading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isLoading}
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isUploading ? "Enviando..." : "Analisando PDF..."}
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <FileText className="w-4 h-4" />
            Importar PDF de Exames
          </>
        )}
      </Button>
    </div>
  );
}
