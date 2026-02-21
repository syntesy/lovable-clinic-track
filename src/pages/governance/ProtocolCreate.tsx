import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Save, Loader2, Plus, Trash2, AlertTriangle, BookOpen, CheckCircle2 } from "lucide-react";
import { useCreateProtocol, useClinicId } from "@/hooks/useProtocols";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────
interface InclusionAlert {
  id: string;
  label: string;
  enabled: boolean;
  custom?: boolean;
}

interface Indicator {
  id: string;
  name: string;
  type: "percentual" | "numerico" | "booleano";
  target: string;
  interval_days: string;
  required: boolean;
}

interface Reference {
  id: string;
  title: string;
  main_author: string;
  year: string;
  journal: string;
  doi: string;
  study_type: string;
  evidence_level: string;
  conclusion: string;
  is_primary: boolean;
}

type ProtocolType = "REGEN_BASE" | "DERIVED" | "INSTITUTIONAL";

const STEPS = [
  { title: "Informações Gerais", description: "Nome, área e tipo" },
  { title: "Critérios de Inclusão", description: "Diagnóstico e alertas" },
  { title: "Procedimento", description: "Técnica e parâmetros" },
  { title: "Acompanhamento", description: "Escalas e desfechos" },
  { title: "Indicadores", description: "Metas clínicas" },
  { title: "Evidência Científica", description: "Referências bibliográficas" },
];

const DEFAULT_ALERTS: InclusionAlert[] = [
  { id: "nsaid", label: "Uso recente de NSAID", enabled: false },
  { id: "platelets", label: "Plaquetas abaixo do limite", enabled: false },
  { id: "age_min", label: "Idade mínima", enabled: false },
  { id: "age_max", label: "Idade máxima", enabled: false },
];

const EXAM_OPTIONS = [
  "Hemograma completo", "Coagulograma", "Radiografia", "Ressonância Magnética",
  "Ultrassonografia", "Tomografia", "PCR / VHS", "Glicemia",
];

const SCALE_OPTIONS = [
  "VAS (Escala Visual Analógica)", "WOMAC", "DASH", "KOOS",
  "SF-36", "Lysholm", "AOFAS", "Harris Hip Score",
];

export default function ProtocolCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createMutation = useCreateProtocol();
  const { data: clinicId } = useClinicId();

  const [currentStep, setCurrentStep] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  // Step 1 — General
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [protocolType, setProtocolType] = useState<ProtocolType>(
    (searchParams.get("type") as ProtocolType) || "INSTITUTIONAL"
  );
  const [description, setDescription] = useState("");

  // Step 2 — Inclusion
  const [diagnosis, setDiagnosis] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [requiredExams, setRequiredExams] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<InclusionAlert[]>(DEFAULT_ALERTS);
  const [customAlertLabel, setCustomAlertLabel] = useState("");

  // Step 3 — Procedure
  const [procedureType, setProcedureType] = useState("");
  const [technique, setTechnique] = useState("");
  const [volume, setVolume] = useState("");
  const [volumeUnit, setVolumeUnit] = useState("ml");
  const [numSessions, setNumSessions] = useState("");
  const [sessionInterval, setSessionInterval] = useState("");

  // Step 4 — Follow-up
  const [scales, setScales] = useState<string[]>([]);
  const [followupIntervals, setFollowupIntervals] = useState<string[]>(["30", "90"]);
  const [primaryOutcome, setPrimaryOutcome] = useState("");
  const [secondaryOutcome, setSecondaryOutcome] = useState("");

  // Step 5 — Indicators
  const [indicators, setIndicators] = useState<Indicator[]>([]);

  // Step 6 — Evidence
  const [references, setReferences] = useState<Reference[]>([]);
  const [reviewDate, setReviewDate] = useState("");
  const [nextReviewMonths, setNextReviewMonths] = useState("");

  // Dirty tracking
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const markDirty = () => { if (!isDirty) setIsDirty(true); };

  // ─── Validation ────────────────────────────────────────────────
  const validateStep = (step: number): string | null => {
    switch (step) {
      case 0:
        if (title.trim().length < 5) return "Nome deve ter pelo menos 5 caracteres.";
        if (!area) return "Área clínica é obrigatória.";
        return null;
      case 1:
        if (scoreMin && scoreMax && Number(scoreMin) > Number(scoreMax))
          return "Score mínimo não pode ser maior que o máximo.";
        return null;
      case 2:
        if (!procedureType) return "Tipo de procedimento é obrigatório.";
        if (!technique.trim()) return "Técnica é obrigatória.";
        if (!volume || Number(volume) <= 0) return "Volume deve ser positivo.";
        if (!numSessions || Number(numSessions) <= 0) return "Número de sessões deve ser positivo.";
        if (!sessionInterval || Number(sessionInterval) <= 0) return "Intervalo deve ser positivo.";
        return null;
      case 3:
        if (!primaryOutcome) return "Desfecho primário é obrigatório.";
        return null;
      case 4:
        return null;
      case 5:
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) { toast.error(error); return; }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  // ─── Indicator helpers ─────────────────────────────────────────
  const addIndicator = () => {
    setIndicators((prev) => [...prev, {
      id: crypto.randomUUID(),
      name: "", type: "percentual", target: "", interval_days: "90", required: false,
    }]);
    markDirty();
  };

  const updateIndicator = (id: string, field: keyof Indicator, value: any) => {
    setIndicators((prev) => prev.map((i) => i.id === id ? { ...i, [field]: value } : i));
    markDirty();
  };

  const removeIndicator = (id: string) => {
    setIndicators((prev) => prev.filter((i) => i.id !== id));
    markDirty();
  };

  // ─── Reference helpers ─────────────────────────────────────────
  const addReference = () => {
    setReferences((prev) => [...prev, {
      id: crypto.randomUUID(),
      title: "", main_author: "", year: "", journal: "", doi: "",
      study_type: "", evidence_level: "", conclusion: "", is_primary: false,
    }]);
    markDirty();
  };

  const updateReference = (id: string, field: keyof Reference, value: any) => {
    setReferences((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
    markDirty();
  };

  const removeReference = (id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
    markDirty();
  };

  // ─── Custom alert ──────────────────────────────────────────────
  const addCustomAlert = () => {
    if (!customAlertLabel.trim()) return;
    setAlerts((prev) => [...prev, {
      id: `custom_${Date.now()}`, label: customAlertLabel.trim(), enabled: true, custom: true,
    }]);
    setCustomAlertLabel("");
    markDirty();
  };

  // ─── Save ──────────────────────────────────────────────────────
  const buildPayload = (status: "draft" | "active") => {
    const inclusionCriteria = {
      diagnosis,
      score_min: scoreMin ? Number(scoreMin) : null,
      score_max: scoreMax ? Number(scoreMax) : null,
      required_exams: requiredExams,
      alerts: alerts.filter((a) => a.enabled).map((a) => ({ id: a.id, label: a.label })),
    };

    const procedureData = {
      type: procedureType,
      technique,
      volume: `${volume} ${volumeUnit}`,
      num_sessions: Number(numSessions),
      session_interval_days: Number(sessionInterval),
    };

    const followupData = {
      scales,
      intervals: followupIntervals.map(Number),
      primary_outcome: primaryOutcome,
      secondary_outcome: secondaryOutcome || null,
    };

    const sortedRefs = [...references].sort((a, b) => Number(b.year) - Number(a.year));

    return {
      title,
      area,
      protocol_type: protocolType,
      indication_summary: description || null,
      inclusion_criteria: inclusionCriteria,
      exclusion_criteria: null,
      required_exams: requiredExams,
      technique_summary: `${procedureType} — ${technique}`,
      checklist_template: null,
      evidence_level: sortedRefs[0]?.evidence_level || null,
      evidence_notes: null,
      evidence_refs: sortedRefs.length > 0 ? sortedRefs : null,
      is_active: status === "active",
      // Extended data stored in a JSON field
      extended_data: {
        procedure: procedureData,
        followup: followupData,
        indicators,
        review_date: reviewDate || null,
        next_review_months: nextReviewMonths ? Number(nextReviewMonths) : null,
      },
    };
  };

  const handleSaveDraft = async () => {
    if (title.trim().length < 5) {
      toast.error("Nome deve ter pelo menos 5 caracteres para salvar.");
      return;
    }
    if (!area) {
      toast.error("Área clínica é obrigatória para salvar.");
      return;
    }

    const payload = buildPayload("draft");
    await createMutation.mutateAsync(payload);
    setIsDirty(false);
    navigate("/governanca/protocolos");
  };

  const handleFinalize = async () => {
    // Validate all steps
    for (let i = 0; i < STEPS.length; i++) {
      const error = validateStep(i);
      if (error) {
        setCurrentStep(i);
        toast.error(error);
        return;
      }
    }

    const payload = buildPayload("active");
    await createMutation.mutateAsync(payload);
    setIsDirty(false);
    navigate("/governanca/protocolos");
  };

  // ─── Render Steps ──────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderStep3();
      case 3: return renderStep4();
      case 4: return renderStep5();
      case 5: return renderStep6();
      default: return null;
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader><CardTitle className="text-base">Informações Gerais</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nome do protocolo *</Label>
          <Input value={title} onChange={(e) => { setTitle(e.target.value); markDirty(); }} placeholder="Mínimo 5 caracteres" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Área clínica *</Label>
            <Select value={area} onValueChange={(v) => { setArea(v); markDirty(); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ortobiológicos">Ortobiológicos</SelectItem>
                <SelectItem value="EPI">EPI</SelectItem>
                <SelectItem value="MAC (Método de Aceleração Cicatricial)">MAC</SelectItem>
                <SelectItem value="Ondas de Choque">Ondas de Choque</SelectItem>
                <SelectItem value="Injetáveis">Injetáveis</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={protocolType} onValueChange={(v) => { setProtocolType(v as ProtocolType); markDirty(); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="REGEN_BASE">Base REGHEN</SelectItem>
                <SelectItem value="DERIVED">Derivado</SelectItem>
                <SelectItem value="INSTITUTIONAL">Institucional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Descrição clínica</Label>
          <Textarea value={description} onChange={(e) => { setDescription(e.target.value); markDirty(); }} rows={3} placeholder="Opcional" />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader><CardTitle className="text-base">Critérios de Inclusão</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Diagnóstico principal</Label>
          <Input value={diagnosis} onChange={(e) => { setDiagnosis(e.target.value); markDirty(); }} placeholder="Ex: Osteoartrite de joelho" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Score mínimo</Label>
            <Input type="number" min="0" value={scoreMin} onChange={(e) => { setScoreMin(e.target.value); markDirty(); }} />
          </div>
          <div className="space-y-2">
            <Label>Score máximo</Label>
            <Input type="number" min="0" value={scoreMax} onChange={(e) => { setScoreMax(e.target.value); markDirty(); }} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Exames obrigatórios</Label>
          <div className="grid grid-cols-2 gap-2">
            {EXAM_OPTIONS.map((exam) => (
              <label key={exam} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={requiredExams.includes(exam)}
                  onCheckedChange={(checked) => {
                    setRequiredExams((prev) => checked ? [...prev, exam] : prev.filter((e) => e !== exam));
                    markDirty();
                  }}
                />
                {exam}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Alertas clínicos</Label>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-2">
                <Checkbox
                  checked={alert.enabled}
                  onCheckedChange={(checked) => {
                    setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, enabled: !!checked } : a));
                    markDirty();
                  }}
                />
                <span className="text-sm">{alert.label}</span>
                {alert.custom && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input value={customAlertLabel} onChange={(e) => setCustomAlertLabel(e.target.value)} placeholder="Novo alerta customizado" className="flex-1" />
            <Button variant="outline" size="sm" onClick={addCustomAlert}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader><CardTitle className="text-base">Procedimento</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de procedimento *</Label>
          <Select value={procedureType} onValueChange={(v) => { setProcedureType(v); markDirty(); }}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PRP">PRP</SelectItem>
              <SelectItem value="PRF">PRF</SelectItem>
              <SelectItem value="BMAc">BMAc</SelectItem>
              <SelectItem value="EPI">EPI</SelectItem>
              <SelectItem value="MAC">MAC</SelectItem>
              <SelectItem value="Ondas de Choque">Ondas de Choque</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Técnica detalhada *</Label>
          <Textarea value={technique} onChange={(e) => { setTechnique(e.target.value); markDirty(); }} rows={3} placeholder="Descreva a técnica do procedimento" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Volume *</Label>
            <div className="flex gap-2">
              <Input type="number" min="0" step="0.1" value={volume} onChange={(e) => { setVolume(e.target.value); markDirty(); }} className="flex-1" />
              <Select value={volumeUnit} onValueChange={setVolumeUnit}>
                <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="cc">cc</SelectItem>
                  <SelectItem value="UI">UI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nº sessões *</Label>
            <Input type="number" min="1" value={numSessions} onChange={(e) => { setNumSessions(e.target.value); markDirty(); }} />
          </div>
          <div className="space-y-2">
            <Label>Intervalo (dias) *</Label>
            <Input type="number" min="1" value={sessionInterval} onChange={(e) => { setSessionInterval(e.target.value); markDirty(); }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader><CardTitle className="text-base">Acompanhamento</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Escalas obrigatórias</Label>
          <div className="grid grid-cols-2 gap-2">
            {SCALE_OPTIONS.map((scale) => (
              <label key={scale} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={scales.includes(scale)}
                  onCheckedChange={(checked) => {
                    setScales((prev) => checked ? [...prev, scale] : prev.filter((s) => s !== scale));
                    markDirty();
                  }}
                />
                {scale}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Intervalos de reavaliação (dias)</Label>
          <div className="flex gap-2 flex-wrap">
            {["7", "30", "60", "90", "180", "365"].map((d) => (
              <label key={d} className="flex items-center gap-1 text-sm">
                <Checkbox
                  checked={followupIntervals.includes(d)}
                  onCheckedChange={(checked) => {
                    setFollowupIntervals((prev) => checked ? [...prev, d] : prev.filter((v) => v !== d));
                    markDirty();
                  }}
                />
                D{d}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Desfecho primário *</Label>
            <Select value={primaryOutcome} onValueChange={(v) => { setPrimaryOutcome(v); markDirty(); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pain_reduction">Redução de dor</SelectItem>
                <SelectItem value="function_improvement">Melhora funcional</SelectItem>
                <SelectItem value="healing">Cicatrização</SelectItem>
                <SelectItem value="rom_improvement">Melhora de amplitude</SelectItem>
                <SelectItem value="patient_satisfaction">Satisfação do paciente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Desfecho secundário</Label>
            <Select value={secondaryOutcome} onValueChange={(v) => { setSecondaryOutcome(v); markDirty(); }}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pain_reduction">Redução de dor</SelectItem>
                <SelectItem value="function_improvement">Melhora funcional</SelectItem>
                <SelectItem value="healing">Cicatrização</SelectItem>
                <SelectItem value="rom_improvement">Melhora de amplitude</SelectItem>
                <SelectItem value="patient_satisfaction">Satisfação do paciente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Indicadores</CardTitle>
          <Button variant="outline" size="sm" onClick={addIndicator}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {indicators.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum indicador adicionado. Clique em "Adicionar" para criar.</p>
        )}
        {indicators.map((ind, idx) => (
          <div key={ind.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Indicador {idx + 1}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeIndicator(ind.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={ind.name} onChange={(e) => updateIndicator(ind.id, "name", e.target.value)} placeholder="Ex: Taxa de melhora" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={ind.type} onValueChange={(v) => updateIndicator(ind.id, "type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Percentual</SelectItem>
                    <SelectItem value="numerico">Numérico</SelectItem>
                    <SelectItem value="booleano">Booleano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Meta esperada</Label>
                <Input value={ind.target} onChange={(e) => updateIndicator(ind.id, "target", e.target.value)} placeholder="Ex: 70%" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Intervalo (dias)</Label>
                <Input type="number" min="1" value={ind.interval_days} onChange={(e) => updateIndicator(ind.id, "interval_days", e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={ind.required} onCheckedChange={(c) => updateIndicator(ind.id, "required", !!c)} />
              Obrigatório
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderStep6 = () => {
    const currentYear = new Date().getFullYear();
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Evidência Científica</CardTitle>
            <Button variant="outline" size="sm" onClick={addReference}><Plus className="h-3 w-3 mr-1" />Adicionar Referência</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {references.length > 0 && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <Badge variant="outline" className="text-xs">
                {references.length} referência{references.length > 1 ? "s" : ""} cadastrada{references.length > 1 ? "s" : ""}
              </Badge>
              {references.some((r) => r.title && r.year) && (
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Baseado em Evidência
                </Badge>
              )}
            </div>
          )}

          {references.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma referência adicionada. Protocolo não pode ser ativado sem evidência.
            </p>
          )}

          {[...references].sort((a, b) => Number(b.year) - Number(a.year)).map((ref, idx) => (
            <div key={ref.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Referência {idx + 1}</span>
                  {ref.year && currentYear - Number(ref.year) > 10 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />+10 anos
                    </Badge>
                  )}
                  {ref.is_primary && <Badge className="text-xs">Principal</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={ref.is_primary ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateReference(ref.id, "is_primary", !ref.is_primary)}
                  >
                    Principal
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeReference(ref.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Título do artigo</Label>
                  <Input value={ref.title} onChange={(e) => updateReference(ref.id, "title", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Autor principal</Label>
                  <Input value={ref.main_author} onChange={(e) => updateReference(ref.id, "main_author", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ano</Label>
                  <Input type="number" value={ref.year} onChange={(e) => updateReference(ref.id, "year", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Revista</Label>
                  <Input value={ref.journal} onChange={(e) => updateReference(ref.id, "journal", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">DOI / PubMed</Label>
                  <Input value={ref.doi} onChange={(e) => updateReference(ref.id, "doi", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de estudo</Label>
                  <Select value={ref.study_type} onValueChange={(v) => updateReference(ref.id, "study_type", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RCT">RCT</SelectItem>
                      <SelectItem value="Meta-análise">Meta-análise</SelectItem>
                      <SelectItem value="Coorte">Coorte</SelectItem>
                      <SelectItem value="Caso-controle">Caso-controle</SelectItem>
                      <SelectItem value="Diretriz">Diretriz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nível de evidência</Label>
                  <Select value={ref.evidence_level} onValueChange={(v) => updateReference(ref.id, "evidence_level", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I">I</SelectItem>
                      <SelectItem value="II">II</SelectItem>
                      <SelectItem value="III">III</SelectItem>
                      <SelectItem value="IV">IV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Conclusão relevante</Label>
                <Textarea value={ref.conclusion} onChange={(e) => updateReference(ref.id, "conclusion", e.target.value)} rows={2} />
              </div>
            </div>
          ))}

          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da última revisão</Label>
              <Input type="date" value={reviewDate} onChange={(e) => { setReviewDate(e.target.value); markDirty(); }} />
            </div>
            <div className="space-y-2">
              <Label>Próxima revisão (meses)</Label>
              <Input type="number" min="1" value={nextReviewMonths} onChange={(e) => { setNextReviewMonths(e.target.value); markDirty(); }} placeholder="Ex: 12" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => {
          if (isDirty) {
            if (!window.confirm("Existem alterações não salvas. Deseja sair?")) return;
          }
          navigate("/governanca/protocolos");
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Novo Protocolo</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <button
              onClick={() => {
                if (idx < currentStep) setCurrentStep(idx);
              }}
              className={`flex flex-col items-center gap-1 flex-1 ${idx <= currentStep ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                idx < currentStep ? "bg-primary text-primary-foreground" :
                idx === currentStep ? "bg-primary text-primary-foreground ring-2 ring-primary/30" :
                "bg-muted text-muted-foreground"
              }`}>
                {idx < currentStep ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span className={`text-[10px] text-center leading-tight hidden sm:block ${
                idx === currentStep ? "text-foreground font-medium" : "text-muted-foreground"
              }`}>{step.title}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 ${idx < currentStep ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {renderStep()}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Rascunho
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Avançar<ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinalize} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Criar Protocolo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
