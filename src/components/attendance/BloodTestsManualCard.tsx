import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Save, FlaskConical, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface ManualBloodTests {
  platelets?: number | null;       // x10³/µL
  hemoglobin?: number | null;      // g/dL
  leukocytes?: number | null;      // x10³/µL
  hematocrit?: number | null;      // %
  crp?: number | null;             // mg/L (PCR)
  ferritin?: number | null;        // ng/mL
  glucose?: number | null;         // mg/dL
  collected_at?: string | null;    // ISO date
}

interface BloodViabilityScore {
  total: number;
  nsaid_penalty: number;
  adjusted: number;
  status: "EXCELENTE" | "BOM" | "MODERADO" | "BAIXO" | "CRITICO";
  flags: string[];
  blocks: string[];
}

// Reference ranges and scoring
function computeBloodViabilityScore(
  labs: ManualBloodTests,
  nsaidTimeBucket: string
): BloodViabilityScore {
  let total = 0;
  const flags: string[] = [];
  const blocks: string[] = [];

  // Plaquetas (0-20)
  const plt = labs.platelets;
  if (plt !== null && plt !== undefined) {
    if (plt >= 200) total += 20;
    else if (plt >= 150) total += 15;
    else if (plt >= 100) { total += 8; flags.push("Plaquetas baixas"); }
    else if (plt >= 80) { total += 2; flags.push("Plaquetas muito baixas"); }
    else { blocks.push("Plaquetas criticamente baixas (<80)"); }
  } else {
    total += 10; // neutro quando não informado
  }

  // Hemoglobina (0-15)
  const hgb = labs.hemoglobin;
  if (hgb !== null && hgb !== undefined) {
    if (hgb >= 13) total += 15;
    else if (hgb >= 11) { total += 8; flags.push("Hemoglobina reduzida"); }
    else if (hgb >= 9) { total += 3; flags.push("Anemia moderada"); }
    else { blocks.push("Anemia grave (Hgb <9)"); }
  } else {
    total += 7;
  }

  // Leucócitos (0-15)
  const lkc = labs.leukocytes;
  if (lkc !== null && lkc !== undefined) {
    if (lkc >= 4 && lkc <= 10) total += 15;
    else if (lkc > 10 && lkc <= 15) { total += 8; flags.push("Leucocitose leve"); }
    else if (lkc > 15) { total += 0; flags.push("Leucocitose importante — possível infecção"); }
    else { total += 5; flags.push("Leucopenia"); }
  } else {
    total += 7;
  }

  // Hematócrito (0-10)
  const hct = labs.hematocrit;
  if (hct !== null && hct !== undefined) {
    if (hct >= 36) total += 10;
    else if (hct >= 30) { total += 5; flags.push("Hematócrito reduzido"); }
    else { total += 0; flags.push("Hematócrito muito baixo"); }
  } else {
    total += 5;
  }

  // PCR — Proteína C Reativa (0-20)
  const crp = labs.crp;
  if (crp !== null && crp !== undefined) {
    if (crp < 5) total += 20;
    else if (crp < 10) { total += 12; flags.push("PCR levemente elevada"); }
    else if (crp < 20) { total += 5; flags.push("PCR elevada"); }
    else { total += 0; flags.push("PCR muito elevada — inflamação ativa"); }
  } else {
    total += 10;
  }

  // Ferritina (0-10)
  const ferr = labs.ferritin;
  if (ferr !== null && ferr !== undefined) {
    if (ferr >= 30) total += 10;
    else if (ferr >= 12) { total += 7; flags.push("Ferritina limítrofe"); }
    else { total += 3; flags.push("Ferritina baixa — deficiência de ferro"); }
  } else {
    total += 5;
  }

  // Glicemia (0-10)
  const glc = labs.glucose;
  if (glc !== null && glc !== undefined) {
    if (glc < 100) total += 10;
    else if (glc < 126) { total += 5; flags.push("Glicemia limítrofe (pré-diabetes)"); }
    else { total += 0; flags.push("Hiperglicemia — controle glicêmico necessário"); }
  } else {
    total += 5;
  }

  // NSAID penalty
  let nsaidPenalty = 0;
  if (nsaidTimeBucket === "< 7 dias") {
    nsaidPenalty = 25;
    blocks.push("AINEs recentes (<7 dias) — janela crítica");
  } else if (nsaidTimeBucket === "7-15 dias") {
    nsaidPenalty = 15;
    flags.push("AINEs recentes (7-15 dias)");
  } else if (nsaidTimeBucket === "15-30 dias" || nsaidTimeBucket === "< 1 mês") {
    nsaidPenalty = 5;
    flags.push("AINEs usados recentemente");
  }

  const adjusted = Math.max(0, total - nsaidPenalty);

  let status: BloodViabilityScore["status"];
  if (blocks.length > 0) status = "CRITICO";
  else if (adjusted >= 80) status = "EXCELENTE";
  else if (adjusted >= 65) status = "BOM";
  else if (adjusted >= 45) status = "MODERADO";
  else status = "BAIXO";

  return { total, nsaid_penalty: nsaidPenalty, adjusted, status, flags, blocks };
}

const STATUS_CONFIG: Record<
  BloodViabilityScore["status"],
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  EXCELENTE: { label: "Excelente", color: "text-green-600", icon: CheckCircle },
  BOM: { label: "Bom", color: "text-emerald-600", icon: CheckCircle },
  MODERADO: { label: "Moderado", color: "text-yellow-600", icon: AlertTriangle },
  BAIXO: { label: "Baixo", color: "text-orange-600", icon: AlertTriangle },
  CRITICO: { label: "Crítico", color: "text-red-600", icon: XCircle },
};

interface Props {
  attendanceId: string;
  nsaidTimeBucket?: string;
  disabled?: boolean;
}

export function BloodTestsManualCard({ attendanceId, nsaidTimeBucket = "", disabled }: Props) {
  const [platelets, setPlatelets] = useState("");
  const [hemoglobin, setHemoglobin] = useState("");
  const [leukocytes, setLeukocytes] = useState("");
  const [hematocrit, setHematocrit] = useState("");
  const [crp, setCrp] = useState("");
  const [ferritin, setFerritin] = useState("");
  const [glucose, setGlucose] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing values
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
        if (labs.platelets != null) setPlatelets(String(labs.platelets));
        if (labs.hemoglobin != null) setHemoglobin(String(labs.hemoglobin));
        if (labs.leukocytes != null) setLeukocytes(String(labs.leukocytes));
        if (labs.hematocrit != null) setHematocrit(String(labs.hematocrit));
        if (labs.crp != null) setCrp(String(labs.crp));
        if (labs.ferritin != null) setFerritin(String(labs.ferritin));
        if (labs.glucose != null) setGlucose(String(labs.glucose));
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
    platelets: parseNum(platelets),
    hemoglobin: parseNum(hemoglobin),
    leukocytes: parseNum(leukocytes),
    hematocrit: parseNum(hematocrit),
    crp: parseNum(crp),
    ferritin: parseNum(ferritin),
    glucose: parseNum(glucose),
  };

  const hasAnyValue = Object.values(currentLabs).some((v) => v !== null);

  const score = hasAnyValue
    ? computeBloodViabilityScore(currentLabs, nsaidTimeBucket)
    : null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: ManualBloodTests = {
        ...currentLabs,
        collected_at: new Date().toISOString(),
      };

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

  const StatusIcon = score ? STATUS_CONFIG[score.status].icon : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5" />
          Exames de Sangue
        </CardTitle>
        <CardDescription>
          Insira os valores dos exames laboratoriais do paciente. O sistema calculará o score de viabilidade biológica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Plaquetas (x10³/µL)</Label>
            <Input
              type="number"
              placeholder="ex: 250"
              value={platelets}
              onChange={(e) => setPlatelets(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hemoglobina (g/dL)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="ex: 14.5"
              value={hemoglobin}
              onChange={(e) => setHemoglobin(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Leucócitos (x10³/µL)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="ex: 7.5"
              value={leukocytes}
              onChange={(e) => setLeukocytes(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hematócrito (%)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="ex: 42"
              value={hematocrit}
              onChange={(e) => setHematocrit(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">PCR (mg/L)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="ex: 3.2"
              value={crp}
              onChange={(e) => setCrp(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ferritina (ng/mL)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="ex: 85"
              value={ferritin}
              onChange={(e) => setFerritin(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Glicemia (mg/dL)</Label>
            <Input
              type="number"
              placeholder="ex: 92"
              value={glucose}
              onChange={(e) => setGlucose(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Score display */}
        {score && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score de Viabilidade Biológica</span>
              <div className={cn("flex items-center gap-1.5 font-semibold", STATUS_CONFIG[score.status].color)}>
                {StatusIcon && <StatusIcon className="w-4 h-4" />}
                <span>{score.status} — {score.adjusted}/100</span>
              </div>
            </div>

            {score.nsaid_penalty > 0 && (
              <p className="text-xs text-muted-foreground">
                Pontuação base: {score.total} — Penalidade AINEs: -{score.nsaid_penalty}
              </p>
            )}

            {score.blocks.length > 0 && (
              <div className="space-y-1">
                {score.blocks.map((b) => (
                  <Badge key={b} variant="destructive" className="text-xs mr-1">
                    {b}
                  </Badge>
                ))}
              </div>
            )}

            {score.flags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {score.flags.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs text-yellow-700 border-yellow-400 bg-yellow-50">
                    {f}
                  </Badge>
                ))}
              </div>
            )}
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
