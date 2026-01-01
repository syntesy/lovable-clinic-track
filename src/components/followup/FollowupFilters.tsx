import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FollowupFilters as Filters, FollowupStatus, STATUS_LABELS } from '@/types/followup';
import { RefreshCw } from 'lucide-react';

interface FollowupFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'today', label: 'Hoje' },
  { value: 'next7days', label: 'Próximos 7 dias' },
  { value: 'overdue', label: 'Atrasados' },
];

export function FollowupFiltersComponent({ filters, onChange, onRefresh, loading }: FollowupFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => 
          onChange({ ...filters, status: value === 'all' ? undefined : value as FollowupStatus })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos status</SelectItem>
          {(Object.entries(STATUS_LABELS) as [FollowupStatus, string][]).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.period || 'all'}
        onValueChange={(value) => 
          onChange({ ...filters, period: value === 'all' ? undefined : value as Filters['period'] })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {onRefresh && (
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
