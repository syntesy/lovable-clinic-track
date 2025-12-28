import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PatientLimitInfo {
  currentPlan: string;
  activePatients: number;
  maxPatients: number;
  canAddPatient: boolean;
  isUnlimited: boolean;
}

export function usePatientLimit() {
  return useQuery({
    queryKey: ['patient-limit'],
    queryFn: async (): Promise<PatientLimitInfo> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          currentPlan: 'basic',
          activePatients: 0,
          maxPatients: 0,
          canAddPatient: false,
          isUnlimited: false
        };
      }

      const { data, error } = await supabase.rpc('check_patient_limit', {
        user_id: user.id
      });

      if (error) {
        console.error('Error checking patient limit:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          currentPlan: 'basic',
          activePatients: 0,
          maxPatients: 0,
          canAddPatient: false,
          isUnlimited: false
        };
      }

      const result = data[0];
      return {
        currentPlan: result.current_plan,
        activePatients: result.active_patients,
        maxPatients: result.max_patients,
        canAddPatient: result.can_add_patient,
        isUnlimited: result.max_patients === -1
      };
    }
  });
}
