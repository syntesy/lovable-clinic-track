import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PendingEnrollment {
  id: string;
  user_id: string;
  mentorship_id: string;
  session_id: string | null;
  status: string;
  enrolled_at: string;
  user_email?: string;
  user_name?: string;
  mentorship_title?: string;
  mentor_name?: string;
}

export function usePendingEnrollments() {
  return useQuery({
    queryKey: ['pending-enrollments'],
    queryFn: async (): Promise<PendingEnrollment[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get enrollments with pending statuses
      const { data: enrollments, error } = await supabase
        .from('mentorship_enrollments' as any)
        .select('*')
        .in('status', ['pending_manual', 'pending_payment'])
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending enrollments:', error);
        return [];
      }

      if (!enrollments || enrollments.length === 0) return [];

      // Fetch mentorships
      const mentorshipIds = [...new Set(enrollments.map((e: any) => e.mentorship_id))];
      const { data: mentorships } = await supabase
        .from('mentorships' as any)
        .select('id, title, mentor_id')
        .in('id', mentorshipIds);

      const mentorshipMap = new Map((mentorships || []).map((m: any) => [m.id, m]));

      // Fetch mentors
      const mentorIds = [...new Set((mentorships || []).map((m: any) => m.mentor_id))];
      const { data: mentors } = mentorIds.length > 0
        ? await supabase.from('mentors' as any).select('id, name').in('id', mentorIds)
        : { data: [] };

      const mentorMap = new Map((mentors || []).map((m: any) => [m.id, m]));

      // Fetch user emails from auth (via profiles or direct)
      const userIds = [...new Set(enrollments.map((e: any) => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles' as any)
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return enrollments.map((e: any) => {
        const mentorship = mentorshipMap.get(e.mentorship_id);
        const mentor = mentorship ? mentorMap.get(mentorship.mentor_id) : null;
        const profile = profileMap.get(e.user_id);
        
        return {
          id: e.id,
          user_id: e.user_id,
          mentorship_id: e.mentorship_id,
          session_id: e.session_id,
          status: e.status,
          enrolled_at: e.enrolled_at,
          user_email: profile?.email || 'Email não disponível',
          user_name: profile?.full_name || 'Nome não disponível',
          mentorship_title: mentorship?.title || 'Mentoria',
          mentor_name: mentor?.name || 'Mentor',
        };
      });
    },
  });
}

export function useApproveEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('mentorship_enrollments' as any)
        .update({
          status: 'active',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-enrollments'] });
    },
  });
}

export function useExpireEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('mentorship_enrollments' as any)
        .update({ status: 'expired' })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-enrollments'] });
    },
  });
}

export function useCanAccessApprovals() {
  return useQuery({
    queryKey: ['can-access-approvals'],
    queryFn: async (): Promise<boolean> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user is edu admin
      const { data: isAdmin } = await supabase.rpc('is_edu_admin', { _user_id: user.id });
      if (isAdmin) return true;

      // Check if user is mentor
      const { data: isMentor } = await supabase.rpc('is_mentor', { _user_id: user.id });
      return !!isMentor;
    },
  });
}
