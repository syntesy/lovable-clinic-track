import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Save, FlaskConical, CheckCircle, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ManualBloodTests {
  platelets?: number | null;    // x10³/µL
  hemoglobin?: number | null;   // g/dL
  leukocytes?: number | null;   // x10³/µL
  hematocrit?: number | null;   // %
  crp?: number | null;          // mg/L
  ferritin?: number | null;     // ng/mL
  glucose?: number | null;      // mg/dL
  vitamin_d?: number | null;    // ng/mL (25-OH)
  collected_at?: string | null;
}

type MarkerStatus = "ideal" | "borderline" | "altered" | "critical" | "empty";

interface MarkerResult {
  status: MarkerStatus;
  message: string | null;
  points: number;
  maxPoints: number;
}

type OverallCategory = "IDEAL" | "ATENCAO" | "BLOQUEIO";

interface BloodViabilityScore {
  raw: number;
  nsaid_penalty: number;
  final: number;
  category: OverallCategory;
  markers: Record<keyof Omit<ManualBloodTests, "collected_at">, MarkerResult>;
  blocks: string[];
  attentions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-PRP reference ranges (regenerative therapy specific)
// ─────────────────────────────────────────────────────────────────────────────

function evalPlatelets(v: number | null | undefined): MarkerResult {
  if (v == null) return { status: "empty", message: null, points: 0, maxPoints: 20 };
  if (v >= 200)  return { status: "ideal",     message: null,                                         points: 20, maxPoints: 20 };
  if (v >= 150)  return { status: "borderline", message: "Plaquetas limítrofes (150–199)",            points: 13, maxPoints: 20 };
  if (v >= 100)  return { status: "altered",    message: "Plaquetas baixas (100–149) — subótimo para PRP", points: 5, maxPoints: 20 };
  if (v >= 80)   return { status: "altered",    message: "Plaquetas muito baixas — concentrado comprometido", points: 1, maxPoints: 20 };
  return           { status: "critical",   message: "Plaquetas <80 — BLOQUEIO: PRP contraindicado",  points: 0, maxPoints: 20 };
}

function evalHemoglobin(v: number | null | undefined): MarkerResult {
  if (v == null) return { status: "empty", message: null, points: 0, maxPoints: 12 };
  if (v >= 12)   return { status: "ideal",     message: null,                                       points: 12, maxPoints: 12 };
  if (v >= 10)   return { status: "borderline", message: "Hemoglobina limítrofe (10–11.9)",         points: 7,  maxPoints: 12 };
  if (v >= 8)    return { status: "altered",    message: "Anemia moderada — qualidade do plasma reduzida", points: 2, maxPoints: 12 };
  return           { status: "critical",   message: "Hemoglobina <8 — BLOQUEIO: anemia grave",     points: 0, maxPoints: 12 };
}

function evalLeukocytes(v: number | null | undefined, crp: number | null | undefined): MarkerResult {
  if (v == null) return { status: "empty", message: null, points: 0, maxPoints: 10 };
  if (v >= 4 && v <= 10) return { status: "ideal", message: null, points: 10, maxPoints: 10 };
  if (v > 10 && v <= 12) return { status: "borderline", message: "Leucocitose leve (10–12) — monitorar", points: 6, maxPoints: 10 };
  if (v > 12) {
    const crpRaised = crp != null && crp > 3;
    return {
      status: "critical",
      message: crpRaised
        ? "Leucocitose >12 + PCR elevada — BLOQUEIO: possível infecção ativa"
        : "Leucocitose >12 — investigar antes de proceder",
      points: 0,
      maxPoints: 10,
    };
  }
  return { status: "borderline", message: "Leucopenia leve — atenção imunológica", points: 5, maxPoints: 10 };
}

function evalHematocrit(v: number | null | undefined): MarkerResult {
  if (v == null) return { status: "empty", message: null, points: 0, maxPoints: 8 };
  if (v >= 35)   return { status: "ideal",     message: null,                             points: 8, maxPoints: 8 };
  if (v >= 30)   return { status: "borderline", message: "Hematócrito limítrofe (30–34%)", points: 5, maxPoints: 8 };
  return           { status: "altered",    message: "Hematócrito <30% — anemia relativa", points: 1, maxPoints: 8 };
}

function evalCrp(v: number | null | undefined): MarkerResult {
  if (v == null) return { status: "empty", message: null, points: 0, maxPoints: 18 };
  if (v < 3)     return { status: "ideal",     message: null,                                    points: 18, maxPoints: 18 };
  if (v <= 10)   return { status: "borderline", message: "PCR elevada (3–10) — inflamação subclínica", points: 10, maxPoints: 18 };
  return           { status: "altered",    message: "PCR >10 — inflamação ativa, verificar causa antes de PRP", points: 2, maxPoints: 18 };
}

function evalFerritin(v: number | null | undefined): MarkerResult {
  if (v == null) return { status: "empty", message: null, points: 0, maxPoints: 15 };
  if (v >= 50)   return { status: "ideal",     message: null,                                      points: 15, maxPoints: 15 };
  if (v >= 30)   return { status: "borderline", message: "Ferritina limítrofe (30–49) — otimizar ferro", points: 9, maxPoints: 15 };
  if (v >= 12)   return { status: "altered",    message: "Ferritina baixa (12–29) — deficiência de ferro", points: 4, maxPoints: 15 };
  return           { status: "critical",   message: "Ferritina <12 — BLOQUEIO: deplete de ferro grave", points: 0, maxPoints: 15 };
}

function evalGlucose(v: number | null | undefined): MarkerResult {
  if (v == null)  return { status: "empty",     message: null,                                              points: 0,  maxPoints: 10 };
  if (v < 100)    return { status: "ideal",     message: null,                                              points: 10, maxPoints: 10 };
  if (v <= 125)   return { status: "borderline", message: "Glicemia limítrofe (100–125) — pré-diabetes",   points: 6,  maxPoints: 10 };
  return            { status: "altered",    message: "Hiperglicemia ≥126 — controle glicêmico necessário", points: 2,  maxPoints: 10 };
}

function evalVitaminD(v: number | null | undefined): MarkerResult {
  if (v == null) return { status: "empty", message: null, points: 0, maxPoints: 15 };
  if (v >= 40)   return { status: "ideal",     message: null,                                      points: 15, maxPoints: 15 };
  if (v >= 30)   return { status: "borderline", message: "Vitamina D limítrofe (30–39) — suplementar", points: 9, maxPoints: 15 };
  if (v >= 20)   return { status: "altered",    message: "Vitamina D insuficiente (20–29) — comprometimento regenerativo", points: 4, maxPoints: 15 };
  return           { status: "critical",   message: "Vitamina D <20 — BLOQUEIO: deficiência grave", points: 0, maxPoints: 15 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Score computation
// ─────────────────────────────────────────────────────────────────────────────

function computeBloodViabilityScore(labs: ManualBloodTests, nsaidTimeBucket: string): BloodViabilityScore {
  const markers = {
    platelets:  evalPlatelets(labs.platelets),
    hemoglobin: evalHemoglobin(labs.hemoglobin),
    leukocytes: evalLeukocytes(labs.leukocytes, labs.crp),
    hematocrit: evalHematocrit(labs.hematocrit),
    crp:        evalCrp(labs.crp),
    ferritin:   evalFerritin(labs.ferritin),
    glucose:    evalGlucose(labs.glucose),
    vitamin_d:  evalVitaminD(labs.vitamin_d),
  } as Record<keyof Omit<ManualBloodTests, "collected_at">, MarkerResult>;

  // Only score markers that were actually entered
  const enteredMarkers = Object.values(markers).filter((m) => m.status !== "empty");
  const raw = enteredMarkers.reduce((sum, m) => sum + m.points, 0);
  const maxPossible = enteredMarkers.reduce((sum, m) => sum + m.maxPoints, 0);
  // Normalize to 0-100
  const normalizedRaw = maxPossible > 0 ? Math.round((raw / maxPossible) * 100) : 0;

  // NSAID penalty
  let nsaidPenalty = 0;
  const blocks: string[] = [];
  const attentions: string[] = [];

  if (nsaidTimeBucket === "< 7 dias") {
    nsaidPenalty = 20;
    blocks.push("AINEs recentes (<7 dias) — janela crítica para PRP");
  } else if (nsaidTimeBucket === "7-15 dias") {
    nsaidPenalty = 10;
    attentions.push("AINEs recentes (7–15 dias) — risco de inibição plaquetária");
  } else if (nsaidTimeBucket === "15-30 dias" || nsaidTimeBucket === "< 1 mês") {
    nsaidPenalty = 4;
    attentions.push("AINEs usados há <1 mês — monitorar função plaquetária");
  }

  // Collect blocks and attentions from markers
  for (const m of Object.values(markers)) {
    if (m.status === "critical" && m.message) blocks.push(m.message);
    else if ((m.status === "borderline" || m.status === "altered") && m.message) attentions.push(m.message);
  }

  const final = Math.max(0, normalizedRaw - nsaidPenalty);

  // Determine category based on the clinical interpretation logic
  const hasBlock =
    blocks.length > 0 ||
    (labs.leukocytes != null && labs.leukocytes > 12 && labs.crp != null && labs.crp > 3);

  const isIdeal =
    !hasBlock &&
    (labs.platelets == null || labs.platelets >= 200) &&
    (labs.crp == null || labs.crp < 3) &&
    (labs.ferritin == null || labs.ferritin >= 50) &&
    (labs.vitamin_d == null || labs.vitamin_d >= 40) &&
    (labs.glucose == null || labs.glucose < 100);

  const category: OverallCategory = hasBlock ? "BLOQUEIO" : isIdeal ? "IDEAL" : "ATENCAO";

  return { raw: normalizedRaw, nsaid_penalty: nsaidPenalty, final, category, markers, blocks, attentions };
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual helpers
// ─────────────────────────────────────────────────────────────────────────────

const MARKER_STATUS_STYLE: Record<MarkerStatus, { dot: string; border: string }> = {
  ideal:      { dot: "bg-green-500",  border: "border-green-300 bg-green-50" },
  borderline: { dot: "bg-yellow-500", border: "border-yellow-300 bg-yellow-50" },
  altered:    { dot: "bg-orange-500", border: "border-orange-300 bg-orange-50" },
  critical:   { dot: "bg-red-500",    border: "border-red-300 bg-red-50" },
  empty:      { dot: "bg-muted",      border: "" },
};

const CATEGORY_CONFIG: Record<OverallCategory, {
  label: string;
  sublabel: string;
  bg: string;
  text: string;
  border: string;
  icon: typeof CheckCircle;
}> = {
  IDEAL: {
    label: "Ambiente Biológico Ideal",
    sublabel: "Todos os critérios favoráveis para terapia regenerativa",
    bg: "bg-green-50 dark:bg-green-950/20",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    icon: CheckCircle,
  },
  ATENCAO: {
    label: "Atenção / Otimização",
    sublabel: "Valores limítrofes presentes — considerar otimização antes do procedimento",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: AlertTriangle,
  },
  BLOQUEIO: {
    label: "Bloqueio Temporário",
    sublabel: "Critérios de bloqueio identificados — adiar procedimento até resolução",
    bg: "bg-red-50 dark:bg-red-950/20",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    icon: XCircle,
  },
};

function MarkerTag({ result }: { result: MarkerResult }) {
  if (result.status === "empty") return null;
  const style = MARKER_STATUS_STYLE[result.status];
  const labels: Record<MarkerStatus, string> = {
    ideal: "Ideal", borderline: "Limítrofe", altered: "Alterado", critical: "Crítico", empty: "",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border", style.border)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)} />
      {labels[result.status]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  attendanceId: string;
  nsaidTimeBucket?: string;
  disabled?: boolean;
}

export function BloodTestsManualCard({ attendanceId, nsaidTimeBucket = "", disabled }: Props) {
  const [platelets, setPlatelets]   = useState("");
  const [hemoglobin, setHemoglobin] = useState("");
  const [leukocytes, setLeukocytes] = useState("");
  const [hematocrit, setHematocrit] = useState("");
  const [crp, setCrp]               = useState("");
  const [ferritin, setFerritin]     = useState("");
  const [glucose, setGlucose]       = useState("");
  const [vitaminD, setVitaminD]     = useState("");

  const [isSaving, setIsSaving]     = useState(false);
  const [isSaved, setIsSaved]       = useState(false);
  const [isLoading, setIsLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("attendance_sessions")
        .select("manual_blood_tests")
        .eq("id", attendanceId)
        .maybeSingle();

      if (cancelled) return;
      const labs = data?.manual_blood_tests as ManualBloodTests | null;
      if (labs) {
        if (labs.platelets  != null) setPlatelets(String(labs.platelets));
        if (labs.hemoglobin != null) setHemoglobin(String(labs.hemoglobin));
        if (labs.leukocytes != null) setLeukocytes(String(labs.leukocytes));
        if (labs.hematocrit != null) setHematocrit(String(labs.hematocrit));
        if (labs.crp        != null) setCrp(String(labs.crp));
        if (labs.ferritin   != null) setFerritin(String(labs.ferritin));
        if (labs.glucose    != null) setGlucose(String(labs.glucose));
        if (labs.vitamin_d  != null) setVitaminD(String(labs.vitamin_d));
      }
      setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [attendanceId]);

  const parseNum = (v: string): number | null => {
    const n = parseFloat(v.replace(",", "."));
    return isNaN(n) ? null : n;
  };

  const currentLabs: ManualBloodTests = {
    platelets:  parseNum(platelets),
    hemoglobin: parseNum(hemoglobin),
    leukocytes: parseNum(leukocytes),
    hematocrit: parseNum(hematocrit),
    crp:        parseNum(crp),
    ferritin:   parseNum(ferritin),
    glucose:    parseNum(glucose),
    vitamin_d:  parseNum(vitaminD),
  };

  const hasAnyValue = Object.values(currentLabs).some((v) => v !== null);
  const score = hasAnyValue ? computeBloodViabilityScore(currentLabs, nsaidTimeBucket) : null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: ManualBloodTests = { ...currentLabs, collected_at: new Date().toISOString() };
      const { error } = await supabase
        .from("attendance_sessions")
        .update({ manual_blood_tests: payload as Record<string, unknown> })
        .eq("id", attendanceId);

      if (error) throw error;

      toast.success("Exames de sangue salvos");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: any) {
      console.error("[BloodTestsManualCard] save error:", e);
      toast.error("Erro ao salvar exames de sangue");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando exames...</span>
        </CardContent>
      </Card>
    );
  }

  const fields: Array<{
    key: keyof Omit<ManualBloodTests, "collected_at">;
    label: string;
    unit: string;
    placeholder: string;
    step?: string;
    value: string;
    setter: (v: string) => void;
    reference: string;
  }> = [
    { key: "platelets",  label: "Plaquetas",       unit: "x10³/µL", placeholder: "ex: 250",  value: platelets,  setter: setPlatelets,  reference: "Ideal ≥200" },
    { key: "hemoglobin", label: "Hemoglobina",      unit: "g/dL",    placeholder: "ex: 14.5", step: "0.1", value: hemoglobin, setter: setHemoglobin, reference: "Ideal ≥12" },
    { key: "leukocytes", label: "Leucócitos",       unit: "x10³/µL", placeholder: "ex: 7.5",  step: "0.1", value: leukocytes, setter: setLeukocytes, reference: "Ideal 4–10" },
    { key: "hematocrit", label: "Hematócrito",      unit: "%",       placeholder: "ex: 42",   step: "0.1", value: hematocrit, setter: setHematocrit, reference: "Ideal ≥35%" },
    { key: "crp",        label: "PCR",              unit: "mg/L",    placeholder: "ex: 1.8",  step: "0.1", value: crp,        setter: setCrp,        reference: "Ideal <3" },
    { key: "ferritin",   label: "Ferritina",        unit: "ng/mL",   placeholder: "ex: 85",   step: "0.1", value: ferritin,   setter: setFerritin,   reference: "Ideal ≥50" },
    { key: "glucose",    label: "Glicemia Jejum",   unit: "mg/dL",   placeholder: "ex: 88",   value: glucose,    setter: setGlucose,    reference: "Ideal <100" },
    { key: "vitamin_d",  label: "Vitamina D (25-OH)", unit: "ng/mL", placeholder: "ex: 45",   step: "0.1", value: vitaminD,   setter: setVitaminD,   reference: "Ideal 40–60" },
  ];

  const catCfg = score ? CATEGORY_CONFIG[score.category] : null;
  const CatIcon = catCfg?.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5" />
          Exames de Sangue — Pré-PRP
        </CardTitle>
        <CardDescription>
          Valores de referência específicos para terapia regenerativa. O sistema avalia viabilidade biológica para PRP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Input grid with inline status */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {fields.map(({ key, label, unit, placeholder, step, value, setter, reference }) => {
            const markerResult = score?.markers[key];
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <Label className="text-xs font-medium">{label}</Label>
                  {markerResult && <MarkerTag result={markerResult} />}
                </div>
                <Input
                  type="number"
                  step={step ?? "1"}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  disabled={disabled}
                  className={cn(
                    "text-sm",
                    markerResult?.status === "critical"   && "border-red-400 focus-visible:ring-red-400",
                    markerResult?.status === "altered"    && "border-orange-400 focus-visible:ring-orange-400",
                    markerResult?.status === "borderline" && "border-yellow-400 focus-visible:ring-yellow-400",
                    markerResult?.status === "ideal"      && "border-green-400 focus-visible:ring-green-400",
                  )}
                />
                <p className="text-[10px] text-muted-foreground">{unit} · {reference}</p>
              </div>
            );
          })}
        </div>

        {/* Interpretation panel */}
        {score && catCfg && (
          <div className={cn("rounded-lg border p-4 space-y-4", catCfg.bg, catCfg.border)}>

            {/* Category header */}
            <div className="flex items-start gap-3">
              {CatIcon && <CatIcon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", catCfg.text)} />}
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm", catCfg.text)}>{catCfg.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{catCfg.sublabel}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn("text-2xl font-bold tabular-nums", catCfg.text)}>{score.final}</p>
                <p className="text-[10px] text-muted-foreground">/ 100</p>
              </div>
            </div>

            {/* NSAID penalty note */}
            {score.nsaid_penalty > 0 && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                Pontuação laboratorial: {score.raw}/100 · Penalidade AINEs: −{score.nsaid_penalty} pts
              </p>
            )}

            {/* Blocks */}
            {score.blocks.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Bloqueios Identificados</p>
                <ul className="space-y-1">
                  {score.blocks.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1">
                      <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Attentions */}
            {score.attentions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">Pontos de Atenção</p>
                <ul className="space-y-1">
                  {score.attentions.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-xs text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 rounded px-2 py-1">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Per-marker mini table */}
            <div className="border-t pt-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Resumo por Marcador</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {fields
                  .filter(({ key }) => score.markers[key].status !== "empty")
                  .map(({ key, label, unit, value: rawVal }) => {
                    const m = score.markers[key];
                    const style = MARKER_STATUS_STYLE[m.status];
                    return (
                      <div key={key} className={cn("rounded border px-2 py-1.5 text-xs", style.border)}>
                        <p className="text-muted-foreground truncate">{label}</p>
                        <p className="font-semibold">{rawVal} <span className="font-normal text-[10px]">{unit}</span></p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
                          <span className="text-[10px] capitalize">{m.status === "ideal" ? "Ideal" : m.status === "borderline" ? "Limítrofe" : m.status === "altered" ? "Alterado" : "Crítico"}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {!disabled && (
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasAnyValue}
            className={cn(
              "gap-2 transition-colors",
              isSaved && "bg-green-600 hover:bg-green-700 border-green-600"
            )}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
            ) : isSaved ? (
              <><CheckCircle2 className="w-4 h-4" />Salvo!</>
            ) : (
              <><Save className="w-4 h-4" />Salvar Exames</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
