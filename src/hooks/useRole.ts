/**
 * useRole — Hook centralizado para verificação de roles via tabela user_roles.
 * 
 * Padrão: getSession inicializa estado, onAuthStateChange mantém atualizado.
 * Query na tabela `user_roles` (não user_metadata/app_metadata).
 */

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UseRoleResult {
  hasAccess: boolean;
  isLoading: boolean;
  session: Session | null;
}

async function checkUserRoles(
  userId: string,
  requiredRoles: string[]
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", requiredRoles);

    return !error && !!data && data.length > 0;
  } catch (err) {
    console.error("[useRole] Error checking roles:", err);
    return false;
  }
}

export function useRole(requiredRoles: string[]): UseRoleResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const rolesKey = requiredRoles.join(",");
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    initializedRef.current = false;

    const resolveSession = async (currentSession: Session | null) => {
      if (!mounted) return;
      setSession(currentSession);

      if (currentSession?.user?.id) {
        const access = await checkUserRoles(currentSession.user.id, requiredRoles);
        if (mounted) setHasAccess(access);
      } else {
        if (mounted) setHasAccess(false);
      }
    };

    // getSession: snapshot inicial — resolve loading UMA vez
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      await resolveSession(currentSession);
      if (mounted) {
        initializedRef.current = true;
        setIsLoading(false);
      }
    });

    // onAuthStateChange: reage a logout, refresh, etc. — NÃO toca isLoading
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted || !initializedRef.current) return;
        await resolveSession(newSession);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [rolesKey]);

  return { hasAccess, isLoading, session };
}
