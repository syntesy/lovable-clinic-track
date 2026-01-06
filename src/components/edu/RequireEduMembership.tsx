import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useEduMembership, EduRole } from '@/hooks/useEduMembership';
import { Loader2, ShieldX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RequireEduMembershipProps {
  children: ReactNode;
  allowedRoles?: EduRole[];
}

export function RequireEduMembership({ children, allowedRoles }: RequireEduMembershipProps) {
  const { data: memberships, isLoading, error } = useEduMembership();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <ShieldX className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Erro de Acesso</h2>
              <p className="text-muted-foreground">
                Não foi possível verificar suas permissões. Por favor, tente novamente.
              </p>
              <Button onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeMemberships = memberships?.filter(m => m.status === 'active') || [];

  if (activeMemberships.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <ShieldX className="h-12 w-12 text-warning" />
              <h2 className="text-xl font-semibold">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Você não está vinculado a nenhuma instituição do Academy.
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com sua instituição para solicitar acesso.
              </p>
              <Button variant="outline" asChild>
                <Link to="/pacientes">Voltar para Área Clínica</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = activeMemberships.some(m => allowedRoles.includes(m.role));
    
    if (!hasAllowedRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <ShieldX className="h-12 w-12 text-warning" />
                <h2 className="text-xl font-semibold">Permissão Insuficiente</h2>
                <p className="text-muted-foreground">
                  Você não possui a permissão necessária para acessar esta área.
                </p>
              <Button variant="outline" asChild>
                <Link to="/edu">Voltar para Dashboard</Link>
              </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
}
