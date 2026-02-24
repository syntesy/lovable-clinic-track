import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Target, Microscope, ShieldCheck, Stethoscope, AlertTriangle,
  GitCompareArrows, GraduationCap, Info,
} from "lucide-react";
import type { EvidenceScoreBreakdown } from "@/hooks/useEvidenceScore";

interface ReghenLayersDisplayProps {
  layers: any;
  breakdown?: EvidenceScoreBreakdown | null;
}

const APPLICABILITY_LABELS: Record<string, string> = {
  high: "Alta", moderate: "Moderada", limited: "Limitada", experimental: "Experimental",
};

const CONSISTENCY_LABELS: Record<string, string> = {
  confirmatory: "Confirmatório", complementary: "Complementar",
  divergent: "Divergente", isolated: "Isolado",
};

const CLARITY_LABELS: Record<string, string> = {
  high: "Alta", moderate: "Moderada", low: "Baixa", unclear: "Incerta",
};

const LIMITATION_CATEGORY_LABELS: Record<string, string> = {
  methodological: "Metodológica", statistical: "Estatística",
  sample: "Amostra", follow_up: "Follow-up",
  generalization: "Generalização", surrogate: "Desfecho substituto",
};

function BoolBadge({ value, trueLabel, falseLabel }: { value: boolean | null | undefined; trueLabel: string; falseLabel: string }) {
  if (value === null || value === undefined) return <Badge variant="outline" className="text-[10px] text-muted-foreground">Não informado</Badge>;
  return value
    ? <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{trueLabel}</Badge>
    : <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-400">{falseLabel}</Badge>;
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-primary" /> {title}
    </h4>
  );
}

export function ReghenLayersDisplay({ layers, breakdown }: ReghenLayersDisplayProps) {
  if (!layers) return null;

  const l1 = layers.layer_1_structure;
  const l2 = layers.layer_2_methodology;
  const l3 = layers.layer_3_reliability;
  const l4 = layers.layer_4_applicability;
  const l5 = layers.layer_5_limitations;
  const l6 = layers.layer_6_consistency;
  const l7 = layers.layer_7_educational;

  return (
    <div className="space-y-5">
      {/* Layer 1 — Clinical Structure */}
      {l1 && (
        <section>
          <SectionHeader icon={Target} title="1. Estrutura Clínica (PICO)" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            {l1.population && <div><span className="text-xs text-muted-foreground">População:</span><p className="text-foreground">{l1.population}</p></div>}
            {l1.intervention && <div><span className="text-xs text-muted-foreground">Intervenção:</span><p className="text-foreground">{l1.intervention}</p></div>}
            {l1.comparison && <div><span className="text-xs text-muted-foreground">Comparação:</span><p className="text-foreground">{l1.comparison}</p></div>}
          </div>
          {l1.outcomes && (
            <div className="mt-2 space-y-1">
              {l1.outcomes.clinical?.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-muted-foreground uppercase mr-1">Clínicos:</span>
                  {l1.outcomes.clinical.map((o: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{o}</Badge>
                  ))}
                </div>
              )}
              {l1.outcomes.functional?.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-muted-foreground uppercase mr-1">Funcionais:</span>
                  {l1.outcomes.functional.map((o: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{o}</Badge>
                  ))}
                </div>
              )}
              {l1.outcomes.biological?.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-muted-foreground uppercase mr-1">Biológicos:</span>
                  {l1.outcomes.biological.map((o: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{o}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <Separator />

      {/* Layer 2 — Methodology */}
      {l2 && (
        <section>
          <SectionHeader icon={Microscope} title="2. Metodologia" />
          <div className="flex flex-wrap gap-2 text-sm">
            {l2.study_type && <Badge variant="secondary" className="text-xs">{l2.study_type}</Badge>}
            <BoolBadge value={l2.is_human} trueLabel="Humano" falseLabel="Não-humano" />
            {l2.sample_size != null && <Badge variant="outline" className="text-[10px]">n={l2.sample_size}</Badge>}
            {l2.follow_up_months != null && <Badge variant="outline" className="text-[10px]">Follow-up: {l2.follow_up_months} meses</Badge>}
          </div>
        </section>
      )}

      <Separator />

      {/* Layer 3 — Reliability */}
      {l3 && (
        <section>
          <SectionHeader icon={ShieldCheck} title="3. Confiabilidade" />
          <div className="flex flex-wrap gap-2">
            <BoolBadge value={l3.randomized} trueLabel="Randomizado" falseLabel="Não randomizado" />
            <BoolBadge value={l3.control_group} trueLabel="Grupo controle" falseLabel="Sem grupo controle" />
            <BoolBadge value={l3.blinded} trueLabel="Cegamento" falseLabel="Sem cegamento" />
            <BoolBadge value={l3.follow_up_adequate} trueLabel="Follow-up adequado" falseLabel="Follow-up insuficiente" />
            {l3.methodology_clarity && (
              <Badge variant="outline" className="text-[10px]">
                Clareza: {CLARITY_LABELS[l3.methodology_clarity] || l3.methodology_clarity}
              </Badge>
            )}
          </div>
        </section>
      )}

      <Separator />

      {/* Layer 4 — Applicability */}
      {l4 && (
        <section>
          <SectionHeader icon={Stethoscope} title="4. Aplicabilidade Clínica" />
          {l4.classification && (
            <Badge variant="outline" className={`text-xs mb-1 ${
              l4.classification === "high" ? "border-emerald-500/30 text-emerald-400" :
              l4.classification === "moderate" ? "border-yellow-500/30 text-yellow-400" :
              l4.classification === "limited" ? "border-orange-500/30 text-orange-400" :
              "border-red-500/30 text-red-400"
            }`}>
              {APPLICABILITY_LABELS[l4.classification] || l4.classification}
            </Badge>
          )}
          {l4.justification && <p className="text-sm text-muted-foreground mt-1">{l4.justification}</p>}
        </section>
      )}

      <Separator />

      {/* Layer 5 — Limitations */}
      {Array.isArray(l5) && l5.length > 0 && (
        <section>
          <SectionHeader icon={AlertTriangle} title="5. Limitações Estruturadas" />
          <div className="space-y-1.5">
            {l5.map((lim: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                  {LIMITATION_CATEGORY_LABELS[lim.category] || lim.category}
                </Badge>
                <span className="text-muted-foreground">{lim.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* Layer 6 — Consistency */}
      {l6 && (
        <section>
          <SectionHeader icon={GitCompareArrows} title="6. Consistência com Literatura" />
          {l6.classification && (
            <Badge variant="outline" className="text-xs mb-1">
              {CONSISTENCY_LABELS[l6.classification] || l6.classification}
            </Badge>
          )}
          {l6.notes && <p className="text-sm text-muted-foreground mt-1">{l6.notes}</p>}
        </section>
      )}

      <Separator />

      {/* Layer 7 — Educational */}
      {l7 && (
        <section>
          <SectionHeader icon={GraduationCap} title="7. Aplicação Educacional" />
          {l7.didactic_summary && (
            <div className="mb-2">
              <span className="text-xs text-muted-foreground">Resumo didático:</span>
              <p className="text-sm text-foreground">{l7.didactic_summary}</p>
            </div>
          )}
          {l7.guided_reading && (
            <div className="mb-2">
              <span className="text-xs text-muted-foreground">Leitura guiada:</span>
              <p className="text-sm text-foreground">{l7.guided_reading}</p>
            </div>
          )}
          {l7.trail_level && (
            <Badge variant="outline" className="text-[10px]">Nível trilha: {l7.trail_level}</Badge>
          )}
        </section>
      )}

      {/* Score Breakdown */}
      {breakdown && (
        <>
          <Separator />
          <section>
            <SectionHeader icon={Info} title="Decomposição do Score" />
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Base metodológica: <span className="text-foreground font-medium">{breakdown.methodology_weight}</span></div>
              <div>Confiabilidade: <span className="text-foreground font-medium">+{breakdown.reliability_weight}</span></div>
              <div>Follow-up: <span className="text-foreground font-medium">+{breakdown.follow_up_weight}</span></div>
              <div>Penalidade limitações: <span className="text-foreground font-medium">-{breakdown.limitation_penalty}</span></div>
              <div className="col-span-2 border-t border-border pt-1 mt-1">
                Score final: <span className="text-foreground font-semibold">{breakdown.final_score}/100</span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
