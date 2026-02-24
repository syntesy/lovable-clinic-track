import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useQuery } from "@tanstack/react-query";
import { GuidedReadingSection } from "./GuidedReadingSection";
import { PaperSummaryCard } from "./PaperSummaryCard";
import { EvidenceMethodSeal } from "./EvidenceMethodSeal";
import { ReghenLayersDisplay } from "./ReghenLayersDisplay";
import { hasReghenMethod, getLegacyWarning } from "@/hooks/useEvidenceScore";

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
  const curation = paper.curation_data;
  const hasCuration = !!curation;
  const remLayers = curation?.reghen_evidence_method?.layers;
  const hasRem = hasReghenMethod(curation);
  const { data: revisions = [], isLoading: loadingRevisions } = usePaperRevisions(open ? paper.id : null);
  const canDownload = ["admin_academy", "teacher_approved", "teacher_candidate"].includes(userRole);
  const hasScanWarning = paper.warnings?.some(w => w.includes("escaneado") || w.includes("scan"));
  const isLegacy = hasCuration && !hasRem && paper.curation_status === "published";

  // Fetch file info
  const { data: paperFiles = [] } = useQuery({
    queryKey: ["paper-files", paper.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_paper_files" as any)
        .select("id, file_name, size_bytes, scan_suspected, storage_path")
        .eq("paper_id", paper.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-lg leading-tight pr-8">{paper.title}</DialogTitle>
            {paper.curation_status === "published" && <EvidenceMethodSeal />}
          </div>
          <p className="text-sm text-muted-foreground">
            {paper.authors} • {paper.year} • {paper.journal}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {paper.pmid && (
              <a href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                  <ExternalLink className="h-3 w-3" /> PubMed: {paper.pmid}
                </Badge>
              </a>
            )}
            {paper.doi && (
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
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
              <span className="text-[10px] text-muted-foreground italic">heurístico</span>
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0">
            <TabsTrigger value="details" className="gap-1"><FileText className="h-3 w-3" /> Detalhes</TabsTrigger>
            <TabsTrigger value="reading" className="gap-1"><BookOpen className="h-3 w-3" /> Leitura Guiada</TabsTrigger>
            <TabsTrigger value="ficha" className="gap-1"><FileText className="h-3 w-3" /> Ficha Aula</TabsTrigger>
            <TabsTrigger value="history" className="gap-1"><History className="h-3 w-3" /> Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 min-h-0">
            <ScrollArea className="h-full max-h-[60vh] -mx-6 px-6">
              <div className="space-y-6 pb-4">
                {/* Scan Warning */}
                {hasScanWarning && (
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <FileWarning className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-300">PDF escaneado / sem texto selecionável</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          O texto extraído deste PDF é insuficiente. A busca RAG pode não funcionar adequadamente para este paper.
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
                            {f.scan_suspected && (
                              <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] shrink-0">
                                Scan
                              </Badge>
                            )}
                          </div>
                          {canDownload && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 gap-1"
                              onClick={() => handleDownloadPdf(f.storage_path, f.file_name)}
                            >
                              <Download className="w-3 h-3" /> Baixar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Warnings */}
                {paper.warnings?.length > 0 && (
                  <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 space-y-1">
                    {paper.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <span className="text-orange-300">{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Abstract */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Abstract
                  </h3>
                  {paper.abstract_text ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{paper.abstract_text}</p>
                  ) : (
                    <p className="text-sm text-orange-400 italic">Abstract não disponível.</p>
                  )}
                </section>

                {/* MeSH Terms */}
                {paper.mesh_terms?.length > 0 && (
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

                    {/* Legacy warning */}
                    {isLegacy && (
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 mb-3">
                        <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {getLegacyWarning()}
                        </p>
                      </div>
                    )}

                    {/* Reghen Evidence Method™ 7 Layers */}
                    {hasRem ? (
                      <ReghenLayersDisplay
                        layers={remLayers}
                        breakdown={(paper as any).evidence_score_breakdown || null}
                      />
                    ) : (
                      /* Legacy curation display */
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <CurationField label="Tipo de Estudo" value={curation.study_type} />
                          <CurationField label="Nível de Evidência" value={curation.level_inference} />
                          <CurationField label="População" value={curation.population} />
                          <CurationField label="Intervenção" value={curation.intervention} />
                          <CurationField label="Comparação" value={curation.comparison} />
                          <CurationField label="Direção do Efeito" value={curation.effect_direction} />
                        </div>

                        <CurationField label="Desfechos Principais" value={curation.outcomes_principais} />
                        <CurationField label="Resumo Curto" value={curation.summary_short} />
                        <CurationField label="Follow-up" value={curation.follow_up} />

                        {curation.limitations?.length > 0 && (
                          <section>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Limitações</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                              {curation.limitations.map((l: string, i: number) => (
                                <li key={i}>{l}</li>
                              ))}
                            </ul>
                          </section>
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

                    {curation.summary_full_md && (
                      <section>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Resumo Completo</h4>
                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {curation.summary_full_md}
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
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 min-h-0">
            <ScrollArea className="h-full max-h-[60vh] -mx-6 px-6">
              <div className="space-y-3 pb-4">
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
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reading" className="flex-1 min-h-0">
            <ScrollArea className="h-full max-h-[60vh] -mx-6 px-6">
              <div className="pb-4">
                <GuidedReadingSection article={{
                  study_type: curation?.study_type || paper.curation_data?.study_type || "",
                  year: paper.year || 0,
                  follow_up: curation?.follow_up,
                  effect_summary: curation?.outcomes_principais,
                  limitations: curation?.limitations,
                  summary_short: curation?.summary_short || paper.abstract_text || "",
                  summary_full: curation?.summary_full_md,
                  abstract_text: paper.abstract_text,
                  evidence_score: paper.evidence_score,
                  curation_data: curation || null,
                }} />
                {!curation && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Curadoria necessária para gerar guia de leitura.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ficha" className="flex-1 min-h-0">
            <ScrollArea className="h-full max-h-[60vh] -mx-6 px-6">
              <div className="pb-4">
                <PaperSummaryCard
                  article={{
                    id: paper.id,
                    title: paper.title,
                    authors: paper.authors,
                    journal: paper.journal,
                    year: paper.year || 0,
                    study_type: curation?.study_type || "",
                    interventions: curation?.interventions_norm || [],
                    pathologies: curation?.pathologies_norm || [],
                    keywords: [],
                    pubmed_url: paper.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}` : null,
                    doi_url: paper.doi ? `https://doi.org/${paper.doi}` : null,
                    abstract_text: paper.abstract_text,
                    summary_short: curation?.summary_short || paper.abstract_text || "",
                    summary_full: curation?.summary_full_md || null,
                    effect_summary: curation?.outcomes_principais || null,
                    limitations: curation?.limitations || null,
                    follow_up: curation?.follow_up || null,
                    external_id: null,
                    ai_summary: null,
                    evidence_score: paper.evidence_score,
                    created_by: paper.created_by,
                    created_at: paper.created_at,
                    updated_at: paper.updated_at,
                    is_published: paper.curation_status === "published",
                    deleted_at: paper.deleted_at,
                  }}
                  open={true}
                  onOpenChange={() => {}}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        {hasCuration && paper.curation_status === "ready" && (
          <div className="flex justify-end gap-2 pt-4 border-t">
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

function CurationField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <section>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-0.5">{label}</h4>
      <p className="text-sm text-foreground">{value}</p>
    </section>
  );
}
