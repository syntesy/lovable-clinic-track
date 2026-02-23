import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ===== TEACHER STRIPE PROFILE =====

export interface TeacherStripeProfile {
  id: string;
  user_id: string;
  stripe_account_id: string | null;
  stripe_onboarding_status: 'not_started' | 'pending' | 'complete' | 'restricted';
  stripe_payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useTeacherStripeProfile() {
  return useQuery({
    queryKey: ['teacher-stripe-profile'],
    queryFn: async (): Promise<TeacherStripeProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('academy_teacher_profiles' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as TeacherStripeProfile | null;
    },
  });
}

export function useTeacherStripeProfileForProduct(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['teacher-stripe-profile', teacherId],
    enabled: !!teacherId,
    queryFn: async (): Promise<TeacherStripeProfile | null> => {
      if (!teacherId) return null;
      const { data, error } = await supabase
        .from('academy_teacher_profiles' as any)
        .select('*')
        .eq('user_id', teacherId)
        .maybeSingle();
      if (error) return null;
      return data as unknown as TeacherStripeProfile | null;
    },
  });
}

export function useConnectStripe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: 'create' | 'refresh' | 'status') => {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { action },
      });
      if (error) throw new Error(error.message || 'Erro ao conectar Stripe');
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['teacher-stripe-profile'] });
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao conectar Stripe'),
  });
}

// ===== ORDERS =====

export interface AcademyOrder {
  id: string;
  user_id: string;
  product_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded' | 'failed' | 'canceled';
  created_at: string;
  updated_at: string;
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['my-academy-orders'],
    queryFn: async (): Promise<AcademyOrder[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('academy_orders' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AcademyOrder[];
    },
  });
}

export function useOrderForProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['academy-order', productId],
    enabled: !!productId,
    queryFn: async (): Promise<AcademyOrder | null> => {
      if (!productId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('academy_orders' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('status', 'paid')
        .maybeSingle();
      if (error) return null;
      return data as unknown as AcademyOrder | null;
    },
  });
}

// ===== CHECKOUT =====

export function useAcademyCheckout() {
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('create-academy-checkout', {
        body: { productId },
      });
      if (error) throw new Error(error.message || 'Erro ao criar checkout');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao iniciar pagamento'),
  });
}

export function useSubscriptionCheckout() {
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke('create-academy-subscription-checkout', {
        body: { productId },
      });
      if (error) throw new Error(error.message || 'Erro ao criar checkout');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao iniciar assinatura'),
  });
}

// ===== REFUND =====

export function useRequestRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('request-academy-refund', {
        body: { orderId },
      });
      if (error) throw new Error(error.message || 'Erro ao solicitar reembolso');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-academy-orders'] });
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
      qc.invalidateQueries({ queryKey: ['academy-order'] });
      toast.success('Reembolso solicitado com sucesso!');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao solicitar reembolso'),
  });
}
