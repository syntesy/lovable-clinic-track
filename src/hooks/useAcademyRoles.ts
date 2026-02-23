import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AcademyRole = 'student' | 'teacher_candidate' | 'teacher_approved' | 'admin_academy';

export interface AcademyUserRole {
  id: string;
  user_id: string;
  role: AcademyRole;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  formation: string;
  professional_registration: string;
  clinical_area: string;
  experience_years: number;
  links: Record<string, string>;
  course_proposal_title: string;
  course_proposal_summary: string;
  course_proposal_audience: string;
  observations: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Get current user's academy roles
export function useMyAcademyRoles() {
  return useQuery({
    queryKey: ['my-academy-roles'],
    queryFn: async (): Promise<AcademyRole[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('academy_user_roles' as any)
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching academy roles:', error);
        return [];
      }

      return (data || []).map((r: any) => r.role as AcademyRole);
    },
  });
}

// Check if user has a specific academy role
export function useHasAcademyRole(role: AcademyRole) {
  const { data: roles = [], isLoading } = useMyAcademyRoles();
  return { hasRole: roles.includes(role), isLoading };
}

// Check if user is academy admin
export function useIsAcademyAdmin() {
  return useQuery({
    queryKey: ['is-academy-admin'],
    queryFn: async (): Promise<boolean> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase.rpc('is_academy_admin', { _user_id: user.id });
      return !!data;
    },
  });
}

// Get current user's teacher application
export function useMyTeacherApplication() {
  return useQuery({
    queryKey: ['my-teacher-application'],
    queryFn: async (): Promise<TeacherApplication | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('teacher_applications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching teacher application:', error);
        return null;
      }

      return data as unknown as TeacherApplication;
    },
  });
}

// Submit teacher application
export function useSubmitTeacherApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<TeacherApplication, 'id' | 'user_id' | 'status' | 'reviewed_by' | 'reviewed_at' | 'review_notes' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Add teacher_candidate role
      await supabase
        .from('academy_user_roles' as any)
        .upsert({ user_id: user.id, role: 'teacher_candidate' }, { onConflict: 'user_id,role' });

      const { data: application, error } = await supabase
        .from('teacher_applications' as any)
        .insert({
          user_id: user.id,
          ...data,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teacher-application'] });
      queryClient.invalidateQueries({ queryKey: ['my-academy-roles'] });
      toast.success('Candidatura enviada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao enviar candidatura');
    },
  });
}

// Admin: Get all teacher applications
export function useTeacherApplications(statusFilter?: string) {
  return useQuery({
    queryKey: ['teacher-applications', statusFilter],
    queryFn: async (): Promise<TeacherApplication[]> => {
      let query = supabase
        .from('teacher_applications' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching teacher applications:', error);
        throw error;
      }

      return (data || []) as unknown as TeacherApplication[];
    },
  });
}

// Admin: Approve teacher application
export function useApproveTeacherApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, userId }: { applicationId: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Update application status
      const { error: appError } = await supabase
        .from('teacher_applications' as any)
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (appError) throw appError;

      // Grant teacher_approved role
      await supabase
        .from('academy_user_roles' as any)
        .upsert({ user_id: userId, role: 'teacher_approved', granted_by: user.id }, { onConflict: 'user_id,role' });

      // Remove teacher_candidate role
      await supabase
        .from('academy_user_roles' as any)
        .delete()
        .eq('user_id', userId)
        .eq('role', 'teacher_candidate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-applications'] });
      toast.success('Professor aprovado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao aprovar professor');
    },
  });
}

// Admin: Reject teacher application
export function useRejectTeacherApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, userId, notes }: { applicationId: string; userId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('teacher_applications' as any)
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Remove teacher_candidate role, keep student
      await supabase
        .from('academy_user_roles' as any)
        .delete()
        .eq('user_id', userId)
        .eq('role', 'teacher_candidate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-applications'] });
      toast.success('Candidatura rejeitada.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao rejeitar');
    },
  });
}

// Admin: Request changes on teacher application
export function useRequestChangesTeacherApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, notes }: { applicationId: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('teacher_applications' as any)
        .update({
          status: 'needs_changes',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-applications'] });
      toast.success('Ajustes solicitados.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao solicitar ajustes');
    },
  });
}
