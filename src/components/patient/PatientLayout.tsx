import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import logoRegenapp from '@/assets/logo-regenapp-new.png';
import { ThemeToggle } from '@/components/ThemeToggle';

interface PatientLayoutProps {
  children: ReactNode;
}

export function PatientLayout({ children }: PatientLayoutProps) {
  const { session, logout } = usePatientAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/patient/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Minimal, no navigation */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoRegenapp} alt="SYNTESY" className="h-8 w-auto" />
            <span className="text-xs text-muted-foreground border-l border-border pl-3">
              Acompanhamento Clínico
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session?.patientName}
            </span>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - No navigation bar */}
      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-4 py-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            Esta área destina-se exclusivamente ao acompanhamento clínico orientado pelo seu profissional de saúde.
          </p>
        </div>
      </footer>
    </div>
  );
}
