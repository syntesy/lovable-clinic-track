import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EduRole = 'student' | 'teacher' | 'director' | 'institution_admin';

export interface EduMembership {
  id: string;
  institution_id: string;
  user_id: string;
  role: EduRole;
  status: 'active' | 'inactive' | 'pending';
  institution?: {
    id: string;
    name: string;
    slug: string;
  };
}

export function useEduMembership() {
  return useQuery({
    queryKey: ['edu-membership'],
    queryFn: async (): Promise<EduMembership[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('edu_institution_members' as any)
        .select(`
          id,
          institution_id,
          user_id,
          role,
          status,
          institution:edu_institutions!institution_id (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Erro ao buscar membership:', error);
        return [];
      }

      return (data || []).map((m: any) => ({
        id: m.id,
        institution_id: m.institution_id,
        user_id: m.user_id,
        role: m.role as EduRole,
        status: m.status,
        institution: m.institution ? {
          id: m.institution.id,
          name: m.institution.name,
          slug: m.institution.slug,
        } : undefined,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEduEnrollments(cohortId?: string) {
  return useQuery({
    queryKey: ['edu-enrollments', cohortId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('edu_enrollments' as any)
        .select(`
          id,
          cohort_id,
          user_id,
          status,
          enrolled_at,
          cohort:edu_cohorts!cohort_id (
            id,
            name,
            institution_id,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (cohortId) {
        query = query.eq('cohort_id', cohortId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar enrollments:', error);
        return [];
      }

      return data || [];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentInstitution() {
  const { data: memberships, isLoading } = useEduMembership();
  
  // For now, return first active membership
  // In future, could add institution selector
  const currentMembership = memberships?.[0];
  
  return {
    membership: currentMembership,
    institution: currentMembership?.institution,
    role: currentMembership?.role,
    isLoading,
    hasAccess: !!currentMembership,
  };
}
