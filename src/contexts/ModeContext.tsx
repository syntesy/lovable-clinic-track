import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type AppMode = 'clinical' | 'education';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  switchToEducation: () => void;
  switchToClinical: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const STORAGE_KEY = 'regenapp_mode';

function getStoredMode(): AppMode {
  if (typeof window === 'undefined') return 'clinical';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'education') return 'education';
  return 'clinical';
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(getStoredMode);
  const location = useLocation();

  // Sincroniza modo com rota atual
  useEffect(() => {
    const isEduRoute = location.pathname.startsWith('/edu');
    if (isEduRoute && mode !== 'education') {
      setModeState('education');
      localStorage.setItem(STORAGE_KEY, 'education');
    } else if (!isEduRoute && mode === 'education') {
      setModeState('clinical');
      localStorage.setItem(STORAGE_KEY, 'clinical');
    }
  }, [location.pathname, mode]);

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const switchToEducation = useCallback(() => {
    setMode('education');
  }, [setMode]);

  const switchToClinical = useCallback(() => {
    setMode('clinical');
  }, [setMode]);

  return (
    <ModeContext.Provider value={{ mode, setMode, switchToEducation, switchToClinical }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode deve ser usado dentro de ModeProvider');
  }
  return context;
}

export function useModeNavigation() {
  const { setMode } = useMode();
  const navigate = useNavigate();

  const goToEducation = useCallback(() => {
    setMode('education');
    navigate('/edu');
  }, [setMode, navigate]);

  const goToClinical = useCallback(() => {
    setMode('clinical');
    navigate('/pacientes');
  }, [setMode, navigate]);

  return { goToEducation, goToClinical };
}
