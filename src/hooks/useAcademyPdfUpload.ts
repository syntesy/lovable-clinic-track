import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useUploadPdf() {
  const [isUploading, setIsUploading] = useState(false);
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
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("academy-upload-pdf", {
        body: {
          paper_id: paperId || null,
          title: title || null,
          file_name: file.name,
          file_base64: base64,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
      return data;
    } catch (err: any) {
      const msg = err.message || "Erro ao fazer upload do PDF.";
      toast.error(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadPdf, isUploading };
}

export function useExtractPdfText() {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractPdfText = async (paperId: string) => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-extract-pdf-text", {
        body: { paper_id: paperId },
      });

      if (error) throw error;
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
