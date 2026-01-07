/**
 * Therapy Taxonomy Service
 * Fonte única para consumo da taxonomia de terapias/intervenções
 * 
 * REGRAS:
 * - therapy_items: itens individuais (PRP, HYB_PRP_HA, etc.)
 * - therapy_categories: categorias com flags de governança
 * - effective_category_code: para híbridos, usa base_component_category_code
 */

import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// TYPES
// =============================================================================

export interface TherapyCategory {
  code: string;
  name: string;
  risk_class: "low" | "medium" | "high";
  requires_score: boolean;
  requires_checklist: boolean;
  requires_curadoria: boolean;
}

export interface TherapyItem {
  code: string;
  name: string;
  category_code: string;
  base_component_category_code: string | null;
}

export interface TherapyItemWithFlags extends TherapyItem {
  effective_category_code: string;
  requires_score: boolean;
  requires_checklist: boolean;
  requires_curadoria: boolean;
  risk_class: "low" | "medium" | "high";
}

export interface GovernanceFlags {
  requires_score: boolean;
  requires_checklist: boolean;
  requires_curadoria: boolean;
  risk_class: "low" | "medium" | "high";
}

// =============================================================================
// CACHE (simple memoization)
// =============================================================================

let cachedCategories: TherapyCategory[] | null = null;
let cachedItems: TherapyItem[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

export function clearTaxonomyCache(): void {
  cachedCategories = null;
  cachedItems = null;
  cacheTimestamp = 0;
}

// =============================================================================
// FETCH FUNCTIONS
// =============================================================================

export async function getTherapyCategories(): Promise<TherapyCategory[]> {
  if (cachedCategories && isCacheValid()) {
    return cachedCategories;
  }

  const { data, error } = await supabase
    .from("therapy_categories")
    .select("code, name, risk_class, requires_score, requires_checklist, requires_curadoria")
    .order("code");

  if (error) {
    console.error("[Taxonomy] Error fetching categories:", error);
    throw error;
  }

  cachedCategories = data as TherapyCategory[];
  cacheTimestamp = Date.now();
  return cachedCategories;
}

export async function getTherapyItems(): Promise<TherapyItem[]> {
  if (cachedItems && isCacheValid()) {
    return cachedItems;
  }

  const { data, error } = await supabase
    .from("therapy_items")
    .select("code, name, category_code, base_component_category_code")
    .order("name");

  if (error) {
    console.error("[Taxonomy] Error fetching items:", error);
    throw error;
  }

  cachedItems = data as TherapyItem[];
  cacheTimestamp = Date.now();
  return cachedItems;
}

// =============================================================================
// CORE LOGIC: EFFECTIVE CATEGORY
// =============================================================================

/**
 * Retorna a categoria efetiva do item.
 * Para híbridos (HYB_*), usa base_component_category_code.
 * Para demais, usa category_code.
 */
export function getEffectiveCategoryCode(item: TherapyItem): string {
  return item.base_component_category_code ?? item.category_code;
}

/**
 * Retorna as flags de governança com base na categoria efetiva.
 */
export function getEffectiveCategoryFlags(
  item: TherapyItem,
  categoriesByCode: Map<string, TherapyCategory>
): GovernanceFlags {
  const effectiveCode = getEffectiveCategoryCode(item);
  const category = categoriesByCode.get(effectiveCode);

  if (!category) {
    console.warn(`[Taxonomy] Category not found: ${effectiveCode}`);
    return {
      requires_score: false,
      requires_checklist: false,
      requires_curadoria: false,
      risk_class: "low",
    };
  }

  return {
    requires_score: category.requires_score,
    requires_checklist: category.requires_checklist,
    requires_curadoria: category.requires_curadoria,
    risk_class: category.risk_class,
  };
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Busca todos os itens com flags de governança já calculadas.
 */
export async function getTherapyItemsWithFlags(): Promise<TherapyItemWithFlags[]> {
  const [items, categories] = await Promise.all([
    getTherapyItems(),
    getTherapyCategories(),
  ]);

  const categoriesByCode = new Map(categories.map((c) => [c.code, c]));

  return items.map((item) => {
    const flags = getEffectiveCategoryFlags(item, categoriesByCode);
    return {
      ...item,
      effective_category_code: getEffectiveCategoryCode(item),
      ...flags,
    };
  });
}

/**
 * Filtra itens por categoria efetiva.
 */
export async function getItemsByEffectiveCategory(
  categoryCode: string
): Promise<TherapyItemWithFlags[]> {
  const items = await getTherapyItemsWithFlags();
  return items.filter((item) => item.effective_category_code === categoryCode);
}

/**
 * Filtra itens que requerem SCORE (autologous_biologic ou híbridos com base autóloga).
 */
export async function getScoreEligibleItems(): Promise<TherapyItemWithFlags[]> {
  const items = await getTherapyItemsWithFlags();
  return items.filter((item) => item.requires_score);
}

/**
 * Converte Map de categorias para lookup rápido.
 */
export async function getCategoriesMap(): Promise<Map<string, TherapyCategory>> {
  const categories = await getTherapyCategories();
  return new Map(categories.map((c) => [c.code, c]));
}

/**
 * Busca um item pelo código.
 */
export async function getItemByCode(code: string): Promise<TherapyItemWithFlags | null> {
  const items = await getTherapyItemsWithFlags();
  return items.find((item) => item.code === code) ?? null;
}

// =============================================================================
// LEGACY MAPPING (para compatibilidade com motor congelado)
// =============================================================================

/**
 * Mapeia item da taxonomia para tipo suportado pelo motor (PRP/PRF/BMAC).
 * Usado APENAS para compatibilidade com regen_engine_v1.0.0.
 * O item REAL é preservado no registro; este é só para cálculo interno.
 */
export function mapToLegacyProcedureType(itemCode: string): "PRP" | "PRF" | "BMAC" | null {
  const code = itemCode.toUpperCase();

  // PRP e variações
  if (
    code === "AUTO_PRP" ||
    code === "AUTO_LP_PRP" ||
    code === "AUTO_LR_PRP" ||
    code.includes("PRP")
  ) {
    return "PRP";
  }

  // PRF e variações
  if (
    code === "AUTO_PRF" ||
    code === "AUTO_IPRF" ||
    code === "AUTO_APRF" ||
    code === "AUTO_LPRF" ||
    code.includes("PRF")
  ) {
    return "PRF";
  }

  // BMA/BMAC/BMEC
  if (
    code === "AUTO_BMA" ||
    code === "AUTO_BMAC" ||
    code === "AUTO_BMEC" ||
    code.includes("BMA") ||
    code.includes("BMAC") ||
    code.includes("BMEC")
  ) {
    return "BMAC";
  }

  // Nanofat/Microfat → mapeia para BMAC (mais próximo em processamento)
  if (code === "AUTO_NANOFAT" || code === "AUTO_MICROFAT") {
    return "BMAC";
  }

  // Não mapeável (bio_stimulator, injectable_nutrition, etc.)
  return null;
}

/**
 * Verifica se um item é elegível para o motor de score (baseado em categoria efetiva).
 */
export function isScoreEligible(item: TherapyItem, categoriesByCode: Map<string, TherapyCategory>): boolean {
  const flags = getEffectiveCategoryFlags(item, categoriesByCode);
  return flags.requires_score;
}
