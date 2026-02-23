import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TopicFollow {
  id: string;
  topic_type: "intervention" | "pathology" | "keyword";
  topic_value: string;
  created_at: string;
}

export function useTopicFollows() {
  return useQuery({
    queryKey: ["academy-topic-follows"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("academy_topic_follows")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TopicFollow[];
    },
  });
}

export function useToggleTopicFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ topicType, topicValue, isFollowing }: {
      topicType: string; topicValue: string; isFollowing: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (isFollowing) {
        await supabase.from("academy_topic_follows").delete()
          .eq("user_id", user.id).eq("topic_type", topicType).eq("topic_value", topicValue);
      } else {
        await supabase.from("academy_topic_follows").insert({
          user_id: user.id, topic_type: topicType, topic_value: topicValue,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-topic-follows"] });
      qc.invalidateQueries({ queryKey: ["academy-feed"] });
    },
  });
}
