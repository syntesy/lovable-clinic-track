import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Loader2, Play, File, ExternalLink } from 'lucide-react';

export default function EduLearningObjectDetail() {
  const { learningObjectId } = useParams();

  interface EduLearningObject {
    id: string;
    title: string;
    type: string;
    content: string | null;
    file_path: string | null;
    module_id: string;
  }

  const { data: learningObject, isLoading } = useQuery({
    queryKey: ['edu-learning-object', learningObjectId],
    queryFn: async (): Promise<EduLearningObject | null> => {
      const { data, error } = await supabase
        .from('edu_learning_objects' as any)
        .select('id, title, type, content, file_path, module_id')
        .eq('id', learningObjectId)
        .single();

      if (error) throw error;
      return data as unknown as EduLearningObject;
    },
    enabled: !!learningObjectId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'document': return FileText;
      default: return File;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'video': return <Badge variant="outline">Vídeo</Badge>;
      case 'document': return <Badge variant="outline">Documento</Badge>;
      case 'article': return <Badge variant="outline">Artigo</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const Icon = getTypeIcon(learningObject?.type);

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/edu/modules/${learningObject?.module_id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{learningObject?.title || 'Conteúdo'}</h1>
          </div>
          {getTypeBadge(learningObject?.type)}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {learningObject?.content ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{learningObject.content}</p>
            </div>
          ) : learningObject?.file_path ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Este conteúdo possui um arquivo anexo.
              </p>
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Arquivo
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Conteúdo em preparação.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
