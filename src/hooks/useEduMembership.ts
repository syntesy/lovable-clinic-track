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

      // Buscar memberships
      const { data: memberships, error: membersError } = await supabase
        .from('edu_institution_members' as any)
        .select('id, institution_id, user_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membersError) {
        console.error('Erro ao buscar membership:', membersError);
        return [];
      }

      if (!memberships || memberships.length === 0) {
        return [];
      }

      // Buscar institutions separadamente
      const institutionIds = [...new Set(memberships.map((m: any) => m.institution_id))];
      const { data: institutions, error: instError } = await supabase
        .from('edu_institutions' as any)
        .select('id, name, slug')
        .in('id', institutionIds);

      if (instError) {
        console.error('Erro ao buscar institutions:', instError);
      }

      const institutionMap = new Map((institutions || []).map((i: any) => [i.id, i]));

      return memberships.map((m: any) => ({
        id: m.id,
        institution_id: m.institution_id,
        user_id: m.user_id,
        role: m.role as EduRole,
        status: m.status,
        institution: institutionMap.get(m.institution_id) ? {
          id: institutionMap.get(m.institution_id).id,
          name: institutionMap.get(m.institution_id).name,
          slug: institutionMap.get(m.institution_id).slug,
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

      // Buscar enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('edu_enrollments' as any)
        .select('id, cohort_id, user_id, status, institution_id, created_at')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (enrollError) {
        console.error('Erro ao buscar enrollments:', enrollError);
        return [];
      }

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      // Filtrar por cohort se especificado
      let filteredEnrollments = enrollments;
      if (cohortId) {
        filteredEnrollments = enrollments.filter((e: any) => e.cohort_id === cohortId);
      }

      // Buscar cohorts separadamente
      const cohortIds = [...new Set(filteredEnrollments.map((e: any) => e.cohort_id))];
      const { data: cohorts } = await supabase
        .from('edu_cohorts' as any)
        .select('id, name, institution_id, status')
        .in('id', cohortIds);

      const cohortMap = new Map((cohorts || []).map((c: any) => [c.id, c]));

      return filteredEnrollments.map((e: any) => ({
        ...e,
        enrolled_at: e.created_at,
        cohort: cohortMap.get(e.cohort_id)
      }));
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
