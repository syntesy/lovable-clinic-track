import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload, FileText, Image, Loader2, AlertCircle, CheckCircle2,
  XCircle, FlaskConical, ChevronDown, ChevronUp, Sparkles, Clock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export function PatientExamUploadAnalysis({ patientId, patientName }: PatientExamUploadAnalysisProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualText, setManualText] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  // Fetch lab analysis runs for this patient
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

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Use JPG, PNG, WEBP ou PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB).");
      return;
    }

    setIsUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const storagePath = `${patientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("exam-files")
        .upload(storagePath, file);

      if (uploadError) {
        toast.error("Erro ao enviar arquivo.");
        console.error(uploadError);
        return;
      }

      setIsUploading(false);
      setIsAnalyzing(true);

      // Call analyze-labs with patient_id
      const { data, error } = await supabase.functions.invoke("analyze-labs", {
        body: {
          patient_id: patientId,
          bucket: "exam-files",
          storage_path: storagePath,
          mime_type: file.type,
          file_name: file.name,
        },
      });

      if (error || !data?.ok) {
        const errMsg = data?.message || error?.message || "Erro na análise";
        toast.error(errMsg);
        console.error("Analyze error:", data || error);
      } else {
        toast.success(`Análise concluída: ${data.normalized?.labs?.length || 0} biomarcadores identificados`);
      }

      queryClient.invalidateQueries({ queryKey: ["lab-analysis-runs", patientId] });
    } catch (err: any) {
      toast.error("Erro inesperado: " + (err.message || ""));
      console.error(err);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManualAnalyze = async () => {
    if (!manualText.trim() || manualText.trim().length < 200) {
      toast.error("Texto muito curto (mínimo 200 caracteres). Cole o laudo completo.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-labs", {
        body: {
          patient_id: patientId,
          raw_text: manualText.trim(),
        },
      });

      if (error || !data?.ok) {
        toast.error(data?.message || error?.message || "Erro na análise");
      } else {
        toast.success(`Análise concluída: ${data.normalized?.labs?.length || 0} biomarcadores`);
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
      {/* Upload + Manual input section */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileUploadAndAnalyze}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isAnalyzing}
              className="flex-1"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
              ) : isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Enviar Exame (PDF/Imagem)</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowManualInput(!showManualInput)}
              disabled={isAnalyzing}
            >
              <FileText className="w-4 h-4 mr-2" />
              Colar Texto
            </Button>
          </div>

          {showManualInput && (
            <div className="space-y-3">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Cole aqui o texto do laudo laboratorial (mínimo 200 caracteres)..."
                className="w-full h-40 p-3 rounded-md border border-border bg-background text-foreground text-sm resize-y"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {manualText.length} caracteres {manualText.length < 200 && manualText.length > 0 ? "(mínimo 200)" : ""}
                </span>
                <Button
                  onClick={handleManualAnalyze}
                  disabled={isAnalyzing || manualText.trim().length < 200}
                  size="sm"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Analisar com IA</>
                  )}
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            O sistema extrai automaticamente os valores dos exames via OCR/Vision e analisa com IA.
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
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </CardContent>
          </Card>
        ) : labRuns && labRuns.length > 0 ? (
          <div className="space-y-3">
            {labRuns.map((run) => {
              const isExpanded = expandedRunId === run.id;
              const labs = run.normalized_json?.labs || [];
              const analysis = run.analysis_json;

              return (
                <Card key={run.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    {/* Header */}
                    <button
                      onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <FlaskConical className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(run.status)}
                            <Badge variant="outline" className="text-xs">
                              {getMethodLabel(run.extraction_method)}
                            </Badge>
                            {labs.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {labs.length} biomarcadores
                              </span>
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

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-border pt-4">
                        {/* Error info */}
                        {run.status === "failed" && run.error_code && (
                          <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                            <strong>Erro:</strong> {run.error_code}
                          </div>
                        )}

                        {/* Biomarkers table */}
                        {labs.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Biomarcadores Extraídos</h5>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border text-muted-foreground">
                                    <th className="text-left py-2 pr-4">Exame</th>
                                    <th className="text-right py-2 pr-4">Valor</th>
                                    <th className="text-left py-2 pr-4">Unidade</th>
                                    <th className="text-left py-2 pr-4">Referência</th>
                                    <th className="text-center py-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {labs.map((lab: any, i: number) => (
                                    <tr key={i} className="border-b border-border/50">
                                      <td className="py-2 pr-4 font-medium">{lab.name}</td>
                                      <td className="py-2 pr-4 text-right tabular-nums">
                                        {lab.value !== null ? lab.value : "—"}
                                      </td>
                                      <td className="py-2 pr-4 text-muted-foreground">{lab.unit || "—"}</td>
                                      <td className="py-2 pr-4 text-muted-foreground text-xs">{lab.reference_range || "—"}</td>
                                      <td className="py-2 text-center">
                                        {lab.flag === "high" && <Badge variant="destructive" className="text-xs">Alto</Badge>}
                                        {lab.flag === "low" && <Badge className="bg-clinical-caution text-white text-xs">Baixo</Badge>}
                                        {lab.flag === "normal" && <Badge className="bg-clinical-safe text-white text-xs">Normal</Badge>}
                                        {lab.flag === "unknown" && <Badge variant="outline" className="text-xs">—</Badge>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* AI Analysis summary */}
                        {analysis && (
                          <div>
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Análise da IA
                            </h5>
                            {analysis.summary && (
                              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                                {analysis.summary}
                              </p>
                            )}
                            {analysis.alerts && analysis.alerts.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {analysis.alerts.map((alert: any, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-xs p-2 bg-destructive/5 rounded">
                                    <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                                    <span>{alert.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Warnings */}
                        {run.warnings && Array.isArray(run.warnings) && run.warnings.length > 0 && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {run.warnings.map((w: string, i: number) => (
                              <p key={i} className="flex items-start gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                {w}
                              </p>
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
              <p className="text-sm text-muted-foreground mt-1">
                Envie um PDF ou imagem de exame para iniciar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
