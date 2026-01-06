import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus, Search, Loader2, Video, BookOpen, FileCheck, HelpCircle, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentInstitution } from '@/hooks/useEduMembership';

interface LearningObject {
  id: string;
  title: string;
  object_type: string;
  status: string;
  created_at: string;
  module_id: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  slides: <Presentation className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  checklist: <FileCheck className="h-4 w-4" />,
  reading: <BookOpen className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  video: 'Vídeo',
  slides: 'Slides',
  pdf: 'PDF',
  checklist: 'Checklist',
  reading: 'Leitura',
  quiz: 'Quiz',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  review: 'outline',
  published: 'default',
  archived: 'secondary',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  review: 'Em revisão',
  published: 'Publicado',
  archived: 'Arquivado',
};

export default function EduTeacherLearningObjects() {
  const navigate = useNavigate();
  const { institution, isLoading: isLoadingMembership } = useCurrentInstitution();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [learningObjects, setLearningObjects] = useState<LearningObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLearningObjects() {
      if (!institution?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('edu_learning_objects' as any)
          .select('id, title, object_type, status, created_at, module_id')
          .eq('institution_id', institution.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar conteúdos:', error);
          return;
        }

        setLearningObjects((data as unknown as LearningObject[]) || []);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLearningObjects();
  }, [institution?.id]);

  const filteredObjects = learningObjects.filter((obj) =>
    obj.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingMembership || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conteúdos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie materiais didáticos, vídeos e documentos.
          </p>
        </div>
        <Button onClick={() => navigate('/edu/teacher/learning-objects/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Conteúdo
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conteúdos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content List */}
      {filteredObjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Nenhum conteúdo encontrado.' : 'Nenhum conteúdo criado ainda.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {!searchQuery && 'Clique em "Novo Conteúdo" para começar.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredObjects.map((obj) => (
            <Card
              key={obj.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/edu/learning/${obj.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {TYPE_ICONS[obj.object_type] || <FileText className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{obj.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {TYPE_LABELS[obj.object_type] || obj.object_type}
                      </p>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[obj.status] || 'secondary'}>
                    {STATUS_LABELS[obj.status] || obj.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
