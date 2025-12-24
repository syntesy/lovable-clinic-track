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
import { supabase } from "@/integrations/supabase/client";
import { CurationStatus, curationStatusConfig } from "@/types/curation";
import { interestColors } from "@/types/curadoria";
import { 
  Search, 
  FileEdit, 
  Eye, 
  History, 
  Filter,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

interface CurationListItem {
  id: string;
  article_id: string;
  version: number;
  status: CurationStatus;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  article: {
    title: string;
    authors: string;
    interest: string;
    year: number;
  };
}

export default function AdminCuradoria() {
  const navigate = useNavigate();
  const [curations, setCurations] = useState<CurationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [interestFilter, setInterestFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchCurations();
    }
  }, [isAdmin, statusFilter, interestFilter]);

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

  const fetchCurations = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("curations")
        .select(`
          id,
          article_id,
          version,
          status,
          created_at,
          updated_at,
          reviewed_by,
          curadoria_articles!inner (
            title,
            authors,
            interest,
            year
          )
        `)
        .order("updated_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as CurationStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData: CurationListItem[] = (data || [])
        .filter((item: any) => {
          if (interestFilter !== "all") {
            return item.curadoria_articles?.interest === interestFilter;
          }
          return true;
        })
        .map((item: any) => ({
          id: item.id,
          article_id: item.article_id,
          version: item.version,
          status: item.status as CurationStatus,
          created_at: item.created_at,
          updated_at: item.updated_at,
          reviewed_by: item.reviewed_by,
          article: {
            title: item.curadoria_articles?.title || "",
            authors: item.curadoria_articles?.authors || "",
            interest: item.curadoria_articles?.interest || "",
            year: item.curadoria_articles?.year || 0,
          },
        }));

      setCurations(formattedData);
    } catch (error) {
      console.error("Error fetching curations:", error);
      toast.error("Erro ao carregar curadorias");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCurations = curations.filter((curation) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      curation.article.title.toLowerCase().includes(search) ||
      curation.article.authors.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: CurationStatus) => {
    const config = curationStatusConfig[status];
    return (
      <Badge variant="outline" className={`${config?.color || ""} border`}>
        {config?.label || status}
      </Badge>
    );
  };

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
            <h1 className="text-2xl font-bold text-foreground">Backoffice de Curadoria</h1>
            <p className="text-muted-foreground">Gerenciamento e revisão de curadorias científicas</p>
          </div>
        </div>
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
                  placeholder="Buscar por título ou autores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="em_revisao">Em revisão</SelectItem>
                <SelectItem value="aprovada">Aprovada</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
                <SelectItem value="indeferida">Indeferida</SelectItem>
              </SelectContent>
            </Select>

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
          ) : filteredCurations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>Nenhuma curadoria encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Artigo</TableHead>
                  <TableHead className="text-muted-foreground">Área</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Versão</TableHead>
                  <TableHead className="text-muted-foreground">Última modificação</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCurations.map((curation) => (
                  <TableRow key={curation.id} className="border-border">
                    <TableCell>
                      <div className="max-w-[400px]">
                        <p className="font-medium text-foreground truncate">
                          {curation.article.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {curation.article.authors} · {curation.article.year}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${interestColors[curation.article.interest] || ""} border`}
                      >
                        {curation.article.interest}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(curation.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        v{curation.version}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(curation.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/curadoria/${curation.id}`)}
                          className="gap-1"
                        >
                          <FileEdit className="h-4 w-4" />
                          Revisar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/curadoria/${curation.article_id}/original`)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Open version history modal
                            toast.info("Histórico de versões em desenvolvimento");
                          }}
                          className="gap-1"
                        >
                          <History className="h-4 w-4" />
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
    </div>
  );
}
