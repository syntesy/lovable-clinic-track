import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { PaperDetailModal } from "@/components/academy/PaperDetailModal";

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

  const { data: papers = [], isLoading } = useAcademyPapers(statusFilter);
  const importMutation = useImportPaper();
  const curationMutation = useGenerateCuration();
  const updateStatusMutation = useUpdatePaperStatus();
  const deleteMutation = useSoftDeletePaper();
  const { indexPaper } = useIndexPaper();

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
          <Button onClick={() => setShowImport(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Importar Paper
          </Button>
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
                        </div>
                        <h3 className="font-semibold text-foreground line-clamp-2">{paper.title}</h3>
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
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Paper Científico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>PMID, DOI ou URL</Label>
              <Input
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="Ex: 38123456, https://pubmed.ncbi.nlm.nih.gov/38123456, 10.1016/j.knee.2024.01.001"
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cole um PMID numérico, uma URL do PubMed, um DOI ou uma URL do DOI.
                Os metadados serão buscados automaticamente via API oficial.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Fontes permitidas</p>
                  <p>Apenas PubMed (E-utilities) e Crossref (API oficial). Nenhum scraping ou fonte secundária é utilizado.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={importMutation.isPending}>
              {importMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Importar
            </Button>
          </DialogFooter>
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
