import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { computeEvidenceScore } from "./useEvidenceScore";
import { validateReghenEvidenceMethod } from "@/utils/remComplianceValidator";

export interface AcademyPaper {
  id: string;
  pmid: string | null;
  doi: string | null;
  title: string;
  authors: string | null;
  journal: string | null;
  year: number | null;
  abstract_text: string | null;
  mesh_terms: string[] | null;
  import_source: string;
  import_payload: any;
  curation_status: string;
  curation_data: any;
  warnings: string[];
  created_by: string;
  curated_by: string | null;
  curated_at: string | null;
  generated_by_ai: boolean;
  published_by: string | null;
  published_at: string | null;
  fingerprint: string | null;
  evidence_score: number | null;
  evidence_label: string | null;
  evidence_notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PaperRevision {
  id: string;
  paper_id: string;
  actor_user_id: string;
  action: string;
  curation_data: any;
  warnings: any;
  tags_norm: any;
  status: string;
  created_at: string;
}

export function useAcademyPapers(statusFilter?: string) {
  return useQuery({
    queryKey: ["academy-papers", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("academy_papers")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("curation_status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AcademyPaper[];
    },
  });
}

export function usePaperRevisions(paperId: string | null) {
  return useQuery({
    queryKey: ["paper-revisions", paperId],
    enabled: !!paperId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_paper_revisions" as any)
        .select("*")
        .eq("paper_id", paperId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as PaperRevision[];
    },
  });
}

export function useImportPaper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (identifier: string) => {
      const { data, error } = await supabase.functions.invoke("academy-import-paper", {
        body: { identifier },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
    },
  });
}

export function useGenerateCuration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paperId: string) => {
      const { data, error } = await supabase.functions.invoke("academy-generate-curation", {
        body: { paper_id: paperId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
    },
  });
}

async function createRevision(paperId: string, action: string, paper: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("academy_paper_revisions" as any).insert({
    paper_id: paperId,
    actor_user_id: user.id,
    action,
    curation_data: paper.curation_data || null,
    warnings: paper.warnings || null,
    tags_norm: paper.curation_data?.tags_norm || null,
    status: paper.curation_status,
  } as any);
}

export function useUpdatePaperStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paperId, status, extra }: { paperId: string; status: string; extra?: Record<string, any> }) => {
      const updateData: any = { curation_status: status, ...extra };

      if (status === "published") {
        // Fetch paper for compliance check + score
        const { data: paperForScore } = await supabase
          .from("academy_papers")
          .select("curation_data, warnings, abstract_text, year")
          .eq("id", paperId)
          .single();

        // REM Compliance check
        if (paperForScore) {
          const remLayers = (paperForScore as any).curation_data?.reghen_evidence_method?.layers;
          if (remLayers) {
            const compliance = validateReghenEvidenceMethod(remLayers);
            if (!compliance.is_valid) {
              // Log blocked attempt
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from("academy_ai_logs" as any).insert({
                  action: "rem_compliance_blocked",
                  user_id: user.id,
                  paper_id: paperId,
                  input: { mode: "rem_compliance_blocked", errors: compliance.errors, warnings: compliance.warnings },
                  output: { compliance_score: compliance.compliance_score },
                  status: "fail",
                  error_message: compliance.errors.join(" | "),
                } as any);
              }
              throw new Error(
                `REM™ Compliance falhou (${compliance.compliance_score}/100):\n${compliance.errors.join("\n")}`
              );
            }
          }

          const scoreResult = computeEvidenceScore(paperForScore as any);
          updateData.evidence_score = scoreResult.score;
          updateData.evidence_label = scoreResult.label;
          updateData.evidence_notes = scoreResult.notes;
        }

        const { data: { user } } = await supabase.auth.getUser();
        updateData.published_by = user?.id;
        updateData.published_at = new Date().toISOString();

        // Sync to academy_curated_articles so it appears in the Scientific Library
        try {
          const curationJson = (paperForScore as any).curation_data;
          const remLayers = curationJson?.reghen_evidence_method?.layers;
          
          // Get full paper data for sync
          const { data: fullPaper } = await supabase
            .from("academy_papers")
            .select("title, authors, journal, doi, year, abstract_text, evidence_score")
            .eq("id", paperId)
            .single();

          // Get curation row for structured data
          const { data: curationRow } = await supabase
            .from("academy_paper_curation" as any)
            .select("curation_json, nivel_evidencia, score_metodologico, risco_vies")
            .eq("paper_id", paperId)
            .maybeSingle();

          const cj = (curationRow as any)?.curation_json || {};

          // Determine classificacao from score
          const score = cj.score_metodologico || (curationRow as any)?.score_metodologico || 5;
          let classificacao = "contexto";
          if (score >= 9) classificacao = "leitura_essencial";
          else if (score >= 7) classificacao = "leitura_recomendada";
          else if (score >= 5) classificacao = "leitura_opcional";
          else if (score >= 3) classificacao = "referencia";

          // Build tags from curation data
          const tags: string[] = [];
          if (Array.isArray(cj.tags)) {
            tags.push(...cj.tags.map((t: string) => t.startsWith("#") ? t : `#${t}`));
          }

          const curatedArticle = {
            title: fullPaper?.title || "",
            authors: fullPaper?.authors || null,
            journal: fullPaper?.journal || cj.journal || null,
            doi: fullPaper?.doi || null,
            tipo_estudo: cj.tipo_estudo || "Outro",
            nivel_evidencia: cj.nivel_evidencia || (curationRow as any)?.nivel_evidencia || null,
            resumo_executivo: cj.conclusao_pratica || cj.resultados_principais || null,
            aplicacao_clinica: cj.aplicabilidade_clinica || null,
            achados_principais: cj.resultados_principais || null,
            limitacoes: cj.justificativa_risco_vies || null,
            metodologia_destaque: cj.intervencao ? `${cj.intervencao} vs ${cj.comparador || "N/A"}` : null,
            resultado_principal: cj.resultados_principais || null,
            score_relevancia: score,
            classificacao,
            leitura_essencial: classificacao === "leitura_essencial",
            tags,
            visible_academy: true,
            visible_reghen_feed: true,
            published_date: fullPaper?.year ? `${fullPaper.year}-01-01` : null,
            reviewed_by: user?.id || null,
            reviewed_at: new Date().toISOString(),
            source: "system_papers",
          };

          // Check for existing by DOI or title
          let existingId: string | null = null;
          if (fullPaper?.doi) {
            const { data: byDoi } = await supabase
              .from("academy_curated_articles")
              .select("id")
              .eq("doi", fullPaper.doi)
              .maybeSingle();
            existingId = byDoi?.id || null;
          }
          if (!existingId) {
            const { data: byTitle } = await supabase
              .from("academy_curated_articles")
              .select("id")
              .eq("title", fullPaper?.title || "")
              .maybeSingle();
            existingId = byTitle?.id || null;
          }

          if (existingId) {
            await supabase
              .from("academy_curated_articles")
              .update(curatedArticle)
              .eq("id", existingId);
          } else {
            await supabase
              .from("academy_curated_articles")
              .insert(curatedArticle);
          }
        } catch (syncErr) {
          console.error("Failed to sync to library:", syncErr);
          // Don't block publish — sync is best-effort
        }
      }

      const { error } = await supabase
        .from("academy_papers")
        .update(updateData)
        .eq("id", paperId);

      if (error) throw error;

      // Fetch updated paper for revision snapshot
      const { data: updatedPaper } = await supabase
        .from("academy_papers")
        .select("*")
        .eq("id", paperId)
        .single();

      if (updatedPaper) {
        const actionMap: Record<string, string> = {
          draft: "save_draft",
          ready: "mark_ready",
          published: "publish",
          rejected: "unpublish",
          archived: "unpublish",
        };
        await createRevision(paperId, actionMap[status] || "edit", updatedPaper);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
      queryClient.invalidateQueries({ queryKey: ["paper-revisions"] });
    },
  });
}

export function useSoftDeletePaper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paperId, restore }: { paperId: string; restore?: boolean }) => {
      const { error } = await supabase
        .from("academy_papers")
        .update({
          deleted_at: restore ? null : new Date().toISOString(),
        })
        .eq("id", paperId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-papers"] });
    },
  });
}
