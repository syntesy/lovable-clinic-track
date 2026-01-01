import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Plus, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFollowupsByScreening, useFollowupActions } from '@/hooks/useFollowups';
import { FollowupList } from './FollowupList';
import { FollowupForm } from './FollowupForm';
import { ProcedureFollowup } from '@/types/followup';

interface ScreeningFollowupsProps {
  screeningId: string;
  patientId: string;
}

export function ScreeningFollowups({ screeningId, patientId }: ScreeningFollowupsProps) {
  const navigate = useNavigate();
  const { followups, loading } = useFollowupsByScreening(screeningId);
  const { createFollowups, completeFollowup, updateStatus, reschedule, loading: actionLoading } = useFollowupActions();
  const [selectedFollowup, setSelectedFollowup] = useState<ProcedureFollowup | null>(null);

  const hasFollowups = followups.length > 0;

  const handleCreate = async () => {
    await createFollowups(screeningId, patientId);
    // Reload is handled by the hook
  };

  const handleComplete = async (outcome: Parameters<typeof completeFollowup>[1]) => {
    if (!selectedFollowup) return false;
    const success = await completeFollowup(selectedFollowup.id, outcome);
    if (success) {
      setSelectedFollowup(null);
    }
    return success;
  };

  const handleMissed = async () => {
    if (!selectedFollowup) return false;
    const success = await updateStatus(selectedFollowup.id, 'missed');
    if (success) {
      setSelectedFollowup(null);
    }
    return success;
  };

  const handleReschedule = async (newDate: Date) => {
    if (!selectedFollowup) return false;
    const success = await reschedule(selectedFollowup.id, newDate);
    if (success) {
      setSelectedFollowup(null);
    }
    return success;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Follow-ups
          </CardTitle>
          <div className="flex gap-2">
            {!hasFollowups && (
              <Button size="sm" onClick={handleCreate} disabled={actionLoading}>
                <Plus className="h-4 w-4 mr-1" />
                Criar Follow-ups
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/followups')}
            >
              <ClipboardList className="h-4 w-4 mr-1" />
              Painel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <FollowupList 
            followups={followups} 
            loading={loading}
            onOpen={setSelectedFollowup}
            compact
          />
        </CardContent>
      </Card>

      {/* Modal de completar follow-up */}
      <Dialog open={!!selectedFollowup} onOpenChange={() => setSelectedFollowup(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Completar Follow-up
            </DialogTitle>
          </DialogHeader>
          <FollowupForm
            onComplete={handleComplete}
            onMissed={handleMissed}
            onReschedule={handleReschedule}
            loading={actionLoading}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
