import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { AcademyArticle } from "./useAcademyArticles";

type ArticlePreview = Pick<AcademyArticle,
  "id" | "title" | "authors" | "journal" | "year" | "study_type" |
  "interventions" | "pathologies" | "summary_short" | "pubmed_url" | "doi_url" | "created_at"
>;

const LISTING_FIELDS = "id, title, authors, journal, year, study_type, interventions, pathologies, summary_short, pubmed_url, doi_url, created_at";

// New articles (last 30 days)
export function useFeedNewArticles(limit = 10) {
  return useQuery({
    queryKey: ["academy-feed-new", limit],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase
        .from("academy_articles")
        .select(LISTING_FIELDS)
        .eq("is_published", true)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ArticlePreview[];
    },
  });
}

// Personalized: articles matching followed topics
export function useFeedForYou(limit = 10) {
  return useQuery({
    queryKey: ["academy-feed-foryou", limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get user's followed topics
      const { data: follows } = await supabase
        .from("academy_topic_follows")
        .select("topic_type, topic_value")
        .eq("user_id", user.id);

      if (!follows?.length) return [];

      const interventions = follows.filter((f: any) => f.topic_type === "intervention").map((f: any) => f.topic_value);
      const pathologies = follows.filter((f: any) => f.topic_type === "pathology").map((f: any) => f.topic_value);
      const keywords = follows.filter((f: any) => f.topic_type === "keyword").map((f: any) => f.topic_value);

      // Build OR query using overlaps
      let query = supabase
        .from("academy_articles")
        .select(LISTING_FIELDS)
        .eq("is_published", true)
        .is("deleted_at", null);

      // Use OR filter for any matching topic
      const orFilters: string[] = [];
      if (interventions.length) orFilters.push(`interventions.ov.{${interventions.join(",")}}`);
      if (pathologies.length) orFilters.push(`pathologies.ov.{${pathologies.join(",")}}`);
      if (keywords.length) orFilters.push(`keywords.ov.{${keywords.join(",")}}`);

      if (orFilters.length) {
        query = query.or(orFilters.join(","));
      }

      const { data, error } = await query
        .order("year", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ArticlePreview[];
    },
  });
}

// Official collections for feed
export function useFeedOfficialCollections() {
  return useQuery({
    queryKey: ["academy-feed-official-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_article_collections")
        .select("id, title, description, is_featured, created_at")
        .eq("kind", "official")
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as { id: string; title: string; description: string | null; is_featured: boolean; created_at: string }[];
    },
  });
}
