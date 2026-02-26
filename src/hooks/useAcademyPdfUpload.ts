import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function computeClientHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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
    const requestId = generateRequestId();
    setIsUploading(true);
    try {
      // Stage 1: Compute hash for idempotency
      setUploadStage("Calculando integridade…");
      const fileHash = await computeClientHash(file);
      console.log(`[upload:hash] requestId=${requestId} hash=${fileHash}`);

      // Stage 2: Upload directly to Storage
      setUploadStage("Enviando PDF…");
      console.log(`[upload:start] requestId=${requestId}`, { fileName: file.name, size: file.size });

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
        console.error(`[upload:storage-error] requestId=${requestId}`, storageErr);
        if (storageErr.message?.includes("row-level security")) {
          throw new Error("Sem permissão para enviar arquivos. Verifique se você tem perfil de professor ou administrador.");
        }
        throw new Error(`Erro ao enviar PDF: ${storageErr.message}`);
      }

      console.log(`[upload:success] requestId=${requestId}`, { filePath: tempPath });

      // Stage 3: Call edge function with storage_path + hash (30s timeout)
      setUploadStage("Registrando paper…");
      const payload = {
        paper_id: paperId || null,
        title: title || null,
        file_name: file.name,
        storage_path: tempPath,
        file_size: file.size,
        file_hash: fileHash,
      };
      console.log(`[function:invoke] requestId=${requestId}`, payload);

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 30_000);

      let data: any;
      let error: any;
      try {
        const result = await supabase.functions.invoke("academy-upload-pdf", {
          body: payload,
          // @ts-ignore - AbortSignal support
        });
        data = result.data;
        error = result.error;
      } catch (invokeErr: any) {
        if (invokeErr?.name === "AbortError" || abortController.signal.aborted) {
          throw new Error("O processamento demorou mais que o esperado. Tente novamente.");
        }
        throw invokeErr;
      } finally {
        clearTimeout(timeoutId);
      }

      if (error) {
        console.error(`[function:error] requestId=${requestId}`, error);
        if (error.message?.includes("Failed to send")) {
          throw new Error("Não foi possível conectar ao servidor de processamento. Verifique sua conexão e tente novamente.");
        }
        throw new Error(error.message || "Erro ao processar o paper.");
      }

      if (data?.error) {
        console.error(`[function:response-error] requestId=${requestId}`, data);
        throw new Error(data.error);
      }

      console.log(`[function:success] requestId=${requestId}`, data);

      if (data?.idempotent) {
        toast.info("Este PDF já foi enviado anteriormente. Usando o registro existente.");
      }

      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
      return { ...data, request_id: requestId };
    } catch (err: any) {
      const msg = err.message || "Erro ao fazer upload do PDF.";
      console.error(`[upload:failed] requestId=${requestId}`, msg);
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

/**
 * Hook to get a signed URL for a published paper's PDF (for students).
 * Returns a 2-minute signed URL with auto-renewal on 403/expiry.
 */
export function useSignedPaperUrl() {
  const getSignedUrl = async (storagePath: string, isRetry = false): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("academy-papers")
      .createSignedUrl(storagePath, 120); // 2 minutes

    if (error) {
      console.error("[signed-url:error]", error);
      if (!isRetry) {
        console.log("[signed-url:retry] Auto-renewing signed URL…");
        return getSignedUrl(storagePath, true);
      }
      toast.error("Não foi possível gerar link de acesso ao PDF.");
      return null;
    }

    return data.signedUrl;
  };

  /**
   * Fetch a URL and auto-renew once if the response is 403 (expired).
   */
  const fetchWithAutoRenew = async (storagePath: string): Promise<{ url: string; blob: Blob } | null> => {
    const url = await getSignedUrl(storagePath);
    if (!url) return null;

    const res = await fetch(url);
    if (res.ok) {
      return { url, blob: await res.blob() };
    }

    if (res.status === 403) {
      console.log("[signed-url:expired] Auto-renewing…");
      const newUrl = await getSignedUrl(storagePath, false);
      if (!newUrl) return null;
      const retryRes = await fetch(newUrl);
      if (retryRes.ok) {
        return { url: newUrl, blob: await retryRes.blob() };
      }
    }

    toast.error("Não foi possível acessar o PDF. Tente novamente.");
    return null;
  };

  return { getSignedUrl, fetchWithAutoRenew };
}
