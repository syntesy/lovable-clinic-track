import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { interestColors } from "@/types/curadoria";
import { 
  Search, 
  Plus,
  FileEdit, 
  Trash2, 
  Eye, 
  Filter,
  FileText,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  interest: string;
  doi: string | null;
  pdf_path: string | null;
  pubmed_url: string | null;
  created_at: string;
}

export default function AdminArtigos() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  
  // Filters
  const [interestFilter, setInterestFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchArticles();
    }
  }, [isAdmin, interestFilter]);

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

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("curadoria_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (interestFilter !== "all") {
        query = query.eq("interest", interestFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Erro ao carregar artigos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      // Delete PDF from storage if exists
      if (articleToDelete.pdf_path) {
        await supabase.storage
          .from("articles")
          .remove([articleToDelete.pdf_path]);
      }

      // Delete article from database
      const { error } = await supabase
        .from("curadoria_articles")
        .delete()
        .eq("id", articleToDelete.id);

      if (error) throw error;

      toast.success("Artigo excluído com sucesso");
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Erro ao excluir artigo");
    } finally {
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  const filteredArticles = articles.filter((article) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(search) ||
      article.authors.toLowerCase().includes(search) ||
      article.journal.toLowerCase().includes(search) ||
      (article.doi && article.doi.toLowerCase().includes(search))
    );
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciar Artigos</h1>
            <p className="text-muted-foreground">Adicione e gerencie artigos científicos</p>
          </div>
        </div>
        <Button onClick={() => navigate("/admin/artigos/novo")} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Artigo
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, autores, journal ou DOI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>

            <Select value={interestFilter} onValueChange={setInterestFilter}>
              <SelectTrigger className="w-[180px] bg-background border-border">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todas as áreas</SelectItem>
                <SelectItem value="PRP">PRP</SelectItem>
                <SelectItem value="PRF">PRF</SelectItem>
                <SelectItem value="PPP">PPP</SelectItem>
                <SelectItem value="BMP">BMP</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum artigo encontrado</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/admin/artigos/novo")}
              >
                Adicionar primeiro artigo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Artigo</TableHead>
                  <TableHead className="text-muted-foreground">Área</TableHead>
                  <TableHead className="text-muted-foreground">Ano</TableHead>
                  <TableHead className="text-muted-foreground">PDF</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow key={article.id} className="border-border">
                    <TableCell>
                      <div className="max-w-[400px]">
                        <p className="font-medium text-foreground truncate">
                          {article.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {article.authors} · {article.journal}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${interestColors[article.interest] || ""} border`}
                      >
                        {article.interest}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {article.year}
                      </span>
                    </TableCell>
                    <TableCell>
                      {article.pdf_path ? (
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          PDF
                        </Badge>
                      ) : article.pubmed_url ? (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Link
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/artigos/${article.id}`)}
                          className="gap-1"
                        >
                          <FileEdit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/curadoria/${article.id}/original`)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setArticleToDelete(article);
                            setDeleteDialogOpen(true);
                          }}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o artigo "{articleToDelete?.title}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
