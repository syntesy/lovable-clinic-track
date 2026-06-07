/**
 * RequireGovernanceAccess — guarda para rotas de governança (protocolos, conformidade).
 *
 * Política de acesso EXPLÍCITA:
 *   professional   → acesso total (visualizar + ações no próprio escopo)
 *   nurse_tech     → acesso de leitura (mesma rota, conteúdo sem ações destrutivas)
 *   admin          → acesso total (inclui visão cross-professional)
 *   secretary      → BLOQUEADO (sem contexto clínico para protocolos)
 *   outros/unknown → BLOQUEADO por segurança (fail-closed)
 *
 * Para criação/edição de protocolos, use RequireAdminRole em vez deste guard.
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

// Roles com permissão explícita de acesso às rotas de governança
const GOVERNANCE_ALLOWED_ROLES = new Set(["professional", "nurse_tech", "admin"]);

export function RequireGovernanceAccess({ children }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) { setRole(null); setLoading(false); }
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mounted) {
        setRole(data?.role || "professional");
        setLoading(false);
      }
    };

    checkRole();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) return <Navigate to="/auth" replace />;

  if (!GOVERNANCE_ALLOWED_ROLES.has(role)) {
    toast.error("Acesso restrito. Seu perfil não tem permissão para acessar a área de governança.");
    return <Navigate to="/pacientes" replace />;
  }

  return <>{children}</>;
}
