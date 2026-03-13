import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductArticleLink {
  id: string;
  product_id: string;
  article_id: string;
  relation_type: "supports" | "recommended" | "contrasts";
  note: string | null;
  order_index: number;
  created_by: string;
  created_at: string;
}

export interface ProductCollectionLink {
  id: string;
  product_id: string;
  collection_id: string;
  order_index: number;
  created_by: string;
  created_at: string;
}

export interface LessonArticleLink {
  id: string;
  lesson_id: string;
  article_id: string;
  relation_type: "supports" | "recommended" | "contrasts";
  note: string | null;
  order_index: number;
  created_by: string;
  created_at: string;
}

// ===== PRODUCT ARTICLES =====

export function useProductArticles(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-articles", productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await (supabase as any)
        .from("academy_product_articles")
        .select("*")
        .eq("product_id", productId)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as ProductArticleLink[];
    },
  });
}

export function useProductArticlesWithDetails(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-articles-details", productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return [];
      // Get links
      const { data: links, error } = await (supabase as any)
        .from("academy_product_articles")
        .select("*")
        .eq("product_id", productId)
        .order("order_index");
      if (error) throw error;
      if (!links?.length) return [];

      // TODO: migrate to academy_curated_articles when join table FKs are updated
      const articleIds = links.map((l: any) => l.article_id);
      const { data: articles, error: err2 } = await supabase
        .from("academy_articles")
        .select("id, title, authors, journal, year, study_type, interventions, pathologies, pubmed_url, doi_url, summary_short")
        .in("id", articleIds)
        .eq("is_published", true)
        .is("deleted_at", null);
      if (err2) throw err2;

      const articleMap = new Map((articles ?? []).map((a: any) => [a.id, a]));
      return links
        .filter((l: any) => articleMap.has(l.article_id))
        .map((l: any) => ({ ...l, article: articleMap.get(l.article_id) }));
    },
  });
}

export function useAddProductArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { product_id: string; article_id: string; relation_type?: string; note?: string; order_index?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await (supabase as any)
        .from("academy_product_articles")
        .insert({ ...data, created_by: user.id });
      if (error) throw error;

      // Audit log
      await (supabase as any).from("academy_audit_log").insert({
        actor_user_id: user.id,
        action: "product_article_added",
        entity_type: "product",
        entity_id: data.product_id,
        metadata: { article_id: data.article_id },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product-articles", vars.product_id] });
      qc.invalidateQueries({ queryKey: ["product-articles-details", vars.product_id] });
      toast.success("Artigo vinculado!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao vincular artigo"),
  });
}

export function useRemoveProductArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, product_id, article_id }: { id: string; product_id: string; article_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("academy_product_articles")
        .delete()
        .eq("id", id);
      if (error) throw error;

      if (user) {
        await (supabase as any).from("academy_audit_log").insert({
          actor_user_id: user.id,
          action: "product_article_removed",
          entity_type: "product",
          entity_id: product_id,
          metadata: { article_id },
        });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product-articles", vars.product_id] });
      qc.invalidateQueries({ queryKey: ["product-articles-details", vars.product_id] });
      toast.success("Artigo removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== PRODUCT COLLECTIONS =====

export function useProductCollectionsWithDetails(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-collections-details", productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return [];
      const { data: links, error } = await (supabase as any)
        .from("academy_product_collections")
        .select("*")
        .eq("product_id", productId)
        .order("order_index");
      if (error) throw error;
      if (!links?.length) return [];

      const collectionIds = links.map((l: any) => l.collection_id);
      const { data: collections, error: err2 } = await (supabase as any)
        .from("academy_article_collections")
        .select("id, title, description, is_public, kind, is_featured")
        .in("id", collectionIds)
        .is("deleted_at", null);
      if (err2) throw err2;

      const colMap = new Map((collections ?? []).map((c: any) => [c.id, c]));
      return links
        .filter((l: any) => colMap.has(l.collection_id))
        .map((l: any) => ({ ...l, collection: colMap.get(l.collection_id) }));
    },
  });
}

export function useAddProductCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { product_id: string; collection_id: string; order_index?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await (supabase as any)
        .from("academy_product_collections")
        .insert({ ...data, created_by: user.id });
      if (error) throw error;

      await (supabase as any).from("academy_audit_log").insert({
        actor_user_id: user.id,
        action: "product_collection_linked",
        entity_type: "product",
        entity_id: data.product_id,
        metadata: { collection_id: data.collection_id },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product-collections-details", vars.product_id] });
      toast.success("Coleção vinculada!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRemoveProductCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, product_id, collection_id }: { id: string; product_id: string; collection_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("academy_product_collections")
        .delete()
        .eq("id", id);
      if (error) throw error;

      if (user) {
        await (supabase as any).from("academy_audit_log").insert({
          actor_user_id: user.id,
          action: "product_collection_unlinked",
          entity_type: "product",
          entity_id: product_id,
          metadata: { collection_id },
        });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product-collections-details", vars.product_id] });
      toast.success("Coleção removida!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== LESSON ARTICLES =====

export function useLessonArticlesWithDetails(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["lesson-articles-details", lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      if (!lessonId) return [];
      const { data: links, error } = await (supabase as any)
        .from("academy_lesson_articles")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index");
      if (error) throw error;
      if (!links?.length) return [];

      // TODO: migrate to academy_curated_articles when join table FKs are updated
      const articleIds = links.map((l: any) => l.article_id);
      const { data: articles, error: err2 } = await supabase
        .from("academy_articles")
        .select("id, title, authors, journal, year, study_type, interventions, pathologies, pubmed_url, doi_url, summary_short")
        .in("id", articleIds)
        .eq("is_published", true)
        .is("deleted_at", null);
      if (err2) throw err2;

      const articleMap = new Map((articles ?? []).map((a: any) => [a.id, a]));
      return links
        .filter((l: any) => articleMap.has(l.article_id))
        .map((l: any) => ({ ...l, article: articleMap.get(l.article_id) }));
    },
  });
}

export function useAddLessonArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { lesson_id: string; article_id: string; relation_type?: string; note?: string; order_index?: number; product_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { product_id, ...rest } = data;
      const { error } = await (supabase as any)
        .from("academy_lesson_articles")
        .insert({ ...rest, created_by: user.id });
      if (error) throw error;

      await (supabase as any).from("academy_audit_log").insert({
        actor_user_id: user.id,
        action: "lesson_article_added",
        entity_type: "lesson",
        entity_id: data.lesson_id,
        metadata: { article_id: data.article_id, product_id },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["lesson-articles-details", vars.lesson_id] });
      toast.success("Artigo vinculado à aula!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRemoveLessonArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lesson_id, article_id, product_id }: { id: string; lesson_id: string; article_id: string; product_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("academy_lesson_articles")
        .delete()
        .eq("id", id);
      if (error) throw error;

      if (user) {
        await (supabase as any).from("academy_audit_log").insert({
          actor_user_id: user.id,
          action: "lesson_article_removed",
          entity_type: "lesson",
          entity_id: lesson_id,
          metadata: { article_id, product_id },
        });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["lesson-articles-details", vars.lesson_id] });
      toast.success("Artigo removido da aula!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== ARTICLE SEARCH (for adding) =====

export function useSearchPublishedArticles(search: string) {
  return useQuery({
    queryKey: ["search-published-articles", search],
    enabled: search.length >= 2,
    queryFn: async () => {
      let query = supabase
        .from("academy_curated_articles")
        .select("id, title, authors, journal, doi, tipo_estudo, tags, published_date, created_at")
        .eq("visible_academy", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (search.trim()) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map to shape expected by consumers
      return (data ?? []).map((row: any) => {
        let year = 0;
        if (row.published_date) {
          const parsed = new Date(row.published_date);
          if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
        }
        let authorsStr: string | null = null;
        if (row.authors) {
          if (typeof row.authors === "string") authorsStr = row.authors;
          else if (Array.isArray(row.authors)) authorsStr = row.authors.join(", ");
        }
        let doiUrl: string | null = null;
        if (row.doi) {
          doiUrl = row.doi.startsWith("http") ? row.doi : `https://doi.org/${row.doi}`;
        }
        return {
          id: row.id,
          title: row.title,
          authors: authorsStr,
          journal: row.journal ?? null,
          year,
          study_type: row.tipo_estudo ?? "Outro",
          pubmed_url: null,
          doi_url: doiUrl,
        };
      });
    },
    staleTime: 10_000,
  });
}
