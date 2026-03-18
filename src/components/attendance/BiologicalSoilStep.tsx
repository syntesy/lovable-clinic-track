import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Save,
  CheckCircle2,
  Droplets,
  Flame,
  Zap,
  Leaf,
  Heart,
  ShieldAlert,
  FileBarChart2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

export interface BiologicalSoilData {
  // 4.1 Hematológico
  platelets: string;       // x10³/µL  — ideal ≥200
  hemoglobin: string;      // g/dL     — ideal ≥12 (F) / ≥13 (M)
  hematocrit: string;      // %        — ideal 36–50
  leukocytes: string;      // x10³/µL  — ideal 4–10

  // 4.2 Inflamatório
  crp: string;             // mg/L     — ideal <5
  esr: string;             // mm/h     — ideal <20

  // 4.3 Metabólico
  fasting_glucose: string; // mg/dL    — ideal <100
  hba1c: string;           // %        — ideal <5.7

  // 4.4 Nutricional
  ferritin: string;        // ng/mL    — ideal 30–300
  vitamin_d: string;       // ng/mL    — ideal ≥40
  vitamin_b12: string;     // pg/mL    — ideal ≥300
  albumin: string;         // g/dL     — ideal ≥3.5

  // 4.5 Estilo de vida
  smoking: boolean;
  alcohol: boolean;
  sedentary: boolean;
  obesity: boolean;

  // 4.6 Segurança biológica
  active_infection: boolean;
  anticoagulant: boolean;
  decompensated_diabetes: boolean;
  active_neoplasia: boolean;
  recent_nsaid: boolean;

  collected_at: string;    // ISO date
}

const EMPTY: BiologicalSoilData = {
  platelets: "", hemoglobin: "", hematocrit: "", leukocytes: "",
  crp: "", esr: "",
  fasting_glucose: "", hba1c: "",
  ferritin: "", vitamin_d: "", vitamin_b12: "", albumin: "",
  smoking: false, alcohol: false, sedentary: false, obesity: false,
  active_infection: false, anticoagulant: false, decompensated_diabetes: false,
  active_neoplasia: false, recent_nsaid: false,
  collected_at: "",
};

// ── Reference ranges ──────────────────────────────────────────

interface Ref { unit: string; hint: string }
const REFS: Record<string, Ref> = {
  platelets:       { unit: "x10³/µL", hint: "Ideal ≥ 200" },
  hemoglobin:      { unit: "g/dL",    hint: "Ideal ≥ 12 (F) / ≥ 13 (M)" },
  hematocrit:      { unit: "%",       hint: "Ideal 36 – 50" },
  leukocytes:      { unit: "x10³/µL", hint: "Ideal 4 – 10" },
  crp:             { unit: "mg/L",    hint: "Ideal < 5" },
  esr:             { unit: "mm/h",    hint: "Ideal < 20" },
  fasting_glucose: { unit: "mg/dL",  hint: "Ideal < 100" },
  hba1c:           { unit: "%",      hint: "Ideal < 5,7" },
  ferritin:        { unit: "ng/mL",  hint: "Ideal 30 – 300" },
  vitamin_d:       { unit: "ng/mL",  hint: "Ideal ≥ 40" },
  vitamin_b12:     { unit: "pg/mL",  hint: "Ideal ≥ 300" },
  albumin:         { unit: "g/dL",   hint: "Ideal ≥ 3,5" },
};

// ── Sub-components ────────────────────────────────────────────

function BlockHeader({
  icon: Icon,
  title,
  color = "text-primary",
}: {
  icon: React.ElementType;
  title: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon className={cn("w-5 h-5 shrink-0", color)} />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function NumericField({
  label,
  fieldKey,
  value,
  onChange,
  disabled,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const ref = REFS[fieldKey];
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        type="number"
        step="any"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        disabled={disabled}
        className="tabular-nums"
      />
      {ref && (
        <div className="space-y-0.5">
          <p className="text-[11px] text-muted-foreground/70">{ref.unit}</p>
          <p className="text-[11px] text-muted-foreground">{ref.hint}</p>
        </div>
      )}
    </div>
  );
}

function FlagCheck({
  label,
  checked,
  onChange,
  disabled,
  danger,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
  danger?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
        checked
          ? danger
            ? "border-red-500 bg-red-500/10"
            : "border-primary bg-primary/5"
          : "border-border hover:border-primary/40",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
        disabled={disabled}
        className={cn(danger && checked && "border-red-500 data-[state=checked]:bg-red-500")}
      />
      <span className={cn("text-sm font-medium", checked ? (danger ? "text-red-500" : "text-foreground") : "text-muted-foreground")}>
        {label}
      </span>
    </label>
  );
}

// ── Main component ────────────────────────────────────────────

interface Props {
  attendanceId: string;
  disabled?: boolean;
}

export function BiologicalSoilStep({ attendanceId, disabled = false }: Props) {
  const [data, setData] = useState<BiologicalSoilData>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved data
  useEffect(() => {
    async function load() {
      const { data: row } = await supabase
        .from("attendance_sessions")
        .select("biological_soil_data")
        .eq("id", attendanceId)
        .single();

      if (row?.biological_soil_data) {
        setData({ ...EMPTY, ...(row.biological_soil_data as Partial<BiologicalSoilData>) });
      }
      setIsLoading(false);
    }
    load();
  }, [attendanceId]);

  function set<K extends keyof BiologicalSoilData>(key: K, value: BiologicalSoilData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({ biological_soil_data: data as unknown as Record<string, unknown> })
        .eq("id", attendanceId);
      if (error) throw error;
      toast.success("Solo biológico salvo");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      toast.error("Erro ao salvar solo biológico");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-12">

      {/* ── 4.1 Hematológico ── */}
      <section>
        <BlockHeader icon={Droplets} title="Hematológico" color="text-red-500" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <NumericField label="Plaquetas"   fieldKey="platelets"  value={data.platelets}  onChange={(v) => set("platelets", v)}  disabled={disabled} />
          <NumericField label="Hemoglobina" fieldKey="hemoglobin" value={data.hemoglobin} onChange={(v) => set("hemoglobin", v)} disabled={disabled} />
          <NumericField label="Hematócrito" fieldKey="hematocrit" value={data.hematocrit} onChange={(v) => set("hematocrit", v)} disabled={disabled} />
          <NumericField label="Leucócitos"  fieldKey="leukocytes" value={data.leukocytes} onChange={(v) => set("leukocytes", v)} disabled={disabled} />
        </div>
      </section>

      <div className="border-t border-border" />

      {/* ── 4.2 Inflamatório ── */}
      <section>
        <BlockHeader icon={Flame} title="Inflamatório" color="text-orange-500" />
        <div className="grid sm:grid-cols-2 gap-5 max-w-sm">
          <NumericField label="PCR"  fieldKey="crp" value={data.crp} onChange={(v) => set("crp", v)} disabled={disabled} />
          <NumericField label="VHS"  fieldKey="esr" value={data.esr} onChange={(v) => set("esr", v)} disabled={disabled} />
        </div>
      </section>

      <div className="border-t border-border" />

      {/* ── 4.3 Metabólico ── */}
      <section>
        <BlockHeader icon={Zap} title="Metabólico" color="text-yellow-500" />
        <div className="grid sm:grid-cols-2 gap-5 max-w-sm">
          <NumericField label="Glicemia em Jejum" fieldKey="fasting_glucose" value={data.fasting_glucose} onChange={(v) => set("fasting_glucose", v)} disabled={disabled} />
          <NumericField label="HbA1c"             fieldKey="hba1c"           value={data.hba1c}           onChange={(v) => set("hba1c", v)}           disabled={disabled} />
        </div>
      </section>

      <div className="border-t border-border" />

      {/* ── 4.4 Nutricional ── */}
      <section>
        <BlockHeader icon={Leaf} title="Nutricional" color="text-green-500" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <NumericField label="Ferritina"       fieldKey="ferritin"    value={data.ferritin}    onChange={(v) => set("ferritin", v)}    disabled={disabled} />
          <NumericField label="Vitamina D (25-OH)" fieldKey="vitamin_d" value={data.vitamin_d}  onChange={(v) => set("vitamin_d", v)}  disabled={disabled} />
          <NumericField label="Vitamina B12"    fieldKey="vitamin_b12" value={data.vitamin_b12} onChange={(v) => set("vitamin_b12", v)} disabled={disabled} />
          <NumericField label="Albumina"        fieldKey="albumin"     value={data.albumin}     onChange={(v) => set("albumin", v)}     disabled={disabled} />
        </div>
      </section>

      <div className="border-t border-border" />

      {/* ── 4.5 Estilo de Vida ── */}
      <section>
        <BlockHeader icon={Heart} title="Estilo de Vida" color="text-pink-500" />
        <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
          <FlagCheck label="Tabagismo"                  checked={data.smoking}   onChange={(v) => set("smoking", v)}   disabled={disabled} />
          <FlagCheck label="Consumo frequente de álcool" checked={data.alcohol}   onChange={(v) => set("alcohol", v)}   disabled={disabled} />
          <FlagCheck label="Sedentarismo"               checked={data.sedentary} onChange={(v) => set("sedentary", v)} disabled={disabled} />
          <FlagCheck label="Obesidade"                  checked={data.obesity}   onChange={(v) => set("obesity", v)}   disabled={disabled} />
        </div>
      </section>

      <div className="border-t border-border" />

      {/* ── 4.6 Segurança Biológica ── */}
      <section>
        <BlockHeader icon={ShieldAlert} title="Segurança Biológica" color="text-red-600" />
        <p className="text-sm text-muted-foreground mb-4">
          Marque se o paciente apresenta qualquer uma das condições abaixo — podem contraindiar ou adiar a terapia regenerativa.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
          <FlagCheck label="Infecção ativa"           checked={data.active_infection}      onChange={(v) => set("active_infection", v)}      disabled={disabled} danger />
          <FlagCheck label="Uso de anticoagulante"    checked={data.anticoagulant}         onChange={(v) => set("anticoagulant", v)}         disabled={disabled} danger />
          <FlagCheck label="Diabetes descompensada"   checked={data.decompensated_diabetes} onChange={(v) => set("decompensated_diabetes", v)} disabled={disabled} danger />
          <FlagCheck label="Neoplasia ativa"          checked={data.active_neoplasia}      onChange={(v) => set("active_neoplasia", v)}      disabled={disabled} danger />
          <FlagCheck label="Uso recente de AINE"      checked={data.recent_nsaid}          onChange={(v) => set("recent_nsaid", v)}          disabled={disabled} />
        </div>
      </section>

      {/* ── Actions ── */}
      {!disabled && (
        <>
          <div className="border-t border-border" />
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={cn("gap-2 transition-colors", isSaved && "bg-green-600 hover:bg-green-700")}
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
              ) : isSaved ? (
                <><CheckCircle2 className="w-4 h-4" />Salvo!</>
              ) : (
                <><Save className="w-4 h-4" />Salvar Avaliação do Solo</>
              )}
            </Button>
            <Button variant="outline" className="gap-2" disabled>
              <FileBarChart2 className="w-4 h-4" />
              Gerar Relatório do Solo Biológico
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
