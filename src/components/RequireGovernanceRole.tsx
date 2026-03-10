/**
 * RequireGovernanceRole - Guard para rotas que exigem role 'admin'
 * 
 * Usado para proteger páginas do Evidence Engine Dashboard e Governança.
 * Nota: Atualmente aceita apenas 'admin'. Quando o enum app_role for
 * estendido com 'governance', adicionar à lista REQUIRED_ROLES.
 */

import { Navigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";
import { Loader2, ShieldX } from "lucide-react";

const REQUIRED_ROLES = ["admin"] as const;

interface RequireGovernanceRoleProps {
  children: React.ReactNode;
}

export function RequireGovernanceRole({ children }: RequireGovernanceRoleProps) {
  const { hasAccess, isLoading, session } = useRole(REQUIRED_ROLES);

  if (isLoading) {
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
