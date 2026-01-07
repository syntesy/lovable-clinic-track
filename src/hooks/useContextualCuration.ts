/**
 * useContextualCuration - Hook para buscar curadoria com fallback
 * 
 * Fallback: item → categoria efetiva → geral
 * Retorna apenas curadorias publicadas (status = 'published')
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useItemGovernance } from "@/hooks/useTherapyTaxonomy";

export type CurationSource = "item" | "category" | "general" | "none";

interface CurationSummary {
  id: string;
  objective: string | null;
  results_key: string | null;
  clinical_takeaways: string[] | null;
  what_changes_in_practice: string | null;
  created_at: string;
  reviewed_at: string | null;
  evidence_level: string | null;
  updated_at: string | null;
  article_title?: string;
  article_authors?: string;
  article_year?: number;
}

interface UseContextualCurationResult {
  status: "idle" | "loading" | "success" | "error";
  source: CurationSource;
  curations: CurationSummary[];
  error: string | null;
  shouldShow: boolean; // Combines requires_curadoria + has therapyItemCode
}

export function useContextualCuration(
  therapyItemCode: string | null | undefined
): UseContextualCurationResult {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [source, setSource] = useState<CurationSource>("none");
  const [curations, setCurations] = useState<CurationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get governance flags to determine if curadoria is required
  const { item, flags, loading: govLoading } = useItemGovernance(therapyItemCode ?? null);

  const fetchCurations = useCallback(async () => {
    if (!therapyItemCode || !item) {
      setStatus("idle");
      setSource("none");
      setCurations([]);
      return;
    }

    // Check if curadoria is required for this category
    if (!flags.requires_curadoria) {
      setStatus("idle");
      setSource("none");
      setCurations([]);
      return;
    }

    setStatus("loading");
    setError(null);

    const effectiveCategoryCode = item.effective_category_code;

    try {
      // Query A: By item
      console.log("[ContextualCuration] Querying by item:", therapyItemCode);
      const { data: itemData, error: itemError } = await supabase
        .from("curations")
        .select(`
          id,
          objective,
          results_key,
          clinical_takeaways,
          what_changes_in_practice,
          evidence_level,
          updated_at,
          created_at,
          reviewed_at,
          curadoria_articles (
            title,
            authors,
            year
          )
        `)
        .eq("therapy_item_code", therapyItemCode)
        .eq("status", "aprovada")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (itemError) throw itemError;

      if (itemData && itemData.length > 0) {
        console.log("[ContextualCuration] Found by item, count:", itemData.length);
        setCurations(mapCurations(itemData));
        setSource("item");
        setStatus("success");
        return;
      }

      // Query B: By effective category
      if (effectiveCategoryCode) {
        console.log("[ContextualCuration] Querying by category:", effectiveCategoryCode);
        const { data: catData, error: catError } = await supabase
          .from("curations")
          .select(`
            id,
            objective,
            results_key,
            clinical_takeaways,
            what_changes_in_practice,
            evidence_level,
            updated_at,
            created_at,
            reviewed_at,
            curadoria_articles (
              title,
              authors,
              year
            )
          `)
          .eq("category_code", effectiveCategoryCode)
          .eq("status", "aprovada")
          .order("updated_at", { ascending: false })
          .limit(5);

        if (catError) throw catError;

        if (catData && catData.length > 0) {
          console.log("[ContextualCuration] Found by category, count:", catData.length);
          setCurations(mapCurations(catData));
          setSource("category");
          setStatus("success");
          return;
        }
      }

      // Query C: General (no item, no category)
      console.log("[ContextualCuration] Querying general curations");
      const { data: generalData, error: generalError } = await supabase
        .from("curations")
        .select(`
          id,
          objective,
          results_key,
          clinical_takeaways,
          what_changes_in_practice,
          evidence_level,
          updated_at,
          created_at,
          reviewed_at,
          curadoria_articles (
            title,
            authors,
            year
          )
        `)
        .is("therapy_item_code", null)
        .is("category_code", null)
        .eq("status", "aprovada")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (generalError) throw generalError;

      if (generalData && generalData.length > 0) {
        console.log("[ContextualCuration] Found general, count:", generalData.length);
        setCurations(mapCurations(generalData));
        setSource("general");
        setStatus("success");
        return;
      }

      // No curations found
      console.log("[ContextualCuration] No curations found");
      setCurations([]);
      setSource("none");
      setStatus("success");
    } catch (err) {
      console.error("[ContextualCuration] Error:", err);
      setError(err instanceof Error ? err.message : "Erro ao buscar curadoria");
      setStatus("error");
    }
  }, [therapyItemCode, item, flags.requires_curadoria]);

  // Fetch when item governance is loaded
  useEffect(() => {
    if (!govLoading && therapyItemCode) {
      fetchCurations();
    }
  }, [govLoading, therapyItemCode, fetchCurations]);

  // Determine if section should be shown
  const shouldShow = Boolean(
    therapyItemCode && 
    !govLoading && 
    flags.requires_curadoria
  );

  return {
    status,
    source,
    curations,
    error,
    shouldShow,
  };
}

// Helper to map DB response to CurationSummary
function mapCurations(data: unknown[]): CurationSummary[] {
  return data.map((row: unknown) => {
    const r = row as Record<string, unknown>;
    const article = r.curadoria_articles as Record<string, unknown> | null;
    return {
      id: r.id as string,
      objective: r.objective as string | null,
      results_key: r.results_key as string | null,
      clinical_takeaways: r.clinical_takeaways as string[] | null,
      what_changes_in_practice: r.what_changes_in_practice as string | null,
      evidence_level: r.evidence_level as string | null,
      updated_at: r.updated_at as string | null,
      created_at: r.created_at as string,
      reviewed_at: r.reviewed_at as string | null,
      article_title: article?.title as string | undefined,
      article_authors: article?.authors as string | undefined,
      article_year: article?.year as number | undefined,
    };
  });
}
