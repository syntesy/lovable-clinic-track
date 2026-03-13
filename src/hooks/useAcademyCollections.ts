import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AcademyCollection {
  id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  kind: "personal" | "official";
  is_featured: boolean;
  created_at: string;
  deleted_at: string | null;
}

export function useOfficialCollections() {
  return useQuery({
    queryKey: ["academy-collections-official"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("academy_article_collections")
        .select("*")
        .eq("kind", "official")
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AcademyCollection[];
    },
  });
}

export function useMyCollections() {
  return useQuery({
    queryKey: ["academy-collections-personal"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as AcademyCollection[];
      const { data, error } = await (supabase as any)
        .from("academy_article_collections")
        .select("*")
        .eq("owner_user_id", user.id)
        .eq("kind", "personal")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AcademyCollection[];
    },
  });
}

export function useCollectionDetail(id: string | null) {
  return useQuery({
    queryKey: ["academy-collection-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("academy_article_collections")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as AcademyCollection;
    },
  });
}

export function useCollectionArticles(collectionId: string | null) {
  return useQuery({
    queryKey: ["academy-collection-articles", collectionId],
    enabled: !!collectionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_article_collection_items")
        .select(`
          order_index,
          article_id
        `)
        .eq("collection_id", collectionId!)
        .order("order_index", { ascending: true });
      if (error) throw error;

      if (!data?.length) return [];

      // TODO: migrate to academy_curated_articles when join table FKs are updated
      const articleIds = data.map((d: any) => d.article_id);
      const { data: articles, error: err2 } = await supabase
        .from("academy_articles")
        .select("id, title, authors, journal, year, study_type, interventions, pathologies, summary_short, pubmed_url, doi_url, created_at, evidence_score")
        .in("id", articleIds)
        .eq("is_published", true)
        .is("deleted_at", null);
      if (err2) throw err2;

      // Merge order_index
      const orderMap = new Map(data.map((d: any) => [d.article_id, d.order_index]));
      return (articles ?? [])
        .map((a: any) => ({ ...a, order_index: orderMap.get(a.id) ?? 0 }))
        .sort((a: any, b: any) => a.order_index - b.order_index);
    },
  });
}

export function useSaveCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (col: Partial<AcademyCollection> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (col.id) {
        const { id, created_at, owner_user_id, kind, ...updates } = col;
        const { error } = await (supabase as any).from("academy_article_collections")
          .update(updates).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("academy_article_collections")
          .insert({ ...col, owner_user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy-collections-personal"] });
      qc.invalidateQueries({ queryKey: ["academy-collections-official"] });
    },
  });
}

export function useAddArticleToCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, articleId }: { collectionId: string; articleId: string }) => {
      const { error } = await supabase.from("academy_article_collection_items")
        .insert({ collection_id: collectionId, article_id: articleId, order_index: 0 });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["academy-collection-articles", vars.collectionId] });
    },
  });
}

export function useRemoveArticleFromCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, articleId }: { collectionId: string; articleId: string }) => {
      const { error } = await supabase.from("academy_article_collection_items")
        .delete().eq("collection_id", collectionId).eq("article_id", articleId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["academy-collection-articles", vars.collectionId] });
    },
  });
}
