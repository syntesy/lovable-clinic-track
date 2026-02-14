/**
 * RequireGovernanceAccess - Blocks SECRETARY role from governance routes.
 * NURSE_TECH can view (read-only), PROFESSIONAL/ADMIN have full access.
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldX } from "lucide-react";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

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

  if (role === "secretary") {
    toast.error("Acesso restrito. Secretárias não podem acessar a área de governança.");
    return <Navigate to="/pacientes" replace />;
  }

  return <>{children}</>;
}
