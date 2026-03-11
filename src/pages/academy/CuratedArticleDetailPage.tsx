import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { CurationCard } from '@/components/academy/CurationCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function CuratedArticleDetailPage() {
  const { articleId } = useParams<{ articleId: string }>()
  const navigate = useNavigate()

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['curated-article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_curated_articles')
        .select('*')
        .eq('id', articleId!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!articleId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center space-y-4">
        <p className="text-muted-foreground">Artigo não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <CurationCard
        article={{
          id: article.id,
          title: article.title,
          authors: typeof article.authors === 'string' ? article.authors : JSON.stringify(article.authors) || '',
          journal: article.journal || '',
          doi: article.doi || undefined,
          nivel_evidencia: article.nivel_evidencia || '',
          tipo_estudo: article.tipo_estudo || '',
          resumo_executivo: article.resumo_executivo || '',
          aplicacao_clinica: article.aplicacao_clinica || '',
          achados_principais: article.achados_principais || '',
          limitacoes: article.limitacoes || '',
          metodologia_destaque: article.metodologia_destaque || '',
          score_relevancia: article.score_relevancia || 0,
          score_breakdown: article.score_breakdown,
          classificacao: article.classificacao || 'contexto',
          leitura_essencial: article.leitura_essencial || false,
          tags: article.tags || [],
          created_at: article.created_at || '',
        }}
      />

      {article.conexoes_temas && (
        <div className="rounded-lg border border-border p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">🔗 Conexões com outros temas</h3>
          <ul className="space-y-1">
            {article.conexoes_temas.split('\n').filter((l: string) => l.trim()).map((item: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-teal-600 shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {article.doi && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.open(`https://doi.org/${article.doi}`, '_blank')}
          >
            Acessar artigo original (DOI)
          </Button>
        </div>
      )}
    </div>
  )
}
