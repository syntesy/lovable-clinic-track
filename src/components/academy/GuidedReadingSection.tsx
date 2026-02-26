import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, ThumbsUp, Beaker, Stethoscope, FlaskConical, AlertOctagon, FileQuestion } from "lucide-react";
import { EvidenceMethodSeal } from "./EvidenceMethodSeal";
import {
  resolvePaperTemplate,
  safeField,
  safeArray,
  getBestConclusion,
  getWhatIsThis,
  getAudience,
  type PaperTemplate,
  TEMPLATE_LABELS,
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

interface GuidedReadingSectionProps {
  curationJson: CurationJson | null;
  remLayers?: any;
  paperTitle?: string;
}

export function GuidedReadingSection({ curationJson, remLayers, paperTitle }: GuidedReadingSectionProps) {
  if (!curationJson) {
    return (
      <Card className="border-primary/10">
        <CardContent className="py-8 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Curadoria necessária para gerar guia de leitura.
          </p>
        </CardContent>
      </Card>
    );
  }

  const template = resolvePaperTemplate(curationJson);

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Como ler este estudo
        </CardTitle>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">{TEMPLATE_LABELS[template]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Guia educacional derivado da curadoria científica estruturada.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {template === 'TEMPLATE_CLINICAL_COMPARATIVE' && (
          <ClinicalGuidedReading c={curationJson} />
        )}
        {template === 'TEMPLATE_REVIEW_CONSENSUS' && (
          <ReviewGuidedReading c={curationJson} />
        )}
        {template === 'TEMPLATE_TRANSLATIONAL_PRECLINICAL' && (
          <TranslationalGuidedReading c={curationJson} />
        )}
        {template === 'TEMPLATE_OTHER' && (
          <OtherGuidedReading c={curationJson} />
        )}

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground italic">
            ⚕️ Guia derivado da curadoria científica estruturada.
          </p>
          <EvidenceMethodSeal />
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
      <Icon className="w-3 h-3" /> {title}
    </h4>
  );
}

function BulletList({ items, icon = "•", className = "text-primary" }: { items: string[]; icon?: string; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-foreground flex items-start gap-2">
          <span className={`mt-1 ${className}`}>{icon}</span> {item}
        </li>
      ))}
    </ul>
  );
}

// ── CLINICAL COMPARATIVE ──
function ClinicalGuidedReading({ c }: { c: CurationJson }) {
  const methodNotes: string[] = [];
  const justification = safeField(c.justificativa_risco_vies);
  if (justification) methodNotes.push(justification);

  const st = (c.tipo_estudo || '').toLowerCase();
  if (st.includes('rct') || st.includes('ecr') || st.includes('randomiz')) {
    methodNotes.push('Confira se houve análise por intenção de tratar (ITT).');
    if ((c.tamanho_amostra_total ?? 0) > 0 && c.tamanho_amostra_total! < 50) {
      methodNotes.push(`Amostra pequena (n=${c.tamanho_amostra_total}) — cautela na generalização.`);
    }
  }
  const followUp = safeField(c.follow_up_medio);
  if (followUp) methodNotes.push(`Follow-up reportado: ${followUp}.`);

  const outcomes = [
    ...safeArray(c.desfechos_primarios).map(d => `Primário: ${d}`),
    ...safeArray(c.desfechos_secundarios).map(d => `Secundário: ${d}`),
  ];

  return (
    <>
      {/* What this study tests */}
      <div>
        <SectionTitle icon={Target} title="O que este estudo testa" />
        <div className="space-y-1 text-sm">
          {safeField(c.intervencao) && (
            <p><span className="text-muted-foreground">Intervenção:</span> <span className="text-foreground">{c.intervencao}</span></p>
          )}
          {safeField(c.comparador) && (
            <p><span className="text-muted-foreground">Comparador:</span> <span className="text-foreground">{c.comparador}</span></p>
          )}
          {(c.tamanho_amostra_total ?? 0) > 0 && (
            <p><span className="text-muted-foreground">Amostra:</span> <span className="text-foreground">n={c.tamanho_amostra_total}</span></p>
          )}
        </div>
      </div>

      {/* Methodology observations */}
      {methodNotes.length > 0 && (
        <div>
          <SectionTitle icon={Beaker} title="O que observar na metodologia" />
          <BulletList items={methodNotes} />
        </div>
      )}

      {/* How to interpret outcomes */}
      {outcomes.length > 0 && (
        <div>
          <SectionTitle icon={ThumbsUp} title="Como interpretar os desfechos" />
          <BulletList items={outcomes} icon="→" />
        </div>
      )}

      {/* What changes in practice */}
      {safeField(c.aplicabilidade_clinica) && (
        <div>
          <SectionTitle icon={Stethoscope} title="O que isso muda na prática" />
          <p className="text-sm text-foreground">{c.aplicabilidade_clinica}</p>
          {safeField(c.conclusao_pratica) && c.conclusao_pratica !== c.aplicabilidade_clinica && (
            <p className="text-sm text-foreground mt-1 font-medium">{c.conclusao_pratica}</p>
          )}
        </div>
      )}
    </>
  );
}

// ── REVIEW / CONSENSUS ──
function ReviewGuidedReading({ c }: { c: CurationJson }) {
  return (
    <>
      {safeField(c.intervencao) && (
        <div>
          <SectionTitle icon={Target} title="O que esta revisão aborda" />
          <p className="text-sm text-foreground">{c.intervencao}</p>
        </div>
      )}

      {safeField(c.resultados_principais) && (
        <div>
          <SectionTitle icon={ThumbsUp} title="Principais recomendações / achados" />
          <p className="text-sm text-foreground">{c.resultados_principais}</p>
        </div>
      )}

      {safeField(c.nivel_evidencia) && (
        <div>
          <SectionTitle icon={Beaker} title="Força da recomendação" />
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
            Nível {c.nivel_evidencia}
          </Badge>
        </div>
      )}

      {safeField(c.aplicabilidade_clinica) && (
        <div>
          <SectionTitle icon={Stethoscope} title="Aplicabilidade" />
          <p className="text-sm text-foreground">{c.aplicabilidade_clinica}</p>
        </div>
      )}
    </>
  );
}

// ── TRANSLATIONAL / PRECLINICAL ──
function TranslationalGuidedReading({ c }: { c: CurationJson }) {
  const mechanisms: string[] = [];
  const mainResults = safeField(c.resultados_principais);
  if (mainResults) mechanisms.push(mainResults);
  const conclusion = safeField(c.conclusao_pratica);
  if (conclusion && conclusion !== mainResults) mechanisms.push(conclusion);

  return (
    <>
      {/* Scientific question */}
      {safeField(c.intervencao) && (
        <div>
          <SectionTitle icon={FlaskConical} title="Pergunta científica" />
          <p className="text-sm text-foreground">{c.intervencao}</p>
        </div>
      )}

      {/* Key mechanisms / findings */}
      {mechanisms.length > 0 && (
        <div>
          <SectionTitle icon={Beaker} title="Principais mecanismos / achados" />
          <BulletList items={mechanisms.slice(0, 3)} icon="→" />
        </div>
      )}

      {/* What CANNOT be concluded — mandatory */}
      <div>
        <SectionTitle icon={AlertOctagon} title="O que NÃO pode concluir" />
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2">
          <p className="text-sm text-orange-300">
            Este paper não fornece evidência clínica direta. Resultados são experimentais e requerem validação em ensaios clínicos.
          </p>
        </div>
      </div>

      {/* Application */}
      <div>
        <SectionTitle icon={Target} title="Aplicação" />
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">Experimental</Badge>
          <Badge variant="outline" className="text-xs">Educacional</Badge>
          <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">Requer ensaios clínicos</Badge>
        </div>
      </div>
    </>
  );
}

// ── OTHER ──
function OtherGuidedReading({ c }: { c: CurationJson }) {
  const conclusion = getBestConclusion(c);
  return (
    <>
      {safeField(c.tipo_estudo) && (
        <div>
          <SectionTitle icon={FileQuestion} title="Tipo de estudo" />
          <Badge variant="secondary" className="text-xs">{c.tipo_estudo}</Badge>
        </div>
      )}
      {conclusion && (
        <div>
          <SectionTitle icon={Target} title="Conclusão principal" />
          <p className="text-sm text-foreground">{conclusion}</p>
        </div>
      )}
    </>
  );
}
