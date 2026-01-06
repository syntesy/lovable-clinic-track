import { Card, CardContent } from '@/components/ui/card';
import { UserCog, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EduAdminEnrollments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Matrículas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as matrículas de estudantes nas turmas.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Matrícula
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar matrículas..." className="pl-10" />
        </div>
      </div>

      {/* Enrollments List */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma matrícula registrada ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Nova Matrícula" para começar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
