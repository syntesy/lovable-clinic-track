/**
 * CARD D — BRS (Biological Readiness Score)
 * Exibe score de prontidão biológica
 */

import { Dna, AlertTriangle, TrendingDown, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BRSOutput } from "@/types/regen-engine";
import { RESULT_MESSAGES, CONFIDENCE_LABELS } from "./types";

interface CardBRSProps {
  brs: BRSOutput | null;
  safetyBlocked?: boolean;
}

export function CardBRS({ brs, safetyBlocked = false }: CardBRSProps) {
  if (safetyBlocked) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Dna className="h-5 w-5" />
            BRS — Prontidão Biológica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            {RESULT_MESSAGES.NOT_CALCULATED}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!brs) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Dna className="h-5 w-5" />
            BRS — Prontidão Biológica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            {RESULT_MESSAGES.NOT_AVAILABLE}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "High":
        return <Badge variant="outline" className="border-emerald-300 text-emerald-700">Confiança Alta</Badge>;
      case "Medium":
        return <Badge variant="outline" className="border-amber-300 text-amber-700">Confiança Média</Badge>;
      default:
        return <Badge variant="outline" className="border-red-300 text-red-700">Confiança Baixa</Badge>;
    }
  };

  // Top 3 fatores biológicos derivados das penalties
  const topFactors = brs.penalties_applied.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Dna className="h-5 w-5 text-primary" />
            BRS — Prontidão Biológica
          </CardTitle>
          {getConfidenceBadge(brs.confidence)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-bold ${getScoreColor(brs.score)}`}>
            {brs.score}
          </div>
          <div className="flex-1">
            <Progress value={brs.score} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>40</span>
              <span>70</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {brs.alerts.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Alertas:</p>
                <ul className="text-sm text-amber-700 mt-1 space-y-1">
                  {brs.alerts.map((alert, idx) => (
                    <li key={idx}>• {alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Reason codes */}
        {brs.reason_codes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {brs.reason_codes.map((code, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs font-mono">
                {code}
              </Badge>
            ))}
          </div>
        )}

        {/* Top factors */}
        {topFactors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              Top fatores biológicos:
            </p>
            <ul className="space-y-1">
              {topFactors.map((penalty, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground">{idx + 1}.</span>
                  <span>{penalty}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* All penalties if more than 3 */}
        {brs.penalties_applied.length > 3 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Ver todas as penalidades ({brs.penalties_applied.length})
            </summary>
            <ul className="mt-2 space-y-1 pl-4">
              {brs.penalties_applied.map((penalty, idx) => (
                <li key={idx} className="text-muted-foreground">{penalty}</li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
