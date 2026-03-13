import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Unified article interface used across the Academy UI.
 * Data is sourced from `academy_curated_articles` (Claude editorial pipeline).
 */
export interface AcademyArticle {
  id: string;
  title: string;
  authors: string | null;
  journal: string | null;
  year: number;
  study_type: string;
  interventions: string[];
  pathologies: string[];
  keywords: string[];
  pubmed_url: string | null;
  doi_url: string | null;
  abstract_text: string | null;
  summary_short: string;
  summary_full: string | null;
  effect_summary: string | null;
  limitations: string[] | null;
  follow_up: string | null;
  external_id: string | null;
  ai_summary: string | null;
  evidence_score: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  deleted_at: string | null;
}

export interface ArticleFilters {
  search?: string;
  interventions?: string[];
  pathologies?: string[];
  study_type?: string;
  year_min?: number;
  year_max?: number;
  sort?: "recent" | "relevance" | "alpha";
  page?: number;
  per_page?: number;
}

const PAGE_SIZE = 20;

/**
 * Maps a raw row from `academy_curated_articles` into the AcademyArticle shape
 * that the rest of the UI expects. This is the single place where field mapping lives.
 */
function mapCuratedToArticle(row: any): AcademyArticle {
  // Extract year from published_date string (e.g. "2024-03-15") or fallback
  let year = 0;
  if (row.published_date) {
    const parsed = new Date(row.published_date);
    if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
  }
  if (!year && row.created_at) {
    year = new Date(row.created_at).getFullYear();
  }

  // Tags → derive interventions, pathologies, keywords
  const tags: string[] = (row.tags ?? []).map((t: string) => t.replace(/^#/, ""));
  
  // Known therapy tags → interventions
  const therapyTags = new Set([
    "PRP", "BMAC", "SVF", "celulas-tronco-mesenquimais", "celulas-tronco-adiposas",
    "celulas-tronco-medula-ossea", "celulas-tronco-cordao-umbilical", "exossomos",
    "vesiculas-extracelulares", "secretoma", "proloterapia", "ozonio",
    "toxina-botulinica", "acido-hialuronico",
  ]);
  const pathologyTags = new Set([
    "tendinopatia", "tendao-aquiles", "tendao-patelar", "manguito-rotador",
    "epicondilite", "fasciite-plantar", "osteoartrite", "osteoartrite-joelho",
    "osteoartrite-quadril", "lesao-cartilagem", "lesao-menisco", "lesao-ligamentar",
    "dor-cronica", "dor-lombar", "lesao-muscular",
  ]);

  const interventions = tags.filter(t => therapyTags.has(t));
  const pathologies = tags.filter(t => pathologyTags.has(t));

  // Parse authors — stored as JSONB (array or string) or plain string
  let authorsStr: string | null = null;
  if (row.authors) {
    if (typeof row.authors === "string") {
      authorsStr = row.authors;
    } else if (Array.isArray(row.authors)) {
      authorsStr = row.authors.join(", ");
    } else if (typeof row.authors === "object") {
      authorsStr = JSON.stringify(row.authors);
    }
  }

  // Parse limitations from string (newline-separated) to array
  let limitations: string[] | null = null;
  if (row.limitacoes) {
    limitations = row.limitacoes.split("\n").filter((l: string) => l.trim());
  }

  // Parse aplicacao_clinica from string (newline-separated)
  let effectSummary: string | null = null;
  if (row.aplicacao_clinica) {
    effectSummary = row.aplicacao_clinica;
  }

  // Build DOI URL
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
    interventions,
    pathologies,
    keywords: tags,
    pubmed_url: null,
    doi_url: doiUrl,
    abstract_text: null,
    summary_short: row.resumo_executivo
      ? row.resumo_executivo.slice(0, 200) + (row.resumo_executivo.length > 200 ? "…" : "")
      : "Resumo não disponível",
    summary_full: row.resumo_executivo ?? null,
    effect_summary: effectSummary,
    limitations,
    follow_up: null,
    external_id: row.queue_id ?? null,
    ai_summary: row.full_curation_markdown ?? null,
    evidence_score: row.score_relevancia ?? null,
    created_by: row.reviewed_by ?? "",
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? row.created_at ?? "",
    is_published: row.visible_academy ?? true,
    deleted_at: null,
  };
}

export function useAcademyArticles(filters: ArticleFilters = {}) {
  const page = filters.page ?? 1;
  const perPage = filters.per_page ?? PAGE_SIZE;

  return useQuery({
    queryKey: ["academy-articles", filters],
    queryFn: async () => {
      let query = supabase
        .from("academy_curated_articles")
        .select(
          "id, title, authors, journal, doi, tipo_estudo, tags, resumo_executivo, score_relevancia, classificacao, visible_academy, created_at, published_date, queue_id, aplicacao_clinica, limitacoes",
          { count: "exact" }
        )
        .eq("visible_academy", true);

      // Text search — use ilike on title since curated_articles doesn't have search_vector
      if (filters.search?.trim()) {
        query = query.ilike("title", `%${filters.search.trim()}%`);
      }

      // Study type filter
      if (filters.study_type) {
        query = query.eq("tipo_estudo", filters.study_type);
      }

      // Tag-based filters for interventions/pathologies
      if (filters.interventions?.length) {
        const tagsWithHash = filters.interventions.map(i => `#${i}`);
        query = query.overlaps("tags", tagsWithHash);
      }
      if (filters.pathologies?.length) {
        const tagsWithHash = filters.pathologies.map(p => `#${p}`);
        query = query.overlaps("tags", tagsWithHash);
      }

      // Sort
      if (filters.sort === "alpha") {
        query = query.order("title", { ascending: true });
      } else if (filters.sort === "relevance") {
        query = query.order("score_relevancia", { ascending: false, nullsFirst: false });
      } else {
        // default: recent
        query = query.order("created_at", { ascending: false });
      }

      // Pagination
      const from = (page - 1) * perPage;
      query = query.range(from, from + perPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      const articles = (data ?? []).map(mapCuratedToArticle);

      return {
        articles,
        total: count ?? 0,
        page,
        totalPages: Math.ceil((count ?? 0) / perPage),
      };
    },
  });
}

export function useAcademyArticleDetail(id: string | null) {
  return useQuery({
    queryKey: ["academy-article-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_curated_articles")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return mapCuratedToArticle(data);
    },
  });
}

// Latest articles for home page
export function useLatestAcademyArticles(limit = 3) {
  return useQuery({
    queryKey: ["academy-articles-latest", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_curated_articles")
        .select("id, title, authors, journal, doi, tipo_estudo, tags, resumo_executivo, score_relevancia, created_at, published_date, aplicacao_clinica, limitacoes")
        .eq("visible_academy", true)
        .order("score_relevancia", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(mapCuratedToArticle);
    },
  });
}

// Admin: all curated articles
export function useAdminAcademyArticles() {
  return useQuery({
    queryKey: ["academy-articles-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_curated_articles")
        .select("id, title, authors, journal, doi, tipo_estudo, tags, resumo_executivo, score_relevancia, classificacao, visible_academy, visible_reghen_feed, created_at, published_date, queue_id, aplicacao_clinica, limitacoes, reviewed_by, reviewed_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapCuratedToArticle);
    },
  });
}

export function useSaveAcademyArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: Partial<AcademyArticle> & { id?: string }) => {
      if (article.id) {
        // Map back to curated_articles fields for update
        const updates: Record<string, any> = {};
        if (article.title !== undefined) updates.title = article.title;
        if (article.journal !== undefined) updates.journal = article.journal;
        if (article.is_published !== undefined) updates.visible_academy = article.is_published;

        const { data, error } = await supabase
          .from("academy_curated_articles")
          .update(updates)
          .eq("id", article.id)
          .select()
          .single();
        if (error) throw error;
        return mapCuratedToArticle(data);
      } else {
        throw new Error("Creating articles directly is not supported. Use the Curator Panel to curate new articles.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-articles"] });
      queryClient.invalidateQueries({ queryKey: ["academy-articles-admin"] });
      queryClient.invalidateQueries({ queryKey: ["academy-articles-latest"] });
    },
  });
}

// Filter options derived from curated articles tags
export function useArticleFilterOptions() {
  return useQuery({
    queryKey: ["academy-article-filter-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_curated_articles")
        .select("tags, tipo_estudo")
        .eq("visible_academy", true);
      if (error) throw error;

      const therapyTags = new Set([
        "PRP", "BMAC", "SVF", "celulas-tronco-mesenquimais", "celulas-tronco-adiposas",
        "celulas-tronco-medula-ossea", "celulas-tronco-cordao-umbilical", "exossomos",
        "vesiculas-extracelulares", "secretoma", "proloterapia", "ozonio",
        "toxina-botulinica", "acido-hialuronico",
      ]);
      const pathologyTags = new Set([
        "tendinopatia", "tendao-aquiles", "tendao-patelar", "manguito-rotador",
        "epicondilite", "fasciite-plantar", "osteoartrite", "osteoartrite-joelho",
        "osteoartrite-quadril", "lesao-cartilagem", "lesao-menisco", "lesao-ligamentar",
        "dor-cronica", "dor-lombar", "lesao-muscular",
      ]);

      const interventionsSet = new Set<string>();
      const pathologiesSet = new Set<string>();
      const studyTypesSet = new Set<string>();

      (data ?? []).forEach((row: any) => {
        const tags: string[] = (row.tags ?? []).map((t: string) => t.replace(/^#/, ""));
        tags.forEach(t => {
          if (therapyTags.has(t)) interventionsSet.add(t);
          if (pathologyTags.has(t)) pathologiesSet.add(t);
        });
        if (row.tipo_estudo) studyTypesSet.add(row.tipo_estudo);
      });

      return {
        interventions: Array.from(interventionsSet).sort(),
        pathologies: Array.from(pathologiesSet).sort(),
        studyTypes: Array.from(studyTypesSet).sort(),
      };
    },
    staleTime: 60_000,
  });
}
