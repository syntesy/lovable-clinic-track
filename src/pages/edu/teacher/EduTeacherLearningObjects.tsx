import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EduTeacherLearningObjects() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conteúdos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie materiais didáticos, vídeos e documentos.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Conteúdo
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar conteúdos..." className="pl-10" />
        </div>
      </div>

      {/* Content List */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum conteúdo criado ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Novo Conteúdo" para começar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
