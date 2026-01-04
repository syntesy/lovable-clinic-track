import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ClinicalEventCard, 
  DashboardCounters, 
  DashboardFilters,
  ClinicalStage,
  ClinicalAlert
} from '@/types/daily-dashboard';
import { format } from 'date-fns';

export function useDailyDashboard(selectedDate: Date = new Date()) {
  const { toast } = useToast();
  const [events, setEvents] = useState<ClinicalEventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({});

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch events for the selected date
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('clinical_scheduled_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_date', dateStr)
        .order('time_start', { ascending: true });

      if (error) throw error;

      const mappedEvents: ClinicalEventCard[] = (data || []).map(row => ({
        id: row.id,
        event_date: row.event_date,
        time_start: row.time_start,
        time_end: row.time_end || undefined,
        patient_id: row.patient_id,
        patient_name: row.patient_name,
        case_id: row.case_id || undefined,
        case_summary: row.case_summary || undefined,
        clinical_stage: row.clinical_stage as ClinicalStage,
        today_action: row.today_action,
        last_outcome: row.last_outcome || undefined,
        alerts: (Array.isArray(row.alerts) ? row.alerts : []) as unknown as ClinicalAlert[],
        attended: row.attended || false,
        attended_at: row.attended_at || undefined,
      }));

      setEvents(mappedEvents);
    } catch (err) {
      console.error('Error fetching daily events:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os eventos do dia',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [dateStr]);

  // Filtered events based on current filters
  const filteredEvents = useMemo(() => {
    let result = events;

    if (filters.stage) {
      result = result.filter(e => e.clinical_stage === filters.stage);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(e => 
        e.patient_name.toLowerCase().includes(term) ||
        e.today_action.toLowerCase().includes(term) ||
        (e.case_summary && e.case_summary.toLowerCase().includes(term))
      );
    }

    return result;
  }, [events, filters]);

  // Counters based on ALL events (not filtered)
  const counters: DashboardCounters = useMemo(() => ({
    avaliacoes: events.filter(e => e.clinical_stage === 'avaliacao').length,
    procedimentos: events.filter(e => e.clinical_stage === 'procedimento').length,
    followups: events.filter(e => e.clinical_stage === 'followup').length,
  }), [events]);

  // Create a new event
  const createEvent = async (eventData: Omit<ClinicalEventCard, 'id' | 'alerts' | 'attended' | 'attended_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('clinical_scheduled_events')
        .insert({
          user_id: user.id,
          patient_id: eventData.patient_id,
          case_id: eventData.case_id || null,
          event_date: eventData.event_date,
          time_start: eventData.time_start,
          time_end: eventData.time_end || null,
          patient_name: eventData.patient_name,
          case_summary: eventData.case_summary || null,
          clinical_stage: eventData.clinical_stage,
          today_action: eventData.today_action,
          last_outcome: eventData.last_outcome || null,
          alerts: [],
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Evento agendado',
        description: 'Atendimento adicionado à agenda do dia',
      });

      await fetchEvents();
      return true;
    } catch (err) {
      console.error('Error creating event:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível agendar o evento',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Mark event as attended
  const markAsAttended = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('clinical_scheduled_events')
        .update({
          attended: true,
          attended_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) throw error;

      await fetchEvents();
      return true;
    } catch (err) {
      console.error('Error marking event as attended:', err);
      return false;
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('clinical_scheduled_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      await fetchEvents();
      return true;
    } catch (err) {
      console.error('Error deleting event:', err);
      return false;
    }
  };

  return {
    events: filteredEvents,
    allEvents: events,
    counters,
    loading,
    filters,
    setFilters,
    createEvent,
    markAsAttended,
    deleteEvent,
    refetch: fetchEvents,
  };
}
