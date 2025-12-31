/**
 * CARD G — DATA QUALITY
 * Exibe qualidade e completude dos dados
 */

import { Database, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataQualityOutput } from "@/types/regen-engine";
import { RESULT_MESSAGES } from "./types";

interface CardDataQualityProps {
  dataQuality: DataQualityOutput;
}

export function CardDataQuality({ dataQuality }: CardDataQualityProps) {
  const { alerts, completeness_percent } = dataQuality;

  const getCompletenessColor = (percent: number) => {
    if (percent >= 80) return "text-emerald-600";
    if (percent >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getCompletenessStatus = (percent: number) => {
    if (percent >= 80) return { label: "Bom", variant: "outline" as const, className: "border-emerald-300 text-emerald-700" };
    if (percent >= 50) return { label: "Parcial", variant: "outline" as const, className: "border-amber-300 text-amber-700" };
    return { label: "Insuficiente", variant: "destructive" as const, className: "" };
  };

  const status = getCompletenessStatus(completeness_percent);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Qualidade dos Dados
          </CardTitle>
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completeness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Completude</span>
            <span className={`text-lg font-bold ${getCompletenessColor(completeness_percent)}`}>
              {completeness_percent}%
            </span>
          </div>
          <Progress value={completeness_percent} className="h-2" />
        </div>

        {/* Low completeness warning */}
        {completeness_percent < 80 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {RESULT_MESSAGES.INCOMPLETE_DATA}
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Alertas de qualidade:</p>
            <ul className="space-y-1">
              {alerts.map((alert, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Good state */}
        {completeness_percent >= 80 && alerts.length === 0 && (
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Dados completos e sem alertas de qualidade.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
