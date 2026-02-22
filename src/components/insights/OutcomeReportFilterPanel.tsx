/**
 * OutcomeReportFilterPanel — Dynamic filter UI for the Procedure Outcome Report engine.
 * Supports presets and fully dynamic filter cascading.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Play, RotateCcw } from 'lucide-react';
import {
  type OutcomeReportParams,
  type ReportPreset,
  REPORT_PRESETS,
  TIMEPOINT_OPTIONS,
  useProcedureTypes,
  usePathologyCategories,
  usePathologiesByCategory,
  getStructuralGradeOptions,
} from '@/hooks/useProcedureOutcomeReport';

interface Props {
  onGenerate: (params: OutcomeReportParams) => void;
  currentParams: OutcomeReportParams | null;
}

export function OutcomeReportFilterPanel({ onGenerate, currentParams }: Props) {
  const [procedureType, setProcedureType] = useState(currentParams?.procedure_type || '');
  const [categoryId, setCategoryId] = useState(currentParams?.category_id || '');
  const [pathologyId, setPathologyId] = useState(currentParams?.pathology_id || '');
  const [structuralModel, setStructuralModel] = useState(currentParams?.structural_model || '');
  const [structuralGrade, setStructuralGrade] = useState(currentParams?.structural_grade || '');
  const [timepoint, setTimepoint] = useState(currentParams?.timepoint || 'm3');

  const { data: procedureTypes } = useProcedureTypes();
  const { data: categories } = usePathologyCategories();
  const { data: pathologies } = usePathologiesByCategory(categoryId || undefined);

  // When pathology changes, derive structural_model
  const selectedPathology = pathologies?.find(p => p.id === pathologyId);
  const activeModel = selectedPathology?.structural_model || '';
  const gradeOptions = getStructuralGradeOptions(activeModel !== 'NONE' ? activeModel : undefined);
  const showStructuralFilter = activeModel && activeModel !== 'NONE' && gradeOptions.length > 0;

  // Sync structural_model when pathology changes
  useEffect(() => {
    if (activeModel && activeModel !== 'NONE') {
      setStructuralModel(activeModel);
    } else {
      setStructuralModel('');
      setStructuralGrade('');
    }
  }, [activeModel]);

  // Reset downstream when category changes
  useEffect(() => {
    if (!categoryId) {
      setPathologyId('');
      setStructuralModel('');
      setStructuralGrade('');
    }
  }, [categoryId]);

  const canGenerate = !!procedureType && !!timepoint;

  function handleGenerate() {
    if (!canGenerate) return;
    onGenerate({
      procedure_type: procedureType,
      category_id: categoryId || undefined,
      pathology_id: pathologyId || undefined,
      structural_model: structuralModel || undefined,
      structural_grade: structuralGrade || undefined,
      timepoint,
    });
  }

  function applyPreset(preset: ReportPreset) {
    setProcedureType(preset.params.procedure_type);
    setCategoryId(preset.params.category_id || '');
    setPathologyId(preset.params.pathology_id || '');
    setStructuralModel(preset.params.structural_model || '');
    setStructuralGrade(preset.params.structural_grade || '');
    setTimepoint(preset.params.timepoint);
    // Auto-generate
    onGenerate(preset.params);
  }

  function handleReset() {
    setProcedureType('');
    setCategoryId('');
    setPathologyId('');
    setStructuralModel('');
    setStructuralGrade('');
    setTimepoint('m3');
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Gerador de Relatório de Resultados
            </CardTitle>
            <CardDescription>
              Selecione os parâmetros do coorte e gere o relatório
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {REPORT_PRESETS.map(preset => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="text-xs"
              >
                <Badge variant="secondary" className="mr-1 text-xs">{preset.label}</Badge>
                Preset
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Procedure Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Procedimento <span className="text-destructive">*</span>
            </label>
            <Select value={procedureType} onValueChange={setProcedureType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(procedureTypes || []).map(pt => (
                  <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select value={categoryId || '__all__'} onValueChange={v => setCategoryId(v === '__all__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {(categories || []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pathology */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Patologia</label>
            <Select
              value={pathologyId || '__all__'}
              onValueChange={v => setPathologyId(v === '__all__' ? '' : v)}
              disabled={!categoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder={categoryId ? 'Todas' : 'Selecione categoria'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {(pathologies || []).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Structural Grade */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Classificação</label>
            <Select
              value={structuralGrade || '__all__'}
              onValueChange={v => setStructuralGrade(v === '__all__' ? '' : v)}
              disabled={!showStructuralFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder={showStructuralFilter ? 'Todas' : 'N/A'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {gradeOptions.map(g => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timepoint */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Timepoint <span className="text-destructive">*</span>
            </label>
            <Select value={timepoint} onValueChange={setTimepoint}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEPOINT_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="space-y-2 flex flex-col justify-end">
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={!canGenerate} className="flex-1">
                <Play className="h-4 w-4 mr-1" />
                Gerar
              </Button>
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
