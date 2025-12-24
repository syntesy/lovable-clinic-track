import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Target, 
  Users, 
  Beaker, 
  Scale, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  Lightbulb,
  BookOpen,
  Quote
} from "lucide-react";
import { 
  Curation, 
  evidenceLevelLabels, 
  biasRiskLabels, 
  applicabilityLabels 
} from "@/types/curation";
import { CurationGovernanceBadge } from "./CurationGovernanceBadge";

interface StructuredCurationViewProps {
  curation: Curation;
}

export function StructuredCurationView({ curation }: StructuredCurationViewProps) {
  return (
    <div className="space-y-6">
      {/* Governance Badge */}
      <div className="flex items-center justify-between">
        <CurationGovernanceBadge status={curation.status} />
        {curation.reviewed_at && (
          <span className="text-xs text-muted-foreground">
            Revisado em: {new Date(curation.reviewed_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {/* PICO Structure */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Estrutura PICO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {curation.objective && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Objetivo</h4>
              <p className="text-sm">{curation.objective}</p>
            </div>
          )}
          
          {curation.design && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Desenho do Estudo</h4>
              <p className="text-sm">{curation.design}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {curation.population && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Users className="h-4 w-4" /> População
                </h4>
                <p className="text-sm">{curation.population}</p>
              </div>
            )}
            
            {curation.sample_size && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Tamanho da Amostra</h4>
                <p className="text-sm">{curation.sample_size}</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {curation.intervention && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Beaker className="h-4 w-4" /> Intervenção
                </h4>
                <p className="text-sm">{curation.intervention}</p>
              </div>
            )}
            
            {curation.comparator && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Scale className="h-4 w-4" /> Comparador
                </h4>
                <p className="text-sm">{curation.comparator}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Outcomes */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Resultados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {curation.outcomes_primary && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Desfechos Primários</h4>
              <p className="text-sm">{curation.outcomes_primary}</p>
            </div>
          )}
          
          {curation.outcomes_secondary && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Desfechos Secundários</h4>
              <p className="text-sm">{curation.outcomes_secondary}</p>
            </div>
          )}
          
          {curation.results_key && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Principais Achados</h4>
              <p className="text-sm">{curation.results_key}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Analysis */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Análise Crítica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Classification Badges */}
          <div className="flex flex-wrap gap-2">
            {curation.evidence_level && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                {evidenceLevelLabels[curation.evidence_level]}
              </Badge>
            )}
            {curation.bias_risk && (
              <Badge variant="secondary" className={`
                ${curation.bias_risk === 'baixo' ? 'bg-green-500/10 text-green-500 border-green-500/30' : ''}
                ${curation.bias_risk === 'moderado' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : ''}
                ${curation.bias_risk === 'alto' || curation.bias_risk === 'muito_alto' ? 'bg-red-500/10 text-red-500 border-red-500/30' : ''}
                ${curation.bias_risk === 'incerto' ? 'bg-gray-500/10 text-gray-500 border-gray-500/30' : ''}
              `}>
                {biasRiskLabels[curation.bias_risk]}
              </Badge>
            )}
            {curation.applicability && (
              <Badge variant="secondary" className={`
                ${curation.applicability === 'alta' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : ''}
                ${curation.applicability === 'moderada' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : ''}
                ${curation.applicability === 'baixa' || curation.applicability === 'muito_baixa' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : ''}
                ${curation.applicability === 'nao_aplicavel' ? 'bg-gray-500/10 text-gray-500 border-gray-500/30' : ''}
              `}>
                {applicabilityLabels[curation.applicability]}
              </Badge>
            )}
          </div>
          
          {curation.adverse_events && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" /> Eventos Adversos
              </h4>
              <p className="text-sm">{curation.adverse_events}</p>
            </div>
          )}
          
          {curation.limitations && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Limitações</h4>
              <p className="text-sm">{curation.limitations}</p>
            </div>
          )}
          
          {curation.authors_conclusion && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Conclusão dos Autores</h4>
              <p className="text-sm">{curation.authors_conclusion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinical Application */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Aplicação Clínica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {curation.clinical_takeaways && curation.clinical_takeaways.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Pontos-chave para a Prática</h4>
              <ul className="space-y-2">
                {curation.clinical_takeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold">•</span>
                    {takeaway}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {curation.what_changes_in_practice && (
            <div className="bg-background/60 p-4 rounded-lg border border-primary/20">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <BookOpen className="h-4 w-4" /> O que muda na prática?
              </h4>
              <p className="text-sm">{curation.what_changes_in_practice}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Citations */}
      {curation.citations && curation.citations.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Quote className="h-5 w-5 text-primary" />
              Citações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {curation.citations.map((citation, index) => (
                <li key={index} className="text-sm border-l-2 border-muted pl-3">
                  {citation.excerpt && <p className="italic mb-1">"{citation.excerpt}"</p>}
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {citation.doi && <span>DOI: {citation.doi}</span>}
                    {citation.pmid && <span>PMID: {citation.pmid}</span>}
                    {citation.page && <span>Página: {citation.page}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
