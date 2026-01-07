import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Download, Lock, Shield, FileSpreadsheet, 
  Calendar, Filter, AlertTriangle, History, Hash
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportLog {
  id: string;
  exported_at: string;
  exported_by: string;
  export_name: string;
  view_version: string;
  filters_json: Record<string, unknown> | null;
  row_count: number;
  status: string;
  export_hash: string | null;
}

interface Filters {
  startMonth: string;
  endMonth: string;
  therapyItemCode: string;
  procedureType: string;
}

export default function AdminResearchExport() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);
  const [filters, setFilters] = useState<Filters>({
    startMonth: "",
    endMonth: "",
    therapyItemCode: "",
    procedureType: "",
  });

  const checkAccess = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        setHasAccess(false);
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.session.user.id);

      const access = roles?.some((r) => r.role === "admin" || r.role === "research") ?? false;
      setHasAccess(access);
    } catch {
      setHasAccess(false);
    }
  }, []);

  const fetchExportLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("registry_exports_log")
        .select("*")
        .order("exported_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setExportLogs((data as ExportLog[]) || []);
    } catch (err) {
      console.error("Error fetching export logs:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await checkAccess();
      await fetchExportLogs();
      setLoading(false);
    };
    init();
  }, [checkAccess, fetchExportLogs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      // Build filter object (only non-empty values)
      const filterPayload: Record<string, string> = {};
      if (filters.startMonth) filterPayload.startMonth = filters.startMonth;
      if (filters.endMonth) filterPayload.endMonth = filters.endMonth;
      if (filters.therapyItemCode) filterPayload.therapyItemCode = filters.therapyItemCode;
      if (filters.procedureType) filterPayload.procedureType = filters.procedureType;

      const response = await supabase.functions.invoke("export-registry-research", {
        body: filterPayload,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao exportar");
      }

      // Get the CSV content
      const csvContent = response.data;
      
      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `registry_research_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Exportação concluída com sucesso!");
      
      // Refresh logs
      await fetchExportLogs();
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Erro ao realizar exportação");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Esta funcionalidade está disponível apenas para administradores e pesquisadores autorizados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Exportação para Pesquisa</h1>
          <p className="text-sm text-muted-foreground">
            Dados pseudonimizados do Registry para análise científica
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Aviso de Segurança</p>
              <ul className="text-amber-700 dark:text-amber-300 mt-1 space-y-1 list-disc list-inside">
                <li>Dados pseudonimizados (UIDs irreversíveis)</li>
                <li>Exportação registrada no log de auditoria</li>
                <li>Hash SHA256 para verificação de integridade</li>
                <li>Uso exclusivo para pesquisa institucional</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros de Exportação
          </CardTitle>
          <CardDescription>
            Selecione o período e categorias para filtrar os dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startMonth" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Mês Inicial
              </Label>
              <Input
                id="startMonth"
                type="month"
                value={filters.startMonth}
                onChange={(e) => setFilters({ ...filters, startMonth: e.target.value })}
                placeholder="YYYY-MM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endMonth" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Mês Final
              </Label>
              <Input
                id="endMonth"
                type="month"
                value={filters.endMonth}
                onChange={(e) => setFilters({ ...filters, endMonth: e.target.value })}
                placeholder="YYYY-MM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedureType">Tipo de Procedimento</Label>
              <Select
                value={filters.procedureType}
                onValueChange={(v) => setFilters({ ...filters, procedureType: v === "all" ? "" : v })}
              >
                <SelectTrigger id="procedureType">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PRP">PRP</SelectItem>
                  <SelectItem value="BMAC">BMAC</SelectItem>
                  <SelectItem value="SVF">SVF</SelectItem>
                  <SelectItem value="PRF">PRF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="therapyItemCode">Código Terapia</Label>
              <Input
                id="therapyItemCode"
                value={filters.therapyItemCode}
                onChange={(e) => setFilters({ ...filters, therapyItemCode: e.target.value })}
                placeholder="Ex: PRP-KNEE-OA"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleExport} 
              disabled={exporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exportando..." : "Gerar Exportação CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Exportações
          </CardTitle>
          <CardDescription>
            Últimas 20 exportações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exportLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhuma exportação registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Linhas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.exported_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.view_version}</Badge>
                      </TableCell>
                      <TableCell>{log.row_count}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={log.status === "success" ? "default" : "destructive"}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.export_hash && (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {log.export_hash.slice(0, 12)}...
                          </code>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
