import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  ArrowLeft,
  FileText,
  Search,
  Bot,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Archive,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useAcademyPapers,
  useImportPaper,
  useGenerateCuration,
  useUpdatePaperStatus,
  useSoftDeletePaper,
  type AcademyPaper,
} from "@/hooks/useAcademyPapers";
import { useIndexPaper } from "@/hooks/useAcademyRag";
import { useUploadPdf, useExtractPdfText } from "@/hooks/useAcademyPdfUpload";
import { toast } from "sonner";
import { PaperDetailModal } from "@/components/academy/PaperDetailModal";
import { EvidenceMethodSeal } from "@/components/academy/EvidenceMethodSeal";
import { hasReghenMethod } from "@/hooks/useEvidenceScore";
import { validateReghenEvidenceMethod } from "@/utils/remComplianceValidator";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Rascunho", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: FileText },
  curating: { label: "Gerando Curadoria...", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Sparkles },
  ready: { label: "Pronto para Revisão", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Bot },
  published: { label: "Publicado", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: ShieldCheck },
  rejected: { label: "Rejeitado", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  archived: { label: "Arquivado", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Archive },
};

export default function AcademyPapersAdminPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<AcademyPaper | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfAssociatePaperId, setPdfAssociatePaperId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: papers = [], isLoading } = useAcademyPapers(statusFilter);
  const importMutation = useImportPaper();
  const curationMutation = useGenerateCuration();
  const updateStatusMutation = useUpdatePaperStatus();
  const deleteMutation = useSoftDeletePaper();
  const { indexPaper } = useIndexPaper();
  const { uploadPdf, isUploading } = useUploadPdf();
  const { extractPdfText, isExtracting } = useExtractPdfText();

  const filteredPapers = papers.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.authors ?? "").toLowerCase().includes(q) ||
      (p.pmid ?? "").includes(q) ||
      (p.doi ?? "").toLowerCase().includes(q)
    );
  });

  const handleImport = async () => {
    if (!importInput.trim()) {
      toast.error("Insira um PMID, DOI ou URL.");
      return;
    }
    try {
      const result = await importMutation.mutateAsync(importInput.trim());
      toast.success(`Artigo importado: "${result.paper.title}"`);
      if (result.warnings?.length > 0) {
        result.warnings.forEach((w: string) => toast.warning(w));
      }
      setShowImport(false);
      setImportInput("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao importar artigo.");
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) {
      toast.error("Selecione um arquivo PDF.");
      return;
    }
    if (!pdfAssociatePaperId && !pdfTitle.trim()) {
      toast.error("Informe o título do novo paper ou selecione um existente.");
      return;
    }
    try {
      const result = await uploadPdf({
        file: pdfFile,
        paperId: pdfAssociatePaperId || undefined,
        title: pdfTitle.trim() || undefined,
      });
      toast.success(result.created_new ? "Paper criado e PDF enviado!" : "PDF associado ao paper!");

      // Auto-extract text
      try {
        toast.info("Extraindo texto do PDF...");
        const extractResult = await extractPdfText(result.paper_id);
        if (extractResult?.extracted) {
          toast.success(`Texto extraído: ${extractResult.chunks_created} chunks criados.`);
        } else if (extractResult?.warning) {
          toast.warning(extractResult.warning);
        }
      } catch {
        toast.warning("PDF enviado, mas extração de texto falhou. Pode ser processado depois.");
      }

      setShowImport(false);
      setPdfFile(null);
      setPdfTitle("");
      setPdfAssociatePaperId("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload do PDF.");
    }
  };

  const handleGenerateCuration = async (paper: AcademyPaper) => {
    try {
      toast.info("Gerando curadoria com IA...");
      const result = await curationMutation.mutateAsync(paper.id);
      toast.success("Curadoria gerada com sucesso!");
      if (result.warnings?.length > 0) {
        result.warnings.forEach((w: string) => toast.warning(w));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar curadoria.");
    }
  };

  const handleStatusChange = async (paper: AcademyPaper, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ paperId: paper.id, status: newStatus });
      toast.success(`Status alterado para "${STATUS_CONFIG[newStatus]?.label || newStatus}".`);

      // Auto-index when publishing
      if (newStatus === "published") {
        try {
          const result = await indexPaper(paper.id);
          if (result?.indexed) {
            toast.success(`Paper indexado para RAG (${result.chunks_created} chunks).`);
          } else if (result?.warning) {
            toast.warning(result.warning);
          }
        } catch {
          toast.warning("Paper publicado, mas indexação RAG falhou. Pode ser reindexado depois.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar status.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Papers Científicos</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Importação oficial via PubMed/DOI • Curadoria assistida por IA • Auditoria completa
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/academy/admin/migrations")} className="gap-2">
              <Sparkles className="w-4 h-4" /> Migração REM™
            </Button>
            <Button onClick={() => setShowImport(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Importar Paper
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, autor, PMID ou DOI…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="ready">Pronto p/ Revisão</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
              <SelectItem value="archived">Arquivados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Nenhum paper encontrado. Importe seu primeiro artigo científico.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPapers.map((paper) => {
              const config = STATUS_CONFIG[paper.curation_status] || STATUS_CONFIG.draft;
              const StatusIcon = config.icon;

              return (
                <Card key={paper.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedPaper(paper)}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge variant="outline" className={`${config.color} border gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {paper.pmid && <Badge variant="outline">PMID: {paper.pmid}</Badge>}
                          {paper.doi && <Badge variant="outline" className="max-w-[200px] truncate">DOI: {paper.doi}</Badge>}
                          {!paper.abstract_text && (
                            <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Sem abstract
                            </Badge>
                          )}
                          {paper.warnings?.length > 0 && (
                            <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {paper.warnings.length} aviso(s)
                            </Badge>
                          )}
                          {paper.evidence_score != null && (
                            <Badge variant="outline" className={`gap-0.5 text-[10px] ${paper.evidence_score >= 70 ? "text-emerald-400" : paper.evidence_score >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                              ⚡ {paper.evidence_score}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground line-clamp-2">{paper.title}</h3>
                          {paper.curation_status === "published" && <EvidenceMethodSeal />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {paper.authors ? `${paper.authors} • ` : ""}
                          {paper.year || "Ano N/A"} • {paper.journal || "Journal N/A"}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {paper.curation_status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateCuration(paper)}
                            disabled={curationMutation.isPending}
                            className="gap-1"
                          >
                            {curationMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Gerar Curadoria
                          </Button>
                        )}
                        {paper.curation_status === "ready" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(paper, "published")} className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Publicar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(paper, "rejected")} className="gap-1 text-destructive">
                              <XCircle className="w-3 h-3" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {paper.curation_status === "published" && (
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(paper, "archived")} className="gap-1">
                            <Archive className="w-3 h-3" />
                            Arquivar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Import Modal */}
      <Dialog open={showImport} onOpenChange={(open) => {
        setShowImport(open);
        if (!open) {
          setImportInput("");
          setPdfFile(null);
          setPdfTitle("");
          setPdfAssociatePaperId("");
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Paper Científico</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="pmid" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pmid">PMID / DOI / URL</TabsTrigger>
              <TabsTrigger value="pdf" className="gap-1">
                <Upload className="w-3 h-3" /> Upload PDF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pmid" className="space-y-4 mt-4">
              <div>
                <Label>PMID, DOI ou URL</Label>
                <Input
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="Ex: 38123456, 10.1016/j.knee.2024.01.001"
                  onKeyDown={(e) => e.key === "Enter" && handleImport()}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cole um PMID numérico, uma URL do PubMed, um DOI ou uma URL do DOI.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Fontes permitidas</p>
                    <p>Apenas PubMed (E-utilities) e Crossref (API oficial).</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImport(false)}>Cancelar</Button>
                <Button onClick={handleImport} disabled={importMutation.isPending}>
                  {importMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Importar
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="pdf" className="space-y-4 mt-4">
              <div>
                <Label>Arquivo PDF</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 20 * 1024 * 1024) {
                        toast.error("Arquivo deve ter no máximo 20MB.");
                        return;
                      }
                      setPdfFile(f);
                    }
                  }}
                />
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {pdfFile ? (
                    <div className="space-y-1">
                      <FileText className="w-8 h-8 mx-auto text-primary" />
                      <p className="text-sm font-medium text-foreground">{pdfFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Clique para selecionar um PDF</p>
                      <p className="text-xs text-muted-foreground">Máximo 20MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Associar a paper existente (opcional)</Label>
                <Select value={pdfAssociatePaperId} onValueChange={setPdfAssociatePaperId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Criar novo paper" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Criar novo paper</SelectItem>
                    {papers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title.slice(0, 60)}{p.title.length > 60 ? "…" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(!pdfAssociatePaperId || pdfAssociatePaperId === "new") && (
                <div>
                  <Label>Título do paper *</Label>
                  <Input
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    placeholder="Título do artigo científico"
                  />
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Upload manual</p>
                    <p>O PDF será armazenado com segurança. O texto será extraído e indexado automaticamente para busca RAG.</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImport(false)}>Cancelar</Button>
                <Button
                  onClick={handlePdfUpload}
                  disabled={isUploading || isExtracting || !pdfFile}
                >
                  {(isUploading || isExtracting) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isExtracting ? "Extraindo texto…" : isUploading ? "Enviando…" : "Enviar e Processar"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Paper Detail Modal */}
      {selectedPaper && (
        <PaperDetailModal
          paper={selectedPaper}
          open={!!selectedPaper}
          onOpenChange={(open) => !open && setSelectedPaper(null)}
          onGenerateCuration={() => handleGenerateCuration(selectedPaper)}
          onPublish={() => handleStatusChange(selectedPaper, "published")}
          onReject={() => handleStatusChange(selectedPaper, "rejected")}
          isGenerating={curationMutation.isPending}
        />
      )}
    </div>
  );
}
