import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RegistryCaseSummary, 
  RESPONDER_STATUS_LABELS, 
  REASON_CODE_LABELS 
} from '@/types/registry-analytics';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CasesTableProps {
  cases: RegistryCaseSummary[];
  loading: boolean;
  onSelectCase: (c: RegistryCaseSummary) => void;
  selectedCaseId?: string;
}

const PAGE_SIZE = 10;

export function CasesTable({ cases, loading, onSelectCase, selectedCaseId }: CasesTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(cases.length / PAGE_SIZE);
  const paginatedCases = cases.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getResponderBadgeClass = (status: string) => {
    switch (status) {
      case 'ROBUST_RESPONDER':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'MODERATE_RESPONDER':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'NON_RESPONDER':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum caso encontrado com os filtros aplicados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10"></TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Diagnóstico</TableHead>
              <TableHead className="text-center">Baseline</TableHead>
              <TableHead className="text-center">D30</TableHead>
              <TableHead className="text-center">D90</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCases.map((c) => (
              <TableRow 
                key={c.screening_id}
                className={cn(
                  'cursor-pointer hover:bg-muted/50 transition-colors',
                  selectedCaseId === c.screening_id && 'bg-primary/5'
                )}
                onClick={() => onSelectCase(c)}
              >
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  {c.procedure_type || '—'}
                </TableCell>
                <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                  {c.diagnosis || '—'}
                </TableCell>
                <TableCell className="text-center">
                  {c.baseline_pain_nrs !== null ? (
                    <span className="font-mono">{c.baseline_pain_nrs}</span>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-center">
                  {c.has_d30 ? (
                    <span className="font-mono">{c.d30_pain ?? '—'}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {c.has_d90 ? (
                    <span className="font-mono">{c.d90_pain ?? '—'}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', getResponderBadgeClass(c.responder_status))}
                  >
                    {RESPONDER_STATUS_LABELS[c.responder_status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {REASON_CODE_LABELS[c.responder_reason_code]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Mostrando {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, cases.length)} de {cases.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
