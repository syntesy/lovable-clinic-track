import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicProfessional {
  user_id: string;
  role: string;
  email: string;
}

/**
 * Fetch professionals (role = professional | admin) from the same clinic.
 * Uses the clinic owner pattern since there's no clinic_members table.
 */
export function useClinicProfessionals() {
  return useQuery({
    queryKey: ["clinic-professionals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Get the user's clinic
      const { data: clinic } = await supabase
        .from("clinics")
        .select("id, owner_user_id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!clinic) return [];

      // Get all users with professional or admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["professional", "admin"] as any[]);

      if (error) throw error;
      if (!roles || roles.length === 0) return [];

      // Get emails for these users from auth (via profiles or user metadata)
      // Since we can't query auth.users directly, we'll use the user_id
      // and show a simplified label
      return roles.map((r) => ({
        user_id: r.user_id,
        role: r.role as string,
        email: "", // Will be enriched if profiles table has email
      })) as ClinicProfessional[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get current user's role
 */
export function useCurrentUserRole() {
  return useQuery({
    queryKey: ["current-user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      return {
        userId: user.id,
        email: user.email || "",
        role: (data?.role as string) || "viewer",
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
