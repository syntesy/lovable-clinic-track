/**
 * RequireGovernanceRole - Guard para rotas que exigem role 'admin' ou 'governance'
 * 
 * Usado para proteger páginas do Evidence Engine Dashboard e Governança.
 * Usuários com role 'user' ou 'professional' apenas são redirecionados para /pacientes.
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2, ShieldX } from "lucide-react";

interface RequireGovernanceRoleProps {
  children: React.ReactNode;
}

export function RequireGovernanceRole({ children }: RequireGovernanceRoleProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkGovernanceRole = async (userId: string) => {
      try {
        // Check if user has 'admin' OR 'governance' role
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .in("role", ["admin", "governance"]);

        if (mounted) {
          setHasAccess(!error && data && data.length > 0);
        }
      } catch (err) {
        console.error("[RequireGovernanceRole] Error checking role:", err);
        if (mounted) {
          setHasAccess(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session);
          if (session?.user?.id) {
            await checkGovernanceRole(session.user.id);
          } else {
            setHasAccess(false);
          }
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        if (session?.user?.id) {
          await checkGovernanceRole(session.user.id);
        } else {
          setHasAccess(false);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAccess) {
    const toastKey = "governance_access_denied_shown";
    if (!sessionStorage.getItem(toastKey)) {
      sessionStorage.setItem(toastKey, "true");
      toast.error("Acesso restrito. Esta área é exclusiva para administradores.", {
        duration: 5000,
        icon: <ShieldX className="h-5 w-5" />
      });
      setTimeout(() => sessionStorage.removeItem(toastKey), 10000);
    }
    return <Navigate to="/pacientes" replace />;
  }

  return <>{children}</>;
}
