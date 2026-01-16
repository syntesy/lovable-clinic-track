import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Mentor } from './useMentors';

export interface MentorshipSession {
  id: string;
  mentorship_id: string;
  scheduled_at: string;
  spots_available: number | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_url: string | null;
  created_at: string;
}

export interface Mentorship {
  id: string;
  mentor_id: string;
  title: string;
  slug: string;
  description: string | null;
  target_audience: string | null;
  topics: string[] | null;
  clinical_area: string | null;
  modality: 'online' | 'presencial' | 'hibrido';
  type: 'individual' | 'coletiva';
  price_cents: number;
  max_spots: number | null;
  duration_minutes: number;
  meeting_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  mentor?: Mentor;
  sessions?: MentorshipSession[];
}

export interface MentorshipEnrollment {
  id: string;
  user_id: string;
  mentorship_id: string;
  session_id: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  stripe_payment_id: string | null;
  enrolled_at: string;
  completed_at: string | null;
  mentorship?: Mentorship;
  session?: MentorshipSession;
}

export interface MentorshipFilters {
  clinical_area?: string;
  type?: 'individual' | 'coletiva';
  modality?: 'online' | 'presencial' | 'hibrido';
  mentor_id?: string;
  featured?: boolean;
}

export function useMentorships(filters?: MentorshipFilters) {
  return useQuery({
    queryKey: ['mentorships', filters],
    queryFn: async (): Promise<Mentorship[]> => {
      // Buscar mentorships
      let query = supabase
        .from('mentorships' as any)
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.clinical_area) {
        query = query.eq('clinical_area', filters.clinical_area);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.modality) {
        query = query.eq('modality', filters.modality);
      }
      if (filters?.mentor_id) {
        query = query.eq('mentor_id', filters.mentor_id);
      }
      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      const { data: mentorships, error } = await query;

      if (error) {
        console.error('Erro ao buscar mentorias:', error);
        throw error;
      }

      if (!mentorships || mentorships.length === 0) {
        return [];
      }

      // Buscar mentores
      const mentorIds = [...new Set(mentorships.map((m: any) => m.mentor_id))];
      const { data: mentors } = await supabase
        .from('mentors' as any)
        .select('*')
        .in('id', mentorIds);

      const mentorMap = new Map((mentors || []).map((m: any) => [m.id, m]));

      // Buscar próximas sessões
      const mentorshipIds = mentorships.map((m: any) => m.id);
      const { data: sessions } = await supabase
        .from('mentorship_sessions' as any)
        .select('*')
        .in('mentorship_id', mentorshipIds)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at');

      const sessionsMap = new Map<string, MentorshipSession[]>();
      (sessions || []).forEach((s: any) => {
        if (!sessionsMap.has(s.mentorship_id)) {
          sessionsMap.set(s.mentorship_id, []);
        }
        sessionsMap.get(s.mentorship_id)!.push(s as MentorshipSession);
      });

      return mentorships.map((m: any) => ({
        ...(m as object),
        mentor: mentorMap.get(m.mentor_id) as unknown as Mentor | undefined,
        sessions: (sessionsMap.get(m.id) || []) as unknown as MentorshipSession[],
      })) as Mentorship[];
    },
  });
}

export function useMentorshipBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['mentorship', slug],
    queryFn: async (): Promise<Mentorship | null> => {
      if (!slug) return null;

      const { data: mentorship, error } = await supabase
        .from('mentorships' as any)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar mentoria:', error);
        throw error;
      }

      if (!mentorship) return null;

      // Buscar mentor
      const { data: mentor } = await supabase
        .from('mentors' as any)
        .select('*')
        .eq('id', (mentorship as any).mentor_id)
        .single();

      // Buscar sessões futuras
      const { data: sessions } = await supabase
        .from('mentorship_sessions' as any)
        .select('*')
        .eq('mentorship_id', (mentorship as any).id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at');

      return {
        ...(mentorship as object),
        mentor: mentor as unknown as Mentor | undefined,
        sessions: (sessions || []) as unknown as MentorshipSession[],
      } as Mentorship;
    },
    enabled: !!slug,
  });
}

export function useMyMentorships() {
  return useQuery({
    queryKey: ['my-mentorships'],
    queryFn: async (): Promise<MentorshipEnrollment[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: enrollments, error } = await supabase
        .from('mentorship_enrollments' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar inscrições:', error);
        throw error;
      }

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      // Buscar mentorships
      const mentorshipIds = [...new Set(enrollments.map((e: any) => e.mentorship_id))];
      const { data: mentorships } = await supabase
        .from('mentorships' as any)
        .select('*')
        .in('id', mentorshipIds);

      const mentorshipMap = new Map((mentorships || []).map((m: any) => [m.id, m]));

      // Buscar sessions
      const sessionIds = enrollments.filter((e: any) => e.session_id).map((e: any) => e.session_id);
      const { data: sessions } = sessionIds.length > 0 
        ? await supabase
            .from('mentorship_sessions' as any)
            .select('*')
            .in('id', sessionIds)
        : { data: [] };

      const sessionMap = new Map((sessions || []).map((s: any) => [s.id, s]));

      return enrollments.map((e: any) => ({
        ...e,
        mentorship: mentorshipMap.get(e.mentorship_id) as Mentorship | undefined,
        session: e.session_id ? sessionMap.get(e.session_id) as MentorshipSession | undefined : undefined,
      })) as MentorshipEnrollment[];
    },
  });
}

export function useEnrollInMentorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mentorshipId, 
      sessionId 
    }: { 
      mentorshipId: string; 
      sessionId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('mentorship_enrollments' as any)
        .insert({
          user_id: user.id,
          mentorship_id: mentorshipId,
          session_id: sessionId || null,
          status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as MentorshipEnrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentorships'] });
    },
  });
}
