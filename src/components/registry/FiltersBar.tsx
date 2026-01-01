import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RegistryFilters } from '@/types/registry-analytics';
import { Search, X } from 'lucide-react';

interface FiltersBarProps {
  filters: RegistryFilters;
  onFiltersChange: (filters: RegistryFilters) => void;
  procedureTypes: string[];
}

export function FiltersBar({ filters, onFiltersChange, procedureTypes }: FiltersBarProps) {
  const [localDiagnosis, setLocalDiagnosis] = useState(filters.diagnosis || '');
  const [localTissue, setLocalTissue] = useState(filters.tissue_type || '');

  const handleSearch = () => {
    onFiltersChange({
      ...filters,
      diagnosis: localDiagnosis || undefined,
      tissue_type: localTissue || undefined,
    });
  };

  const handleClear = () => {
    setLocalDiagnosis('');
    setLocalTissue('');
    onFiltersChange({});
  };

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Diagnosis Search */}
        <div className="space-y-2">
          <Label htmlFor="diagnosis" className="text-sm text-muted-foreground">
            Diagnóstico
          </Label>
          <Input
            id="diagnosis"
            placeholder="Buscar diagnóstico..."
            value={localDiagnosis}
            onChange={(e) => setLocalDiagnosis(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Tissue Type Search */}
        <div className="space-y-2">
          <Label htmlFor="tissue" className="text-sm text-muted-foreground">
            Tipo de Tecido
          </Label>
          <Input
            id="tissue"
            placeholder="Buscar tecido..."
            value={localTissue}
            onChange={(e) => setLocalTissue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Procedure Type */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Procedimento</Label>
          <Select
            value={filters.procedure_type || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, procedure_type: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {procedureTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* D90 Status */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Status D90</Label>
          <Select
            value={filters.d90_status || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                d90_status: value === 'all' ? undefined : (value as 'completed' | 'inconclusive'),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">D90 Completo</SelectItem>
              <SelectItem value="inconclusive">Inconclusivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground opacity-0">Ações</Label>
          <div className="flex gap-2">
            <Button onClick={handleSearch} size="sm" className="flex-1">
              <Search className="h-4 w-4 mr-1" />
              Filtrar
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
