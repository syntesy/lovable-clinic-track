import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  FileText, 
  AlertTriangle, 
  AlertCircle,
  Info,
  ExternalLink,
  ClipboardCheck,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClinicalEventCard as EventCardType, STAGE_CONFIG } from '@/types/daily-dashboard';
import { cn } from '@/lib/utils';

interface ClinicalEventCardProps {
  event: EventCardType;
  viewMode: 'by_time' | 'by_stage';
  onMarkAttended: (id: string) => void;
}

export function ClinicalEventCard({ event, viewMode, onMarkAttended }: ClinicalEventCardProps) {
  const navigate = useNavigate();
  const stageConfig = STAGE_CONFIG[event.clinical_stage];

  // Format time range
  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  const timeRange = event.time_end 
    ? `${formatTime(event.time_start)} — ${formatTime(event.time_end)}`
    : formatTime(event.time_start);

  // Calculate visual state based on current time
  const getEventState = (): 'future' | 'ongoing' | 'completed' => {
    if (event.attended) return 'completed';
    
    const now = new Date();
    const today = event.event_date;
    const [startH, startM] = event.time_start.split(':').map(Number);
    const startTime = new Date(`${today}T${event.time_start}`);
    
    if (event.time_end) {
      const endTime = new Date(`${today}T${event.time_end}`);
      if (now >= startTime && now <= endTime) return 'ongoing';
    } else {
      // If no end time, consider ongoing for 1 hour after start
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      if (now >= startTime && now <= endTime) return 'ongoing';
    }
    
    if (now < startTime) return 'future';
    return 'future'; // Past events without attended flag show as future style
  };

  const eventState = getEventState();

  // State visual config
  const stateConfig = {
    future: {
      borderColor: 'border-l-muted-foreground/30',
      clockColor: 'text-muted-foreground',
      indicator: null
    },
    ongoing: {
      borderColor: 'border-l-emerald-500',
      clockColor: 'text-emerald-600 dark:text-emerald-400',
      indicator: 'bg-emerald-500 animate-pulse'
    },
    completed: {
      borderColor: 'border-l-muted-foreground/50',
      clockColor: 'text-muted-foreground',
      indicator: null
    }
  };

  // Alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md border-l-4",
      event.attended && "opacity-60",
      // State-based border color (default)
      !viewMode || viewMode === 'by_time' ? stateConfig[eventState].borderColor : '',
      // Stage-based border color (when viewing by stage)
      viewMode === 'by_stage' && event.clinical_stage === 'avaliacao' && "border-l-blue-500",
      viewMode === 'by_stage' && event.clinical_stage === 'procedimento' && "border-l-emerald-500",
      viewMode === 'by_stage' && event.clinical_stage === 'followup' && "border-l-amber-500",
      viewMode === 'by_stage' && event.clinical_stage === 'alta' && "border-l-purple-500",
    )}>
      <CardContent className="p-4 space-y-3">
        {/* BLOCO 1 — TEMPO (sempre visível, nunca ocultável) */}
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex items-center gap-2 text-lg font-semibold",
            stateConfig[eventState].clockColor
          )}>
            {/* Ongoing indicator dot */}
            {eventState === 'ongoing' && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            <Clock className="h-5 w-5" />
            <span>{timeRange}</span>
          </div>
          {event.attended && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Atendido
            </Badge>
          )}
        </div>

        {/* BLOCO 2 — IDENTIFICAÇÃO */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{event.patient_name}</span>
          </div>
          {event.case_summary && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{event.case_summary}</span>
            </div>
          )}
        </div>

        {/* BLOCO 3 — ETAPA CLÍNICA (badge visual) */}
        <div>
          <Badge className={cn(stageConfig.bgColor, stageConfig.color, "border-0")}>
            {stageConfig.label}
          </Badge>
        </div>

        {/* BLOCO 4 — AÇÃO DO DIA */}
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-sm font-medium text-foreground">
            {event.today_action}
          </p>
        </div>

        {/* BLOCO 5 — STATUS CLÍNICO RECENTE (somente se existir) */}
        {event.last_outcome && (
          <div className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
              Última evolução:
            </span>
            <p className="mt-0.5">{event.last_outcome}</p>
          </div>
        )}

        {/* BLOCO 6 — ALERTAS CLÍNICOS (somente se existirem) */}
        {event.alerts.length > 0 && (
          <div className="space-y-1.5">
            {event.alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex items-start gap-2 text-sm p-2 rounded-md",
                  alert.type === 'critical' && "bg-destructive/10",
                  alert.type === 'warning' && "bg-amber-500/10",
                  alert.type === 'info' && "bg-blue-500/10"
                )}
              >
                {getAlertIcon(alert.type)}
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* BLOCO 7 — AÇÕES (botões fixos) */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              if (event.case_id) {
                navigate(`/triagem-biologica/${event.case_id}`);
              } else {
                navigate(`/pacientes/${event.patient_id}`);
              }
            }}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir caso
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={event.attended}
            onClick={() => onMarkAttended(event.id)}
          >
            <ClipboardCheck className="h-4 w-4 mr-1" />
            Registrar atendimento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
