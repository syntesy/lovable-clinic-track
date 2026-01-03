/**
 * ObservationalFollowupForm - Formulário de follow-up longitudinal
 * 
 * Permite registrar follow-ups em D30, D90, D180, D365.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface FollowupData {
  timepoint: 30 | 90 | 180 | 365;
  pain_score?: number;
  perceived_improvement?: number;
  return_to_activity?: boolean;
  new_intervention?: boolean;
  late_adverse_event?: boolean;
  adverse_event_type?: string;
}

interface ObservationalFollowupFormProps {
  onSave: (data: FollowupData) => Promise<boolean>;
  existingTimepoints: number[];
}

const TIMEPOINTS = [
  { value: 30, label: 'D30 (1 mês)' },
  { value: 90, label: 'D90 (3 meses)' },
  { value: 180, label: 'D180 (6 meses)' },
  { value: 365, label: 'D365 (1 ano)' }
] as const;

const IMPROVEMENT_LABELS = [
  'Muito pior',
  'Um pouco pior',
  'Igual',
  'Um pouco melhor',
  'Muito melhor'
];

export function ObservationalFollowupForm({
  onSave,
  existingTimepoints
}: ObservationalFollowupFormProps) {
  const [selectedTimepoint, setSelectedTimepoint] = useState<30 | 90 | 180 | 365 | null>(null);
  const [painScore, setPainScore] = useState<number>(5);
  const [improvement, setImprovement] = useState<number>(3);
  const [returnToActivity, setReturnToActivity] = useState<boolean>(false);
  const [newIntervention, setNewIntervention] = useState<boolean>(false);
  const [adverseEvent, setAdverseEvent] = useState<boolean>(false);
  const [adverseEventType, setAdverseEventType] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedTimepoint) return;
    
    setSaving(true);
    const success = await onSave({
      timepoint: selectedTimepoint,
      pain_score: painScore,
      perceived_improvement: improvement,
      return_to_activity: returnToActivity,
      new_intervention: newIntervention,
      late_adverse_event: adverseEvent,
      adverse_event_type: adverseEvent ? adverseEventType : undefined
    });

    if (success) {
      // Reset form
      setSelectedTimepoint(null);
      setPainScore(5);
      setImprovement(3);
      setReturnToActivity(false);
      setNewIntervention(false);
      setAdverseEvent(false);
      setAdverseEventType('');
    }
    setSaving(false);
  };

  const getTimepointStatus = (value: number) => {
    if (existingTimepoints.includes(value)) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      {/* Timeline de timepoints */}
      <div className="flex flex-wrap gap-2">
        {TIMEPOINTS.map((tp) => {
          const status = getTimepointStatus(tp.value);
          return (
            <Badge
              key={tp.value}
              variant={status === 'completed' ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                selectedTimepoint === tp.value 
                  ? 'ring-2 ring-primary ring-offset-2' 
                  : ''
              } ${
                status === 'completed' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : ''
              }`}
              onClick={() => setSelectedTimepoint(tp.value)}
            >
              {status === 'completed' ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              {tp.label}
            </Badge>
          );
        })}
      </div>

      {selectedTimepoint && (
        <div className="space-y-4 pt-4 border-t">
          {/* Dor 0-10 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Dor atual (0-10)</Label>
              <span className="text-sm font-medium">{painScore}</span>
            </div>
            <Slider
              value={[painScore]}
              onValueChange={([val]) => setPainScore(val)}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sem dor</span>
              <span>Pior dor possível</span>
            </div>
          </div>

          {/* Melhora percebida (Likert 1-5) */}
          <div className="space-y-2">
            <Label>Melhora percebida</Label>
            <Select
              value={String(improvement)}
              onValueChange={(val) => setImprovement(Number(val))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMPROVEMENT_LABELS.map((label, idx) => (
                  <SelectItem key={idx + 1} value={String(idx + 1)}>
                    {idx + 1} - {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Retorno à atividade */}
          <div className="flex items-center justify-between">
            <Label htmlFor="return-activity">Retornou às atividades normais?</Label>
            <Switch
              id="return-activity"
              checked={returnToActivity}
              onCheckedChange={setReturnToActivity}
            />
          </div>

          {/* Nova intervenção */}
          <div className="flex items-center justify-between">
            <Label htmlFor="new-intervention">Realizou nova intervenção?</Label>
            <Switch
              id="new-intervention"
              checked={newIntervention}
              onCheckedChange={setNewIntervention}
            />
          </div>

          {/* Evento adverso tardio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <Label htmlFor="adverse-event">Evento adverso tardio?</Label>
            </div>
            <Switch
              id="adverse-event"
              checked={adverseEvent}
              onCheckedChange={setAdverseEvent}
            />
          </div>

          {adverseEvent && (
            <div className="space-y-2">
              <Label htmlFor="adverse-type">Descreva o evento adverso</Label>
              <Textarea
                id="adverse-type"
                placeholder="Tipo e descrição do evento adverso..."
                value={adverseEventType}
                onChange={(e) => setAdverseEventType(e.target.value)}
                className="h-20"
              />
            </div>
          )}

          {/* Botão salvar */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Salvando...' : `Registrar Follow-up D${selectedTimepoint}`}
          </Button>
        </div>
      )}

      {!selectedTimepoint && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Selecione um timepoint para registrar o follow-up
        </p>
      )}
    </div>
  );
}
