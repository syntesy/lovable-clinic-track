import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export interface ProfessionalConformityFilters {
  start: Date;
  end: Date;
  professionalId: string | null;
  area?: string | null;
  protocolType?: string | null;
  onlyCompleted?: boolean;
}

export interface ProfessionalConformityData {
  professional: { id: string; name: string; role: string };
  kpis: {
    total: number;
    withProtocol: number;
    checklistCompleted: number;
    finalized: number;
    adverseEvents: number;
    scientificDraftCount: number;
    scientificValidatedCount: number;
    traceabilityComplete: number;
    protocolDistribution: { type: string; count: number }[];
  };
  topProtocols: {
    protocol_id: string;
    title: string;
    protocol_type: string;
    total_procedures: number;
    checklist_completed_count: number;
  }[];
  pending: {
    id: string;
    created_at: string;
    attendance_id: string;
    checklist_status: string;
    finalization_status: string;
    protocol_title: string;
    patient_name: string | null;
  }[];
  adverseEvents: {
    id: string;
    created_at: string;
    attendance_id: string;
    adverse_event_record: { type?: string; severity?: string } | null;
    protocol_title: string;
    patient_name: string | null;
  }[];
}

function useClinicId() {
  const [clinicId, setClinicId] = useState<string | null>(null);
  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("clinics")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (data) setClinicId(data.id);
    };
    fetch();
  }, []);
  return clinicId;
}

export function useConformityMetricsByProfessional(filters: ProfessionalConformityFilters) {
  const clinicId = useClinicId();

  return useQuery({
    queryKey: [
      "conformity-metrics-by-professional",
      clinicId,
      filters.professionalId,
      filters.start.toISOString(),
      filters.end.toISOString(),
      filters.area,
      filters.protocolType,
      filters.onlyCompleted,
    ],
    queryFn: async (): Promise<ProfessionalConformityData> => {
      if (!clinicId || !filters.professionalId) throw new Error("Missing params");

      const { data, error } = await supabase.rpc(
        "get_conformity_metrics_by_professional" as any,
        {
          p_clinic_id: clinicId,
          p_start: filters.start.toISOString(),
          p_end: filters.end.toISOString(),
          p_professional_id: filters.professionalId,
          p_area: filters.area || null,
          p_protocol_type: filters.protocolType || null,
          p_only_completed: filters.onlyCompleted || false,
        }
      );

      if (error) throw error;
      return data as unknown as ProfessionalConformityData;
    },
    enabled: !!clinicId && !!filters.professionalId,
  });
}
