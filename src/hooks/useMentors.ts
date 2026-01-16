import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Mentor {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  photo_url: string | null;
  specialty: string;
  headline: string | null;
  bio: string | null;
  clinical_areas: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export function useMentors(options?: { featured?: boolean }) {
  return useQuery({
    queryKey: ['mentors', options],
    queryFn: async (): Promise<Mentor[]> => {
      let query = supabase
        .from('mentors' as any)
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name');

      if (options?.featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar mentores:', error);
        throw error;
      }

      return (data || []) as unknown as Mentor[];
    },
  });
}

export function useMentorBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['mentor', slug],
    queryFn: async (): Promise<Mentor | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('mentors' as any)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar mentor:', error);
        throw error;
      }

      return data as unknown as Mentor | null;
    },
    enabled: !!slug,
  });
}

export function useCreateMentor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mentor: Omit<Mentor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mentors' as any)
        .insert(mentor)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Mentor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
    },
  });
}
