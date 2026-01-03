/**
 * RequireAdminRole - Guard para rotas administrativas
 * 
 * Verifica se o usuário autenticado possui role 'admin'.
 * Non-admin recebe redirecionamento para /pacientes com toast de erro.
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2, ShieldX } from "lucide-react";

interface RequireAdminRoleProps {
  children: React.ReactNode;
}

export function RequireAdminRole({ children }: RequireAdminRoleProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAdminRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();

        if (mounted) {
          setIsAdmin(!!data && !error);
        }
      } catch (err) {
        console.error("[RequireAdminRole] Error checking role:", err);
        if (mounted) {
          setIsAdmin(false);
        }
      }
    };

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session);
          if (session?.user?.id) {
            await checkAdminRole(session.user.id);
          } else {
            setIsAdmin(false);
          }
          setLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        if (session?.user?.id) {
          await checkAdminRole(session.user.id);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Loading state
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

  // Not authenticated → redirect to auth
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Authenticated but not admin → redirect with error
  if (!isAdmin) {
    // Show toast only once (using sessionStorage to prevent spam on redirect)
    const toastKey = "admin_access_denied_shown";
    if (!sessionStorage.getItem(toastKey)) {
      sessionStorage.setItem(toastKey, "true");
      toast.error("Acesso negado. Esta área é restrita a administradores.", {
        duration: 5000,
        icon: <ShieldX className="h-5 w-5" />
      });
      // Clear after a short delay to allow showing again if user navigates away and back
      setTimeout(() => sessionStorage.removeItem(toastKey), 10000);
    }
    return <Navigate to="/pacientes" replace />;
  }

  // Admin → render children
  return <>{children}</>;
}
