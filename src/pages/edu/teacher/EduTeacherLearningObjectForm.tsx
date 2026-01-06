import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Upload, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentInstitution } from '@/hooks/useEduMembership';
import { toast } from '@/hooks/use-toast';

const OBJECT_TYPES = [
  { value: 'video', label: 'Vídeo' },
  { value: 'slides', label: 'Slides' },
  { value: 'pdf', label: 'PDF' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'reading', label: 'Leitura' },
  { value: 'quiz', label: 'Quiz' },
] as const;

interface Module {
  id: string;
  title: string;
  cohort_id: string;
}

export default function EduTeacherLearningObjectForm() {
  const navigate = useNavigate();
  const { institution, isLoading: isLoadingMembership } = useCurrentInstitution();
  
  const [title, setTitle] = useState('');
  const [objectType, setObjectType] = useState<string>('');
  const [moduleId, setModuleId] = useState<string>('');
  const [sourceType, setSourceType] = useState<'upload' | 'external'>('external');
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch modules for the current institution
  useEffect(() => {
    async function fetchModules() {
      if (!institution?.id) return;
      
      setIsLoadingModules(true);
      try {
        const { data, error } = await supabase
          .from('edu_modules' as any)
          .select('id, title, cohort_id')
          .eq('institution_id', institution.id)
          .in('status', ['draft', 'review', 'published']);

        if (error) {
          console.error('Erro ao buscar módulos:', error);
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar os módulos.',
            variant: 'destructive',
          });
          return;
        }

        setModules((data as unknown as Module[]) || []);
      } finally {
        setIsLoadingModules(false);
      }
    }

    fetchModules();
  }, [institution?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!title.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Informe o título do conteúdo.',
        variant: 'destructive',
      });
      return;
    }

    if (!objectType) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione o tipo de conteúdo.',
        variant: 'destructive',
      });
      return;
    }

    if (!moduleId) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione o módulo.',
        variant: 'destructive',
      });
      return;
    }

    if (sourceType === 'external' && !externalUrl.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Informe a URL do conteúdo externo.',
        variant: 'destructive',
      });
      return;
    }

    if (sourceType === 'upload' && !file) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione um arquivo para upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      let storagePath: string | null = null;
      let finalExternalUrl: string | null = null;

      // Handle file upload if needed
      if (sourceType === 'upload' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${institution?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('edu-assets')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          toast({
            title: 'Erro no upload',
            description: 'Não foi possível fazer upload do arquivo.',
            variant: 'destructive',
          });
          return;
        }

        storagePath = filePath;
      } else if (sourceType === 'external') {
        finalExternalUrl = externalUrl.trim();
      }

      // Create the learning object
      const { error: insertError } = await supabase
        .from('edu_learning_objects' as any)
        .insert({
          institution_id: institution?.id,
          module_id: moduleId,
          title: title.trim(),
          object_type: objectType,
          status: 'draft',
          storage_path: storagePath,
          external_url: finalExternalUrl,
        });

      if (insertError) {
        console.error('Erro ao criar conteúdo:', insertError);
        toast({
          title: 'Erro',
          description: 'Não foi possível criar o conteúdo.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Conteúdo criado com sucesso',
        description: 'Status: rascunho.',
      });

      navigate('/edu/teacher/learning-objects');
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingMembership) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/edu/teacher/learning-objects')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Conteúdo</h1>
          <p className="text-muted-foreground mt-1">
            Crie um novo material didático para seus alunos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título do conteúdo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Introdução à Fisioterapia Regenerativa"
              />
            </div>

            {/* Object Type */}
            <div className="space-y-2">
              <Label htmlFor="object-type">Tipo de conteúdo *</Label>
              <Select value={objectType} onValueChange={setObjectType}>
                <SelectTrigger id="object-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {OBJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module */}
            <div className="space-y-2">
              <Label htmlFor="module">Módulo *</Label>
              <Select value={moduleId} onValueChange={setModuleId} disabled={isLoadingModules}>
                <SelectTrigger id="module">
                  <SelectValue placeholder={isLoadingModules ? 'Carregando...' : 'Selecione o módulo'} />
                </SelectTrigger>
                <SelectContent>
                  {modules.length === 0 ? (
                    <SelectItem value="no-modules" disabled>
                      Nenhum módulo disponível
                    </SelectItem>
                  ) : (
                    modules.map((mod) => (
                      <SelectItem key={mod.id} value={mod.id}>
                        {mod.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {modules.length === 0 && !isLoadingModules && (
                <p className="text-sm text-muted-foreground">
                  Crie um módulo primeiro para poder adicionar conteúdos.
                </p>
              )}
            </div>

            {/* Source Type */}
            <div className="space-y-3">
              <Label>Fonte do conteúdo *</Label>
              <RadioGroup
                value={sourceType}
                onValueChange={(val) => setSourceType(val as 'upload' | 'external')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="external" id="source-external" />
                  <Label htmlFor="source-external" className="cursor-pointer font-normal">
                    <span className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Link externo
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="source-upload" />
                  <Label htmlFor="source-upload" className="cursor-pointer font-normal">
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload de arquivo
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* External URL */}
            {sourceType === 'external' && (
              <div className="space-y-2">
                <Label htmlFor="external-url">URL do conteúdo</Label>
                <Input
                  id="external-url"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            {/* File Upload */}
            {sourceType === 'upload' && (
              <div className="space-y-2">
                <Label htmlFor="file-upload">Arquivo</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.ppt,.pptx,.mp4,.mov,.doc,.docx"
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo selecionado: {file.name}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/edu/teacher/learning-objects')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving || modules.length === 0}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Criar Conteúdo'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
