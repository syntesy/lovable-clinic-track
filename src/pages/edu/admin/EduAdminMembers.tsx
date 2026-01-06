import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Search, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export default function EduAdminMembers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Membros</h1>
          <p className="text-muted-foreground mt-1">
            Adicione e gerencie membros da instituição.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      {/* Security Notice */}
      <Alert className="bg-primary/5 border-primary/20">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Segurança:</strong> Alterações de função (role) são registradas em log de auditoria. Auto-elevação de privilégios é bloqueada.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar membros..." className="pl-10" />
        </div>
      </div>

      {/* Members List */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum membro cadastrado ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Adicionar Membro" para começar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
