import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { EduSidebar } from './EduSidebar';
import { Button } from '@/components/ui/button';
import { LogOut, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import SessionTimeout from '@/components/SessionTimeout';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModeSwitch } from './ModeSwitch';
import { useCurrentInstitution } from '@/hooks/useEduMembership';
import { Badge } from '@/components/ui/badge';

interface EduLayoutProps {
  children: ReactNode;
}

export function EduLayout({ children }: EduLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { institution, role } = useCurrentInstitution();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'institution_admin':
        return <Badge variant="default" className="text-xs">Admin</Badge>;
      case 'director':
        return <Badge variant="secondary" className="text-xs">Diretor</Badge>;
      case 'teacher':
        return <Badge variant="outline" className="text-xs">Professor</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Estudante</Badge>;
    }
  };

  return (
    <SessionTimeout timeoutMinutes={30} warningMinutes={5}>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-background">
          <EduSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-3 md:px-6 sticky top-0 z-10">
              <div className="flex items-center min-w-0 gap-3">
                <SidebarTrigger className="flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-semibold text-foreground">REGENAPP Academy</span>
                    {institution && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {institution.name}
                      </span>
                    )}
                  </div>
                </div>
                {role && getRoleBadge()}
              </div>
              <div className="flex items-center gap-2">
                <ModeSwitch />
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-1 md:gap-2 flex-shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </header>
            <main className="flex-1 p-3 md:p-6 overflow-x-hidden">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </SessionTimeout>
  );
}
