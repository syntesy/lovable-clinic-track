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
  is_active: boolean;
  superseded_at: string | null;
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
  snapshot_hash: string | null;
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
        .eq("is_active", true)
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

// C) Topic link lifecycle — supersede old links when topic changes
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

      // Supersede all existing active links for this attendance that have a different topic_key
      const { data: existingLinks } = await supabase
        .from("reghen_evidence_links")
        .select("id, topic_key")
        .eq("attendance_id", params.attendanceId)
        .eq("is_active", true);

      if (existingLinks && existingLinks.length > 0) {
        const toSupersede = existingLinks.filter(
          (l: any) => l.topic_key !== params.topicKey
        );
        if (toSupersede.length > 0) {
          const ids = toSupersede.map((l: any) => l.id);
          await supabase
            .from("reghen_evidence_links")
            .update({
              is_active: false,
              superseded_at: new Date().toISOString(),
            } as any)
            .in("id", ids);
        }
      }

      // Upsert the new/current link
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
            is_active: true,
            superseded_at: null,
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
      // Handle PII block (422)
      if (data?.blocked) {
        throw new Error(data.error);
      }
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
      toast.error(error.message || "Erro ao consultar evidência");
    },
  });
}

// B) Snapshot save with hash-based deduplication (handled server-side for manual_question,
//    client-side hash for auto_panel)
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

      // Generate client-side hash for dedup
      const paperIds = params.papers
        .map((p: any) => p.paper_id || p.id)
        .filter(Boolean)
        .sort()
        .join(",");
      const normalizedQuery = (params.queryText || "").trim().toLowerCase().replace(/\s+/g, " ");
      const raw = `${params.attendanceId}|${params.topicKey}|${params.retrievalMode}|${paperIds}|${normalizedQuery}`;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const snapshotHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

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
          snapshot_hash: snapshotHash,
        } as any)
        .select()
        .single();

      if (error) {
        // Handle unique violation gracefully
        if (error.code === "23505") {
          return { deduplicated: true };
        }
        throw error;
      }
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.deduplicated) {
        toast.info("Evidência já vinculada a este atendimento.");
      } else {
        queryClient.invalidateQueries({
          queryKey: ["reghen-evidence-snapshots", data?.attendance_id],
        });
        toast.success("Evidência vinculada ao atendimento");
      }
    },
    onError: (error) => {
      console.error("Error saving evidence snapshot:", error);
      toast.error("Erro ao salvar evidência");
    },
  });
}
