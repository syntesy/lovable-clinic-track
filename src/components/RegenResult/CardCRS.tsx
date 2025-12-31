/**
 * CARD B — CRS (Clinical Readiness Score)
 * Exibe score de prontidão clínica
 */

import { Activity, TrendingDown, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CRSOutput } from "@/types/regen-engine";
import { RESULT_MESSAGES, CLASSIFICATION_LABELS, CONFIDENCE_LABELS } from "./types";

interface CardCRSProps {
  crs: CRSOutput | null;
  safetyBlocked?: boolean;
}

export function CardCRS({ crs, safetyBlocked = false }: CardCRSProps) {
  if (safetyBlocked) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Activity className="h-5 w-5" />
            CRS — Prontidão Clínica
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

  if (!crs) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Activity className="h-5 w-5" />
            CRS — Prontidão Clínica
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

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "Potentially Ready":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Potencialmente Preparado</Badge>;
      case "Conditionally Ready":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Condicionalmente Preparado</Badge>;
      default:
        return <Badge variant="destructive">Não Preparado</Badge>;
    }
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

  // Top 3 fatores clínicos derivados das penalties
  const topFactors = crs.penalties_applied.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            CRS — Prontidão Clínica
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {getClassificationBadge(crs.classification)}
            {getConfidenceBadge(crs.confidence)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-bold ${getScoreColor(crs.score)}`}>
            {crs.score}
          </div>
          <div className="flex-1">
            <Progress value={crs.score} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>40</span>
              <span>70</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Missing fields */}
        {crs.missing.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Dados ausentes:</p>
                <p className="text-sm text-amber-700">{crs.missing.join(", ")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Penalties / Top factors */}
        {topFactors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              Top fatores clínicos:
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
        {crs.penalties_applied.length > 3 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Ver todas as penalidades ({crs.penalties_applied.length})
            </summary>
            <ul className="mt-2 space-y-1 pl-4">
              {crs.penalties_applied.map((penalty, idx) => (
                <li key={idx} className="text-muted-foreground">{penalty}</li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
