import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Upload, FileText, Loader2, AlertCircle, CheckCircle2,
  XCircle, FlaskConical, ChevronDown, ChevronUp, Sparkles, Clock,
  ShieldAlert, ShieldCheck, Edit3, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeLabs, type NormalizedLabItem } from "@/utils/normalizeLabs";

interface PatientExamUploadAnalysisProps {
  patientId: string;
  patientName: string;
}

interface LabRun {
  id: string;
  created_at: string;
  status: string;
  extraction_method: string | null;
  extraction_confidence: string | null;
  normalized_json: any;
  analysis_json: any;
  error_code: string | null;
  warnings: any;
  storage_path: string | null;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const UNIT_OPTIONS = [
  "%", "mg/dL", "g/dL", "ng/mL", "pg/mL", "µg/dL", "µg/L",
  "mg/L", "mmol/L", "mEq/L", "U/L", "UI/L", "mUI/L",
  "10^3/µL", "10^6/µL", "mil/mm³", "mL/min/1.73m²",
  "fL", "pg", "g/L", "µUI/mL", "mUI/mL", "ng/dL",
];

const BLOCKING_REASON_LABELS: Record<string, string> = {
  MISSING_VALUE: "Valor ausente",
  CRITICAL_MISSING_UNIT: "Unidade obrigatória ausente",
  CRITICAL_LOW_CONFIDENCE: "Confiança baixa (biomarcador crítico)",
  INVALID_UNIT: "Unidade não reconhecida",
  INVALID_UNIT_PATTERN: "Unidade inválida (token/hash detectado)",
  NO_REFERENCE_RANGE: "Sem intervalo de referência",
  RANGE_REQUIRES_SEX: "Intervalo depende do sexo (não informado)",
};

export function PatientExamUploadAnalysis({ patientId, patientName }: PatientExamUploadAnalysisProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualText, setManualText] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [editingLab, setEditingLab] = useState<{ runId: string; labIndex: number } | null>(null);
  const [editForm, setEditForm] = useState<{ value: string; unit: string; rangeMin: string; rangeMax: string }>({ value: "", unit: "", rangeMin: "", rangeMax: "" });

  const { data: labRuns, isLoading } = useQuery({
    queryKey: ["lab-analysis-runs", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_analysis_runs")
        .select("id, created_at, status, extraction_method, extraction_confidence, normalized_json, analysis_json, error_code, warnings, storage_path")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as LabRun[];
    },
    enabled: !!patientId,
  });

  const handleFileUploadAndAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) { toast.error("Formato não suportado. Use JPG, PNG, WEBP ou PDF."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande (máx. 10MB)."); return; }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const storagePath = `${patientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("exam-files").upload(storagePath, file);
      if (uploadError) { toast.error("Erro ao enviar arquivo."); return; }

      setIsUploading(false);
      setIsAnalyzing(true);

      const { data, error } = await supabase.functions.invoke("analyze-labs", {
        body: { patient_id: patientId, bucket: "exam-files", storage_path: storagePath, mime_type: file.type, file_name: file.name },
      });

      if (error || !data?.ok) {
        toast.error(data?.message || error?.message || "Erro na análise");
      } else {
        const safe = data.safety || {};
        toast.success(`Análise concluída: ${safe.interpretable || 0} interpretáveis, ${safe.blocked || 0} bloqueados`);
      }
      queryClient.invalidateQueries({ queryKey: ["lab-analysis-runs", patientId] });
    } catch (err: any) {
      toast.error("Erro inesperado: " + (err.message || ""));
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManualAnalyze = async () => {
    if (!manualText.trim() || manualText.trim().length < 200) {
      toast.error("Texto muito curto (mínimo 200 caracteres).");
      return;
    }
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-labs", {
        body: { patient_id: patientId, raw_text: manualText.trim() },
      });
      if (error || !data?.ok) {
        toast.error(data?.message || error?.message || "Erro na análise");
      } else {
        toast.success("Análise concluída!");
        setManualText("");
        setShowManualInput(false);
      }
      queryClient.invalidateQueries({ queryKey: ["lab-analysis-runs", patientId] });
    } catch (err: any) {
      toast.error("Erro: " + (err.message || ""));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startEditLab = (runId: string, labIndex: number, lab: any) => {
    setEditingLab({ runId, labIndex });
    setEditForm({
      value: lab.value?.toString() || "",
      unit: lab.unit || "",
      rangeMin: "",
      rangeMax: "",
    });
    // Try to parse existing range
    if (lab.reference_range) {
      const m = lab.reference_range.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
      if (m) { setEditForm(prev => ({ ...prev, rangeMin: m[1], rangeMax: m[2] })); }
    }
  };

  const handleReanalyzeWithCorrections = async (run: LabRun) => {
    if (!editingLab || editingLab.runId !== run.id) return;
    const labs = [...(run.normalized_json?.labs || [])];
    const idx = editingLab.labIndex;
    if (idx < 0 || idx >= labs.length) return;

    // Apply corrections
    const lab = { ...labs[idx] };
    if (editForm.value) lab.value = parseFloat(editForm.value.replace(",", "."));
    if (editForm.unit) lab.unit = editForm.unit;
    if (editForm.rangeMin && editForm.rangeMax) lab.reference_range = `${editForm.rangeMin}-${editForm.rangeMax}`;

    // Recalculate interpretability
    lab.blocking_reasons = [];
    lab.is_interpretable = true;
    if (lab.value === null || lab.value === undefined) { lab.blocking_reasons.push("MISSING_VALUE"); lab.is_interpretable = false; }
    if (!lab.unit) { lab.blocking_reasons.push("CRITICAL_MISSING_UNIT"); lab.is_interpretable = false; }
    labs[idx] = lab;

    // Build corrected raw text from all labs
    const correctedText = labs.map((l: any) =>
      `${l.name}: ${l.value ?? "?"} ${l.unit || ""} ref: ${l.reference_range || "?"}`
    ).join("\n");

    setEditingLab(null);
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-labs", {
        body: { patient_id: patientId, raw_text: correctedText },
      });
      if (error || !data?.ok) toast.error(data?.message || "Erro na reanálise");
      else toast.success("Reanálise concluída com dados corrigidos!");
      queryClient.invalidateQueries({ queryKey: ["lab-analysis-runs", patientId] });
    } catch (err: any) {
      toast.error("Erro: " + (err.message || ""));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") return <Badge className="bg-clinical-safe text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Sucesso</Badge>;
    return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Falha</Badge>;
  };

  const getMethodLabel = (method: string | null) => {
    switch (method) {
      case "PDF_TEXT": return "PDF (texto)";
      case "OCR_PDF": return "PDF (OCR)";
      case "OCR_IMAGE": return "Imagem (OCR)";
      case "MANUAL": return "Texto manual";
      default: return method || "—";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload + Manual input */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileUploadAndAnalyze} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || isAnalyzing} className="flex-1">
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                : isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando...</>
                : <><Upload className="w-4 h-4 mr-2" /> Enviar Exame (PDF/Imagem)</>}
            </Button>
            <Button variant="outline" onClick={() => setShowManualInput(!showManualInput)} disabled={isAnalyzing}>
              <FileText className="w-4 h-4 mr-2" /> Colar Texto
            </Button>
          </div>

          {showManualInput && (
            <div className="space-y-3">
              <textarea value={manualText} onChange={(e) => setManualText(e.target.value)}
                placeholder="Cole aqui o texto do laudo laboratorial (mínimo 200 caracteres)..."
                className="w-full h-40 p-3 rounded-md border border-border bg-background text-foreground text-sm resize-y" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {manualText.length} caracteres {manualText.length < 200 && manualText.length > 0 ? "(mínimo 200)" : ""}
                </span>
                <Button onClick={handleManualAnalyze} disabled={isAnalyzing || manualText.trim().length < 200} size="sm">
                  {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Analisar com IA</>}
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Modo Clínico Seguro: dados incompletos são bloqueados. Apenas biomarcadores com valor, unidade e referência válidos são interpretados.
          </p>
        </CardContent>
      </Card>

      {/* Analysis history */}
      <div className="space-y-3">
        <h4 className="text-base font-medium text-foreground flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Análises Realizadas
        </h4>

        {isLoading ? (
          <Card className="bg-card border-border"><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></CardContent></Card>
        ) : labRuns && labRuns.length > 0 ? (
          <div className="space-y-3">
            {labRuns.map((run) => {
              const isExpanded = expandedRunId === run.id;
              const allLabs: NormalizedLabItem[] = run.normalized_json?.labs || [];
              const interpretable = allLabs.filter((l: any) => l.is_interpretable);
              const blocked = allLabs.filter((l: any) => !l.is_interpretable);
              const analysis = run.analysis_json;

              return (
                <Card key={run.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <button onClick={() => setExpandedRunId(isExpanded ? null : run.id)} className="w-full flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <FlaskConical className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(run.status)}
                            <Badge variant="outline" className="text-xs">{getMethodLabel(run.extraction_method)}</Badge>
                            {allLabs.length > 0 && (
                              <>
                                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30 gap-1">
                                  <ShieldCheck className="w-3 h-3" /> {interpretable.length}
                                </Badge>
                                {blocked.length > 0 && (
                                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/30 gap-1">
                                    <ShieldAlert className="w-3 h-3" /> {blocked.length}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(run.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-border pt-4">
                        {/* Error */}
                        {run.status === "failed" && run.error_code && (
                          <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                            <strong>Erro:</strong> {run.error_code}
                          </div>
                        )}

                        {/* Data Quality Panel */}
                        {allLabs.length > 0 && (
                          <Card className="bg-muted/30 border-border">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                Qualidade dos Dados
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex gap-4 text-sm">
                                <span className="text-emerald-700">✓ Interpretáveis: <strong>{interpretable.length}</strong></span>
                                <span className="text-amber-700">⚠ Bloqueados: <strong>{blocked.length}</strong></span>
                              </div>

                              {/* Blocked items */}
                              {blocked.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">Biomarcadores bloqueados:</p>
                                  {blocked.map((lab: any, idx: number) => {
                                    const labIndex = allLabs.indexOf(lab);
                                    const isEditing = editingLab?.runId === run.id && editingLab?.labIndex === labIndex;

                                    return (
                                      <div key={idx} className="p-2 bg-amber-500/5 border border-amber-500/20 rounded-md text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{lab.name}</span>
                                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"
                                            onClick={() => isEditing ? setEditingLab(null) : startEditLab(run.id, labIndex, lab)}>
                                            <Edit3 className="w-3 h-3" /> {isEditing ? "Cancelar" : "Corrigir"}
                                          </Button>
                                        </div>
                                        <div className="flex gap-3 text-muted-foreground">
                                          <span>Valor: {lab.value ?? "—"}</span>
                                          <span>Unidade: {lab.unit || "—"}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {(lab.blocking_reasons || []).map((r: string, ri: number) => (
                                            <Badge key={ri} variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/20">
                                              {BLOCKING_REASON_LABELS[r] || r}
                                            </Badge>
                                          ))}
                                        </div>
                                        {lab.source_line && (
                                          <p className="text-[10px] text-muted-foreground/70 font-mono truncate" title={lab.source_line}>
                                            Linha: {lab.source_line}
                                          </p>
                                        )}

                                        {/* Edit form */}
                                        {isEditing && (
                                          <div className="mt-2 p-2 bg-background rounded border border-border space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                              <div>
                                                <label className="text-[10px] text-muted-foreground">Valor</label>
                                                <Input value={editForm.value} onChange={(e) => setEditForm(p => ({ ...p, value: e.target.value }))}
                                                  placeholder="Ex: 4.5" className="h-7 text-xs" />
                                              </div>
                                              <div>
                                                <label className="text-[10px] text-muted-foreground">Unidade</label>
                                                <Select value={editForm.unit} onValueChange={(v) => setEditForm(p => ({ ...p, unit: v }))}>
                                                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                                                  <SelectContent>
                                                    {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                              <div>
                                                <label className="text-[10px] text-muted-foreground">Ref. Mín</label>
                                                <Input value={editForm.rangeMin} onChange={(e) => setEditForm(p => ({ ...p, rangeMin: e.target.value }))}
                                                  placeholder="Ex: 70" className="h-7 text-xs" />
                                              </div>
                                              <div>
                                                <label className="text-[10px] text-muted-foreground">Ref. Máx</label>
                                                <Input value={editForm.rangeMax} onChange={(e) => setEditForm(p => ({ ...p, rangeMax: e.target.value }))}
                                                  placeholder="Ex: 100" className="h-7 text-xs" />
                                              </div>
                                            </div>
                                            <Button size="sm" className="w-full h-7 text-xs gap-1" onClick={() => handleReanalyzeWithCorrections(run)}>
                                              <RotateCcw className="w-3 h-3" /> Aplicar e Reanalisar
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Interpretable biomarkers table */}
                        {interpretable.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              Biomarcadores Interpretados
                            </h5>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border text-muted-foreground">
                                    <th className="text-left py-2 pr-4">Exame</th>
                                    <th className="text-right py-2 pr-4">Valor</th>
                                    <th className="text-left py-2 pr-4">Unidade</th>
                                    <th className="text-left py-2 pr-4">Referência</th>
                                    <th className="text-center py-2 pr-2">Status</th>
                                    <th className="text-center py-2">Confiança</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {interpretable.map((lab: any, i: number) => (
                                    <tr key={i} className="border-b border-border/50">
                                      <td className="py-2 pr-4 font-medium">{lab.name}</td>
                                      <td className="py-2 pr-4 text-right tabular-nums">{lab.value !== null ? lab.value : "—"}</td>
                                      <td className="py-2 pr-4 text-muted-foreground">{lab.unit || "—"}</td>
                                      <td className="py-2 pr-4 text-muted-foreground text-xs">{lab.reference_range || "—"}</td>
                                      <td className="py-2 pr-2 text-center">
                                        {lab.flag === "high" && <Badge variant="destructive" className="text-xs">Alto</Badge>}
                                        {lab.flag === "low" && <Badge className="bg-clinical-caution text-white text-xs">Baixo</Badge>}
                                        {lab.flag === "normal" && <Badge className="bg-clinical-safe text-white text-xs">Normal</Badge>}
                                        {lab.flag === "unknown" && <Badge variant="outline" className="text-xs">—</Badge>}
                                      </td>
                                      <td className="py-2 text-center">
                                        <Badge variant="outline" className={`text-[10px] ${
                                          lab.parser_confidence === "high" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" :
                                          lab.parser_confidence === "medium" ? "bg-amber-500/10 text-amber-700 border-amber-500/30" :
                                          "bg-red-500/10 text-red-700 border-red-500/30"
                                        }`}>
                                          {lab.parser_confidence === "high" ? "Alta" : lab.parser_confidence === "medium" ? "Média" : "Baixa"}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* AI Analysis */}
                        {analysis && (
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Análise da IA
                            </h5>
                            {analysis.summary && (
                              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{analysis.summary}</p>
                            )}
                            {analysis.alerts && analysis.alerts.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {analysis.alerts.map((alert: any, i: number) => (
                                  <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded ${
                                    alert.severity === "high" ? "bg-destructive/10 text-destructive" :
                                    alert.severity === "medium" ? "bg-amber-500/10 text-amber-700" :
                                    "bg-sky-500/10 text-sky-700"
                                  }`}>
                                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                    <span>{alert.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {analysis.disclaimer && (
                              <p className="mt-2 text-[10px] text-muted-foreground italic">{analysis.disclaimer}</p>
                            )}
                          </div>
                        )}

                        {/* Warnings */}
                        {run.warnings && Array.isArray(run.warnings) && run.warnings.length > 0 && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {run.warnings.map((w: string, i: number) => (
                              <p key={i} className="flex items-start gap-1"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />{w}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma análise realizada</p>
              <p className="text-sm text-muted-foreground mt-1">Envie um PDF ou imagem de exame para iniciar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
