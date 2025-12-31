/**
 * CARD C — DIE (Diagnostic Intelligence Engine)
 * Exibe recomendações de exames laboratoriais
 */

import { TestTube2, Check, RefreshCw, FileQuestion, Calendar, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DIEOutput, LabRecommendation } from "@/types/regen-engine";
import { RESULT_MESSAGES, LAB_STATUS_LABELS, LAB_VALIDITY_LABELS } from "./types";

interface CardDIEProps {
  die: DIEOutput | null;
  safetyBlocked?: boolean;
}

function LabItem({ lab }: { lab: LabRecommendation }) {
  const getStatusIcon = () => {
    switch (lab.status) {
      case "USE":
        return <Check className="h-4 w-4 text-emerald-600" />;
      case "REPEAT":
        return <RefreshCw className="h-4 w-4 text-amber-600" />;
      case "REQUEST":
        return <FileQuestion className="h-4 w-4 text-blue-600" />;
    }
  };

  const getValidityBadge = () => {
    switch (lab.validity) {
      case "VALID":
        return <Badge className="bg-emerald-100 text-emerald-700 text-xs">{LAB_VALIDITY_LABELS.VALID}</Badge>;
      case "CAUTION":
        return <Badge className="bg-amber-100 text-amber-700 text-xs">{LAB_VALIDITY_LABELS.CAUTION}</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive" className="text-xs">{LAB_VALIDITY_LABELS.EXPIRED}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{LAB_VALIDITY_LABELS.UNKNOWN}</Badge>;
    }
  };

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="shrink-0 mt-0.5">{getStatusIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{lab.lab_name}</span>
          {getValidityBadge()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          <span className="font-mono">{lab.lab_code}</span>
          {lab.reason_code && (
            <span className="ml-2">• {lab.reason_code}</span>
          )}
        </div>
        {lab.rationale_short && (
          <p className="text-xs text-muted-foreground mt-1">{lab.rationale_short}</p>
        )}
        {lab.days_since_collection != null && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            <span>{lab.days_since_collection} dias desde coleta</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CardDIE({ die, safetyBlocked = false }: CardDIEProps) {
  if (safetyBlocked) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <TestTube2 className="h-5 w-5" />
            DIE — Exames Laboratoriais
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

  if (!die) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <TestTube2 className="h-5 w-5" />
            DIE — Exames Laboratoriais
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

  const useLabs = die.lab_recommendations.filter(l => l.status === "USE");
  const repeatLabs = die.lab_recommendations.filter(l => l.status === "REPEAT");
  const requestLabs = die.lab_recommendations.filter(l => l.status === "REQUEST");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TestTube2 className="h-5 w-5 text-primary" />
            DIE — Exames Laboratoriais
          </CardTitle>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-emerald-50">
              Válidos: {die.labs_valid_count}
            </Badge>
            <Badge variant="outline" className="bg-amber-50">
              Expirados: {die.labs_expired_count}
            </Badge>
            <Badge variant="outline" className="bg-blue-50">
              Ausentes: {die.labs_missing_count}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {/* USAR */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-sm text-emerald-700">USAR</span>
              <Badge variant="outline" className="ml-auto text-xs">{useLabs.length}</Badge>
            </div>
            {useLabs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-2">Nenhum</p>
            ) : (
              <div className="space-y-1">
                {useLabs.map((lab, idx) => (
                  <LabItem key={idx} lab={lab} />
                ))}
              </div>
            )}
          </div>

          {/* REPETIR */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b">
              <RefreshCw className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-sm text-amber-700">REPETIR</span>
              <Badge variant="outline" className="ml-auto text-xs">{repeatLabs.length}</Badge>
            </div>
            {repeatLabs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-2">Nenhum</p>
            ) : (
              <div className="space-y-1">
                {repeatLabs.map((lab, idx) => (
                  <LabItem key={idx} lab={lab} />
                ))}
              </div>
            )}
          </div>

          {/* SOLICITAR */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b">
              <FileQuestion className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-700">SOLICITAR</span>
              <Badge variant="outline" className="ml-auto text-xs">{requestLabs.length}</Badge>
            </div>
            {requestLabs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-2">Nenhum</p>
            ) : (
              <div className="space-y-1">
                {requestLabs.map((lab, idx) => (
                  <LabItem key={idx} lab={lab} />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
