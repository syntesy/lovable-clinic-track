import { useNavigate } from 'react-router-dom';
import { useEduMembership } from '@/hooks/useEduMembership';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function EduHome() {
  const navigate = useNavigate();
  const { data: memberships, isLoading } = useEduMembership();

  // Auto-redirect if single institution
  useEffect(() => {
    if (!isLoading && memberships?.length === 1) {
      navigate('/edu/dashboard', { replace: true });
    }
  }, [memberships, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Single institution - redirect handled by useEffect
  if (memberships?.length === 1) {
    return null;
  }

  // Multiple institutions - show selector
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Selecione sua Instituição</h1>
        <p className="text-muted-foreground mt-1">
          Você está vinculado a múltiplas instituições. Selecione qual deseja acessar.
        </p>
      </div>

      <div className="space-y-4">
        {memberships?.map((membership) => (
          <Card key={membership.id} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full h-auto p-4 justify-between"
                onClick={() => navigate('/edu/dashboard')}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {membership.institution?.name || 'Instituição'}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {membership.role === 'institution_admin' ? 'Administrador' :
                       membership.role === 'director' ? 'Diretor' :
                       membership.role === 'teacher' ? 'Professor' : 'Estudante'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
