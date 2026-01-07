/**
 * React Hook para consumo da taxonomia de terapias
 * Wrapper reativo sobre therapyTaxonomy.ts
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TherapyCategory,
  TherapyItem,
  TherapyItemWithFlags,
  GovernanceFlags,
  getTherapyCategories,
  getTherapyItems,
  getTherapyItemsWithFlags,
  getItemsByEffectiveCategory,
  getScoreEligibleItems,
  getItemByCode,
  getEffectiveCategoryCode,
  getEffectiveCategoryFlags,
  clearTaxonomyCache,
} from "@/lib/taxonomy/therapyTaxonomy";

export interface UseTherapyTaxonomyResult {
  // Data
  categories: TherapyCategory[];
  items: TherapyItemWithFlags[];
  categoriesMap: Map<string, TherapyCategory>;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;

  // Helpers
  getItemByCode: (code: string) => TherapyItemWithFlags | undefined;
  getItemsByCategory: (categoryCode: string) => TherapyItemWithFlags[];
  getScoreEligibleItems: () => TherapyItemWithFlags[];
  getEffectiveCategory: (item: TherapyItem) => string;
  getFlags: (item: TherapyItem) => GovernanceFlags;
}

export function useTherapyTaxonomy(): UseTherapyTaxonomyResult {
  const [categories, setCategories] = useState<TherapyCategory[]>([]);
  const [items, setItems] = useState<TherapyItemWithFlags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoriesMap = useMemo(
    () => new Map(categories.map((c) => [c.code, c])),
    [categories]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [cats, itemsWithFlags] = await Promise.all([
        getTherapyCategories(),
        getTherapyItemsWithFlags(),
      ]);

      setCategories(cats);
      setItems(itemsWithFlags);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar taxonomia";
      setError(message);
      console.error("[useTherapyTaxonomy]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    clearTaxonomyCache();
    await fetchData();
  }, [fetchData]);

  // Helper: buscar item por código
  const getItemByCodeFn = useCallback(
    (code: string): TherapyItemWithFlags | undefined => {
      return items.find((item) => item.code === code);
    },
    [items]
  );

  // Helper: filtrar por categoria efetiva
  const getItemsByCategoryFn = useCallback(
    (categoryCode: string): TherapyItemWithFlags[] => {
      return items.filter((item) => item.effective_category_code === categoryCode);
    },
    [items]
  );

  // Helper: itens elegíveis para score
  const getScoreEligibleItemsFn = useCallback((): TherapyItemWithFlags[] => {
    return items.filter((item) => item.requires_score);
  }, [items]);

  // Helper: categoria efetiva
  const getEffectiveCategoryFn = useCallback(
    (item: TherapyItem): string => {
      return getEffectiveCategoryCode(item);
    },
    []
  );

  // Helper: flags de governança
  const getFlagsFn = useCallback(
    (item: TherapyItem): GovernanceFlags => {
      return getEffectiveCategoryFlags(item, categoriesMap);
    },
    [categoriesMap]
  );

  return {
    categories,
    items,
    categoriesMap,
    loading,
    error,
    refresh,
    getItemByCode: getItemByCodeFn,
    getItemsByCategory: getItemsByCategoryFn,
    getScoreEligibleItems: getScoreEligibleItemsFn,
    getEffectiveCategory: getEffectiveCategoryFn,
    getFlags: getFlagsFn,
  };
}

// Hook específico para seleção de procedimentos ortobiológicos
export function useAutologousProcedures() {
  const taxonomy = useTherapyTaxonomy();
  
  const autologousItems = useMemo(
    () => taxonomy.getItemsByCategory("autologous_biologic"),
    [taxonomy]
  );

  return {
    items: autologousItems,
    loading: taxonomy.loading,
    error: taxonomy.error,
    refresh: taxonomy.refresh,
  };
}

// Hook para verificar se item requer score
export function useItemGovernance(itemCode: string | null) {
  const taxonomy = useTherapyTaxonomy();
  
  const item = useMemo(
    () => (itemCode ? taxonomy.getItemByCode(itemCode) : undefined),
    [itemCode, taxonomy]
  );

  const flags = useMemo(
    () =>
      item
        ? taxonomy.getFlags(item)
        : { requires_score: false, requires_checklist: false, requires_curadoria: false, risk_class: "low" as const },
    [item, taxonomy]
  );

  return {
    item,
    flags,
    loading: taxonomy.loading,
    error: taxonomy.error,
  };
}
