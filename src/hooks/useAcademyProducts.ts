import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AcademyProduct {
  id: string;
  teacher_id: string;
  type: 'course' | 'mentorship' | 'subscription';
  status: 'draft' | 'in_review' | 'published' | 'archived';
  title: string;
  subtitle: string | null;
  description: string;
  category: string | null;
  cover_image_url: string | null;
  language: string;
  price_cents: number | null;
  currency: string;
  access_policy: 'lifetime' | 'time_limited';
  access_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  product_id: string;
  title: string;
  order_index: number;
  created_at: string;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
  video_url: string | null;
  duration_seconds: number | null;
  is_free_preview: boolean;
  created_at: string;
}

export interface MentorshipCohort {
  id: string;
  product_id: string;
  title: string;
  start_at: string | null;
  end_at: string | null;
  capacity: number | null;
  status: string;
  created_at: string;
  sessions?: MentorshipSession[];
}

export interface MentorshipSession {
  id: string;
  cohort_id: string;
  title: string;
  scheduled_at: string | null;
  meeting_url: string | null;
  recording_url: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface SubscriptionPost {
  id: string;
  product_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  attachments: any;
  status: string;
  published_at: string | null;
  created_at: string;
}

export interface ReviewNote {
  id: string;
  product_id: string;
  admin_id: string;
  note: string;
  created_at: string;
}

// ===== PRODUCTS =====

export function useMyProducts() {
  return useQuery({
    queryKey: ['my-academy-products'],
    queryFn: async (): Promise<AcademyProduct[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('academy_products' as any)
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AcademyProduct[];
    },
  });
}

export function useAcademyProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['academy-product', id],
    enabled: !!id,
    queryFn: async (): Promise<AcademyProduct | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('academy_products' as any)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AcademyProduct;
    },
  });
}

export function usePublishedProducts(filters?: { type?: string; search?: string; category?: string }) {
  return useQuery({
    queryKey: ['published-products', filters],
    queryFn: async (): Promise<AcademyProduct[]> => {
      let query = supabase
        .from('academy_products' as any)
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as AcademyProduct[];
    },
  });
}

export function useAllProductsAdmin(statusFilter?: string) {
  return useQuery({
    queryKey: ['admin-academy-products', statusFilter],
    queryFn: async (): Promise<AcademyProduct[]> => {
      let query = supabase
        .from('academy_products' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as AcademyProduct[];
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AcademyProduct>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data: product, error } = await supabase
        .from('academy_products' as any)
        .insert({ ...data, teacher_id: user.id, status: 'draft' })
        .select()
        .single();
      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-academy-products'] });
      toast.success('Produto criado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar produto'),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<AcademyProduct> & { id: string }) => {
      const { error } = await supabase
        .from('academy_products' as any)
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['my-academy-products'] });
      qc.invalidateQueries({ queryKey: ['academy-product', vars.id] });
      qc.invalidateQueries({ queryKey: ['admin-academy-products'] });
      toast.success('Produto atualizado!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar'),
  });
}

export function useSubmitForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('academy_products' as any)
        .update({ status: 'in_review' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-academy-products'] });
      toast.success('Enviado para revisão!');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAdminPublishProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('academy_products' as any)
        .update({ status: 'published' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-academy-products'] });
      qc.invalidateQueries({ queryKey: ['published-products'] });
      toast.success('Produto publicado!');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAdminArchiveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('academy_products' as any)
        .update({ status: 'archived' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-academy-products'] });
      toast.success('Produto arquivado.');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAdminRequestChanges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, note }: { productId: string; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      // Add review note
      await supabase.from('academy_product_review_notes' as any).insert({
        product_id: productId, admin_id: user.id, note,
      });
      // Reset to draft
      const { error } = await supabase
        .from('academy_products' as any)
        .update({ status: 'draft' })
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-academy-products'] });
      toast.success('Ajustes solicitados.');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== REVIEW NOTES =====
export function useProductReviewNotes(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-review-notes', productId],
    enabled: !!productId,
    queryFn: async (): Promise<ReviewNote[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('academy_product_review_notes' as any)
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ReviewNote[];
    },
  });
}

// ===== COURSE MODULES =====
export function useCourseModules(productId: string | undefined) {
  return useQuery({
    queryKey: ['course-modules', productId],
    enabled: !!productId,
    queryFn: async (): Promise<CourseModule[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('academy_course_modules' as any)
        .select('*, academy_course_lessons(*)')
        .eq('product_id', productId)
        .order('order_index');
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        lessons: (m.academy_course_lessons || []).sort((a: any, b: any) => a.order_index - b.order_index),
      })) as unknown as CourseModule[];
    },
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { product_id: string; title: string; order_index: number }) => {
      const { error } = await supabase.from('academy_course_modules' as any).insert(data);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['course-modules', vars.product_id] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { module_id: string; title: string; order_index: number; product_id: string }) => {
      const { product_id, ...rest } = data;
      const { error } = await supabase.from('academy_course_lessons' as any).insert(rest);
      if (error) throw error;
      return product_id;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ['course-modules', productId] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== MENTORSHIP COHORTS =====
export function useMentorshipCohorts(productId: string | undefined) {
  return useQuery({
    queryKey: ['mentorship-cohorts', productId],
    enabled: !!productId,
    queryFn: async (): Promise<MentorshipCohort[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('academy_mentorship_cohorts' as any)
        .select('*, academy_mentorship_sessions(*)')
        .eq('product_id', productId)
        .order('created_at');
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        sessions: (c.academy_mentorship_sessions || []).sort((a: any, b: any) => a.order_index - b.order_index),
      })) as unknown as MentorshipCohort[];
    },
  });
}

export function useCreateCohort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { product_id: string; title: string; capacity?: number }) => {
      const { error } = await supabase.from('academy_mentorship_cohorts' as any).insert(data);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['mentorship-cohorts', vars.product_id] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useCreateMentorshipSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { cohort_id: string; title: string; order_index: number; product_id: string }) => {
      const { product_id, ...rest } = data;
      const { error } = await supabase.from('academy_mentorship_sessions' as any).insert(rest);
      if (error) throw error;
      return product_id;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ['mentorship-cohorts', productId] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== SUBSCRIPTION POSTS =====
export function useSubscriptionPosts(productId: string | undefined) {
  return useQuery({
    queryKey: ['subscription-posts', productId],
    enabled: !!productId,
    queryFn: async (): Promise<SubscriptionPost[]> => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('academy_subscription_posts' as any)
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SubscriptionPost[];
    },
  });
}

export function useCreateSubscriptionPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { product_id: string; title: string; content?: string }) => {
      const { error } = await supabase.from('academy_subscription_posts' as any).insert(data);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['subscription-posts', vars.product_id] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}
