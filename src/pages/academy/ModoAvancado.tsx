import { useNavigate } from 'react-router-dom';
import { useEduMembership } from '@/hooks/useEduMembership';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { EduLayout } from '@/components/edu/EduLayout';

export default function ModoAvancado() {
  const navigate = useNavigate();
  const { data: memberships, isLoading } = useEduMembership();

  if (isLoading) {
    return (
      <EduLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </EduLayout>
    );
  }

  return (
    <EduLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/academy/home')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Home
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Modo Avançado</h1>
          <p className="text-muted-foreground mt-1">
            Selecione seu contexto de acesso institucional para acessar recursos avançados.
          </p>
        </div>

        {(!memberships || memberships.length === 0) ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Você não possui vínculo com nenhuma instituição.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/academy/home')}
              >
                Explorar Academy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {memberships.map((membership) => {
              const roleLabel = membership.role === 'institution_admin' ? 'Administrador' :
                               membership.role === 'director' ? 'Diretor' :
                               membership.role === 'teacher' ? 'Professor' : 'Estudante';
              
              return (
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
                          <p className="text-sm text-muted-foreground">
                            {membership.institution?.name || 'Instituição'}
                          </p>
                          <p className="text-lg font-semibold text-foreground">
                            {roleLabel}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </EduLayout>
  );
}
