import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ClinicalEventCard, 
  DashboardCounters, 
  DashboardFilters,
  ClinicalStage,
  ClinicalAlert,
  FALLBACK_STAGE
} from '@/types/daily-dashboard';
import { format } from 'date-fns';

export function useDailyDashboard(selectedDate: Date = new Date()) {
  const { toast } = useToast();
  const [events, setEvents] = useState<ClinicalEventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({});

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch events for the selected date with READ-ONLY Registry enrichment
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch scheduled events
      const { data, error } = await supabase
        .from('clinical_scheduled_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_date', dateStr)
        .order('time_start', { ascending: true });

      if (error) throw error;

      // 2. Collect case_ids that exist (for Registry lookup)
      const caseIds = (data || [])
        .map(e => e.case_id)
        .filter((id): id is string => !!id);

      // 3. READ-ONLY: Fetch Registry data for these cases (prp_screenings)
      let registryData: Record<string, { last_outcome?: string; alerts?: ClinicalAlert[] }> = {};
      
      if (caseIds.length > 0) {
        // Fetch latest followup outcome per screening (READ-ONLY)
        const { data: followups } = await supabase
          .from('procedure_followups')
          .select('screening_id, pain_score, adverse_event, completed_at')
          .in('screening_id', caseIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false });

        // Fetch screening data (READ-ONLY) - classification and questionnaire_responses contain red_flags
        const { data: screenings } = await supabase
          .from('prp_screenings')
          .select('id, classification, questionnaire_responses')
          .in('id', caseIds);

        // Build registry data map (READ-ONLY consumption)
        for (const caseId of caseIds) {
          const latestFollowup = followups?.find(f => f.screening_id === caseId);
          const screening = screenings?.find(s => s.id === caseId);
          
          const alerts: ClinicalAlert[] = [];
          
          // READ-ONLY: Consume red_flags from questionnaire_responses if present
          if (screening?.questionnaire_responses) {
            const responses = screening.questionnaire_responses as Record<string, unknown>;
            const canonical = responses?.regen_canonical as Record<string, unknown> | undefined;
            const flags = canonical?.flags as Record<string, unknown> | undefined;
            
            if (flags?.red_flags_present === true) {
              alerts.push({ type: 'critical', message: 'Red flags identificados', source: 'registry' });
            }
          }
          
          // READ-ONLY: Consume adverse events from followup
          if (latestFollowup?.adverse_event === true) {
            alerts.push({ 
              type: 'critical', 
              message: 'Evento adverso registrado', 
              source: 'registry' 
            });
          }

          // READ-ONLY: Build last_outcome from followup data
          let lastOutcome: string | undefined;
          if (latestFollowup?.pain_score !== null && latestFollowup?.pain_score !== undefined) {
            lastOutcome = `Último follow-up: Dor ${latestFollowup.pain_score}/10`;
          }

          registryData[caseId] = {
            last_outcome: lastOutcome,
            alerts: alerts.length > 0 ? alerts : undefined,
          };
        }
      }

      // 4. Map events, enriching with Registry data when available
      // Apply FALLBACK for null/invalid clinical_stage to prevent events from disappearing
      const validStages: ClinicalStage[] = ['avaliacao', 'procedimento', 'followup', 'alta'];
      
      const mappedEvents: ClinicalEventCard[] = (data || []).map(row => {
        const registryEnrichment = row.case_id ? registryData[row.case_id] : undefined;
        
        // Merge alerts: event alerts + registry alerts (if any)
        const rawAlerts = Array.isArray(row.alerts) ? row.alerts : [];
        const eventAlerts: ClinicalAlert[] = rawAlerts.map((a: unknown) => {
          const alert = a as Record<string, unknown>;
          return {
            type: (alert.type as 'warning' | 'info' | 'critical') || 'info',
            message: String(alert.message || ''),
            source: alert.source ? String(alert.source) : undefined,
          };
        });
        const registryAlerts = registryEnrichment?.alerts || [];
        const mergedAlerts = [...eventAlerts, ...registryAlerts];

        // FALLBACK: Se clinical_stage for nulo ou inválido, usar FALLBACK_STAGE
        const rawStage = row.clinical_stage as string | null | undefined;
        const clinicalStage: ClinicalStage = (rawStage && validStages.includes(rawStage as ClinicalStage))
          ? (rawStage as ClinicalStage)
          : FALLBACK_STAGE;

        return {
          id: row.id,
          event_date: row.event_date,
          time_start: row.time_start,
          time_end: row.time_end || undefined,
          patient_id: row.patient_id,
          patient_name: row.patient_name,
          case_id: row.case_id || undefined,
          case_summary: row.case_summary || undefined,
          clinical_stage: clinicalStage,
          today_action: row.today_action,
          // Use Registry last_outcome if available, else use event's stored value
          last_outcome: registryEnrichment?.last_outcome || row.last_outcome || undefined,
          // Merged alerts from event + registry
          alerts: mergedAlerts,
          attended: row.attended || false,
          attended_at: row.attended_at || undefined,
          // Store created_at for tie-breaker sorting
          created_at: row.created_at,
        };
      });

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

  // Counters based on filtered events (per TESTE 14 spec)
  const counters: DashboardCounters = useMemo(() => ({
    avaliacoes: filteredEvents.filter(e => e.clinical_stage === 'avaliacao').length,
    procedimentos: filteredEvents.filter(e => e.clinical_stage === 'procedimento').length,
    followups: filteredEvents.filter(e => e.clinical_stage === 'followup').length,
  }), [filteredEvents]);

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
