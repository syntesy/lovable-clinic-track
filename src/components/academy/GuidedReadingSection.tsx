import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Clock, ThumbsUp, AlertTriangle, Users } from "lucide-react";

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
  };
}

export function GuidedReadingSection({ article }: GuidedReadingSectionProps) {
  const studyType = article.study_type?.toLowerCase() || "";
  
  const methodologyNotes: string[] = [];
  const strengths: string[] = [];
  
  // Methodology guidance based on study type
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

  // Follow-up note
  const hasFollowUp = article.follow_up && article.follow_up.trim().length > 0;
  
  // Check if there's enough info to show the section
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
        {/* Methodology */}
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

        {/* Follow-up */}
        {hasFollowUp && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Tempo de Follow-up
            </h4>
            <p className="text-sm text-foreground">{article.follow_up}</p>
          </div>
        )}

        {/* Strengths */}
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

        {/* Limitations */}
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

        <p className="text-[10px] text-muted-foreground italic mt-2">
          ⚕️ Guia gerado automaticamente com base nos metadados. Informações ausentes não foram preenchidas.
        </p>
      </CardContent>
    </Card>
  );
}
