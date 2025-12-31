/**
 * CARD F — PEE (Procedure Eligibility Engine)
 * Exibe elegibilidade para procedimentos
 */

import { Target, CheckCircle, AlertCircle, XCircle, HelpCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PEEOutput, BRSOutput, ProcedureEligibility } from "@/types/regen-engine";
import { RESULT_MESSAGES, CLASSIFICATION_LABELS } from "./types";

interface CardPEEProps {
  pee: PEEOutput | null;
  brs: BRSOutput | null;
  safetyBlocked?: boolean;
}

function EligibilityIcon({ eligibility }: { eligibility: string }) {
  switch (eligibility) {
    case "Recommended":
      return <CheckCircle className="h-5 w-5 text-emerald-600" />;
    case "Possible with adjustments":
      return <AlertCircle className="h-5 w-5 text-amber-600" />;
    case "Not recommended":
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  }
}

function EligibilityBadge({ eligibility }: { eligibility: string }) {
  switch (eligibility) {
    case "Recommended":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Recomendado</Badge>;
    case "Possible with adjustments":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Possível com ajustes</Badge>;
    case "Not recommended":
      return <Badge variant="destructive">Não recomendado</Badge>;
    default:
      return <Badge variant="outline">Não avaliável</Badge>;
  }
}

export function CardPEE({ pee, brs, safetyBlocked = false }: CardPEEProps) {
  if (safetyBlocked) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Target className="h-5 w-5" />
            PEE — Elegibilidade
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

  if (!pee || pee.eligibility.length === 0) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Target className="h-5 w-5" />
            PEE — Elegibilidade
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

  const isLowConfidence = brs?.confidence === "Low";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          PEE — Elegibilidade para Procedimentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Low confidence warning */}
        {isLowConfidence && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {RESULT_MESSAGES.LOW_CONFIDENCE}
              </p>
            </div>
          </div>
        )}

        {/* Eligibility table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">Procedimento</TableHead>
                <TableHead className="font-medium">Elegibilidade</TableHead>
                <TableHead className="font-medium">Gates Acionados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pee.eligibility.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <EligibilityIcon eligibility={item.eligibility} />
                      <span>{item.procedure_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <EligibilityBadge eligibility={item.eligibility} />
                  </TableCell>
                  <TableCell>
                    {item.gates_triggered.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.gates_triggered.map((gate, gIdx) => (
                          <Badge key={gIdx} variant="outline" className="text-xs font-mono">
                            {gate}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mandatory disclaimer */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground font-medium">
              {RESULT_MESSAGES.NO_PRESCRIPTION}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
