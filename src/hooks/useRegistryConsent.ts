import { supabase } from "@/integrations/supabase/client";
import { useCallback, useState, useEffect } from "react";

interface ConsentStatus {
  hasConsent: boolean;
  consentGiven: boolean;
  loading: boolean;
}

/**
 * Hook para gerenciar consentimento do Registry
 */
export function useRegistryConsent(patientId?: string) {
  const [status, setStatus] = useState<ConsentStatus>({
    hasConsent: false,
    consentGiven: false,
    loading: true
  });

  /**
   * Verifica status de consentimento do paciente
   */
  const checkConsentStatus = useCallback(async () => {
    if (!patientId) {
      setStatus({ hasConsent: false, consentGiven: false, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('registry_consents')
        .select('consent_given')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error) {
        console.error('Registry consent check error:', error);
        setStatus({ hasConsent: false, consentGiven: false, loading: false });
        return;
      }

      setStatus({
        hasConsent: data !== null,
        consentGiven: data?.consent_given === true,
        loading: false
      });
    } catch (err) {
      console.error('Registry consent error:', err);
      setStatus({ hasConsent: false, consentGiven: false, loading: false });
    }
  }, [patientId]);

  useEffect(() => {
    checkConsentStatus();
  }, [checkConsentStatus]);

  /**
   * Registra decisão de consentimento (aceitar ou recusar)
   */
  const registerConsent = useCallback(async (accepted: boolean): Promise<boolean> => {
    if (!patientId) return false;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        console.error('No user session for consent registration');
        return false;
      }

      const consentData = {
        patient_id: patientId,
        professional_id: userId,
        consent_given: accepted,
        consent_date: accepted ? new Date().toISOString() : null,
        lgpd_accepted: accepted
      };

      const { error } = await supabase
        .from('registry_consents')
        .upsert(consentData, { onConflict: 'patient_id' });

      if (error) {
        console.error('Error registering consent:', error);
        return false;
      }

      setStatus({
        hasConsent: true,
        consentGiven: accepted,
        loading: false
      });

      return true;
    } catch (err) {
      console.error('Consent registration error:', err);
      return false;
    }
  }, [patientId]);

  /**
   * Aceita participação no Registry
   */
  const acceptConsent = useCallback(async () => {
    return registerConsent(true);
  }, [registerConsent]);

  /**
   * Recusa participação (registra que foi perguntado)
   */
  const declineConsent = useCallback(async () => {
    return registerConsent(false);
  }, [registerConsent]);

  return {
    ...status,
    checkConsentStatus,
    acceptConsent,
    declineConsent,
    isEligible: status.consentGiven
  };
}
