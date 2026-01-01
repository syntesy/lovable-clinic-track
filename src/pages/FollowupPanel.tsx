import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  ClipboardList, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  RefreshCw 
} from 'lucide-react';
import { useFollowups, useFollowupActions } from '@/hooks/useFollowups';
import { FollowupList, FollowupFiltersComponent, FollowupForm } from '@/components/followup';
import { FollowupFilters, ProcedureFollowup } from '@/types/followup';

export default function FollowupPanel() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FollowupFilters>({ period: 'next7days' });
  const { followups, loading, refetch } = useFollowups(filters);
  const { completeFollowup, updateStatus, reschedule, markMissedFollowups, loading: actionLoading } = useFollowupActions();
  const [selectedFollowup, setSelectedFollowup] = useState<ProcedureFollowup | null>(null);

  // Marcar follow-ups atrasados ao carregar
  useEffect(() => {
    markMissedFollowups().then(() => refetch());
  }, []);

  // Stats
  const stats = {
    pending: followups.filter(f => f.status === 'pending').length,
    today: followups.filter(f => {
      const today = new Date().toISOString().split('T')[0];
      return f.scheduled_for === today && f.status === 'pending';
    }).length,
    overdue: followups.filter(f => {
      const today = new Date().toISOString().split('T')[0];
      return f.scheduled_for < today && f.status === 'pending';
    }).length,
    completed: followups.filter(f => f.status === 'completed').length,
  };

  const handleComplete = async (outcome: Parameters<typeof completeFollowup>[1]) => {
    if (!selectedFollowup) return false;
    const success = await completeFollowup(selectedFollowup.id, outcome);
    if (success) {
      setSelectedFollowup(null);
      refetch();
    }
    return success;
  };

  const handleMissed = async () => {
    if (!selectedFollowup) return false;
    const success = await updateStatus(selectedFollowup.id, 'missed');
    if (success) {
      setSelectedFollowup(null);
      refetch();
    }
    return success;
  };

  const handleReschedule = async (newDate: Date) => {
    if (!selectedFollowup) return false;
    const success = await reschedule(selectedFollowup.id, newDate);
    if (success) {
      setSelectedFollowup(null);
      refetch();
    }
    return success;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Painel de Follow-ups
            </h1>
            <p className="text-muted-foreground">
              Acompanhamento pós-procedimento
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atrasados</p>
                  <p className="text-2xl font-bold">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <FollowupFiltersComponent 
              filters={filters} 
              onChange={setFilters}
              onRefresh={refetch}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Lista */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <FollowupList 
              followups={followups}
              loading={loading}
              onOpen={setSelectedFollowup}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modal de completar follow-up */}
      <Dialog open={!!selectedFollowup} onOpenChange={() => setSelectedFollowup(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Completar Follow-up
              {selectedFollowup?.patient && (
                <span className="font-normal text-muted-foreground ml-2">
                  - {selectedFollowup.patient.full_name}
                </span>
              )}
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
    </Layout>
  );
}
