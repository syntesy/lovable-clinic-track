import { Card, CardContent } from '@/components/ui/card';
import { Beaker, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function EduTeacherDecisionLab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Decision Reasoning Lab™</h1>
          <p className="text-muted-foreground mt-1">
            Crie cenários de raciocínio clínico para treinamento.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cenário
        </Button>
      </div>

      {/* Educational Banner */}
      <Alert className="bg-warning/10 border-warning">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-warning-foreground">
          <strong>Ambiente educacional.</strong> Os cenários criados aqui são exclusivamente para treinamento e não geram SCORE clínico real.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cenários..." className="pl-10" />
        </div>
      </div>

      {/* Scenarios List */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum cenário de decisão criado ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Novo Cenário" para começar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
