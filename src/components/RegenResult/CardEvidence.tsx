/**
 * CARD H — Evidence Engine Panel
 * Shows aggregated scientific evidence for the current pathology × intervention
 */

import { useState } from 'react';
import { BookOpen, TrendingUp, Shield, ChevronRight, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useEvidenceAggregate } from '@/hooks/useEvidenceAggregate';
import {
  EvidencePaperLite,
  EvidenceAggregate,
  STRENGTH_LABELS,
  STRENGTH_COLORS,
  CONFIDENCE_LABELS_PTBR,
  CONFIDENCE_COLORS,
  DIRECTION_LABELS,
  DIRECTION_COLORS,
} from '@/types/evidence-aggregate';
import { PaperDetailModal } from '@/components/academy/PaperDetailModal';
import { supabase } from '@/integrations/supabase/client';

interface CardEvidenceProps {
  pathologyKey?: string | null;
  interventionKey?: string | null;
}

function StrengthBadge({ strength }: { strength: string }) {
  const label = STRENGTH_LABELS[strength as keyof typeof STRENGTH_LABELS] || strength;
  const color = STRENGTH_COLORS[strength as keyof typeof STRENGTH_COLORS] || '';
  return <Badge className={`${color} font-semibold`}>{label}</Badge>;
}

function ConfidenceBadge({ level }: { level: string }) {
  const label = CONFIDENCE_LABELS_PTBR[level as keyof typeof CONFIDENCE_LABELS_PTBR] || level;
  const color = CONFIDENCE_COLORS[level as keyof typeof CONFIDENCE_COLORS] || '';
  return <Badge variant="outline" className={color}>{label}</Badge>;
}

function buildSummary(agg: EvidenceAggregate): string {
  const dirLabel = DIRECTION_LABELS[agg.direction_summary] || 'Desconhecido';
  if (agg.recommendation_strength === 'insufficient') {
    return 'Evidência insuficiente para recomendação.';
  }
  const strengthLabel = STRENGTH_LABELS[agg.recommendation_strength];
  return `Recomendação ${strengthLabel.toLowerCase()} com tendência ${dirLabel.toLowerCase()} baseada em ${agg.papers_count} estudo(s).`;
}

function PaperListItem({ paper, onClick }: { paper: EvidencePaperLite; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight line-clamp-2">{paper.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {paper.authors ? `${paper.authors.split(',')[0]} et al.` : 'Autores não disponíveis'}
            {paper.year ? ` (${paper.year})` : ''}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {paper.nivel_evidencia && (
          <Badge variant="outline" className="text-xs">Nível {paper.nivel_evidencia}</Badge>
        )}
        {paper.risco_vies && (
          <Badge variant="outline" className="text-xs">Viés: {paper.risco_vies}</Badge>
        )}
        {paper.score_metodologico != null && (
          <Badge variant="outline" className="text-xs">Método: {paper.score_metodologico}/10</Badge>
        )}
        {paper.evidence_score != null && (
          <Badge variant="outline" className="text-xs">Score: {paper.evidence_score}</Badge>
        )}
      </div>
    </button>
  );
}

export function CardEvidence({ pathologyKey, interventionKey }: CardEvidenceProps) {
  const { result, loading, error, refresh } = useEvidenceAggregate(pathologyKey, interventionKey);
  const [papersModalOpen, setPapersModalOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [loadingPaper, setLoadingPaper] = useState(false);

  if (!pathologyKey || !interventionKey) return null;

  const handleOpenPaper = async (paper: EvidencePaperLite) => {
    try {
      setLoadingPaper(true);
      const { data } = await supabase
        .from('academy_papers')
        .select('*')
        .eq('id', paper.paper_id)
        .single();
      
      if (data) {
        setSelectedPaper(data);
      }
    } catch (err) {
      console.error('Error loading paper:', err);
    } finally {
      setLoadingPaper(false);
    }
  };

  if (loading && !result) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            Evidência Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando base de evidências...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !result || !result.aggregate) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            Evidência Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            {error || 'Sem mapeamento de evidência para esta combinação de patologia e intervenção.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const agg = result.aggregate;
  const papers = result.papers;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Evidência Atual
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="gap-1 text-xs"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Força:</span>
              <StrengthBadge strength={agg.recommendation_strength} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Confiança:</span>
              <ConfidenceBadge level={agg.confidence_level} />
            </div>
            {agg.best_level_evidence && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Melhor nível:</span>
                <Badge variant="outline">{agg.best_level_evidence}</Badge>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-xl font-bold">{agg.papers_count}</p>
              <p className="text-xs text-muted-foreground">Estudos</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-xl font-bold">{agg.consistency_score > 0 ? `${(agg.consistency_score * 100).toFixed(0)}%` : '—'}</p>
              <p className="text-xs text-muted-foreground">Consistência</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-xl font-bold">{agg.average_method_score != null ? agg.average_method_score.toFixed(1) : '—'}</p>
              <p className="text-xs text-muted-foreground">Score Método</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className={`text-xl font-bold ${DIRECTION_COLORS[agg.direction_summary]}`}>
                {DIRECTION_LABELS[agg.direction_summary]}
              </p>
              <p className="text-xs text-muted-foreground">Direção</p>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm">{buildSummary(agg)}</p>
          </div>

          {/* Reasons */}
          {agg.reasons.length > 0 && (
            <div className="space-y-1">
              {agg.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Shield className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                  <p className="text-xs text-muted-foreground">{reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* View papers button */}
          {papers.length > 0 && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setPapersModalOpen(true)}
            >
              <ExternalLink className="h-4 w-4" />
              Ver {papers.length} artigo(s)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Papers list modal */}
      <Dialog open={papersModalOpen} onOpenChange={setPapersModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Artigos — {pathologyKey} × {interventionKey}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {papers.map((paper) => (
              <PaperListItem
                key={paper.paper_id}
                paper={paper}
                onClick={() => handleOpenPaper(paper)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Paper detail modal (reusing Academy component) */}
      {selectedPaper && (
        <PaperDetailModal
          paper={selectedPaper}
          open={!!selectedPaper}
          onOpenChange={(open) => { if (!open) setSelectedPaper(null); }}
          onGenerateCuration={() => {}}
          onPublish={() => {}}
          onReject={() => {}}
          isGenerating={false}
          userRole="admin_academy"
        />
      )}
    </>
  );
}
