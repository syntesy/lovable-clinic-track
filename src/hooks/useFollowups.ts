import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ProcedureFollowup, 
  FollowupFilters, 
  FollowupOutcome,
  FollowupStatus 
} from '@/types/followup';

export function useFollowups(filters?: FollowupFilters) {
  const [followups, setFollowups] = useState<ProcedureFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFollowups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('procedure_followups')
        .select(`
          *,
          patient:patients(full_name, phone)
        `)
        .order('scheduled_for', { ascending: true });

      // Aplicar filtros
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.period) {
        const today = new Date().toISOString().split('T')[0];
        const next7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const overdueCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        switch (filters.period) {
          case 'today':
            query = query.eq('scheduled_for', today);
            break;
          case 'next7days':
            query = query.gte('scheduled_for', today).lte('scheduled_for', next7);
            break;
          case 'overdue':
            query = query.eq('status', 'pending').lt('scheduled_for', overdueCutoff);
            break;
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setFollowups((data || []) as unknown as ProcedureFollowup[]);
    } catch (err) {
      console.error('Error fetching followups:', err);
      setError('Erro ao carregar follow-ups');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.period]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  return { followups, loading, error, refetch: fetchFollowups };
}

export function useFollowupsByScreening(screeningId: string | undefined) {
  const [followups, setFollowups] = useState<ProcedureFollowup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!screeningId) {
      setFollowups([]);
      setLoading(false);
      return;
    }

    const fetchFollowups = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('procedure_followups')
          .select('*')
          .eq('screening_id', screeningId)
          .order('scheduled_for', { ascending: true });

        if (error) throw error;
        setFollowups((data || []) as unknown as ProcedureFollowup[]);
      } catch (err) {
        console.error('Error fetching followups by screening:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowups();
  }, [screeningId]);

  return { followups, loading };
}

export function useFollowupActions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createFollowups = async (
    screeningId: string, 
    patientId: string, 
    procedureDate?: Date
  ) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('create_followups_for_screening', {
        p_screening_id: screeningId,
        p_patient_id: patientId,
        p_clinician_id: user.id,
        p_procedure_date: procedureDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      toast({
        title: 'Follow-ups criados',
        description: '5 follow-ups agendados automaticamente',
      });

      return data;
    } catch (err) {
      console.error('Error creating followups:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar os follow-ups',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeFollowup = async (followupId: string, outcome: FollowupOutcome) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('procedure_followups')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          pain_score: outcome.pain_score,
          function_score: outcome.function_score || null,
          function_text: outcome.function_text || null,
          global_change: outcome.global_change,
          adverse_event: outcome.adverse_event,
          adverse_event_severity: outcome.adverse_event_severity || null,
          adverse_event_description: outcome.adverse_event_description || null,
          notes: outcome.notes || null,
        })
        .eq('id', followupId);

      if (error) throw error;

      toast({
        title: 'Follow-up concluído',
        description: 'Dados salvos com sucesso',
      });

      return true;
    } catch (err) {
      console.error('Error completing followup:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o follow-up',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (followupId: string, status: FollowupStatus) => {
    try {
      setLoading(true);
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('procedure_followups')
        .update(updateData)
        .eq('id', followupId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Follow-up marcado como ${status}`,
      });

      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reschedule = async (followupId: string, newDate: Date) => {
    try {
      setLoading(true);
      
      // Primeiro buscar a data atual
      const { data: current } = await supabase
        .from('procedure_followups')
        .select('scheduled_for')
        .eq('id', followupId)
        .single();

      const { error } = await supabase
        .from('procedure_followups')
        .update({
          scheduled_for: newDate.toISOString().split('T')[0],
          rescheduled_from: current?.scheduled_for || null,
          status: 'pending',
        })
        .eq('id', followupId);

      if (error) throw error;

      toast({
        title: 'Follow-up reagendado',
        description: `Nova data: ${newDate.toLocaleDateString('pt-BR')}`,
      });

      return true;
    } catch (err) {
      console.error('Error rescheduling followup:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível reagendar',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markMissedFollowups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('mark_missed_followups');
      
      if (error) throw error;

      if (data && data > 0) {
        toast({
          title: 'Follow-ups atualizados',
          description: `${data} follow-up(s) marcado(s) como perdido(s)`,
        });
      }

      return data;
    } catch (err) {
      console.error('Error marking missed followups:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createFollowups,
    completeFollowup,
    updateStatus,
    reschedule,
    markMissedFollowups,
  };
}
