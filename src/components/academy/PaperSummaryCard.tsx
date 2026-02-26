import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, FileText, ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { EvidenceMethodSeal, EVIDENCE_METHOD_SEAL_TEXT } from "./EvidenceMethodSeal";
import {
  resolvePaperTemplate,
  safeField,
  safeArray,
  getBestConclusion,
  getWhatIsThis,
  getAudience,
  TEMPLATE_LABELS,
  type PaperTemplate,
} from "@/utils/paperTemplateRouter";

interface CurationJson {
  tipo_estudo?: string;
  nivel_evidencia?: string;
  tamanho_amostra_total?: number;
  intervencao?: string;
  comparador?: string;
  desfechos_primarios?: string[];
  desfechos_secundarios?: string[];
  follow_up_medio?: string;
  resultados_principais?: string;
  significancia_estatistica?: string;
  eventos_adversos?: string;
  risco_vies?: string;
  justificativa_risco_vies?: string;
  score_metodologico?: number;
  aplicabilidade_clinica?: string;
  conclusao_pratica?: string;
  conclusao?: string;
  tags?: string[];
  outcomes?: Array<{ name?: string; direction?: string; timeframe?: string; domain?: string }>;
  [key: string]: any;
}

interface PaperSummaryCardProps {
  title: string;
  authors?: string | null;
  journal?: string | null;
  year?: number | null;
  isPublished?: boolean;
  evidenceScore?: number | null;
  curationJson: CurationJson | null;
  template?: PaperTemplate;
}

export function PaperSummaryCard({
  title,
  authors,
  journal,
  year,
  isPublished,
  evidenceScore,
  curationJson,
  template: templateProp,
}: PaperSummaryCardProps) {
  const c = curationJson;
  // Use template from parent (DB source) if available, otherwise fallback to client router
  const template = templateProp || resolvePaperTemplate(c);
  const hasContent = c != null;

  // Fixed format: 1 central sentence
  const centralSentence = c ? (getBestConclusion(c) || safeField(c.resultados_principais)) : null;

  // 3 learnings
  const learnings: string[] = [];
  if (c) {
    const mainResult = safeField(c.resultados_principais);
    if (mainResult && mainResult !== centralSentence) learnings.push(mainResult);
    const sig = safeField(c.significancia_estatistica);
    if (sig) learnings.push(`Significância: ${sig}`);
    const applic = safeField(c.aplicabilidade_clinica);
    if (applic && applic !== centralSentence) learnings.push(applic);
    const conclusion = safeField(c.conclusao_pratica);
    if (conclusion && conclusion !== centralSentence && conclusion !== applic) learnings.push(conclusion);
  }

  // 2 limitations
  const limitations: string[] = [];
  if (c) {
    if (safeField(c.risco_vies) && c.risco_vies !== 'baixo' && safeField(c.justificativa_risco_vies)) {
      limitations.push(c.justificativa_risco_vies!);
    }
    if ((c.tamanho_amostra_total ?? 0) > 0 && c.tamanho_amostra_total! < 50) {
      limitations.push(`Amostra pequena (n=${c.tamanho_amostra_total}).`);
    }
    if (template === 'TEMPLATE_TRANSLATIONAL_PRECLINICAL') {
      limitations.push('Evidência pré-clínica — não aplicável diretamente à prática.');
    }
  }

  // Classification
  const audience = getAudience(template);

  const needsReview = !hasContent;

  const copyText = () => {
    const lines = [
      `📄 ${title}`,
      `📅 ${year || ''} • ${journal || ''}`,
      `🏷️ ${TEMPLATE_LABELS[template]}`,
      '',
      centralSentence ? `💡 ${centralSentence}` : '',
      '',
      ...learnings.slice(0, 3).map(l => `• ${l}`),
      '',
      ...limitations.slice(0, 2).map(l => `⚠️ ${l}`),
      '',
      `🎯 ${audience.join(' • ')}`,
      '',
      '⚕️ Não substitui avaliação clínica formal.',
      isPublished ? `🛡️ ${EVIDENCE_METHOD_SEAL_TEXT}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    toast.success('Ficha copiada para o clipboard!');
  };

  const copyShort = () => {
    const bullets = [centralSentence, ...learnings.slice(0, 2), ...limitations.slice(0, 1)].filter(Boolean).slice(0, 4);
    const text = `${title} (${year || '?'}, ${TEMPLATE_LABELS[template]})\n${bullets.map(b => `• ${b}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success('Versão resumida copiada!');
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Ficha Aula
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={copyText} className="gap-1 text-xs" disabled={!hasContent}>
              <Copy className="w-3 h-3" /> Copiar
            </Button>
            <Button variant="ghost" size="sm" onClick={copyShort} className="gap-1 text-xs" disabled={!hasContent}>
              <ClipboardCopy className="w-3 h-3" /> Resumida
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsReview && (
          <div className="flex items-center gap-2 p-2 rounded border border-orange-500/30 bg-orange-500/10">
            <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30 shrink-0">
              Requer revisão humana
            </Badge>
            <p className="text-xs text-orange-400">
              Curadoria não disponível. Ficha gerada com dados mínimos.
            </p>
          </div>
        )}

        {/* Title & meta */}
        <div>
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {authors && `${authors} • `}{year} • {journal}
          </p>
        </div>

        {/* Template badge + tags */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{TEMPLATE_LABELS[template]}</Badge>
          {template === 'TEMPLATE_CLINICAL_COMPARATIVE' && safeField(c?.nivel_evidencia) && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              Nível {c!.nivel_evidencia}
            </Badge>
          )}
          {template === 'TEMPLATE_TRANSLATIONAL_PRECLINICAL' && (
            <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
              Experimental
            </Badge>
          )}
          {evidenceScore != null && (
            <Badge variant="outline" className={
              evidenceScore >= 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              evidenceScore >= 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
              'bg-red-500/10 text-red-400 border-red-500/30'
            }>
              Score: {evidenceScore}/100
            </Badge>
          )}
        </div>

        <Separator />

        {/* Central sentence */}
        {centralSentence && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Frase central</h4>
            <p className="text-sm text-foreground font-medium">{centralSentence}</p>
          </div>
        )}

        {/* 3 learnings */}
        {learnings.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Aprendizados</h4>
            <ul className="space-y-0.5">
              {learnings.slice(0, 3).map((l, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span> {l}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2 limitations */}
        {limitations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Limitações</h4>
            <ul className="space-y-0.5">
              {limitations.slice(0, 2).map((l, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-orange-500 mt-1">⚠</span> {l}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Audience classification */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Para quem serve</h4>
          <div className="flex flex-wrap gap-1.5">
            {audience.map(a => (
              <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground italic">
            ⚕️ Não substitui avaliação clínica formal.
          </p>
          {isPublished && <EvidenceMethodSeal />}
        </div>
      </CardContent>
    </Card>
  );
}
