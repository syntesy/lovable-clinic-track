import { ReactNode } from 'react';
import { useCurrentInstitution } from '@/hooks/useEduMembership';
import { EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RequirePublishedProps {
  children: ReactNode;
  isPublished: boolean;
  isLoading?: boolean;
}

export function RequirePublished({ children, isPublished, isLoading }: RequirePublishedProps) {
  const { role } = useCurrentInstitution();

  // Staff can see unpublished content
  const isStaff = role === 'teacher' || role === 'director' || role === 'institution_admin';

  if (isLoading) {
    return <>{children}</>;
  }

  if (!isPublished && !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <EyeOff className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Conteúdo Não Publicado</h2>
              <p className="text-muted-foreground">
                Este conteúdo ainda não foi publicado.
              </p>
              <p className="text-sm text-muted-foreground">
                Aguarde a liberação pelo professor ou coordenador.
              </p>
              <Button variant="outline" asChild>
                <a href="/edu">Voltar para Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
