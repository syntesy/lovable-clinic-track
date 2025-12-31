/**
 * CARD A — SAFETY
 * Exibe status de segurança do motor REGENAPP
 */

import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SafetyOutput } from "@/types/regen-engine";
import { RESULT_MESSAGES } from "./types";

interface CardSafetyProps {
  safety: SafetyOutput;
  onReviewTriage?: () => void;
  onReferEvaluation?: () => void;
}

export function CardSafety({ safety, onReviewTriage, onReferEvaluation }: CardSafetyProps) {
  const getStatusConfig = () => {
    if (safety.block) {
      return {
        status: "Bloqueado",
        icon: ShieldOff,
        variant: "destructive" as const,
        bgColor: "bg-destructive/10",
        borderColor: "border-destructive/30",
      };
    }
    if (safety.alert) {
      return {
        status: "Alerta",
        icon: ShieldAlert,
        variant: "secondary" as const,
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      };
    }
    return {
      status: "OK",
      icon: ShieldCheck,
      variant: "outline" as const,
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Segurança
          </CardTitle>
          <Badge variant={config.variant}>{config.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reasons */}
        {safety.reasons.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Motivos:</p>
            <ul className="space-y-1">
              {safety.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Block message */}
        {safety.block && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <p className="text-sm text-destructive font-medium">
              {RESULT_MESSAGES.SAFETY_BLOCK}
            </p>
          </div>
        )}

        {/* CTAs */}
        {safety.block && (
          <div className="flex flex-wrap gap-2 pt-2">
            {onReviewTriage && (
              <Button variant="outline" size="sm" onClick={onReviewTriage}>
                Revisar Triagem
              </Button>
            )}
            {onReferEvaluation && (
              <Button variant="outline" size="sm" onClick={onReferEvaluation}>
                Encaminhar para Avaliação
              </Button>
            )}
          </div>
        )}

        {/* OK state */}
        {!safety.block && !safety.alert && safety.reasons.length === 0 && (
          <p className="text-sm text-emerald-700">
            Nenhuma contraindicação de segurança identificada.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
