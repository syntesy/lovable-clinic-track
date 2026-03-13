import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { AcademyArticle } from "./useAcademyArticles";

type ArticlePreview = Pick<AcademyArticle,
  "id" | "title" | "authors" | "journal" | "year" | "study_type" |
  "interventions" | "pathologies" | "summary_short" | "pubmed_url" | "doi_url" | "created_at"
>;

/**
 * Maps a curated article row to the ArticlePreview shape used by feed components.
 */
function mapCuratedToPreview(row: any): ArticlePreview {
  let year = 0;
  if (row.published_date) {
    const parsed = new Date(row.published_date);
    if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
  }
  if (!year && row.created_at) {
    year = new Date(row.created_at).getFullYear();
  }

  const tags: string[] = (row.tags ?? []).map((t: string) => t.replace(/^#/, ""));

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
    interventions: tags.filter(t => ["PRP","BMAC","SVF"].includes(t)),
    pathologies: tags.filter(t => ["osteoartrite","tendinopatia"].includes(t)),
    summary_short: row.resumo_executivo
      ? row.resumo_executivo.slice(0, 200) + (row.resumo_executivo.length > 200 ? "…" : "")
      : "Resumo não disponível",
    pubmed_url: null,
    doi_url: doiUrl,
    created_at: row.created_at ?? "",
  };
}

const CURATED_FIELDS = "id, title, authors, journal, doi, tipo_estudo, tags, resumo_executivo, score_relevancia, created_at, published_date";

export function useFeedNewArticles(limit = 10) {
  return useQuery({
    queryKey: ["academy-feed-new", limit],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase
        .from("academy_curated_articles")
        .select(CURATED_FIELDS)
        .eq("visible_academy", true)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(mapCuratedToPreview);
    },
  });
}

export function useFeedForYou(limit = 10) {
  return useQuery({
    queryKey: ["academy-feed-foryou", limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as ArticlePreview[];

      const { data: follows } = await (supabase as any)
        .from("academy_topic_follows")
        .select("topic_type, topic_value")
        .eq("user_id", user.id);

      if (!follows?.length) return [] as ArticlePreview[];

      // Build tag-based filter from follows
      const allTags = follows.map((f: any) => `#${f.topic_value}`);

      let query = supabase
        .from("academy_curated_articles")
        .select(CURATED_FIELDS)
        .eq("visible_academy", true);

      if (allTags.length) {
        query = query.overlaps("tags", allTags);
      }

      const { data, error } = await query
        .order("score_relevancia", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(mapCuratedToPreview);
    },
  });
}

export function useFeedOfficialCollections() {
  return useQuery({
    queryKey: ["academy-feed-official-collections"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("academy_article_collections")
        .select("id, title, description, is_featured, created_at")
        .eq("kind", "official")
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as { id: string; title: string; description: string | null; is_featured: boolean; created_at: string }[];
    },
  });
}
