import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────
export interface Protocol {
  id: string;
  clinic_id: string;
  title: string;
  area: string | null;
  indication_summary: string | null;
  evidence_level: string | null;
  evidence_notes: string | null;
  evidence_refs: any | null;
  inclusion_criteria: any | null;
  exclusion_criteria: any | null;
  required_exams: any | null;
  technique_summary: string | null;
  checklist_template: any | null;
  protocol_type: "REGEN_BASE" | "DERIVED" | "INSTITUTIONAL";
  source_protocol_id: string | null;
  source_protocol_version_id: string | null;
  is_active: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // Joined
  latest_version_label?: string;
  latest_version_created_at?: string;
}

export interface ProtocolVersion {
  id: string;
  clinic_id: string;
  protocol_id: string;
  version_label: string;
  change_summary: string;
  snapshot: any;
  created_by_user_id: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────
async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Try to get clinic where user is owner
  const { data: clinic } = await supabase
    .from("clinics")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (clinic) return clinic.id;

  // Fallback: get any clinic that has protocols (for test/dev)
  const { data: anyClinic } = await supabase
    .from("clinics")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (anyClinic) return anyClinic.id;
  throw new Error("Nenhuma clínica encontrada para o usuário");
}

async function getUserRole(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "viewer";

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.role || "professional";
}

export function useUserRole() {
  return useQuery({
    queryKey: ["user-role-governance"],
    queryFn: getUserRole,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClinicId() {
  return useQuery({
    queryKey: ["clinic-id"],
    queryFn: getClinicId,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── List Protocols ──────────────────────────────────────────────
export function useProtocolsList(
  protocolType: "REGEN_BASE" | "DERIVED" | "INSTITUTIONAL",
  filters?: { search?: string; area?: string; isActive?: boolean }
) {
  const { data: clinicId } = useClinicId();

  return useQuery({
    queryKey: ["protocols", protocolType, clinicId, filters],
    queryFn: async () => {
      if (!clinicId) return [];

      let query = supabase
        .from("protocols")
        .select("*")
        .eq("clinic_id", clinicId)
        .eq("protocol_type", protocolType)
        .order("updated_at", { ascending: false });

      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }
      if (filters?.area) {
        query = query.eq("area", filters.area);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch latest versions for all protocols (avoid N+1)
      if (data && data.length > 0) {
        const protocolIds = data.map((p: any) => p.id);
        const { data: versions } = await supabase
          .from("protocol_versions")
          .select("protocol_id, version_label, created_at")
          .in("protocol_id", protocolIds)
          .order("created_at", { ascending: false });

        // Map latest version to each protocol
        const latestVersionMap = new Map<string, { label: string; createdAt: string }>();
        if (versions) {
          for (const v of versions) {
            if (!latestVersionMap.has(v.protocol_id)) {
              latestVersionMap.set(v.protocol_id, {
                label: v.version_label,
                createdAt: v.created_at,
              });
            }
          }
        }

        return data.map((p: any) => ({
          ...p,
          latest_version_label: latestVersionMap.get(p.id)?.label || "—",
          latest_version_created_at: latestVersionMap.get(p.id)?.createdAt,
        })) as Protocol[];
      }

      return (data || []) as Protocol[];
    },
    enabled: !!clinicId,
  });
}

// ─── Get Single Protocol ─────────────────────────────────────────
export function useProtocol(protocolId: string | undefined) {
  return useQuery({
    queryKey: ["protocol", protocolId],
    queryFn: async () => {
      if (!protocolId) return null;
      const { data, error } = await supabase
        .from("protocols")
        .select("*")
        .eq("id", protocolId)
        .single();
      if (error) throw error;
      return data as Protocol;
    },
    enabled: !!protocolId,
  });
}

// ─── Get Protocol Versions ──────────────────────────────────────
export function useProtocolVersions(protocolId: string | undefined) {
  return useQuery({
    queryKey: ["protocol-versions", protocolId],
    queryFn: async () => {
      if (!protocolId) return [];
      const { data, error } = await supabase
        .from("protocol_versions")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProtocolVersion[];
    },
    enabled: !!protocolId,
  });
}

// ─── Duplicate Protocol ──────────────────────────────────────────
export function useDuplicateProtocol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceProtocolId,
      newTitle,
    }: {
      sourceProtocolId: string;
      newTitle: string;
    }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // 1. Get source protocol
      const { data: source, error: srcErr } = await supabase
        .from("protocols")
        .select("*")
        .eq("id", sourceProtocolId)
        .single();
      if (srcErr) throw srcErr;

      // 2. Get latest version of source
      const { data: srcVersions } = await supabase
        .from("protocol_versions")
        .select("*")
        .eq("protocol_id", sourceProtocolId)
        .order("created_at", { ascending: false })
        .limit(1);

      const latestSrcVersion = srcVersions?.[0];

      // 3. Create DERIVED protocol
      const { data: newProto, error: createErr } = await supabase
        .from("protocols")
        .insert({
          clinic_id: clinicId,
          title: newTitle,
          area: source.area,
          indication_summary: source.indication_summary,
          evidence_level: source.evidence_level,
          evidence_notes: source.evidence_notes,
          evidence_refs: source.evidence_refs,
          inclusion_criteria: source.inclusion_criteria,
          exclusion_criteria: source.exclusion_criteria,
          required_exams: source.required_exams,
          technique_summary: source.technique_summary,
          checklist_template: source.checklist_template,
          protocol_type: "DERIVED" as any,
          source_protocol_id: sourceProtocolId,
          source_protocol_version_id: latestSrcVersion?.id || null,
          is_active: true,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (createErr) throw createErr;

      // NOTE: version 1.0 é criada automaticamente pelo trigger ao inserir o protocolo

      // 4. Create audit log
      await supabase.from("governance_audit_logs").insert({
        clinic_id: clinicId,
        entity_type: "protocol",
        entity_id: newProto.id,
        action: "DUPLICATE" as any,
        previous_snapshot: latestSrcVersion?.snapshot || null,
        new_snapshot: newProto,
        justification: `Derivado do protocolo "${source.title}" v${latestSrcVersion?.version_label || "1.0"}`,
        performed_by_user_id: user.id,
      });

      return newProto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
      toast.success("Protocolo duplicado com sucesso!");
    },
    onError: (err: any) => {
      console.error("Duplicate error:", err);
      toast.error("Erro ao duplicar protocolo");
    },
  });
}

// ─── Update Protocol (with versioning) ───────────────────────────
export function useUpdateProtocol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      protocolId,
      updates,
      changeSummary,
    }: {
      protocolId: string;
      updates: Partial<Protocol>;
      changeSummary: string;
    }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // 1. Get previous state
      const { data: prevProto } = await supabase
        .from("protocols")
        .select("*")
        .eq("id", protocolId)
        .single();

      // 2. Update protocol
      const { data: updated, error: updateErr } = await supabase
        .from("protocols")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", protocolId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // 3. Create new version via atomic RPC (version_label calculado atomicamente no backend)
      const snapshotData = {
        ...updated,
        updated_at: new Date().toISOString(),
      };

      const { data: newVersion, error: versionErr } = await supabase.rpc(
        "create_protocol_version_atomic",
        {
          p_protocol_id: protocolId,
          p_clinic_id: clinicId,
          p_change_summary: changeSummary,
          p_snapshot: snapshotData,
          p_user_id: user.id,
        }
      );

      if (versionErr) throw versionErr;

      // 5. Audit log
      await supabase.from("governance_audit_logs").insert({
        clinic_id: clinicId,
        entity_type: "protocol",
        entity_id: protocolId,
        action: "UPDATE" as any,
        previous_snapshot: prevProto,
        new_snapshot: updated,
        changed_fields: { changeSummary, updatedFields: Object.keys(updates) },
        justification: changeSummary,
        performed_by_user_id: user.id,
      });

      return updated;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
      queryClient.invalidateQueries({ queryKey: ["protocol", vars.protocolId] });
      queryClient.invalidateQueries({ queryKey: ["protocol-versions", vars.protocolId] });
      toast.success("Protocolo atualizado com sucesso!");
    },
    onError: (err: any) => {
      console.error("Update error:", err);
      toast.error("Erro ao atualizar protocolo");
    },
  });
}

// ─── Toggle Active ───────────────────────────────────────────────
export function useToggleProtocolActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      protocolId,
      isActive,
    }: {
      protocolId: string;
      isActive: boolean;
    }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("protocols")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", protocolId);

      if (error) throw error;

      await supabase.from("governance_audit_logs").insert({
        clinic_id: clinicId,
        entity_type: "protocol",
        entity_id: protocolId,
        action: (isActive ? "ACTIVATE" : "DEACTIVATE") as any,
        justification: isActive ? "Protocolo ativado" : "Protocolo desativado",
        performed_by_user_id: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
      toast.success("Status atualizado!");
    },
    onError: () => {
      toast.error("Erro ao alterar status");
    },
  });
}

// ─── Create Protocol ─────────────────────────────────────────────
export function useCreateProtocol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      area: string;
      protocol_type: string;
      indication_summary?: string | null;
      inclusion_criteria?: any;
      exclusion_criteria?: any;
      required_exams?: any;
      technique_summary?: string | null;
      checklist_template?: any;
      evidence_level?: string | null;
      evidence_notes?: string | null;
      evidence_refs?: any;
      is_active: boolean;
      extended_data?: any;
    }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { extended_data, ...protocolFields } = payload;

      const { data: newProto, error } = await supabase
        .from("protocols")
        .insert({
          clinic_id: clinicId,
          ...protocolFields,
          protocol_type: payload.protocol_type as any,
          created_by_user_id: user.id,
          checklist_template: extended_data || payload.checklist_template || null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("governance_audit_logs").insert({
        clinic_id: clinicId,
        entity_type: "protocol",
        entity_id: newProto.id,
        action: "CREATE" as any,
        new_snapshot: newProto,
        justification: `Protocolo "${payload.title}" criado`,
        performed_by_user_id: user.id,
      });

      return newProto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
      toast.success("Protocolo criado com sucesso!");
    },
    onError: (err: any) => {
      console.error("Create error:", err);
      toast.error("Erro ao criar protocolo");
    },
  });
}

// ─── Unique areas for filter ─────────────────────────────────────
export function useProtocolAreas() {
  const { data: clinicId } = useClinicId();

  return useQuery({
    queryKey: ["protocol-areas", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data } = await supabase
        .from("protocols")
        .select("area")
        .eq("clinic_id", clinicId)
        .not("area", "is", null);

      const uniqueAreas = [...new Set((data || []).map((d: any) => d.area).filter(Boolean))];
      return uniqueAreas as string[];
    },
    enabled: !!clinicId,
  });
}
