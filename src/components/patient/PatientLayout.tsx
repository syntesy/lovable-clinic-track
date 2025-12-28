import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { Button } from '@/components/ui/button';
import { FileText, Pill, ShoppingBag, Home, LogOut } from 'lucide-react';
import logoRegenapp from '@/assets/logo-regenapp.png';

interface PatientLayoutProps {
  children: ReactNode;
}

export function PatientLayout({ children }: PatientLayoutProps) {
  const { session, logout } = usePatientAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/patient/login');
  };

  const navItems = [
    { path: '/patient/home', label: 'Início', icon: Home },
    { path: '/patient/reports', label: 'Relatórios', icon: FileText },
    { path: '/patient/prescriptions', label: 'Prescrições', icon: Pill },
    { path: '/patient/partners', label: 'Parceiros', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoRegenapp} alt="REGENAPP" className="h-8 w-auto" />
            <span className="text-xs text-muted-foreground border-l border-border pl-3">
              Área do Paciente
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session?.patientName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border px-4 py-2">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate(item.path)}
                className="flex-shrink-0"
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-4 py-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            O REGENAPP é uma ferramenta de apoio à decisão clínica.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Esta área destina-se exclusivamente à visualização de informações liberadas pelo seu profissional de saúde.
          </p>
        </div>
      </footer>
    </div>
  );
}
