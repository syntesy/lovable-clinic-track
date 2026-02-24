import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RagCitation {
  paper_id: string;
  title: string;
  year: number | null;
  journal: string | null;
  doi: string | null;
  pmid: string | null;
}

export interface EvidenceSnippet {
  paper_id: string;
  chunk_id: string;
  snippet: string;
  similarity: number;
}

export interface RagResult {
  answer_md: string;
  citations: RagCitation[];
  evidence_snippets: EvidenceSnippet[];
  suggested_terms: string[];
}

export function useAcademyRag() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RagResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async (question: string, filters?: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("academy-rag-answer", {
        body: { question, filters },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setResult(data as RagResult);
    } catch (err: any) {
      const msg = err.message || "Erro ao consultar a IA.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { ask, isLoading, result, error, reset };
}

export function useIndexPaper() {
  const [isLoading, setIsLoading] = useState(false);

  const indexPaper = async (paperId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-index-paper", {
        body: { paper_id: paperId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (err: any) {
      toast.error(err.message || "Erro ao indexar paper.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { indexPaper, isLoading };
}
