import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import logoHeader from "@/assets/logo-regenapp-new.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuditLog } from "@/hooks/useAuditLog";
import SessionTimeout from "@/components/SessionTimeout";
import { useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { logLogout, logSessionStart } = useAuditLog();

  // Registrar início da sessão
  useEffect(() => {
    logSessionStart();
  }, [logSessionStart]);

  const handleLogout = async () => {
    await logLogout();
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  return (
    <SessionTimeout timeoutMinutes={30} warningMinutes={5}>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-3 md:px-6 sticky top-0 z-10">
              <div className="flex items-center min-w-0">
                <SidebarTrigger className="mr-2 md:mr-4 flex-shrink-0" />
                <img 
                  src={logoHeader} 
                  alt="REGENAPP" 
                  className="h-12 md:h-[60px] w-auto"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1 md:gap-2 flex-shrink-0"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </header>
            <main className="flex-1 p-3 md:p-6 overflow-x-hidden">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </SessionTimeout>
  );
}
