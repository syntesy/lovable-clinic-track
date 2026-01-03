import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Database, 
  AlertTriangle, 
  ChevronRight,
  Users,
  Activity
} from 'lucide-react';
import { useCurationEvidence } from '@/hooks/useEvidenceEngine';
import { 
  K_MIN, 
  getInsufficientDataMessage,
  TIME_WINDOW_LABELS,
  LINK_TYPE_LABELS,
  LINK_TYPE_COLORS
} from '@/types/evidence-engine';

interface CurationEvidenceSectionProps {
  curationId: string;
}

export function CurationEvidenceSection({ curationId }: CurationEvidenceSectionProps) {
  const { links, loading, error } = useCurationEvidence(curationId);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados Observacionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null; // Silent fail for optional section
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5" />
          Dados Observacionais do REGENAPP Clinical Registry™
        </CardTitle>
        <CardDescription>
          Dados observacionais agregados. Não comparativos. Não inferenciais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disclaimer - Always visible */}
        <Alert className="bg-muted/50 border-muted">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Dados observacionais agregados. Não comparativos. Não inferenciais.
            Evidence Engine powered by REGENAPP Clinical Registry™.
          </AlertDescription>
        </Alert>

        {links.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Nenhuma dimensão de evidência vinculada a esta curadoria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map(link => {
              const snapshot = link.snapshot;
              const dimension = link.dimension;
              
              if (!dimension) return null;

              const hasData = snapshot && snapshot.n_cases_total >= K_MIN;

              return (
                <div 
                  key={link.id} 
                  className="p-4 rounded-lg border bg-muted/30 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{dimension.pathology_tag}</Badge>
                      <Badge variant="outline">{dimension.technique_tag}</Badge>
                      <Badge className={LINK_TYPE_COLORS[link.link_type]}>
                        {LINK_TYPE_LABELS[link.link_type]}
                      </Badge>
                    </div>
                    <Link to={`/evidence/dimensions/${dimension.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver detalhes
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  {/* Data */}
                  {hasData ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div className="text-center p-2 rounded bg-background/50">
                        <div className="flex items-center justify-center gap-1 text-primary">
                          <Users className="h-4 w-4" />
                          <span className="text-lg font-bold">{snapshot.n_cases_total}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Casos totais</p>
                      </div>
                      <div className="text-center p-2 rounded bg-background/50">
                        <div className="flex items-center justify-center gap-1 text-green-500">
                          <Activity className="h-4 w-4" />
                          <span className="text-lg font-bold">{snapshot.n_with_followup_90}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Com D90</p>
                      </div>
                      {snapshot.pain_baseline_mean !== null && (
                        <div className="text-center p-2 rounded bg-background/50">
                          <span className="text-lg font-bold">{snapshot.pain_baseline_mean.toFixed(1)}</span>
                          <p className="text-xs text-muted-foreground">Dor Baseline (média)</p>
                        </div>
                      )}
                      {snapshot.pct_improved_90 !== null && (
                        <div className="text-center p-2 rounded bg-background/50">
                          <span className="text-lg font-bold text-green-500">
                            {snapshot.pct_improved_90.toFixed(0)}%
                          </span>
                          <p className="text-xs text-muted-foreground">Melhora ≥2pts D90</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {getInsufficientDataMessage()}
                    </p>
                  )}

                  {/* Notes */}
                  {link.notes && (
                    <p className="text-sm text-muted-foreground italic border-t pt-2 mt-2">
                      {link.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Link to Evidence Engine */}
        <div className="pt-2 border-t">
          <Link to="/evidence">
            <Button variant="outline" size="sm" className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Explorar Evidence Engine
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
