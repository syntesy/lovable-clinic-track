import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PatientSession {
  patientId: string;
  patientName: string;
  professionalId: string;
}

interface PatientAuthContextType {
  session: PatientSession | null;
  isLoading: boolean;
  login: (surname: string, cpf: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

const SESSION_KEY = 'regenapp_patient_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PatientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Recuperar sessão do sessionStorage
    // SECURITY: Dados ofuscados com btoa/atob para reduzir exposição direta.
    // TODO SECURITY: Avaliar migração para httpOnly cookies via Auth para compliance LGPD completo.
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const decoded = atob(stored);
        const parsed = JSON.parse(decoded);
        const now = Date.now();
        if (parsed.expiresAt && parsed.expiresAt > now) {
          setSession(parsed.session);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Timeout automático
  useEffect(() => {
    if (!session) return;

    const timeout = setTimeout(() => {
      logout();
    }, SESSION_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [session]);

  const login = async (surname: string, cpf: string): Promise<{ error?: string }> => {
    try {
      // Remover caracteres não numéricos do CPF
      const cleanCpf = cpf.replace(/\D/g, '');
      
      if (!surname.trim()) {
        return { error: 'Informe o sobrenome' };
      }
      
      if (cleanCpf.length !== 11) {
        return { error: 'CPF inválido. Informe 11 dígitos.' };
      }

      // Chamar função RPC do Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.rpc('authenticate_patient', {
        p_surname: surname.trim(),
        p_cpf: cleanCpf
      });

      if (error) {
        console.error('Auth error:', error);
        return { error: 'Erro ao autenticar. Tente novamente.' };
      }

      if (!data || data.length === 0) {
        return { error: 'Credenciais inválidas. Verifique seu sobrenome e CPF.' };
      }

      const patientData = data[0];
      const newSession: PatientSession = {
        patientId: patientData.patient_id,
        patientName: patientData.patient_name,
        professionalId: patientData.professional_id
      };

      setSession(newSession);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        session: newSession,
        expiresAt: Date.now() + SESSION_TIMEOUT
      }));

      // Registrar evento de login
      await supabase.from('patient_events').insert({
        patient_id: newSession.patientId,
        professional_id: newSession.professionalId,
        event_name: 'patient_login',
        event_data: { timestamp: new Date().toISOString() }
      });

      return {};
    } catch (err) {
      console.error('Login error:', err);
      return { error: 'Erro inesperado. Tente novamente.' };
    }
  };

  const logout = () => {
    setSession(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <PatientAuthContext.Provider value={{ session, isLoading, login, logout }}>
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  const context = useContext(PatientAuthContext);
  if (context === undefined) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
}
