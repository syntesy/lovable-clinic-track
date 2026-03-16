import { useEffect, useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FlaskConical,
  Loader2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import type { ManualBloodTests } from "./BloodTestsManualCard";

// ─────────────────────────────────────────────────────────────────────────────
// Re-use the same pre-PRP reference ranges (single source of truth)
// ─────────────────────────────────────────────────────────────────────────────

type MarkerStatus = "ideal" | "borderline" | "altered" | "critical" | "missing";

interface MarkerEval {
  label: string;
  value: number | null | undefined;
  unit: string;
  status: MarkerStatus;
  message: string | null;
  points: number;
  maxPoints: number;
}

function evalMarker(
  label: string,
  unit: string,
  value: number | null | undefined,
  fn: (v: number) => { status: MarkerStatus; message: string | null; points: number; maxPoints: number }
): MarkerEval {
  if (value == null) return { label, value, unit, status: "missing", message: null, points: 0, maxPoints: 0 };
  const r = fn(value);
  return { label, value, unit, ...r };
}

function evalAll(labs: ManualBloodTests): MarkerEval[] {
  return [
    evalMarker("Plaquetas", "x10³/µL", labs.platelets, (v) => {
      if (v >= 200) return { status: "ideal", message: null, points: 20, maxPoints: 20 };
      if (v >= 150) return { status: "borderline", message: "150–199: limítrofe", points: 13, maxPoints: 20 };
      if (v >= 100) return { status: "altered", message: "100–149: subótimo para PRP", points: 5, maxPoints: 20 };
      if (v >= 80)  return { status: "altered", message: "<150: concentrado comprometido", points: 1, maxPoints: 20 };
      return { status: "critical", message: "<80: contraindicação — BLOQUEIO", points: 0, maxPoints: 20 };
    }),
    evalMarker("Hemoglobina", "g/dL", labs.hemoglobin, (v) => {
      if (v >= 12)  return { status: "ideal", message: null, points: 12, maxPoints: 12 };
      if (v >= 10)  return { status: "borderline", message: "10–11.9: qualidade plasmática reduzida", points: 7, maxPoints: 12 };
      if (v >= 8)   return { status: "altered", message: "8–9.9: anemia moderada", points: 2, maxPoints: 12 };
      return { status: "critical", message: "<8: anemia grave — BLOQUEIO", points: 0, maxPoints: 12 };
    }),
    evalMarker("Leucócitos", "x10³/µL", labs.leukocytes, (v) => {
      if (v >= 4 && v <= 10) return { status: "ideal", message: null, points: 10, maxPoints: 10 };
      if (v > 10 && v <= 12) return { status: "borderline", message: "10–12: leucocitose leve", points: 6, maxPoints: 10 };
      if (v > 12)            return { status: "critical", message: ">12: investigar infecção ativa — BLOQUEIO", points: 0, maxPoints: 10 };
      return { status: "borderline", message: "<4: leucopenia — atenção imunológica", points: 5, maxPoints: 10 };
    }),
    evalMarker("Hematócrito", "%", labs.hematocrit, (v) => {
      if (v >= 35) return { status: "ideal", message: null, points: 8, maxPoints: 8 };
      if (v >= 30) return { status: "borderline", message: "30–34%: limítrofe", points: 5, maxPoints: 8 };
      return { status: "altered", message: "<30%: baixo", points: 1, maxPoints: 8 };
    }),
    evalMarker("PCR", "mg/L", labs.crp, (v) => {
      if (v < 3)   return { status: "ideal", message: null, points: 18, maxPoints: 18 };
      if (v <= 10) return { status: "borderline", message: "3–10: inflamação subclínica", points: 10, maxPoints: 18 };
      return { status: "altered", message: ">10: inflamação ativa — otimizar antes do PRP", points: 2, maxPoints: 18 };
    }),
    evalMarker("Ferritina", "ng/mL", labs.ferritin, (v) => {
      if (v >= 50) return { status: "ideal", message: null, points: 15, maxPoints: 15 };
      if (v >= 30) return { status: "borderline", message: "30–49: reposição de ferro recomendada", points: 9, maxPoints: 15 };
      if (v >= 12) return { status: "altered", message: "12–29: deficiência de ferro", points: 4, maxPoints: 15 };
      return { status: "critical", message: "<12: depleção grave de ferro — BLOQUEIO", points: 0, maxPoints: 15 };
    }),
    evalMarker("Glicemia", "mg/dL", labs.glucose, (v) => {
      if (v < 100)  return { status: "ideal", message: null, points: 10, maxPoints: 10 };
      if (v <= 125) return { status: "borderline", message: "100–125: pré-diabetes", points: 6, maxPoints: 10 };
      return { status: "altered", message: "≥126: hiperglicemia — controle necessário", points: 2, maxPoints: 10 };
    }),
    evalMarker("Vitamina D", "ng/mL", labs.vitamin_d, (v) => {
      if (v >= 40) return { status: "ideal", message: null, points: 15, maxPoints: 15 };
      if (v >= 30) return { status: "borderline", message: "30–39: suplementação recomendada", points: 9, maxPoints: 15 };
      if (v >= 20) return { status: "altered", message: "20–29: insuficiência — impacto regenerativo", points: 4, maxPoints: 15 };
      return { status: "critical", message: "<20: deficiência grave — BLOQUEIO", points: 0, maxPoints: 15 };
    }),
  ];
}

type AptitudeCategory = "APTO" | "ATENCAO" | "BLOQUEIO" | "SEM_DADOS";

interface AptitudeResult {
  category: AptitudeCategory;
  score: number;
  nsaidPenalty: number;
  finalScore: number;
  markers: MarkerEval[];
  blocks: string[];
  attentions: string[];
  filled: number; // how many markers have values
}

function computeAptitude(labs: ManualBloodTests, nsaidTimeBucket: string): AptitudeResult {
  const markers = evalAll(labs);
  const filled = markers.filter((m) => m.status !== "missing").length;

  if (filled === 0) {
    return { category: "SEM_DADOS", score: 0, nsaidPenalty: 0, finalScore: 0, markers, blocks: [], attentions: [], filled };
  }

  const enteredMarkers = markers.filter((m) => m.status !== "missing");
  const raw = enteredMarkers.reduce((s, m) => s + m.points, 0);
  const maxPossible = enteredMarkers.reduce((s, m) => s + m.maxPoints, 0);
  const score = maxPossible > 0 ? Math.round((raw / maxPossible) * 100) : 0;

  const blocks: string[] = [];
  const attentions: string[] = [];

  for (const m of enteredMarkers) {
    if (m.status === "critical" && m.message) blocks.push(`${m.label}: ${m.message}`);
    else if ((m.status === "borderline" || m.status === "altered") && m.message) attentions.push(`${m.label}: ${m.message}`);
  }

  // NSAID
  let nsaidPenalty = 0;
  if (nsaidTimeBucket === "< 7 dias") {
    nsaidPenalty = 20;
    blocks.push("AINEs: uso há <7 dias — janela crítica para PRP");
  } else if (nsaidTimeBucket === "7-15 dias") {
    nsaidPenalty = 10;
    attentions.push("AINEs: uso há 7–15 dias — risco de inibição plaquetária");
  } else if (nsaidTimeBucket === "15-30 dias" || nsaidTimeBucket === "< 1 mês") {
    nsaidPenalty = 4;
    attentions.push("AINEs: uso há <1 mês — monitorar função plaquetária");
  }

  const finalScore = Math.max(0, score - nsaidPenalty);

  // Ideal environment logic
  const isIdeal =
    blocks.length === 0 &&
    (labs.platelets == null || labs.platelets >= 200) &&
    (labs.crp == null || labs.crp < 3) &&
    (labs.ferritin == null || labs.ferritin >= 50) &&
    (labs.vitamin_d == null || labs.vitamin_d >= 40) &&
    (labs.glucose == null || labs.glucose < 100);

  const category: AptitudeCategory =
    blocks.length > 0 ? "BLOQUEIO" : isIdeal ? "APTO" : "ATENCAO";

  return { category, score, nsaidPenalty, finalScore, markers, blocks, attentions, filled };
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual config
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_CFG = {
  APTO: {
    label: "Apto para Procedimento Ortobiológico",
    sublabel: "Ambiente biológico favorável — condições ideais para PRP/terapia regenerativa",
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-400",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: CheckCircle,
    scoreColor: "text-green-700 dark:text-green-400",
  },
  ATENCAO: {
    label: "Apto com Atenção",
    sublabel: "Proceder com cautela — otimizar os fatores listados antes ou durante o tratamento",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-700 dark:text-yellow-400",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: AlertTriangle,
    scoreColor: "text-yellow-700 dark:text-yellow-400",
  },
  BLOQUEIO: {
    label: "Bloqueio Temporário",
    sublabel: "Adiar o procedimento até resolução dos bloqueios identificados",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: XCircle,
    scoreColor: "text-red-700 dark:text-red-400",
  },
  SEM_DADOS: {
    label: "Exames não preenchidos",
    sublabel: "Preencha os exames de sangue acima para obter a avaliação de aptidão",
    bg: "bg-muted/30",
    border: "border-border",
    text: "text-muted-foreground",
    badge: "",
    icon: FlaskConical,
    scoreColor: "text-muted-foreground",
  },
} as const;

const MARKER_DOT: Record<MarkerStatus, string> = {
  ideal: "bg-green-500",
  borderline: "bg-yellow-500",
  altered: "bg-orange-500",
  critical: "bg-red-500",
  missing: "bg-muted-foreground/30",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  attendanceId: string;
  nsaidTimeBucket?: string;
}

export function OrtobiologicAptitudeCard({ attendanceId, nsaidTimeBucket = "" }: Props) {
  const [labs, setLabs] = useState<ManualBloodTests | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("attendance_sessions")
      .select("manual_blood_tests")
      .eq("id", attendanceId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setLabs((data?.manual_blood_tests as ManualBloodTests) ?? null);
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [attendanceId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Calculando aptidão...</span>
        </CardContent>
      </Card>
    );
  }

  const result = computeAptitude(labs ?? {}, nsaidTimeBucket);
  const cfg = CATEGORY_CFG[result.category];
  const Icon = cfg.icon;

  const enteredMarkers = result.markers.filter((m) => m.status !== "missing");

  return (
    <Card className={cn("border-2", cfg.border)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-primary" />
          Score REGHEN — Aptidão para Ortobiológicos
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Main status banner ── */}
        <div className={cn("rounded-lg border p-4", cfg.bg, cfg.border)}>
          <div className="flex items-start gap-3">
            <Icon className={cn("w-6 h-6 mt-0.5 flex-shrink-0", cfg.text)} />
            <div className="flex-1 min-w-0">
              <p className={cn("font-bold text-base", cfg.text)}>{cfg.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cfg.sublabel}</p>
            </div>
            {result.category !== "SEM_DADOS" && (
              <div className="text-right flex-shrink-0">
                <p className={cn("text-4xl font-bold tabular-nums leading-none", cfg.scoreColor)}>
                  {result.finalScore}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">/ 100</p>
              </div>
            )}
          </div>

          {result.nsaidPenalty > 0 && result.category !== "SEM_DADOS" && (
            <p className="text-[11px] text-muted-foreground mt-2 border-t border-current/10 pt-2">
              Pontuação laboratorial: {result.score}/100 · Penalidade AINEs: −{result.nsaidPenalty} pts
            </p>
          )}
        </div>

        {/* ── Bloqueios ── */}
        {result.blocks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
              Bloqueios Identificados
            </p>
            <ul className="space-y-1">
              {result.blocks.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded px-2.5 py-1.5 text-red-800 dark:text-red-300">
                  <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Atenções ── */}
        {result.attentions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
              Pontos de Atenção / Otimização
            </p>
            <ul className="space-y-1">
              {result.attentions.map((a) => (
                <li key={a} className="flex items-start gap-2 text-xs bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded px-2.5 py-1.5 text-yellow-800 dark:text-yellow-300">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Per-marker grid ── */}
        {enteredMarkers.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Perfil Laboratorial ({enteredMarkers.length} marcador{enteredMarkers.length > 1 ? "es" : ""} avaliado{enteredMarkers.length > 1 ? "s" : ""})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {enteredMarkers.map((m) => (
                  <div
                    key={m.label}
                    className={cn(
                      "rounded border px-2.5 py-2 text-xs",
                      m.status === "ideal"      && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20",
                      m.status === "borderline" && "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20",
                      m.status === "altered"    && "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20",
                      m.status === "critical"   && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
                    )}
                  >
                    <p className="text-muted-foreground truncate">{m.label}</p>
                    <p className="font-bold mt-0.5">
                      {m.value} <span className="font-normal text-[10px] text-muted-foreground">{m.unit}</span>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", MARKER_DOT[m.status])} />
                      <span className={cn(
                        "text-[10px] font-medium capitalize",
                        m.status === "ideal"      && "text-green-700 dark:text-green-400",
                        m.status === "borderline" && "text-yellow-700 dark:text-yellow-400",
                        m.status === "altered"    && "text-orange-700 dark:text-orange-400",
                        m.status === "critical"   && "text-red-700 dark:text-red-400",
                      )}>
                        {m.status === "ideal" ? "Ideal" : m.status === "borderline" ? "Limítrofe" : m.status === "altered" ? "Alterado" : "Crítico"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {result.category === "SEM_DADOS" && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Preencha os exames de sangue no card acima para ativar a avaliação de aptidão REGHEN.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
