import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileDown, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { RegistryExportLog } from '@/types/registry-analytics';

export default function RegistryExport() {
  const [logs, setLogs] = useState<RegistryExportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) {
          navigate('/registry');
          return;
        }

        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!roleData) {
          navigate('/registry');
          return;
        }

        setIsAdmin(true);

        // Fetch export logs
        const { data: logsData, error } = await supabase
          .from('registry_exports_log')
          .select('*')
          .order('exported_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setLogs((logsData || []) as RegistryExportLog[]);
      } catch (err) {
        console.error('Error loading export logs:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  if (!isAdmin && !loading) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Acesso restrito. Apenas administradores podem visualizar esta página.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileDown className="h-6 w-6 text-primary" />
            Histórico de Exportações
          </h1>
          <p className="text-muted-foreground text-sm">
            Registro de todas as exportações CSV do registry
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/registry')}>
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Security Info */}
      <Alert className="bg-green-500/10 border-green-500/20">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          Todas as exportações são anonimizadas e registradas para auditoria.
          Nenhuma informação pessoal identificável é incluída nos arquivos CSV.
        </AlertDescription>
      </Alert>

      {/* Export Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logs de Exportação</CardTitle>
          <CardDescription>
            Últimas 100 exportações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma exportação realizada ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead className="text-center">Linhas</TableHead>
                  <TableHead>Filtros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(log.exported_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.export_version}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {log.row_count}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {Object.keys(log.filters_json || {}).length > 0 
                        ? JSON.stringify(log.filters_json)
                        : 'Sem filtros'}
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
