import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

export function useAcademyArticles(filters: ArticleFilters = {}) {
  const page = filters.page ?? 1;
  const perPage = filters.per_page ?? PAGE_SIZE;

  return useQuery({
    queryKey: ["academy-articles", filters],
    queryFn: async () => {
      // Only select listing fields (no summary_full, abstract_text, etc.)
      let query = supabase
        .from("academy_articles")
        .select(
          "id, title, authors, journal, year, study_type, interventions, pathologies, keywords, pubmed_url, doi_url, summary_short, evidence_score, is_published, created_at",
          { count: "exact" }
        )
        .is("deleted_at", null)
        .eq("is_published", true);

      // Full-text search
      if (filters.search?.trim()) {
        query = query.textSearch("search_vector", filters.search.trim(), {
          type: "websearch",
          config: "portuguese",
        });
      }

      // Filters
      if (filters.interventions?.length) {
        query = query.overlaps("interventions", filters.interventions);
      }
      if (filters.pathologies?.length) {
        query = query.overlaps("pathologies", filters.pathologies);
      }
      if (filters.study_type) {
        query = query.eq("study_type", filters.study_type);
      }
      if (filters.year_min) {
        query = query.gte("year", filters.year_min);
      }
      if (filters.year_max) {
        query = query.lte("year", filters.year_max);
      }

      // Sort
      if (filters.sort === "alpha") {
        query = query.order("title", { ascending: true });
      } else {
        query = query.order("year", { ascending: false }).order("created_at", { ascending: false });
      }

      // Pagination
      const from = (page - 1) * perPage;
      query = query.range(from, from + perPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        articles: (data ?? []) as Pick<AcademyArticle, 
          "id" | "title" | "authors" | "journal" | "year" | "study_type" | 
          "interventions" | "pathologies" | "keywords" | "pubmed_url" | "doi_url" | 
          "summary_short" | "evidence_score" | "is_published" | "created_at"
        >[],
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
        .from("academy_articles")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as AcademyArticle;
    },
  });
}

// Latest articles for home
export function useLatestAcademyArticles(limit = 3) {
  return useQuery({
    queryKey: ["academy-articles-latest", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_articles")
        .select("id, title, authors, journal, year, study_type, interventions, pathologies, summary_short, pubmed_url, doi_url")
        .is("deleted_at", null)
        .eq("is_published", true)
        .order("year", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Pick<AcademyArticle, "id" | "title" | "authors" | "journal" | "year" | "study_type" | "interventions" | "pathologies" | "summary_short" | "pubmed_url" | "doi_url">[];
    },
  });
}

// Admin: all articles including unpublished and deleted
export function useAdminAcademyArticles() {
  return useQuery({
    queryKey: ["academy-articles-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_articles")
        .select("id, title, authors, journal, year, study_type, interventions, pathologies, is_published, deleted_at, created_at, pubmed_url, doi_url, summary_short")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Pick<AcademyArticle, 
        "id" | "title" | "authors" | "journal" | "year" | "study_type" | 
        "interventions" | "pathologies" | "is_published" | "deleted_at" | 
        "created_at" | "pubmed_url" | "doi_url" | "summary_short"
      >[];
    },
  });
}

export function useSaveAcademyArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: Partial<AcademyArticle> & { id?: string }) => {
      if (article.id) {
        const { id, created_at, created_by, ...updates } = article;
        const { data, error } = await supabase
          .from("academy_articles")
          .update(updates as any)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { id, ...insert } = article;
        const { data, error } = await supabase
          .from("academy_articles")
          .insert({ ...insert, created_by: user.id } as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-articles"] });
      queryClient.invalidateQueries({ queryKey: ["academy-articles-admin"] });
      queryClient.invalidateQueries({ queryKey: ["academy-articles-latest"] });
    },
  });
}

// Filter options from existing data
export function useArticleFilterOptions() {
  return useQuery({
    queryKey: ["academy-article-filter-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_articles")
        .select("interventions, pathologies, study_type")
        .is("deleted_at", null)
        .eq("is_published", true);
      if (error) throw error;

      const interventionsSet = new Set<string>();
      const pathologiesSet = new Set<string>();
      const studyTypesSet = new Set<string>();

      (data ?? []).forEach((row: any) => {
        (row.interventions ?? []).forEach((i: string) => interventionsSet.add(i));
        (row.pathologies ?? []).forEach((p: string) => pathologiesSet.add(p));
        if (row.study_type) studyTypesSet.add(row.study_type);
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
