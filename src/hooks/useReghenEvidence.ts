import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ---- Types ----

export interface ReghenEvidenceLink {
  id: string;
  attendance_id: string;
  patient_id: string | null;
  pathology_id: string | null;
  intervention_code: string | null;
  topic_key: string;
  created_by: string;
  created_at: string;
}

export interface ReghenEvidenceSnapshot {
  id: string;
  attendance_id: string;
  topic_key: string;
  query_text: string | null;
  retrieval_mode: "auto_panel" | "manual_question";
  papers: any[];
  evidence_profile: any | null;
  answer_md: string | null;
  snippets: any[] | null;
  created_by: string;
  created_at: string;
}

export interface EvidencePanelResult {
  papers: any[];
  evidence_profile: any;
  short_summary: string;
}

// ---- Hooks ----

export function useEvidenceLinks(attendanceId: string | null) {
  return useQuery({
    queryKey: ["reghen-evidence-links", attendanceId],
    queryFn: async () => {
      if (!attendanceId) return [];
      const { data, error } = await supabase
        .from("reghen_evidence_links")
        .select("*")
        .eq("attendance_id", attendanceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ReghenEvidenceLink[];
    },
    enabled: !!attendanceId,
  });
}

export function useEvidenceSnapshots(attendanceId: string | null) {
  return useQuery({
    queryKey: ["reghen-evidence-snapshots", attendanceId],
    queryFn: async () => {
      if (!attendanceId) return [];
      const { data, error } = await supabase
        .from("reghen_evidence_snapshots")
        .select("*")
        .eq("attendance_id", attendanceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ReghenEvidenceSnapshot[];
    },
    enabled: !!attendanceId,
  });
}

export function useCreateEvidenceLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      attendanceId: string;
      patientId?: string;
      pathologyId?: string;
      interventionCode?: string;
      topicKey: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("reghen_evidence_links")
        .upsert(
          {
            attendance_id: params.attendanceId,
            patient_id: params.patientId || null,
            pathology_id: params.pathologyId || null,
            intervention_code: params.interventionCode || null,
            topic_key: params.topicKey,
            created_by: user.id,
          } as any,
          { onConflict: "attendance_id,topic_key" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["reghen-evidence-links", data.attendance_id],
      });
    },
    onError: (error) => {
      console.error("Error creating evidence link:", error);
      toast.error("Erro ao vincular evidência");
    },
  });
}

export function useFetchEvidencePanel() {
  return useMutation({
    mutationFn: async (params: {
      attendanceId: string;
      topicKey: string;
    }): Promise<EvidencePanelResult> => {
      const { data, error } = await supabase.functions.invoke(
        "reghen-evidence-panel",
        {
          body: {
            attendance_id: params.attendanceId,
            topic_key: params.topicKey,
          },
        }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as EvidencePanelResult;
    },
    onError: (error) => {
      console.error("Error fetching evidence panel:", error);
      toast.error("Erro ao buscar painel de evidência");
    },
  });
}

export function useAskEvidenceQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      attendanceId: string;
      topicKey: string;
      question: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "reghen-evidence-answer",
        {
          body: {
            attendance_id: params.attendanceId,
            topic_key: params.topicKey,
            question: params.question,
          },
        }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reghen-evidence-snapshots", variables.attendanceId],
      });
    },
    onError: (error) => {
      console.error("Error asking evidence question:", error);
      toast.error("Erro ao consultar evidência");
    },
  });
}

export function useSaveEvidenceSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      attendanceId: string;
      topicKey: string;
      retrievalMode: "auto_panel" | "manual_question";
      papers: any[];
      evidenceProfile?: any;
      answerMd?: string;
      snippets?: any[];
      queryText?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("reghen_evidence_snapshots")
        .insert({
          attendance_id: params.attendanceId,
          topic_key: params.topicKey,
          retrieval_mode: params.retrievalMode,
          papers: params.papers as any,
          evidence_profile: params.evidenceProfile || null,
          answer_md: params.answerMd || null,
          snippets: (params.snippets as any) || null,
          query_text: params.queryText || null,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["reghen-evidence-snapshots", data.attendance_id],
      });
      toast.success("Evidência vinculada ao atendimento");
    },
    onError: (error) => {
      console.error("Error saving evidence snapshot:", error);
      toast.error("Erro ao salvar evidência");
    },
  });
}
