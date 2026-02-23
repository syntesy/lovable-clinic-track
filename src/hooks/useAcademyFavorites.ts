import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useAcademyFavorites() {
  return useQuery({
    queryKey: ["academy-favorites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as string[];
      const { data, error } = await (supabase as any)
        .from("academy_article_favorites")
        .select("article_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((f: any) => f.article_id as string);
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ articleId, isFavorited }: { articleId: string; isFavorited: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (isFavorited) {
        await (supabase as any).from("academy_article_favorites").delete()
          .eq("user_id", user.id).eq("article_id", articleId);
      } else {
        await (supabase as any).from("academy_article_favorites").insert({
          user_id: user.id, article_id: articleId,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-favorites"] });
    },
  });
}
