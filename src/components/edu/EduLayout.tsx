import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { EduSidebar } from './EduSidebar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import SessionTimeout from '@/components/SessionTimeout';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModeSwitch } from './ModeSwitch';
import { AcademyNotificationBell } from '@/components/academy/AcademyNotificationBell';
import logoReghen from '@/assets/logo-reghen.png';

interface EduLayoutProps {
  children: ReactNode;
}

export function EduLayout({ children }: EduLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
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
          <EduSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-3 md:px-6 sticky top-0 z-10">
              <div className="flex items-center min-w-0">
                <SidebarTrigger className="mr-2 md:mr-4 flex-shrink-0" />
                <img 
                  src={logoReghen} 
                  alt="rhegen" 
                  className="h-12 md:h-[60px] w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <AcademyNotificationBell />
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
