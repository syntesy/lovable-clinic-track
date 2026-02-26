import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useUploadPdf() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>("");
  const queryClient = useQueryClient();

  const uploadPdf = async ({
    file,
    paperId,
    title,
  }: {
    file: File;
    paperId?: string;
    title?: string;
  }) => {
    setIsUploading(true);
    try {
      // Stage 1: Upload directly to Storage
      setUploadStage("Enviando PDF…");
      console.log("[upload:start]", { fileName: file.name, size: file.size });

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const tempPath = paperId
        ? `papers/${paperId}/${timestamp}-${safeName}`
        : `papers/pending/${timestamp}-${safeName}`;

      const { error: storageErr } = await supabase.storage
        .from("academy-papers")
        .upload(tempPath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (storageErr) {
        console.error("[upload:storage-error]", storageErr);
        if (storageErr.message?.includes("row-level security")) {
          throw new Error("Sem permissão para enviar arquivos. Verifique se você tem perfil de professor ou administrador.");
        }
        throw new Error(`Erro ao enviar PDF: ${storageErr.message}`);
      }

      console.log("[upload:success]", { filePath: tempPath });

      // Stage 2: Call edge function to create paper record + link file
      setUploadStage("Registrando paper…");
      const payload = {
        paper_id: paperId || null,
        title: title || null,
        file_name: file.name,
        storage_path: tempPath,
        file_size: file.size,
      };
      console.log("[function:invoke]", payload);

      const { data, error } = await supabase.functions.invoke("academy-upload-pdf", {
        body: payload,
      });

      if (error) {
        console.error("[function:error]", error);
        // Classify error
        if (error.message?.includes("Failed to send")) {
          throw new Error("Não foi possível conectar ao servidor de processamento. Verifique sua conexão e tente novamente.");
        }
        throw new Error(error.message || "Erro ao processar o paper.");
      }

      if (data?.error) {
        console.error("[function:response-error]", data);
        throw new Error(data.error);
      }

      console.log("[function:success]", data);
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
      return data;
    } catch (err: any) {
      const msg = err.message || "Erro ao fazer upload do PDF.";
      toast.error(msg);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadStage("");
    }
  };

  return { uploadPdf, isUploading, uploadStage };
}

export function useExtractPdfText() {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractPdfText = async (paperId: string) => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-extract-pdf-text", {
        body: { paper_id: paperId },
      });

      if (error) {
        console.error("[extract:error]", error);
        if (error.message?.includes("Failed to send")) {
          throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão.");
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);

      return data;
    } catch (err: any) {
      const msg = err.message || "Erro ao extrair texto do PDF.";
      toast.error(msg);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  };

  return { extractPdfText, isExtracting };
}
