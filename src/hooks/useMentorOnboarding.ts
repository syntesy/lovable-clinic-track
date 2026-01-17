import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MentorStatus = 'pending_review' | 'approved' | 'rejected' | 'suspended';

export interface MentorProfile {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  email: string | null;
  photo_url: string | null;
  specialty: string;
  headline: string | null;
  bio: string | null;
  clinical_areas: string[] | null;
  formation: string | null;
  linkedin_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  status: MentorStatus;
  approved_by: string | null;
  approved_at: string | null;
  terms_accepted_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MentorApplicationData {
  name: string;
  email: string;
  specialty: string;
  formation: string;
  clinical_areas: string[];
  bio: string;
  linkedin_url?: string;
}

// Status labels for UI
export const mentorStatusLabels: Record<MentorStatus, { label: string; description: string; variant: 'blue' | 'green' | 'red' | 'amber' }> = {
  pending_review: {
    label: 'Em análise',
    description: 'Perfil em análise pela curadoria do REGEN Academy.',
    variant: 'blue',
  },
  approved: {
    label: 'Aprovado',
    description: 'Perfil aprovado. Você já pode criar mentorias.',
    variant: 'green',
  },
  rejected: {
    label: 'Não aprovado',
    description: 'Perfil não aprovado no momento.',
    variant: 'red',
  },
  suspended: {
    label: 'Suspenso',
    description: 'Perfil temporariamente suspenso.',
    variant: 'amber',
  },
};

// Get current user's mentor profile
export function useMyMentorProfile() {
  return useQuery({
    queryKey: ['my-mentor-profile'],
    queryFn: async (): Promise<MentorProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching mentor profile:', error);
        throw error;
      }

      return data as unknown as MentorProfile;
    },
  });
}

// Check if current user is an approved mentor
export function useIsApprovedMentor() {
  const { data: profile, isLoading } = useMyMentorProfile();
  
  return {
    isApprovedMentor: profile?.status === 'approved' && profile?.is_active,
    isLoading,
    profile,
  };
}

// Onboarding checklist status
export interface OnboardingChecklist {
  hasCompletedProfile: boolean;
  hasBio: boolean;
  hasClinicalAreas: boolean;
  hasAcceptedTerms: boolean;
  isComplete: boolean;
}

export function useOnboardingChecklist(): { checklist: OnboardingChecklist | null; isLoading: boolean } {
  const { data: profile, isLoading } = useMyMentorProfile();

  if (isLoading || !profile) {
    return { checklist: null, isLoading };
  }

  const hasCompletedProfile = !!(profile.name && profile.specialty && profile.headline);
  const hasBio = !!(profile.bio && profile.bio.length >= 50);
  const hasClinicalAreas = !!(profile.clinical_areas && profile.clinical_areas.length > 0);
  const hasAcceptedTerms = !!profile.terms_accepted_at;

  return {
    checklist: {
      hasCompletedProfile,
      hasBio,
      hasClinicalAreas,
      hasAcceptedTerms,
      isComplete: hasCompletedProfile && hasBio && hasClinicalAreas && hasAcceptedTerms,
    },
    isLoading,
  };
}

// Submit mentor application
export function useSubmitMentorApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MentorApplicationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Generate slug from name
      const slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: mentor, error } = await supabase
        .from('mentors')
        .insert({
          user_id: user.id,
          name: data.name,
          email: data.email,
          slug: `${slug}-${Date.now()}`,
          specialty: data.specialty,
          formation: data.formation,
          clinical_areas: data.clinical_areas,
          bio: data.bio,
          linkedin_url: data.linkedin_url || null,
          status: 'pending_review',
          is_active: false,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error submitting application:', error);
        throw error;
      }

      return mentor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentor-profile'] });
      toast.success('Candidatura enviada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao enviar candidatura');
    },
  });
}

// Update mentor profile
export function useUpdateMentorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<MentorProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Remove fields that mentors cannot update
      const { status, approved_by, approved_at, id, user_id, created_at, ...safeUpdates } = updates as any;

      const { data, error } = await supabase
        .from('mentors')
        .update({ ...safeUpdates, updated_at: new Date().toISOString() } as any)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentor-profile'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar perfil');
    },
  });
}

// Accept terms
export function useAcceptMentorTerms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('mentors')
        .update({
          terms_accepted_at: new Date().toISOString(),
          onboarding_completed: true,
        } as any)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentor-profile'] });
      toast.success('Termos aceitos com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao aceitar termos');
    },
  });
}

// Admin: Get pending mentor applications
export function usePendingMentorApplications() {
  return useQuery({
    queryKey: ['pending-mentor-applications'],
    queryFn: async (): Promise<MentorProfile[]> => {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending applications:', error);
        throw error;
      }

      return (data || []) as unknown as MentorProfile[];
    },
  });
}

// Admin: Approve mentor
export function useApproveMentor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mentorId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('mentors')
        .update({
          status: 'approved',
          is_active: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', mentorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-mentor-applications'] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      toast.success('Mentor aprovado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao aprovar mentor');
    },
  });
}

// Admin: Reject mentor
export function useRejectMentor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mentorId: string) => {
      const { data, error } = await supabase
        .from('mentors')
        .update({
          status: 'rejected',
          is_active: false,
        } as any)
        .eq('id', mentorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-mentor-applications'] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      toast.success('Mentor rejeitado.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao rejeitar mentor');
    },
  });
}

// Admin: Suspend mentor
export function useSuspendMentor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mentorId: string) => {
      const { data, error } = await supabase
        .from('mentors')
        .update({
          status: 'suspended',
          is_active: false,
        } as any)
        .eq('id', mentorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-mentor-applications'] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      toast.success('Mentor suspenso.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao suspender mentor');
    },
  });
}
