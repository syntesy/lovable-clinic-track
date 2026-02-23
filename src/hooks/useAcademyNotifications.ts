import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AcademyNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function useAcademyNotifications(limit?: number) {
  return useQuery({
    queryKey: ["academy-notifications", limit],
    queryFn: async () => {
      let query = (supabase as any)
        .from("academy_notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AcademyNotification[];
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["academy-notifications-unread-count"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("academy_notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("academy_notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-notifications"] });
      qc.invalidateQueries({ queryKey: ["academy-notifications-unread-count"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await (supabase as any).from("academy_notifications").update({ is_read: true })
        .eq("user_id", user.id).eq("is_read", false);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-notifications"] });
      qc.invalidateQueries({ queryKey: ["academy-notifications-unread-count"] });
    },
  });
}
