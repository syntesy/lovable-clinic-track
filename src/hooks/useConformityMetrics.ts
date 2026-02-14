import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export interface ConformityFilters {
  start: Date;
  end: Date;
  area?: string | null;
  protocolType?: string | null;
  onlyCompleted?: boolean;
}

export interface ConformityKPIs {
  total: number;
  withProtocol: number;
  checklistCompleted: number;
  finalized: number;
  adverseEvents: number;
  protocolDistribution: { type: string; count: number }[];
}

export interface TopProtocol {
  protocol_id: string;
  title: string;
  protocol_type: string;
  total_procedures: number;
  checklist_completed_count: number;
}

export interface PendingItem {
  id: string;
  created_at: string;
  attendance_id: string;
  checklist_status: string;
  finalization_status: string;
  protocol_title: string;
  patient_name: string | null;
}

export interface AdverseEventItem {
  id: string;
  created_at: string;
  attendance_id: string;
  adverse_event_record: {
    type?: string;
    severity?: string;
    management?: string;
    outcome?: string;
  } | null;
  protocol_title: string;
  patient_name: string | null;
}

export interface ConformityMetrics {
  kpis: ConformityKPIs;
  topProtocols: TopProtocol[];
  pending: PendingItem[];
  adverseEvents: AdverseEventItem[];
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

export function useConformityMetrics(filters: ConformityFilters) {
  const clinicId = useClinicId();

  return useQuery({
    queryKey: ["conformity-metrics", clinicId, filters.start.toISOString(), filters.end.toISOString(), filters.area, filters.protocolType, filters.onlyCompleted],
    queryFn: async (): Promise<ConformityMetrics> => {
      if (!clinicId) throw new Error("No clinic");

      const { data, error } = await supabase.rpc("get_conformity_metrics", {
        p_clinic_id: clinicId,
        p_start: filters.start.toISOString(),
        p_end: filters.end.toISOString(),
        p_area: filters.area || null,
        p_protocol_type: filters.protocolType || null,
        p_only_completed: filters.onlyCompleted || false,
      });

      if (error) throw error;

      const result = data as unknown as ConformityMetrics;
      return result;
    },
    enabled: !!clinicId,
  });
}
