import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  FileText,
  History,
  Clock,
  FileWarning,
  Download,
  BookOpen,
} from "lucide-react";
import type { AcademyPaper } from "@/hooks/useAcademyPapers";
import { usePaperRevisions } from "@/hooks/useAcademyPapers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GuidedReadingSection } from "./GuidedReadingSection";
import { PaperSummaryCard } from "./PaperSummaryCard";
import { EvidenceMethodSeal } from "./EvidenceMethodSeal";
import { ReghenLayersDisplay } from "./ReghenLayersDisplay";
import { PaperTechnicalStatus } from "./PaperTechnicalStatus";
import { hasReghenMethod, getLegacyWarning } from "@/hooks/useEvidenceScore";
import { validateReghenEvidenceMethod, type RemComplianceResult } from "@/utils/remComplianceValidator";
import {
  resolvePaperTemplate,
  safeField,
  safeArray,
  getBestConclusion,
  getWhatIsThis,
  getAudience,
  validateAbstract,
  TEMPLATE_LABELS,
  TEMPLATE_APPLICABILITY,
  type PaperTemplate,
} from "@/utils/paperTemplateRouter";

interface PaperDetailModalProps {
  paper: AcademyPaper;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateCuration: () => void;
  onPublish: () => void;
  onReject: () => void;
  isGenerating: boolean;
  userRole?: string;
}

const ACTION_LABELS: Record<string, string> = {
  save_draft: "Rascunho salvo",
  mark_ready: "Marcado como pronto",
  publish: "Publicado",
  unpublish: "Despublicado / Rejeitado",
  edit: "Editado",
};

export function PaperDetailModal({
  paper,
  open,
  onOpenChange,
  onGenerateCuration,
  onPublish,
  onReject,
  isGenerating,
  userRole = "admin_academy",
}: PaperDetailModalProps) {
  const queryClient = useQueryClient();
  const [reprocessingFileId, setReprocessingFileId] = useState<string | null>(null);
  const [generatingAbstract, setGeneratingAbstract] = useState(false);
  const curation = paper.curation_data;
  const hasCuration = !!curation;
  const remLayers = curation?.reghen_evidence_method?.layers;
  const hasRem = hasReghenMethod(curation);
  const { data: revisions = [], isLoading: loadingRevisions } = usePaperRevisions(open ? paper.id : null);
  const canDownload = ["admin_academy", "teacher_approved", "teacher_candidate"].includes(userRole);
  const isAdmin = ["admin_academy", "teacher_approved"].includes(userRole);
  const isLegacy = hasCuration && !hasRem && paper.curation_status === "published";

  // Fetch fulltext data from DB
  const { data: fulltextData } = useQuery({
    queryKey: ["paper-fulltext", paper.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_paper_fulltext" as any)
        .select("has_sufficient_text, is_scanned, extraction_method, char_count, word_count, chunk_count, updated_at, abstract, abstract_source, abstract_char_count")
        .eq("paper_id", paper.id)
        .maybeSingle();
      return data as any | null;
    },
  });

  // Fetch curation row from academy_paper_curation
  const { data: curationRow } = useQuery({
    queryKey: ["paper-curation", paper.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_paper_curation" as any)
        .select("id, curation_json, nivel_evidencia, score_metodologico, risco_vies, request_id, created_at, paper_template, schema_version, data_quality_warnings")
        .eq("paper_id", paper.id)
        .maybeSingle();
      return data as any | null;
    },
  });

  // Fetch file info
  const { data: paperFiles = [] } = useQuery({
    queryKey: ["paper-files", paper.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_paper_files" as any)
        .select("id, file_name, size_bytes, scan_suspected, storage_path, processing_status")
        .eq("paper_id", paper.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const hasScanWarning = fulltextData?.is_scanned === true;
  const curationJson = curationRow?.curation_json || null;

  // Template: DB is source of truth, client router is fallback only
  const template: PaperTemplate = curationRow?.paper_template
    ? (curationRow.paper_template as PaperTemplate)
    : resolvePaperTemplate(curationJson, {
        nivel_evidencia: curationRow?.nivel_evidencia,
        risco_vies: curationRow?.risco_vies,
        score_metodologico: curationRow?.score_metodologico,
        evidence_score: paper.evidence_score,
        has_sufficient_text: fulltextData?.has_sufficient_text,
      });
  const templateFromDb = !!curationRow?.paper_template;

  // REM compliance — adjusted for template
  const compliance: RemComplianceResult | null = hasRem
    ? validateReghenEvidenceMethod(remLayers)
    : null;

  // Abstract validation
  const abstractText = fulltextData?.abstract || paper.abstract_text || null;
  const abstractValidation = validateAbstract(abstractText, fulltextData?.abstract_char_count ?? (abstractText?.length || 0));

  const handleDownloadPdf = async (storagePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("academy-papers")
        .download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar PDF.");
    }
  };

  const handleReprocess = async (fileId: string) => {
    setReprocessingFileId(fileId);
    try {
      const { data, error } = await supabase.functions.invoke("academy-upload-pdf", {
        body: { paper_id: paper.id, file_id: fileId, reprocess: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Reprocessamento iniciado.");
      queryClient.invalidateQueries({ queryKey: ["paper-files", paper.id] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao reprocessar.");
    } finally {
      setReprocessingFileId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-lg leading-tight pr-8">{paper.title}</DialogTitle>
            {paper.curation_status === "published" && <EvidenceMethodSeal />}
          </div>
          <p className="text-sm text-muted-foreground">
            {paper.authors} • {paper.year} • {paper.journal}
          </p>
          {/* Template + key chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="secondary" className="text-xs">{TEMPLATE_LABELS[template]}</Badge>
            {template === 'TEMPLATE_CLINICAL_COMPARATIVE' ? (
              <>
                {safeField(curationJson?.nivel_evidencia) && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    Nível {curationJson.nivel_evidencia}
                  </Badge>
                )}
                {safeField(curationJson?.risco_vies) && (
                  <Badge variant="outline" className={`text-xs ${
                    curationJson.risco_vies === 'baixo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    curationJson.risco_vies === 'moderado' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    Viés: {curationJson.risco_vies}
                  </Badge>
                )}
              </>
            ) : (
              <>
                <Badge variant="outline" className="text-xs text-muted-foreground">Nível: N/A</Badge>
                <Badge variant="outline" className="text-xs text-muted-foreground">Viés: N/A</Badge>
              </>
            )}
            <Badge variant="outline" className="text-xs">{TEMPLATE_APPLICABILITY[template]}</Badge>
            {paper.pmid && (
              <a href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted text-xs">
                  <ExternalLink className="h-3 w-3" /> PubMed
                </Badge>
              </a>
            )}
            {paper.doi && (
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted text-xs">
                  <ExternalLink className="h-3 w-3" /> DOI
                </Badge>
              </a>
            )}
          </div>
          {/* Evidence Score */}
          {paper.evidence_score != null && (
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={`text-xs gap-1 ${
                  paper.evidence_score >= 70
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : paper.evidence_score >= 40
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}
              >
                Score: {paper.evidence_score}/100
              </Badge>
              {paper.evidence_label && (
                <Badge variant="outline" className="text-xs">{paper.evidence_label}</Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="shrink-0">
            <TabsTrigger value="details" className="gap-1"><FileText className="h-3 w-3" /> Detalhes</TabsTrigger>
            <TabsTrigger value="reading" className="gap-1"><BookOpen className="h-3 w-3" /> Leitura Guiada</TabsTrigger>
            <TabsTrigger value="ficha" className="gap-1"><FileText className="h-3 w-3" /> Ficha Aula</TabsTrigger>
            <TabsTrigger value="history" className="gap-1"><History className="h-3 w-3" /> Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 min-h-0 mt-0 overflow-hidden">
            <div className="h-full overflow-y-auto -mx-6 px-6">
              <div className="space-y-6 pb-24">
                {/* Technical Status Panel */}
                <PaperTechnicalStatus
                  paperId={paper.id}
                  curationStatus={paper.curation_status}
                  fulltextData={fulltextData}
                  curationRow={curationRow}
                  userRole={userRole}
                  dataQualityWarnings={curationRow?.data_quality_warnings as any[] | null}
                />

                {/* Scan Warning */}
                {hasScanWarning && (
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <FileWarning className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-300">PDF escaneado / sem texto selecionável</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          O texto extraído deste PDF é insuficiente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Files */}
                {paperFiles.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Arquivos PDF
                    </h3>
                    <div className="space-y-2">
                      {paperFiles.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-2 rounded border border-border">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm text-foreground truncate">{f.file_name}</span>
                            {f.size_bytes && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                ({(f.size_bytes / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            )}
                            {f.processing_status === "processed" && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Processado
                              </Badge>
                            )}
                            {f.processing_status === "failed" && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] shrink-0 gap-1">
                                <XCircle className="w-2.5 h-2.5" /> Falha
                              </Badge>
                            )}
                            {(f.processing_status === "pending" || f.processing_status === "queued") && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px] shrink-0 gap-1">
                                <Clock className="w-2.5 h-2.5" /> Processando
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {f.processing_status === "failed" && canDownload && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs"
                                disabled={reprocessingFileId === f.id}
                                onClick={() => handleReprocess(f.id)}
                              >
                                {reprocessingFileId === f.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                Reprocessar
                              </Button>
                            )}
                            {canDownload && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleDownloadPdf(f.storage_path, f.file_name)}
                              >
                                <Download className="w-3 h-3" /> Baixar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Warnings */}
                {paper.warnings && paper.warnings.length > 0 && (
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 space-y-1">
                    {paper.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <span className="text-orange-300">{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── EM 20 SEGUNDOS ── */}
                {curationJson && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-primary uppercase">Em 20 segundos</h3>
                    {getWhatIsThis(curationJson) && (
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">O que é:</span> {getWhatIsThis(curationJson)}
                      </p>
                    )}
                    {getBestConclusion(curationJson) && (
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">Conclui:</span> {getBestConclusion(curationJson)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-muted-foreground">Para:</span>
                      {getAudience(template).map(a => (
                        <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Abstract */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Abstract
                    {fulltextData?.abstract_source && fulltextData.abstract_source !== "none" && abstractValidation.isValid && (
                      <Badge variant="outline" className="text-[10px]">
                        {fulltextData.abstract_source === "extracted" ? "Extraído do PDF" :
                         fulltextData.abstract_source === "fallback" ? "Fallback" :
                         fulltextData.abstract_source === "generated" ? "Gerado por IA" : ""}
                      </Badge>
                    )}
                  </h3>
                  {abstractValidation.isValid && abstractText ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{abstractText}</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground italic">
                        Abstract não identificado no PDF.
                      </p>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          disabled={generatingAbstract}
                          onClick={async () => {
                            setGeneratingAbstract(true);
                            try {
                              const { data, error } = await supabase.functions.invoke("academy-generate-abstract", {
                                body: { paper_id: paper.id },
                              });
                              if (error) throw error;
                              if (data?.error) throw new Error(data.error);
                              toast.success("Abstract gerado com sucesso.");
                              queryClient.invalidateQueries({ queryKey: ["paper-fulltext", paper.id] });
                            } catch (err: any) {
                              toast.error(err.message || "Erro ao gerar abstract.");
                            } finally {
                              setGeneratingAbstract(false);
                            }
                          }}
                        >
                          {generatingAbstract ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Gerar resumo por IA (neutro)
                        </Button>
                      )}
                    </div>
                  )}
                </section>

                {/* MeSH Terms */}
                {paper.mesh_terms && paper.mesh_terms.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-foreground mb-2">MeSH Terms</h3>
                    <div className="flex flex-wrap gap-1">
                      {paper.mesh_terms.map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </section>
                )}

                <Separator />

                {/* Curation */}
                {hasCuration ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-foreground">Curadoria IA</span>
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                        Gerado por IA — requer revisão humana
                      </Badge>
                    </div>

                    {isLegacy && (
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 mb-3">
                        <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {getLegacyWarning()}
                        </p>
                      </div>
                    )}

                    {hasRem ? (
                      <>
                        {/* REM Compliance — template-aware */}
                        {compliance && (
                          <div className={`rounded-lg border p-2 mb-3 ${
                            compliance.is_valid
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-red-500/30 bg-red-500/10"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {compliance.is_valid ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                              )}
                              <span className={`text-xs font-medium ${compliance.is_valid ? "text-emerald-400" : "text-red-400"}`}>
                                Qualidade e Consistência (REM™): {compliance.compliance_score}/100
                              </span>
                            </div>
                            {/* Show max 2 alerts */}
                            {compliance.errors.length > 0 && (
                              <ul className="space-y-0.5 mt-1">
                                {compliance.errors.slice(0, 2).map((e, i) => (
                                  <li key={i} className="text-[11px] text-red-400 flex items-start gap-1">
                                    <span className="shrink-0">✕</span> {e}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {compliance.warnings.length > 0 && (
                              <ul className="space-y-0.5 mt-1">
                                {compliance.warnings.slice(0, 2).map((w, i) => (
                                  <li key={i} className="text-[11px] text-yellow-400 flex items-start gap-1">
                                    <span className="shrink-0">⚠</span> {w}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {template !== 'TEMPLATE_CLINICAL_COMPARATIVE' && (
                              <p className="text-[10px] text-muted-foreground mt-1 italic">
                                Critérios clínicos (outcome, comparador) não aplicáveis para este tipo de paper.
                              </p>
                            )}
                          </div>
                        )}
                        <ReghenLayersDisplay
                          layers={remLayers}
                          breakdown={(paper as any).evidence_score_breakdown || null}
                        />
                      </>
                    ) : (
                      /* Non-REM: template-specific curation display */
                      <>
                        {curationJson && (
                          <TemplateCurationDisplay curationJson={curationJson} template={template} />
                        )}
                        {/* Legacy fields fallback */}
                        {!curationJson && (
                          <div className="grid grid-cols-2 gap-4">
                            <CurationField label="Tipo de Estudo" value={curation.study_type} />
                            <CurationField label="Nível de Evidência" value={curation.level_inference} />
                            <CurationField label="População" value={curation.population} />
                            <CurationField label="Intervenção" value={curation.intervention} />
                            <CurationField label="Comparação" value={curation.comparison} />
                            <CurationField label="Direção do Efeito" value={curation.effect_direction} />
                          </div>
                        )}
                      </>
                    )}

                    {curation.interventions_norm?.length > 0 && (
                      <section>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Intervenções (normalizado)</h4>
                        <div className="flex flex-wrap gap-1">
                          {curation.interventions_norm.map((t: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </section>
                    )}

                    {curation.pathologies_norm?.length > 0 && (
                      <section>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Patologias (normalizado)</h4>
                        <div className="flex flex-wrap gap-1">
                          {curation.pathologies_norm.map((t: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </section>
                    )}

                    <Separator />

                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                      <p className="italic">
                        ⚕️ Esta síntese é baseada exclusivamente nos estudos disponíveis na biblioteca e não substitui avaliação clínica individual.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">Curadoria ainda não gerada.</p>
                    <Button onClick={onGenerateCuration} disabled={isGenerating} className="gap-2">
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Gerar Curadoria com IA
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 min-h-0 mt-0 overflow-hidden">
            <div className="h-full overflow-y-auto -mx-6 px-6">
              <div className="space-y-3 pb-24">
                {loadingRevisions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : revisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma revisão registrada ainda.
                  </p>
                ) : (
                  revisions.map((rev) => (
                    <div key={rev.id} className="rounded-lg border border-border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {ACTION_LABELS[rev.action] || rev.action}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{rev.status}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(rev.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      {rev.warnings && Array.isArray(rev.warnings) && rev.warnings.length > 0 && (
                        <p className="text-xs text-orange-400">
                          ⚠ {rev.warnings.length} aviso(s)
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reading" className="flex-1 min-h-0 mt-0 overflow-hidden">
            <div className="h-full overflow-y-auto -mx-6 px-6">
              <div className="pb-24">
                <GuidedReadingSection
                  curationJson={curationJson}
                  remLayers={remLayers}
                  paperTitle={paper.title}
                  template={template}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ficha" className="flex-1 min-h-0 mt-0 overflow-hidden">
            <div className="h-full overflow-y-auto -mx-6 px-6">
              <div className="pb-24">
                <PaperSummaryCard
                  title={paper.title}
                  authors={paper.authors}
                  journal={paper.journal}
                  year={paper.year}
                  isPublished={paper.curation_status === "published"}
                  evidenceScore={paper.evidence_score}
                  curationJson={curationJson}
                  template={template}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        {hasCuration && paper.curation_status === "ready" && (
          <div className="flex justify-end gap-2 pt-3 pb-1 border-t shrink-0 bg-background">
            <Button variant="outline" onClick={onReject} className="gap-1 text-destructive">
              <XCircle className="w-4 h-4" /> Rejeitar
            </Button>
            <Button onClick={onPublish} className="gap-1">
              <CheckCircle2 className="w-4 h-4" /> Publicar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Template-specific curation display ──
function TemplateCurationDisplay({ curationJson, template }: { curationJson: any; template: PaperTemplate }) {
  const c = curationJson;

  if (template === 'TEMPLATE_CLINICAL_COMPARATIVE') {
    return (
      <div className="space-y-4">
        {/* PICO */}
        {(safeField(c.intervencao) || safeField(c.comparador)) && (
          <div className="grid grid-cols-2 gap-4">
            <CurationField label="Intervenção" value={safeField(c.intervencao)} />
            <CurationField label="Comparador" value={safeField(c.comparador)} />
            {(c.tamanho_amostra_total ?? 0) > 0 && (
              <CurationField label="Amostra" value={`n=${c.tamanho_amostra_total}`} />
            )}
            <CurationField label="Follow-up" value={safeField(c.follow_up_medio)} />
          </div>
        )}
        {/* Key results */}
        <CurationField label="Resultados Principais" value={safeField(c.resultados_principais)} />
        {/* Reliability */}
        <div className="flex flex-wrap gap-2">
          {safeField(c.risco_vies) && (
            <Badge variant="outline" className={`text-xs ${
              c.risco_vies === 'baixo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              c.risco_vies === 'moderado' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
              'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              Viés: {c.risco_vies}
            </Badge>
          )}
          {c.score_metodologico != null && (
            <Badge variant="outline" className="text-xs">Score: {c.score_metodologico}/10</Badge>
          )}
        </div>
        <CurationField label="Aplicabilidade Clínica" value={safeField(c.aplicabilidade_clinica)} />
        <CurationField label="Conclusão Prática" value={safeField(c.conclusao_pratica)} />
      </div>
    );
  }

  if (template === 'TEMPLATE_REVIEW_CONSENSUS') {
    return (
      <div className="space-y-4">
        <CurationField label="O que revisa" value={safeField(c.intervencao)} />
        <CurationField label="Principais achados" value={safeField(c.resultados_principais)} />
        <CurationField label="Aplicabilidade" value={safeField(c.aplicabilidade_clinica)} />
        <CurationField label="Conclusão" value={safeField(c.conclusao_pratica)} />
      </div>
    );
  }

  if (template === 'TEMPLATE_TRANSLATIONAL_PRECLINICAL') {
    return (
      <div className="space-y-4">
        <CurationField label="Pergunta científica" value={safeField(c.intervencao)} />
        <CurationField label="Mecanismos / achados" value={safeField(c.resultados_principais)} />
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2">
          <p className="text-sm text-orange-300">
            ⚠ Este paper não fornece evidência clínica direta. Resultados são experimentais.
          </p>
        </div>
        <CurationField label="Aplicabilidade" value={safeField(c.aplicabilidade_clinica)} />
      </div>
    );
  }

  // OTHER
  return (
    <div className="space-y-4">
      <CurationField label="Tipo de Estudo" value={safeField(c.tipo_estudo)} />
      <CurationField label="Resultados" value={safeField(c.resultados_principais)} />
      <CurationField label="Conclusão" value={safeField(c.conclusao_pratica) || safeField(c.aplicabilidade_clinica)} />
    </div>
  );
}

function CurationField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <section>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-0.5">{label}</h4>
      <p className="text-sm text-foreground">{value}</p>
    </section>
  );
}
