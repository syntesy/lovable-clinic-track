import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "regenapp_last_environment";

type Environment = "clinical" | "academy" | "patient";

interface EnvironmentRoutes {
  clinical: string;
  academy: string;
  patient: string;
}

const ENVIRONMENT_ROUTES: EnvironmentRoutes = {
  clinical: "/pacientes",
  academy: "/academy/home",
  patient: "/patient/login"
};

export function useEnvironmentPreference() {
  const navigate = useNavigate();
  const location = useLocation();

  const getLastEnvironment = (): Environment | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ["clinical", "academy", "patient"].includes(stored)) {
      return stored as Environment;
    }
    return null;
  };

  const setLastEnvironment = (env: Environment) => {
    localStorage.setItem(STORAGE_KEY, env);
  };

  const clearEnvironmentPreference = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const shouldRedirectToSelector = () => {
    // Check if user is on a deep link that should be respected
    const currentPath = location.pathname;
    
    // Paths that should bypass environment selection
    const bypassPaths = [
      "/auth",
      "/checkout",
      "/patient/",
      "/academy/",
      "/edu/",
      "/select-environment"
    ];

    return !bypassPaths.some(path => currentPath.startsWith(path));
  };

  const navigateToEnvironmentSelector = () => {
    navigate("/select-environment");
  };

  const navigateToLastEnvironment = () => {
    const lastEnv = getLastEnvironment();
    if (lastEnv && ENVIRONMENT_ROUTES[lastEnv]) {
      navigate(ENVIRONMENT_ROUTES[lastEnv]);
    } else {
      navigateToEnvironmentSelector();
    }
  };

  return {
    getLastEnvironment,
    setLastEnvironment,
    clearEnvironmentPreference,
    shouldRedirectToSelector,
    navigateToEnvironmentSelector,
    navigateToLastEnvironment,
    ENVIRONMENT_ROUTES
  };
}

/**
 * Hook to handle post-login environment redirection
 */
export function usePostLoginRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  const handlePostLoginRedirect = async () => {
    // Check if there's a saved environment preference
    const lastEnv = localStorage.getItem(STORAGE_KEY) as Environment | null;
    
    if (lastEnv && ENVIRONMENT_ROUTES[lastEnv]) {
      navigate(ENVIRONMENT_ROUTES[lastEnv]);
    } else {
      // First time or no preference - show environment selector
      navigate("/select-environment");
    }
  };

  return { handlePostLoginRedirect };
}
