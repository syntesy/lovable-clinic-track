import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PatientLimitInfo {
  currentPlan: string;
  activePatients: number;
  maxPatients: number;
  canAddPatient: boolean;
  isUnlimited: boolean;
  isAdmin: boolean;
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
          isUnlimited: false,
          isAdmin: false
        };
      }

      // Check if user is admin - admins have full access
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const isAdmin = Boolean(adminRole);

      const { data, error } = await supabase.rpc('check_patient_limit', {
        user_id: user.id
      });

      if (error) {
        console.error('Error checking patient limit:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          currentPlan: isAdmin ? 'pro' : 'basic',
          activePatients: 0,
          maxPatients: isAdmin ? -1 : 0,
          canAddPatient: isAdmin,
          isUnlimited: isAdmin,
          isAdmin
        };
      }

      const result = data[0];
      
      // Admins always have unlimited access
      if (isAdmin) {
        return {
          currentPlan: 'pro',
          activePatients: result.active_patients,
          maxPatients: -1,
          canAddPatient: true,
          isUnlimited: true,
          isAdmin: true
        };
      }

      return {
        currentPlan: result.current_plan,
        activePatients: result.active_patients,
        maxPatients: result.max_patients,
        canAddPatient: result.can_add_patient,
        isUnlimited: result.max_patients === -1,
        isAdmin: false
      };
    }
  });
}
