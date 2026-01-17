/**
 * Hooks para gerenciamento de taxonomias clínicas e curadoria de mentores
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface ClinicalTaxonomy {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MentorTaxonomy {
  id: string;
  mentor_id: string;
  taxonomy_id: string;
  created_at: string;
  taxonomy?: ClinicalTaxonomy;
}

export interface MentorCurationChecklist {
  id: string;
  mentor_id: string;
  formation_compatible: boolean;
  clinical_experience_verified: boolean;
  evidence_based_alignment: boolean;
  ethical_compliance: boolean;
  language_adequate: boolean;
  curator_notes: string | null;
  curated_by: string | null;
  curated_at: string | null;
  created_at: string;
  updated_at: string;
}

// Hook para buscar todas as taxonomias ativas
export function useClinicalTaxonomies() {
  return useQuery({
    queryKey: ['clinical-taxonomies'],
    queryFn: async (): Promise<ClinicalTaxonomy[]> => {
      const { data, error } = await supabase
        .from('clinical_taxonomies' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Erro ao buscar taxonomias:', error);
        throw error;
      }

      return (data || []) as unknown as ClinicalTaxonomy[];
    },
  });
}

// Hook para buscar taxonomias de um mentor específico
export function useMentorTaxonomies(mentorId: string | undefined) {
  return useQuery({
    queryKey: ['mentor-taxonomies', mentorId],
    queryFn: async (): Promise<MentorTaxonomy[]> => {
      if (!mentorId) return [];

      const { data, error } = await supabase
        .from('mentor_taxonomies' as any)
        .select(`
          id,
          mentor_id,
          taxonomy_id,
          created_at,
          taxonomy:clinical_taxonomies(*)
        `)
        .eq('mentor_id', mentorId);

      if (error) {
        console.error('Erro ao buscar taxonomias do mentor:', error);
        throw error;
      }

      return (data || []) as unknown as MentorTaxonomy[];
    },
    enabled: !!mentorId,
  });
}

// Hook para atualizar taxonomias do mentor
export function useUpdateMentorTaxonomies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mentorId, 
      taxonomyIds 
    }: { 
      mentorId: string; 
      taxonomyIds: string[] 
    }) => {
      // Primeiro, remover todas as associações existentes
      const { error: deleteError } = await supabase
        .from('mentor_taxonomies' as any)
        .delete()
        .eq('mentor_id', mentorId);

      if (deleteError) throw deleteError;

      // Depois, inserir as novas associações
      if (taxonomyIds.length > 0) {
        const insertData = taxonomyIds.map(taxonomyId => ({
          mentor_id: mentorId,
          taxonomy_id: taxonomyId,
        }));

        const { error: insertError } = await supabase
          .from('mentor_taxonomies' as any)
          .insert(insertData);

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-taxonomies', variables.mentorId] });
      toast.success('Áreas de atuação atualizadas');
    },
    onError: (error) => {
      console.error('Erro ao atualizar taxonomias:', error);
      toast.error('Erro ao atualizar áreas de atuação');
    },
  });
}

// Hook para verificar se mentor tem taxonomias (para bloqueio de criação de mentoria)
export function useMentorHasTaxonomies(mentorId: string | undefined) {
  const { data: taxonomies, isLoading } = useMentorTaxonomies(mentorId);
  
  return {
    hasTaxonomies: (taxonomies?.length ?? 0) > 0,
    isLoading,
    count: taxonomies?.length ?? 0,
  };
}

// ========== ADMIN ONLY: Curadoria ==========

// Hook para buscar checklist de curadoria de um mentor (admin only)
export function useMentorCurationChecklist(mentorId: string | undefined) {
  return useQuery({
    queryKey: ['mentor-curation-checklist', mentorId],
    queryFn: async (): Promise<MentorCurationChecklist | null> => {
      if (!mentorId) return null;

      const { data, error } = await supabase
        .from('mentor_curation_checklists' as any)
        .select('*')
        .eq('mentor_id', mentorId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar checklist de curadoria:', error);
        throw error;
      }

      return data as unknown as MentorCurationChecklist | null;
    },
    enabled: !!mentorId,
  });
}

// Hook para criar/atualizar checklist de curadoria (admin only)
export function useUpdateMentorCuration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mentorId, 
      checklist 
    }: { 
      mentorId: string; 
      checklist: Partial<MentorCurationChecklist> 
    }) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      // Verificar se já existe checklist
      const { data: existing } = await supabase
        .from('mentor_curation_checklists' as any)
        .select('id')
        .eq('mentor_id', mentorId)
        .maybeSingle();

      const checklistData = {
        ...checklist,
        mentor_id: mentorId,
        curated_by: userId,
        curated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update
        const { error } = await supabase
          .from('mentor_curation_checklists' as any)
          .update(checklistData)
          .eq('mentor_id', mentorId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('mentor_curation_checklists' as any)
          .insert(checklistData);

        if (error) throw error;
      }

      // Verificar se checklist está completo para atualizar selo
      const isComplete = 
        checklist.formation_compatible &&
        checklist.clinical_experience_verified &&
        checklist.evidence_based_alignment &&
        checklist.ethical_compliance &&
        checklist.language_adequate;

      // Atualizar has_curation_seal no mentor
      const { error: sealError } = await supabase
        .from('mentors' as any)
        .update({ has_curation_seal: isComplete })
        .eq('id', mentorId);

      if (sealError) throw sealError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-curation-checklist', variables.mentorId] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      queryClient.invalidateQueries({ queryKey: ['pending-mentor-applications'] });
      toast.success('Curadoria atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar curadoria:', error);
      toast.error('Erro ao atualizar curadoria');
    },
  });
}

// Hook para verificar se mentor tem selo válido
export function useMentorHasValidSeal(mentorId: string | undefined) {
  const { data: checklist, isLoading: checklistLoading } = useMentorCurationChecklist(mentorId);
  
  // Verifica se todos os itens estão completos
  const isComplete = checklist
    ? checklist.formation_compatible &&
      checklist.clinical_experience_verified &&
      checklist.evidence_based_alignment &&
      checklist.ethical_compliance &&
      checklist.language_adequate
    : false;

  return {
    hasValidSeal: isComplete,
    isLoading: checklistLoading,
    checklist,
  };
}

// ========== ADMIN: Gerenciamento de Taxonomias ==========

export function useCreateTaxonomy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taxonomy: Omit<ClinicalTaxonomy, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('clinical_taxonomies' as any)
        .insert(taxonomy)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ClinicalTaxonomy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-taxonomies'] });
      toast.success('Taxonomia criada');
    },
    onError: (error) => {
      console.error('Erro ao criar taxonomia:', error);
      toast.error('Erro ao criar taxonomia');
    },
  });
}

export function useUpdateTaxonomy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClinicalTaxonomy> & { id: string }) => {
      const { error } = await supabase
        .from('clinical_taxonomies' as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-taxonomies'] });
      toast.success('Taxonomia atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar taxonomia:', error);
      toast.error('Erro ao atualizar taxonomia');
    },
  });
}
