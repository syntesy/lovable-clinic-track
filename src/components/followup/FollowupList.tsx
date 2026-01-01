import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, Calendar } from 'lucide-react';
import { ProcedureFollowup, TIMEPOINT_LABELS } from '@/types/followup';
import { FollowupStatusBadge } from './FollowupStatusBadge';

interface FollowupListProps {
  followups: ProcedureFollowup[];
  loading?: boolean;
  onOpen?: (followup: ProcedureFollowup) => void;
  compact?: boolean;
}

export function FollowupList({ followups, loading, onOpen, compact }: FollowupListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (followups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum follow-up encontrado</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {followups.map((followup) => (
          <div 
            key={followup.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-card"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {TIMEPOINT_LABELS[followup.timepoint]}
              </span>
              <FollowupStatusBadge status={followup.status} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {format(new Date(followup.scheduled_for), 'dd/MM/yyyy')}
              </span>
              {onOpen && followup.status === 'pending' && (
                <Button size="sm" variant="ghost" onClick={() => onOpen(followup)}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {followups.map((followup) => (
        <Card key={followup.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {TIMEPOINT_LABELS[followup.timepoint]}
                  </span>
                  <FollowupStatusBadge status={followup.status} />
                </div>
                
                {followup.patient && (
                  <p className="text-sm text-muted-foreground">
                    {followup.patient.full_name}
                  </p>
                )}
                
                <p className="text-sm text-muted-foreground">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {format(new Date(followup.scheduled_for), "PPP", { locale: ptBR })}
                  {followup.rescheduled_from && (
                    <span className="ml-2 text-amber-600">
                      (reagendado)
                    </span>
                  )}
                </p>
              </div>

              {onOpen && (
                <Button onClick={() => onOpen(followup)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
              )}
            </div>

            {followup.status === 'completed' && (
              <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-sm">
                {followup.pain_score !== null && (
                  <div>
                    <span className="text-muted-foreground">Dor:</span>{' '}
                    <span className="font-medium">{followup.pain_score}/10</span>
                  </div>
                )}
                {followup.function_score !== null && (
                  <div>
                    <span className="text-muted-foreground">Função:</span>{' '}
                    <span className="font-medium">{followup.function_score}%</span>
                  </div>
                )}
                {followup.global_change && (
                  <div>
                    <span className="text-muted-foreground">Evolução:</span>{' '}
                    <span className="font-medium capitalize">
                      {followup.global_change.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
