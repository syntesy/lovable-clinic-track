import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { ExternalLink, Star } from 'lucide-react'

interface CurationCardProps {
  article: {
    id: string
    title: string
    authors: string
    journal: string
    doi?: string
    publicado?: string
    nivel_evidencia: string
    tipo_estudo: string
    resumo_executivo: string
    aplicacao_clinica: string
    achados_principais: string
    limitacoes: string
    metodologia_destaque: string
    score_relevancia: number
    score_breakdown?: any
    classificacao: string
    leitura_essencial: boolean
    tags: string[]
    created_at: string
  }
  compact?: boolean
}

const CLASSIFICACAO_CONFIG: Record<string, { emoji: string; label: string; sublabel: string; color: string; bg: string }> = {
  leitura_essencial:   { emoji: '🟢', label: 'Leitura Essencial',       sublabel: 'Evidência sólida — leitura obrigatória',   color: 'text-emerald-400',  bg: 'bg-card border-emerald-500/30' },
  leitura_recomendada: { emoji: '🔵', label: 'Leitura Recomendada',     sublabel: 'Alta relevância clínica',                  color: 'text-blue-400',     bg: 'bg-card border-blue-500/30' },
  leitura_opcional:    { emoji: '🟡', label: 'Leitura Opcional',        sublabel: 'Relevante para especialistas',             color: 'text-yellow-400',   bg: 'bg-card border-yellow-500/30' },
  referencia:          { emoji: '🟠', label: 'Referência Bibliográfica', sublabel: 'Valor de contextualização',                color: 'text-orange-400',   bg: 'bg-card border-orange-500/30' },
  contexto:            { emoji: '🔴', label: 'Contexto',                sublabel: 'Evidência preliminar ou periférica',       color: 'text-red-400',      bg: 'bg-card border-red-500/30' },
}

const NIVEL_COLORS: Record<string, string> = {
  '1': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  '2': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  '3': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  '4': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  '5': 'bg-muted text-muted-foreground border-border',
}

function getNivelColor(nivel: string): string {
  const num = nivel?.match(/\d/)?.[0] || '5'
  return NIVEL_COLORS[num] || NIVEL_COLORS['5']
}

function ScoreStars({ score }: { score: number }) {
  const filled = Math.round(score / 2)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-muted-foreground">{score?.toFixed(1)}/10</span>
    </div>
  )
}

function parseLines(text: string): string[] {
  if (!text) return []
  return text.split('\n').filter(l => l.trim())
}

export function CurationCard({ article, compact = false }: CurationCardProps) {
  const config = CLASSIFICACAO_CONFIG[article.classificacao] || CLASSIFICACAO_CONFIG['contexto']

  return (
    <Card className={`overflow-hidden border ${config.bg}`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-2">
              {article.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {article.authors} • {article.journal}
            </p>
          </div>

          {/* Score badge */}
          <div className="flex flex-col items-center shrink-0">
            <div className="text-center">
              <div className="text-2xl font-black text-teal-600">
                {article.score_relevancia?.toFixed(1)}
                <span className="text-sm font-normal text-gray-400">/10</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">relevância clínica</div>
            </div>
            <div className="text-lg mt-1">{config.emoji}</div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className={getNivelColor(article.nivel_evidencia)}>
            {article.nivel_evidencia}
          </Badge>
          <Badge variant="outline">
            {article.tipo_estudo}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            {config.emoji} {config.label}
            <span className="text-[10px] font-normal text-muted-foreground hidden sm:inline">— {config.sublabel}</span>
          </Badge>
        </div>

        <ScoreStars score={article.score_relevancia} />
      </CardHeader>

      <CardContent className="pt-0">
        {/* Resumo executivo */}
        <Accordion type="multiple" defaultValue={['resumo']}>
          <AccordionItem value="resumo">
            <AccordionTrigger className="text-sm font-medium">
              📋 Resumo Executivo
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm leading-relaxed text-foreground/80">
                {article.resumo_executivo}
              </p>
            </AccordionContent>
          </AccordionItem>

          {!compact && (
            <>
              <AccordionItem value="aplicacao">
                <AccordionTrigger className="text-sm font-medium">
                  🎯 Aplicação Clínica Prática
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1">
                    {parseLines(article.aplicacao_clinica).map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground/80">
                        <span className="text-primary shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="achados">
                <AccordionTrigger className="text-sm font-medium">
                  📊 Achados Principais
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {article.achados_principais}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="limitacoes">
                <AccordionTrigger className="text-sm font-medium">
                  ⚠️ Limitações
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1">
                    {parseLines(article.limitacoes).map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground/80">
                        <span className="text-destructive shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </>
          )}
        </Accordion>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Curado em {new Date(article.created_at).toLocaleDateString('pt-BR')}
          </span>
          {article.doi && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => window.open(`https://doi.org/${article.doi}`, '_blank')}
            >
              Ver artigo original <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
