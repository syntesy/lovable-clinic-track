import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Shield,
  Activity,
  Lightbulb,
  Leaf,
  Info,
} from "lucide-react";

interface LabAnalysisResult {
  summary?: string;
  by_system?: Array<{
    system: string;
    findings: string[];
    flags: string[];
  }>;
  alerts?: Array<{
    type: "safety" | "data_quality" | "clinical";
    message: string;
    severity: "low" | "medium" | "high";
  }>;
  recommendations?: string[];
  regen_notes?: string[];
  disclaimer?: string;
}

interface LabAnalysisResultsProps {
  analysis: LabAnalysisResult;
  extractionMethod?: string;
  extractionConfidence?: string;
  labsCount?: number;
}

const METHOD_BADGES: Record<string, { label: string; className: string }> = {
  PDF_TEXT: { label: "PDF Nativo", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  OCR_PDF: { label: "OCR (PDF)", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  OCR_IMAGE: { label: "OCR (Imagem)", className: "bg-sky-500/10 text-sky-700 border-sky-500/30" },
  MANUAL: { label: "Manual", className: "bg-primary/10 text-primary border-primary/30" },
};

const CONFIDENCE_BADGES: Record<string, { label: string; className: string }> = {
  high: { label: "Alta confiança", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  medium: { label: "Confiança média", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  low: { label: "Baixa confiança", className: "bg-red-500/10 text-red-700 border-red-500/30" },
};

const ALERT_ICONS: Record<string, typeof Shield> = {
  safety: Shield,
  data_quality: AlertTriangle,
  clinical: Activity,
};

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-500/10 border-red-500/30 text-red-700",
  medium: "bg-amber-500/10 border-amber-500/30 text-amber-700",
  low: "bg-sky-500/10 border-sky-500/30 text-sky-700",
};

export function LabAnalysisResults({
  analysis,
  extractionMethod,
  extractionConfidence,
  labsCount,
}: LabAnalysisResultsProps) {
  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          {extractionMethod && METHOD_BADGES[extractionMethod] && (
            <Badge variant="outline" className={METHOD_BADGES[extractionMethod].className}>
              {METHOD_BADGES[extractionMethod].label}
            </Badge>
          )}
          {extractionConfidence && CONFIDENCE_BADGES[extractionConfidence] && (
            <Badge variant="outline" className={CONFIDENCE_BADGES[extractionConfidence].className}>
              {CONFIDENCE_BADGES[extractionConfidence].label}
            </Badge>
          )}
          {labsCount !== undefined && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <FlaskConical className="w-3 h-3 mr-1" />
              {labsCount} biomarcadores
            </Badge>
          )}
        </div>

        {/* Alerts */}
        {analysis.alerts && analysis.alerts.length > 0 && (
          <div className="space-y-2">
            {analysis.alerts.map((alert, idx) => {
              const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-3 rounded-md border ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low}`}
                >
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="text-sm">{alert.message}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {analysis.summary && (
          <Card className="bg-card/95 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="w-4 h-4" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/90">{analysis.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* By System */}
        {analysis.by_system && analysis.by_system.length > 0 && (
          <Card className="bg-card/95 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Análise por Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.by_system.map((sys, idx) => (
                <div key={idx}>
                  {idx > 0 && <Separator className="mb-3" />}
                  <h4 className="text-sm font-semibold text-primary mb-1">{sys.system}</h4>
                  {sys.findings.length > 0 && (
                    <ul className="space-y-1 mb-1">
                      {sys.findings.map((f, fi) => (
                        <li key={fi} className="text-sm flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {sys.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sys.flags.map((flag, fi) => (
                        <Badge key={fi} variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/30">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <Card className="bg-card/95 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Regen Notes */}
        {analysis.regen_notes && analysis.regen_notes.length > 0 && (
          <Card className="bg-card/95 border-emerald-500/30 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700">
                <Leaf className="w-4 h-4" />
                Notas para Prática Regenerativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {analysis.regen_notes.map((note, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        {analysis.disclaimer && (
          <p className="text-xs text-muted-foreground italic px-1">{analysis.disclaimer}</p>
        )}
      </div>
    </ScrollArea>
  );
}
