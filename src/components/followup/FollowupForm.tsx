import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Save, XCircle, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  FollowupOutcome, 
  GlobalChange, 
  AdverseEventSeverity,
  GLOBAL_CHANGE_LABELS,
  SEVERITY_LABELS 
} from '@/types/followup';

interface FollowupFormProps {
  onComplete: (outcome: FollowupOutcome) => Promise<boolean>;
  onMissed: () => Promise<boolean>;
  onReschedule: (newDate: Date) => Promise<boolean>;
  loading?: boolean;
}

export function FollowupForm({ onComplete, onMissed, onReschedule, loading }: FollowupFormProps) {
  const [painScore, setPainScore] = useState<number>(5);
  const [functionScore, setFunctionScore] = useState<number>(50);
  const [functionText, setFunctionText] = useState('');
  const [useFunctionScore, setUseFunctionScore] = useState(true);
  const [globalChange, setGlobalChange] = useState<GlobalChange | ''>('');
  const [adverseEvent, setAdverseEvent] = useState(false);
  const [adverseSeverity, setAdverseSeverity] = useState<AdverseEventSeverity | ''>('');
  const [adverseDescription, setAdverseDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState<Date>();
  const [showReschedule, setShowReschedule] = useState(false);

  const handleComplete = async () => {
    if (!globalChange) {
      return;
    }

    const outcome: FollowupOutcome = {
      pain_score: painScore,
      global_change: globalChange,
      adverse_event: adverseEvent,
      notes: notes || undefined,
    };

    if (useFunctionScore) {
      outcome.function_score = functionScore;
    } else if (functionText) {
      outcome.function_text = functionText;
    }

    if (adverseEvent && adverseSeverity) {
      outcome.adverse_event_severity = adverseSeverity;
      outcome.adverse_event_description = adverseDescription || undefined;
    }

    await onComplete(outcome);
  };

  const handleReschedule = async () => {
    if (rescheduleDate) {
      await onReschedule(rescheduleDate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dor (0-10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Slider
              value={[painScore]}
              onValueChange={([v]) => setPainScore(v)}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0 - Sem dor</span>
              <span className="font-medium text-foreground text-lg">{painScore}</span>
              <span>10 - Dor máxima</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Função */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Função</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={useFunctionScore}
              onCheckedChange={setUseFunctionScore}
            />
            <Label>{useFunctionScore ? 'Usar escala 0-100' : 'Usar descrição'}</Label>
          </div>

          {useFunctionScore ? (
            <div className="space-y-3">
              <Slider
                value={[functionScore]}
                onValueChange={([v]) => setFunctionScore(v)}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span className="font-medium text-foreground text-lg">{functionScore}%</span>
                <span>100%</span>
              </div>
            </div>
          ) : (
            <Textarea
              placeholder="Descreva a funcionalidade atual do paciente..."
              value={functionText}
              onChange={(e) => setFunctionText(e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      {/* Global Change */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mudança Global</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={globalChange}
            onValueChange={(v) => setGlobalChange(v as GlobalChange)}
            className="grid grid-cols-2 md:grid-cols-5 gap-2"
          >
            {(Object.entries(GLOBAL_CHANGE_LABELS) as [GlobalChange, string][]).map(([value, label]) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={value} />
                <Label htmlFor={value} className="text-sm cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Eventos Adversos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Eventos Adversos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={adverseEvent}
              onCheckedChange={setAdverseEvent}
            />
            <Label>Houve evento adverso?</Label>
          </div>

          {adverseEvent && (
            <div className="space-y-4 pt-2">
              <div>
                <Label>Severidade</Label>
                <Select value={adverseSeverity} onValueChange={(v) => setAdverseSeverity(v as AdverseEventSeverity)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(SEVERITY_LABELS) as [AdverseEventSeverity, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o evento adverso..."
                  value={adverseDescription}
                  onChange={(e) => setAdverseDescription(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Observações adicionais..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Reagendar */}
      {showReschedule && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reagendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !rescheduleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {rescheduleDate 
                    ? format(rescheduleDate, "PPP", { locale: ptBR })
                    : "Selecione a nova data"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={rescheduleDate}
                  onSelect={setRescheduleDate}
                  disabled={(date) => date < new Date()}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Button 
              onClick={handleReschedule} 
              disabled={!rescheduleDate || loading}
              className="w-full"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Confirmar Reagendamento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleComplete} 
          disabled={!globalChange || loading}
          className="flex-1"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar como Concluído
        </Button>
        
        <Button 
          variant="destructive"
          onClick={onMissed}
          disabled={loading}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Marcar como Perdido
        </Button>

        <Button 
          variant="outline"
          onClick={() => setShowReschedule(!showReschedule)}
          disabled={loading}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {showReschedule ? 'Cancelar' : 'Reagendar'}
        </Button>
      </div>
    </div>
  );
}
