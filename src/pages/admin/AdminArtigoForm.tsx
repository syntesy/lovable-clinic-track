import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Save,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ArticleFormData {
  title: string;
  authors: string;
  year: string;
  journal: string;
  doi: string;
  interest: string;
  abstract: string;
  pubmed_url: string;
  tags: string;
}

const interestOptions = [
  { value: "PRP", label: "PRP" },
  { value: "PRF", label: "PRF" },
  { value: "PPP", label: "PPP" },
  { value: "BMP", label: "BMP" },
  { value: "Outro", label: "Outro" },
];

export default function AdminArtigoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfPath, setExistingPdfPath] = useState<string | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    authors: "",
    year: new Date().getFullYear().toString(),
    journal: "",
    doi: "",
    interest: "PRP",
    abstract: "",
    pubmed_url: "",
    tags: "",
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin && isEditing) {
      fetchArticle();
    } else if (isAdmin) {
      setIsLoading(false);
    }
  }, [isAdmin, id]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado");
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Acesso restrito a administradores");
      navigate("/");
      return;
    }

    setIsAdmin(true);
  };

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from("curadoria_articles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || "",
          authors: data.authors || "",
          year: data.year?.toString() || "",
          journal: data.journal || "",
          doi: data.doi || "",
          interest: data.interest || "PRP",
          abstract: data.abstract || "",
          pubmed_url: data.pubmed_url || "",
          tags: data.tags?.join(", ") || "",
        });
        setExistingPdfPath(data.pdf_path);
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      toast.error("Erro ao carregar artigo");
      navigate("/admin/artigos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ArticleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Por favor, selecione um arquivo PDF");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 20MB");
        return;
      }
      setPdfFile(file);
      setRemovePdf(false);
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setRemovePdf(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.authors.trim() || !formData.journal.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    
    try {
      let pdfPath = existingPdfPath;

      // Handle PDF upload/removal
      if (removePdf && existingPdfPath) {
        await supabase.storage.from("articles").remove([existingPdfPath]);
        pdfPath = null;
      }

      if (pdfFile) {
        const articleId = id || crypto.randomUUID();
        const timestamp = Date.now();
        const filePath = `${articleId}/${timestamp}.pdf`;

        // Remove old PDF if exists
        if (existingPdfPath) {
          await supabase.storage.from("articles").remove([existingPdfPath]);
        }

        const { error: uploadError } = await supabase.storage
          .from("articles")
          .upload(filePath, pdfFile);

        if (uploadError) throw uploadError;
        pdfPath = filePath;
      }

      const articleData = {
        title: formData.title.trim(),
        authors: formData.authors.trim(),
        year: parseInt(formData.year),
        journal: formData.journal.trim(),
        doi: formData.doi.trim() || null,
        interest: formData.interest,
        abstract: formData.abstract.trim() || null,
        pubmed_url: formData.pubmed_url.trim() || null,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        pdf_path: pdfPath,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("curadoria_articles")
          .update(articleData)
          .eq("id", id);

        if (error) throw error;
        toast.success("Artigo atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("curadoria_articles")
          .insert(articleData);

        if (error) throw error;
        toast.success("Artigo adicionado com sucesso");
      }

      navigate("/admin/artigos");
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Erro ao salvar artigo");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/admin/artigos")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? "Editar Artigo" : "Novo Artigo"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Atualize as informações do artigo" : "Adicione um novo artigo científico"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Informações do Artigo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Título completo do artigo"
                  className="bg-background border-border"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authors">Autores *</Label>
                  <Input
                    id="authors"
                    value={formData.authors}
                    onChange={(e) => handleInputChange("authors", e.target.value)}
                    placeholder="Ex: Silva AB, Santos CD, et al."
                    className="bg-background border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Ano *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                    placeholder="2024"
                    className="bg-background border-border"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="journal">Journal *</Label>
                  <Input
                    id="journal"
                    value={formData.journal}
                    onChange={(e) => handleInputChange("journal", e.target.value)}
                    placeholder="Nome do periódico"
                    className="bg-background border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest">Área de Interesse *</Label>
                  <Select 
                    value={formData.interest} 
                    onValueChange={(v) => handleInputChange("interest", v)}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {interestOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={formData.doi}
                    onChange={(e) => handleInputChange("doi", e.target.value)}
                    placeholder="10.1000/xyz123"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pubmed_url">URL PubMed / Externa</Label>
                  <Input
                    id="pubmed_url"
                    value={formData.pubmed_url}
                    onChange={(e) => handleInputChange("pubmed_url", e.target.value)}
                    placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  placeholder="regeneração, plaquetas, ortopedia"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abstract">Resumo (Abstract)</Label>
                <Textarea
                  id="abstract"
                  value={formData.abstract}
                  onChange={(e) => handleInputChange("abstract", e.target.value)}
                  placeholder="Resumo do artigo (opcional)"
                  className="bg-background border-border min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* PDF Upload */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Arquivo PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(existingPdfPath && !removePdf) || pdfFile ? (
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        {pdfFile ? pdfFile.name : "PDF anexado"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pdfFile 
                          ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` 
                          : "Arquivo existente"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePdf}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    Arraste um PDF ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Máximo 20MB
                  </p>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("pdf-upload")?.click()}
                  >
                    Selecionar PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/artigos")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Salvar Alterações" : "Adicionar Artigo"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
