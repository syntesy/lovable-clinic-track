import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EduTeacherCases() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Casos Clínicos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os casos clínicos educacionais.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Caso
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar casos..." className="pl-10" />
        </div>
      </div>

      {/* Cases List */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum caso clínico criado ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Novo Caso" para começar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
