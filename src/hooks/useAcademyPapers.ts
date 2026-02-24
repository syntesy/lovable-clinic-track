import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AcademyPaper {
  id: string;
  pmid: string | null;
  doi: string | null;
  title: string;
  authors: string | null;
  journal: string | null;
  year: number | null;
  abstract_text: string | null;
  mesh_terms: string[] | null;
  import_source: string;
  import_payload: any;
  curation_status: string;
  curation_data: any;
  warnings: string[];
  created_by: string;
  curated_by: string | null;
  curated_at: string | null;
  generated_by_ai: boolean;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useAcademyPapers(statusFilter?: string) {
  return useQuery({
    queryKey: ["academy-papers", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("academy_papers")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("curation_status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AcademyPaper[];
    },
  });
}

export function useImportPaper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (identifier: string) => {
      const { data, error } = await supabase.functions.invoke("academy-import-paper", {
        body: { identifier },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
    },
  });
}

export function useGenerateCuration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paperId: string) => {
      const { data, error } = await supabase.functions.invoke("academy-generate-curation", {
        body: { paper_id: paperId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
    },
  });
}

export function useUpdatePaperStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paperId, status, extra }: { paperId: string; status: string; extra?: Record<string, any> }) => {
      const updateData: any = { curation_status: status, ...extra };

      if (status === "published") {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.published_by = user?.id;
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("academy_papers")
        .update(updateData)
        .eq("id", paperId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
    },
  });
}

export function useSoftDeletePaper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paperId, restore }: { paperId: string; restore?: boolean }) => {
      const { error } = await supabase
        .from("academy_papers")
        .update({
          deleted_at: restore ? null : new Date().toISOString(),
        })
        .eq("id", paperId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
    },
  });
}
