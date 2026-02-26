import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, ThumbsUp, AlertTriangle, Beaker, Stethoscope } from "lucide-react";
import { EvidenceMethodSeal } from "./EvidenceMethodSeal";

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
  tags?: string[];
}

interface GuidedReadingSectionProps {
  curationJson: CurationJson | null;
  remLayers?: any;
  paperTitle?: string;
}

function MissingField({ field }: { field: string }) {
  return (
    <p className="text-xs text-orange-400 italic flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />
      Campo "{field}" não estruturado na curadoria.
    </p>
  );
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

  const c = curationJson;

  // Build methodology observations from risco_vies + justificativa
  const methodNotes: string[] = [];
  if (c.justificativa_risco_vies) {
    methodNotes.push(c.justificativa_risco_vies);
  }
  
  // Add study-type specific guidance
  const st = (c.tipo_estudo || "").toLowerCase();
  if (st.includes("rct") || st.includes("ecr") || st.includes("randomiz")) {
    methodNotes.push("Confira se houve análise por intenção de tratar (ITT).");
    if (c.tamanho_amostra_total != null && c.tamanho_amostra_total < 50) {
      methodNotes.push(`Amostra pequena (n=${c.tamanho_amostra_total}) — cautela na generalização.`);
    }
  } else if (st.includes("meta") || st.includes("sistem")) {
    methodNotes.push("Verifique os critérios de inclusão/exclusão dos estudos selecionados.");
    methodNotes.push("Observe a heterogeneidade entre os estudos (I²).");
  } else if (st.includes("coorte") || st.includes("cohort")) {
    methodNotes.push("Observe o período de seguimento e as perdas de acompanhamento.");
  }

  if (c.follow_up_medio) {
    methodNotes.push(`Follow-up reportado: ${c.follow_up_medio}.`);
  }

  // Strengths derived from data
  const strengths: string[] = [];
  if (c.risco_vies === "baixo") strengths.push("Baixo risco de viés identificado.");
  if (c.score_metodologico != null && c.score_metodologico >= 7) strengths.push(`Score metodológico elevado (${c.score_metodologico}/10).`);
  if (c.tamanho_amostra_total != null && c.tamanho_amostra_total >= 100) strengths.push(`Amostra robusta (n=${c.tamanho_amostra_total}).`);
  if (c.significancia_estatistica) strengths.push(`Significância: ${c.significancia_estatistica}`);

  // Outcomes
  const allOutcomes = [
    ...(c.desfechos_primarios || []).map(d => ({ name: d, type: "Primário" })),
    ...(c.desfechos_secundarios || []).map(d => ({ name: d, type: "Secundário" })),
  ];

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Como ler este estudo
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Guia educacional derivado da curadoria científica estruturada.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. What this study tests - PICO */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" /> O que este estudo testa
          </h4>
          <div className="space-y-1 text-sm">
            {c.intervencao ? (
              <p><span className="text-muted-foreground">Intervenção:</span> <span className="text-foreground">{c.intervencao}</span></p>
            ) : <MissingField field="intervencao" />}
            {c.comparador ? (
              <p><span className="text-muted-foreground">Comparador:</span> <span className="text-foreground">{c.comparador}</span></p>
            ) : <MissingField field="comparador" />}
            {c.tamanho_amostra_total != null && c.tamanho_amostra_total > 0 && (
              <p><span className="text-muted-foreground">Amostra:</span> <span className="text-foreground">n={c.tamanho_amostra_total}</span></p>
            )}
          </div>
        </div>

        {/* 2. How to interpret */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Beaker className="w-3 h-3" /> Como interpretar este estudo
          </h4>
          <div className="flex flex-wrap gap-2 mb-1">
            {c.tipo_estudo && <Badge variant="secondary" className="text-xs">{c.tipo_estudo}</Badge>}
            {c.nivel_evidencia && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                Nível {c.nivel_evidencia}
              </Badge>
            )}
            {c.risco_vies && (
              <Badge variant="outline" className={`text-xs ${
                c.risco_vies === "baixo" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                c.risco_vies === "moderado" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
                "bg-red-500/10 text-red-400 border-red-500/30"
              }`}>
                Viés: {c.risco_vies}
              </Badge>
            )}
            {c.score_metodologico != null && (
              <Badge variant="outline" className="text-xs">
                Score: {c.score_metodologico}/10
              </Badge>
            )}
          </div>
        </div>

        {/* 3. Methodology observations */}
        {methodNotes.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" /> O que observar na metodologia
            </h4>
            <ul className="space-y-1">
              {methodNotes.map((note, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span> {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Main results */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> Principais resultados
          </h4>
          {c.resultados_principais ? (
            <p className="text-sm text-foreground">{c.resultados_principais}</p>
          ) : <MissingField field="resultados_principais" />}

          {allOutcomes.length > 0 && (
            <div className="mt-2 space-y-1">
              {allOutcomes.map((o, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-[10px] shrink-0">{o.type}</Badge>
                  <span className="text-foreground">{o.name}</span>
                </div>
              ))}
            </div>
          )}
          {allOutcomes.length === 0 && <MissingField field="desfechos" />}
        </div>

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

        {/* 5. Clinical applicability */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Stethoscope className="w-3 h-3" /> Aplicabilidade clínica
          </h4>
          {c.aplicabilidade_clinica ? (
            <p className="text-sm text-foreground">{c.aplicabilidade_clinica}</p>
          ) : <MissingField field="aplicabilidade_clinica" />}
          {c.conclusao_pratica && (
            <p className="text-sm text-foreground mt-1 font-medium">{c.conclusao_pratica}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground italic">
            ⚕️ Guia derivado da curadoria científica estruturada. Informações ausentes não foram preenchidas.
          </p>
          <EvidenceMethodSeal />
        </div>
      </CardContent>
    </Card>
  );
}
