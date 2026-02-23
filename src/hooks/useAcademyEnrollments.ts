import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AcademyEnrollment {
  id: string;
  user_id: string;
  product_id: string;
  access_status: 'active' | 'expired' | 'refunded' | 'canceled';
  access_expires_at: string | null;
  created_at: string;
  product?: {
    id: string;
    title: string;
    type: string;
    cover_image_url: string | null;
    status: string;
  };
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  progress_seconds: number;
  created_at: string;
}

// ===== ENROLLMENTS =====

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async (): Promise<AcademyEnrollment[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('academy_enrollments' as any)
        .select('*, academy_products(id, title, type, cover_image_url, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        product: e.academy_products,
      })) as unknown as AcademyEnrollment[];
    },
  });
}

export function useEnrollmentForProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['enrollment', productId],
    enabled: !!productId,
    queryFn: async (): Promise<AcademyEnrollment | null> => {
      if (!productId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('academy_enrollments' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('access_status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AcademyEnrollment | null;
    },
  });
}

export function useAdminGrantEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, productId }: { userId: string; productId: string }) => {
      const { data, error } = await supabase.rpc('admin_grant_enrollment', {
        p_user_id: userId,
        p_product_id: productId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
      qc.invalidateQueries({ queryKey: ['enrollment'] });
      toast.success('Acesso concedido com sucesso!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao conceder acesso'),
  });
}

// ===== LESSON PROGRESS =====

export function useLessonProgressForProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['lesson-progress', productId],
    enabled: !!productId,
    queryFn: async (): Promise<LessonProgress[]> => {
      if (!productId) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      // Get all lessons for this product via modules
      const { data: modules } = await supabase
        .from('academy_course_modules' as any)
        .select('id')
        .eq('product_id', productId);
      if (!modules || modules.length === 0) return [];
      const moduleIds = modules.map((m: any) => m.id);
      const { data: lessons } = await supabase
        .from('academy_course_lessons' as any)
        .select('id')
        .in('module_id', moduleIds);
      if (!lessons || lessons.length === 0) return [];
      const lessonIds = lessons.map((l: any) => l.id);
      const { data, error } = await supabase
        .from('academy_lesson_progress' as any)
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);
      if (error) throw error;
      return (data || []) as unknown as LessonProgress[];
    },
  });
}

export function useUpdateLessonProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, completed, progressSeconds, productId }: {
      lessonId: string;
      completed?: boolean;
      progressSeconds?: number;
      productId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const upsertData: any = {
        user_id: user.id,
        lesson_id: lessonId,
      };
      if (completed !== undefined) {
        upsertData.completed = completed;
        if (completed) upsertData.completed_at = new Date().toISOString();
      }
      if (progressSeconds !== undefined) upsertData.progress_seconds = progressSeconds;
      const { error } = await supabase
        .from('academy_lesson_progress' as any)
        .upsert(upsertData, { onConflict: 'user_id,lesson_id' });
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ['lesson-progress', productId] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== SIGNED URL GENERATION =====

export async function getSignedVideoUrl(storagePath: string): Promise<string | null> {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage
    .from('academy-videos')
    .createSignedUrl(storagePath, 120); // 2 min
  if (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
  return data.signedUrl;
}

export async function getSignedFileUrl(storagePath: string): Promise<string | null> {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage
    .from('academy-files')
    .createSignedUrl(storagePath, 300);
  if (error) return null;
  return data.signedUrl;
}
