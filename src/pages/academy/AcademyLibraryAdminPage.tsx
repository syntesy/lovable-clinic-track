import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  ArrowLeft,
  Library,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useAdminAcademyArticles,
  useSaveAcademyArticle,
  type AcademyArticle,
} from "@/hooks/useAcademyArticles";
import { toast } from "sonner";

const STUDY_TYPES = [
  "Revisão Sistemática",
  "Meta-Análise",
  "Ensaio Clínico Randomizado",
  "Estudo de Coorte",
  "Estudo de Caso",
  "Estudo Observacional",
  "Guideline",
  "Outro",
];

const emptyForm: Partial<AcademyArticle> = {
  title: "",
  authors: "",
  journal: "",
  year: new Date().getFullYear(),
  study_type: "",
  interventions: [],
  pathologies: [],
  keywords: [],
  pubmed_url: "",
  doi_url: "",
  summary_short: "",
  summary_full: "",
  effect_summary: "",
  limitations: [],
  follow_up: "",
  is_published: false,
};

export default function AcademyLibraryAdminPage() {
  const navigate = useNavigate();
  const { data: articles = [], isLoading } = useAdminAcademyArticles();
  const saveMutation = useSaveAcademyArticle();
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<Partial<AcademyArticle>>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "deleted">("all");

  const openNew = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowEditor(true);
  };

  const openEdit = (article: typeof articles[0]) => {
    setForm({
      title: article.title,
      authors: article.authors,
      journal: article.journal,
      year: article.year,
      study_type: article.study_type,
      interventions: article.interventions ?? [],
      pathologies: article.pathologies ?? [],
      pubmed_url: article.pubmed_url ?? "",
      doi_url: article.doi_url ?? "",
      summary_short: article.summary_short,
      is_published: article.is_published,
    });
    setEditingId(article.id);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim() || !form.summary_short?.trim() || !form.study_type) {
      toast.error("Preencha título, tipo de estudo e resumo curto.");
      return;
    }
    if (!form.pubmed_url?.trim() && !form.doi_url?.trim()) {
      toast.error("É necessário pelo menos um link (PubMed ou DOI).");
      return;
    }
    try {
      await saveMutation.mutateAsync({
        ...form,
        id: editingId ?? undefined,
        pubmed_url: form.pubmed_url?.trim() || null,
        doi_url: form.doi_url?.trim() || null,
      } as any);
      toast.success(editingId ? "Artigo atualizado!" : "Artigo criado!");
      setShowEditor(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar artigo.");
    }
  };

  const handleTogglePublish = async (article: typeof articles[0]) => {
    try {
      await saveMutation.mutateAsync({
        id: article.id,
        is_published: !article.is_published,
      } as any);
      toast.success(article.is_published ? "Artigo despublicado." : "Artigo publicado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar publicação.");
    }
  };

  const handleSoftDelete = async (article: typeof articles[0]) => {
    try {
      await saveMutation.mutateAsync({
        id: article.id,
        deleted_at: article.deleted_at ? null : new Date().toISOString(),
        is_published: false,
      } as any);
      toast.success(article.deleted_at ? "Artigo restaurado." : "Artigo removido.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover artigo.");
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (filterStatus === "published" && !a.is_published) return false;
    if (filterStatus === "draft" && (a.is_published || a.deleted_at)) return false;
    if (filterStatus === "deleted" && !a.deleted_at) return false;
    if (filterStatus !== "deleted" && a.deleted_at) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !(a.authors ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

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
              <Library className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Administrar Biblioteca</h1>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Artigo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou autor…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="deleted">Removidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Nenhum artigo encontrado.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <Card key={article.id} className={article.deleted_at ? "opacity-60" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {article.is_published ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Publicado</Badge>
                        ) : article.deleted_at ? (
                          <Badge variant="destructive">Removido</Badge>
                        ) : (
                          <Badge variant="secondary">Rascunho</Badge>
                        )}
                        <Badge variant="outline">{article.study_type}</Badge>
                        {article.is_published && <EvidenceMethodSeal />}
                      </div>
                      <h3 className="font-semibold text-foreground line-clamp-1">{article.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {article.authors} • {article.year} • {article.journal}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(article)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePublish(article)}
                        title={article.is_published ? "Despublicar" : "Publicar"}
                        disabled={!!article.deleted_at}
                      >
                        {article.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSoftDelete(article)}
                        title={article.deleted_at ? "Restaurar" : "Remover"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Autores</Label>
                <Input value={form.authors ?? ""} onChange={(e) => setForm({ ...form, authors: e.target.value })} />
              </div>
              <div>
                <Label>Journal</Label>
                <Input value={form.journal ?? ""} onChange={(e) => setForm({ ...form, journal: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ano *</Label>
                <Input type="number" value={form.year ?? ""} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Tipo de Estudo *</Label>
                <Select value={form.study_type ?? ""} onValueChange={(v) => setForm({ ...form, study_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                  <SelectContent>
                    {STUDY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>PubMed URL</Label>
                <Input value={form.pubmed_url ?? ""} onChange={(e) => setForm({ ...form, pubmed_url: e.target.value })} placeholder="https://pubmed.ncbi.nlm.nih.gov/..." />
              </div>
              <div>
                <Label>DOI URL</Label>
                <Input value={form.doi_url ?? ""} onChange={(e) => setForm({ ...form, doi_url: e.target.value })} placeholder="https://doi.org/..." />
              </div>
            </div>
            <div>
              <Label>Intervenções (separar por vírgula)</Label>
              <Input
                value={(form.interventions ?? []).join(", ")}
                onChange={(e) => setForm({ ...form, interventions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="PRP, Ondas de Choque"
              />
            </div>
            <div>
              <Label>Patologias (separar por vírgula)</Label>
              <Input
                value={(form.pathologies ?? []).join(", ")}
                onChange={(e) => setForm({ ...form, pathologies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Osteoartrite, Tendinopatia"
              />
            </div>
            <div>
              <Label>Resumo Curto * (exibido no card)</Label>
              <Textarea
                value={form.summary_short ?? ""}
                onChange={(e) => setForm({ ...form, summary_short: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Resumo Completo (exibido no modal)</Label>
              <Textarea
                value={form.summary_full ?? ""}
                onChange={(e) => setForm({ ...form, summary_full: e.target.value })}
                rows={6}
              />
            </div>
            <div>
              <Label>Efeito Principal</Label>
              <Textarea
                value={form.effect_summary ?? ""}
                onChange={(e) => setForm({ ...form, effect_summary: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Follow-up</Label>
              <Input value={form.follow_up ?? ""} onChange={(e) => setForm({ ...form, follow_up: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
