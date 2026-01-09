import { useEvidenceDimensions } from '@/hooks/useEvidenceEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Database, 
  RefreshCw, 
  Search,
  ChevronRight,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { K_MIN, getInsufficientDataMessage } from '@/types/evidence-engine';

export default function EvidenceDimensions() {
  const { dimensions, loading, error, refetch } = useEvidenceDimensions();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDimensions = useMemo(() => {
    if (!searchTerm.trim()) return dimensions;
    const term = searchTerm.toLowerCase();
    return dimensions.filter(d => 
      d.pathology_tag.toLowerCase().includes(term) ||
      d.technique_tag.toLowerCase().includes(term) ||
      (d.region_tag && d.region_tag.toLowerCase().includes(term))
    );
  }, [dimensions, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/evidence">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Dimensões de Evidência
          </h1>
          <p className="text-muted-foreground text-sm">
            Agregações por Patologia × Técnica do SYNTESY Clinical Registry™
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Disclaimer */}
      <Alert className="bg-muted/50 border-muted">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Dados observacionais agregados. Não comparativos. Não inferenciais.
          Dimensões com N &lt; {K_MIN} não são exibidas (k-anonymity).
        </AlertDescription>
      </Alert>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por patologia ou técnica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredDimensions.length} dimensões
        </Badge>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredDimensions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma dimensão encontrada.</p>
              <p className="text-sm">
                {searchTerm ? 'Tente outro termo de busca.' : 'Execute o batch de agregação para criar dimensões.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patologia</TableHead>
                  <TableHead>Técnica</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead className="text-right">N total</TableHead>
                  <TableHead className="text-right">N com D90</TableHead>
                  <TableHead className="text-right">Versão</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDimensions.map((dim) => (
                  <TableRow key={dim.id}>
                    <TableCell>
                      <Badge variant="secondary">{dim.pathology_tag}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{dim.technique_tag}</Badge>
                    </TableCell>
                    <TableCell>
                      {dim.region_tag ? (
                        <Badge variant="outline" className="bg-muted">
                          {dim.region_tag}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {dim.latestSnapshot ? dim.latestSnapshot.n_cases_total : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dim.latestSnapshot ? dim.latestSnapshot.n_with_followup_90 : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dim.latestSnapshot ? `v${dim.latestSnapshot.version}` : '—'}
                    </TableCell>
                    <TableCell>
                      {dim.latestSnapshot ? (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(dim.latestSnapshot.computed_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Link to={`/evidence/dimensions/${dim.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
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
