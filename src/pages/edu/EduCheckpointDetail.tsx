import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, ArrowLeft, Loader2 } from 'lucide-react';

export default function EduCheckpointDetail() {
  const { checkpointId } = useParams();

  interface EduCheckpoint {
    id: string;
    title: string;
    checkpoint_type: string;
    instructions: string | null;
    module_id: string;
  }

  const { data: checkpoint, isLoading } = useQuery({
    queryKey: ['edu-checkpoint', checkpointId],
    queryFn: async (): Promise<EduCheckpoint | null> => {
      const { data, error } = await supabase
        .from('edu_checkpoints' as any)
        .select('id, title, checkpoint_type, instructions, module_id')
        .eq('id', checkpointId)
        .single();

      if (error) throw error;
      return data as unknown as EduCheckpoint;
    },
    enabled: !!checkpointId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'quiz': return <Badge className="bg-primary/10 text-primary">Quiz</Badge>;
      case 'practical': return <Badge className="bg-success/10 text-success">Prático</Badge>;
      case 'reflection': return <Badge className="bg-warning/10 text-warning">Reflexão</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/edu/modules/${checkpoint?.module_id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{checkpoint?.title || 'Checkpoint'}</h1>
          </div>
          {getTypeBadge(checkpoint?.checkpoint_type)}
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instruções</CardTitle>
        </CardHeader>
        <CardContent>
          {checkpoint?.instructions ? (
            <p className="text-muted-foreground whitespace-pre-wrap">{checkpoint.instructions}</p>
          ) : (
            <p className="text-muted-foreground">Nenhuma instrução disponível.</p>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for checkpoint interaction */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              A interação do checkpoint será implementada em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
