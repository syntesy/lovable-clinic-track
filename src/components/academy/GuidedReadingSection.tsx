import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Clock, ThumbsUp, AlertTriangle, Users } from "lucide-react";
import { EvidenceMethodSeal } from "./EvidenceMethodSeal";

interface GuidedReadingSectionProps {
  article: {
    study_type: string;
    year: number;
    follow_up?: string | null;
    effect_summary?: string | null;
    limitations?: string[] | null;
    summary_short: string;
    summary_full?: string | null;
    abstract_text?: string | null;
    evidence_score?: number | null;
    curation_data?: any;
  };
}

export function GuidedReadingSection({ article }: GuidedReadingSectionProps) {
  const rem = article.curation_data?.reghen_evidence_method?.layers;
  const l2 = rem?.layer_2_methodology;
  const l3 = rem?.layer_3_reliability;
  const l5 = rem?.layer_5_limitations;
  const l7 = rem?.layer_7_educational;

  // If structured layers exist, use them
  if (rem) {
    const methodologyNotes: string[] = [];
    const strengths: string[] = [];

    const st = l2?.study_type || "";
    if (st === "meta" || st === "systematic_review") {
      methodologyNotes.push("Verifique os critérios de inclusão/exclusão dos estudos selecionados.");
      methodologyNotes.push("Observe a heterogeneidade entre os estudos (I²).");
      if (l3?.methodology_clarity) methodologyNotes.push(`Clareza metodológica classificada como: ${l3.methodology_clarity}.`);
      strengths.push("Sintetiza múltiplos estudos, aumentando o poder estatístico.");
    } else if (st === "rct") {
      if (l3?.randomized === true) strengths.push("Estudo randomizado — controle de confundidores.");
      if (l3?.blinded === true) strengths.push("Cegamento aplicado — redução de viés de aferição.");
      if (l3?.randomized === false) methodologyNotes.push("Sem randomização adequada relatada.");
      if (l3?.blinded === false) methodologyNotes.push("Sem cegamento relatado.");
      methodologyNotes.push("Confira a análise por intenção de tratar (ITT).");
    } else if (st === "cohort") {
      methodologyNotes.push("Observe o período de seguimento e as perdas de acompanhamento.");
      if (l3?.control_group === true) strengths.push("Possui grupo controle para comparação.");
    } else if (st === "animal" || st === "in_vitro") {
      methodologyNotes.push("Estudo pré-clínico. Cautela na extrapolação para humanos.");
    }

    if (l2?.follow_up_months != null) {
      methodologyNotes.push(`Follow-up de ${l2.follow_up_months} meses ${l2.follow_up_months >= 12 ? "(adequado para desfechos de longo prazo)" : "(curto para desfechos crônicos)"}.`);
    }
    if (l2?.sample_size != null) {
      methodologyNotes.push(`Tamanho amostral: n=${l2.sample_size}${l2.sample_size < 30 ? " (amostra pequena — cautela na generalização)" : ""}.`);
    }

    // Structured limitations
    const structuredLimitations = Array.isArray(l5) ? l5.map((l: any) => l.description) : [];

    // Guided reading from layer 7
    const guidedText = l7?.guided_reading;

    const hasContent = methodologyNotes.length > 0 || structuredLimitations.length > 0 || strengths.length > 0 || guidedText;
    if (!hasContent) return null;

    return (
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Como ler este estudo
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Guia educacional derivado do Reghen Evidence Method™.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {guidedText && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Orientação de Leitura
              </h4>
              <p className="text-sm text-foreground">{guidedText}</p>
            </div>
          )}

          {methodologyNotes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" /> O que observar na metodologia
              </h4>
              <ul className="space-y-1">
                {methodologyNotes.map((note, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span> {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {strengths.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> Pontos fortes
              </h4>
              <ul className="space-y-0.5">
                {strengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {structuredLimitations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Limitações importantes
              </h4>
              <ul className="space-y-0.5">
                {structuredLimitations.map((l: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-orange-500 mt-1">⚠</span> {l}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground italic">
              ⚕️ Guia derivado do Reghen Evidence Method™. Informações ausentes não foram preenchidas.
            </p>
            <EvidenceMethodSeal />
          </div>
        </CardContent>
      </Card>
    );
  }

  // === Legacy fallback (no structured layers) ===
  const studyType = article.study_type?.toLowerCase() || "";
  const methodologyNotes: string[] = [];
  const strengths: string[] = [];

  if (studyType.includes("meta") || studyType.includes("revisão sistemática") || studyType.includes("systematic")) {
    methodologyNotes.push("Verifique os critérios de inclusão/exclusão dos estudos selecionados.");
    methodologyNotes.push("Observe a heterogeneidade entre os estudos (I²).");
    methodologyNotes.push("Confira se houve análise de viés de publicação (funnel plot).");
    strengths.push("Sintetiza múltiplos estudos, aumentando o poder estatístico.");
  } else if (studyType.includes("ecr") || studyType.includes("rct") || studyType.includes("randomiz")) {
    methodologyNotes.push("Verifique se houve randomização adequada e ocultação de alocação.");
    methodologyNotes.push("Observe se o estudo foi cego (simples, duplo ou triplo-cego).");
    methodologyNotes.push("Confira a análise por intenção de tratar (ITT).");
    strengths.push("Padrão-ouro para avaliar intervenções — controle de confundidores.");
  } else if (studyType.includes("coorte") || studyType.includes("cohort")) {
    methodologyNotes.push("Observe o período de seguimento e as perdas de acompanhamento.");
    methodologyNotes.push("Verifique como os grupos de comparação foram definidos.");
    strengths.push("Permite avaliar causalidade temporal e múltiplos desfechos.");
  } else if (studyType.includes("caso-controle") || studyType.includes("case-control")) {
    methodologyNotes.push("Observe como os casos e controles foram selecionados.");
    methodologyNotes.push("Verifique possíveis vieses de memória (recall bias).");
  } else if (studyType.includes("relato") || studyType.includes("case report") || studyType.includes("série")) {
    methodologyNotes.push("Estudos descritivos: servem para gerar hipóteses, não para confirmar.");
    methodologyNotes.push("Cuidado ao generalizar a partir de poucos casos.");
  }

  const hasFollowUp = article.follow_up && article.follow_up.trim().length > 0;
  const hasContent = methodologyNotes.length > 0 || hasFollowUp || article.limitations?.length;
  if (!hasContent) return null;

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Como ler este estudo
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Guia educacional baseado nos metadados disponíveis do estudo.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {methodologyNotes.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" /> O que observar na metodologia
            </h4>
            <ul className="space-y-1">
              {methodologyNotes.map((note, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span> {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasFollowUp && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Tempo de Follow-up
            </h4>
            <p className="text-sm text-foreground">{article.follow_up}</p>
          </div>
        )}

        {strengths.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> Pontos fortes
            </h4>
            <ul className="space-y-0.5">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {article.limitations?.length ? (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Limitações importantes
            </h4>
            <ul className="space-y-0.5">
              {article.limitations.map((l, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-orange-500 mt-1">⚠</span> {l}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground italic">
            ⚕️ Guia gerado automaticamente com base nos metadados. Informações ausentes não foram preenchidas.
          </p>
          <EvidenceMethodSeal />
        </div>
      </CardContent>
    </Card>
  );
}
