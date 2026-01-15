/**
 * Dynamic Labs Panel - Entrada e validação de exames laboratoriais
 * 
 * REGRA FUNDAMENTAL: Os exames são definidos pela Triagem de Ortobiológicos.
 * Este componente apenas coleta e valida os exames solicitados.
 * 
 * UX FINAL:
 * - Badge S2 no topo (APTO/PENDENTE/INDISPONÍVEL)
 * - Microlegendas por exame
 * - Resumo automático
 * - Mensagens de bloqueio claras
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Save, 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  Info,
  Shield,
  ShieldAlert,
  ShieldX,
  ClipboardList
} from "lucide-react";
import { ExamRequestModal } from "./ExamRequestModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { computeDIE } from "@/lib/regen-engine";
import { RegenCanonical, RegenLabValue, defaultLabValue } from "@/types/regen-canonical";
import { DynamicLabsChecklist } from "./DynamicLabsChecklist";
import { 
  TriageExamItem, 
  extractExamsFromTriage, 
  updateExamsWithValidation,
  areAllCriticalExamsValid,
  hasTriageExams,
  getCriticalExams
} from "@/types/triage-exams";
import { ExamGroup } from "@/types/screening";

interface DynamicLabsPanelProps {
  screeningId: string;
  canonical: RegenCanonical | null;
  analysisResult: string | null;
  recommendedExams: ExamGroup[] | unknown[] | null;
  labsValidated?: Record<string, { 
    status: string; 
    value?: number | null;
    date?: string | null;
    validity_days?: number;
  }> | null;
  labsCollectedDate?: string | null;
  onSave?: () => void;
  disabled?: boolean;
  patientName?: string;
}

interface LabInputState {
  value: string;
  date: string;
}

/**
 * Badge S2 Component - Exibe status de aptidão para Score Definitivo
 */
function S2StatusBadge({ triageExams }: { triageExams: TriageExamItem[] }) {
  if (!hasTriageExams(triageExams)) {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground border-muted">
        <ShieldX className="h-3.5 w-3.5" />
        S2: INDISPONÍVEL
      </Badge>
    );
  }

  const allCriticalValid = areAllCriticalExamsValid(triageExams);

  if (allCriticalValid) {
    return (
      <Badge className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
        <Shield className="h-3.5 w-3.5" />
        S2: APTO
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700">
      <ShieldAlert className="h-3.5 w-3.5" />
      S2: PENDENTE
    </Badge>
  );
}

/**
 * Microlegenda por exame (para inputs)
 */
function ExamInputMicroBadge({ exam }: { exam: TriageExamItem }) {
  if (exam.status === "desatualizado") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400">
            DESATUALIZADO
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Coletado há mais de 90 dias — repetir exame.
        </TooltipContent>
      </Tooltip>
    );
  }

  if (exam.status === "pendente") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400">
            PENDENTE
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Aguardando inserção do resultado.
        </TooltipContent>
      </Tooltip>
    );
  }

  if (exam.status === "válido") {
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3 mr-0.5" />
        OK
      </Badge>
    );
  }

  return null;
}

export function DynamicLabsPanel({
  screeningId,
  canonical,
  analysisResult,
  recommendedExams,
  labsValidated,
  labsCollectedDate,
  onSave,
  disabled = false,
  patientName
}: DynamicLabsPanelProps) {
  const [examModalOpen, setExamModalOpen] = useState(false);
  // Extrair exames da triagem (fonte única de verdade)
  const triageExams = useMemo(() => {
    const exams = extractExamsFromTriage(analysisResult, recommendedExams);
    return updateExamsWithValidation(exams, labsValidated || null, labsCollectedDate || null);
  }, [analysisResult, recommendedExams, labsValidated, labsCollectedDate]);

  // Estado dos inputs de laboratório
  const [labs, setLabs] = useState<Record<string, LabInputState>>(() => {
    const initial: Record<string, LabInputState> = {};
    triageExams.forEach(exam => {
      const labData = canonical?.labs?.[exam.code as keyof typeof canonical.labs];
      initial[exam.code] = {
        value: (labData as RegenLabValue)?.raw_value || "",
        date: labsCollectedDate || ""
      };
    });
    return initial;
  });
  
  const [collectedDate, setCollectedDate] = useState(labsCollectedDate || "");
  const [isSaving, setIsSaving] = useState(false);
  const [validationResults, setValidationResults] = useState(labsValidated || null);

  // BLOQUEIO SEM TRIAGEM: Se não há exames da triagem, bloquear todas as ações
  const hasExams = hasTriageExams(triageExams);
  
  if (!hasExams) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              Exames Laboratoriais
            </CardTitle>
            <S2StatusBadge triageExams={triageExams} />
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Nenhuma triagem de ortobiológicos encontrada para este paciente.</strong>
              <br />
              <span className="text-sm">
                Crie uma triagem de ortobiológicos para definir os exames.
              </span>
              <br />
              <em className="text-xs text-muted-foreground">
                Ações bloqueadas: salvar exames, validar exames, avançar status clínico (S2).
              </em>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "USE":
        return (
          <Badge className="bg-green-500 text-white gap-1">
            <CheckCircle2 className="w-3 h-3" />
            USE
          </Badge>
        );
      case "REPEAT":
        return (
          <Badge className="bg-yellow-500 text-white gap-1">
            <AlertTriangle className="w-3 h-3" />
            REPETIR
          </Badge>
        );
      case "REQUEST":
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="w-3 h-3" />
            SOLICITAR
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Não avaliado
          </Badge>
        );
    }
  };

  const handleLabChange = (examCode: string, value: string) => {
    setLabs(prev => ({
      ...prev,
      [examCode]: { ...prev[examCode], value }
    }));
  };

  const handleSaveAndValidate = async () => {
    if (!screeningId || !collectedDate) {
      toast.error("Informe a data de coleta dos exames");
      return;
    }
    
    setIsSaving(true);
    try {
      // Construir o canonical atualizado com os labs
      const updatedLabs: Record<string, RegenLabValue> = {};
      
      triageExams.forEach(exam => {
        const rawValue = labs[exam.code]?.value?.trim() || "";
        const parsed = parseFloat(rawValue.replace(",", "."));
        
        updatedLabs[exam.code] = {
          raw_value: rawValue || null,
          parsed_value: isNaN(parsed) ? null : parsed,
          unit: null,
          parsed_ok: !isNaN(parsed) && rawValue !== "",
          notes: null
        };
      });

      // Executar DIE para validar
      const mockCanonical: RegenCanonical = {
        ...(canonical || {} as RegenCanonical),
        schema_version: "regen_canonical_v1",
        captured_at: new Date().toISOString(),
        labs: {
          ...updatedLabs,
          hematocrit: canonical?.labs?.hematocrit || defaultLabValue,
          glucose: canonical?.labs?.glucose || defaultLabValue,
          collected_date: collectedDate,
          source: "manual"
        } as RegenCanonical["labs"]
      };

      const dieResult = computeDIE(mockCanonical);
      
      // Mapear resultados do DIE para formato de validação
      const newValidation: Record<string, { 
        status: string; 
        value: number | null; 
        date: string | null;
        validity_days?: number;
      }> = {};
      
      // Para cada exame da triagem
      triageExams.forEach(exam => {
        const dieRec = dieResult.lab_recommendations.find(r => r.lab_code === exam.code);
        const labInput = labs[exam.code];
        const parsedValue = labInput ? parseFloat(labInput.value.replace(",", ".")) : null;
        
        if (dieRec) {
          newValidation[exam.code] = {
            status: dieRec.status,
            value: !isNaN(parsedValue as number) ? parsedValue : null,
            date: collectedDate || null,
            validity_days: dieRec.days_since_collection || undefined
          };
        } else {
          // Se não há recomendação DIE, determinar status baseado no valor
          newValidation[exam.code] = {
            status: labInput?.value?.trim() ? "USE" : "REQUEST",
            value: !isNaN(parsedValue as number) ? parsedValue : null,
            date: collectedDate || null
          };
        }
      });
      
      setValidationResults(newValidation);

      // Salvar no banco
      const { error } = await supabase
        .from("prp_screenings")
        .update({
          labs_validated: newValidation,
          labs_collected_date: collectedDate,
          canonical_updated_at: new Date().toISOString()
        })
        .eq("id", screeningId);
      
      if (error) throw error;
      
      // Verificar se todos os labs críticos estão válidos
      const updatedExams = updateExamsWithValidation(
        triageExams,
        newValidation,
        collectedDate
      );
      const allCriticalValid = areAllCriticalExamsValid(updatedExams);
      
      if (allCriticalValid) {
        // Atualizar para S2
        await supabase
          .from("prp_screenings")
          .update({ regen_case_status: "S2" })
          .eq("id", screeningId);
        
        toast.success("Exames validados! Pronto para gerar Score Definitivo.");
      } else {
        toast.success("Exames salvos. Alguns precisam ser repetidos ou solicitados.");
      }
      
      onSave?.();
    } catch (error) {
      console.error("Error saving labs:", error);
      toast.error("Erro ao salvar exames");
    } finally {
      setIsSaving(false);
    }
  };

  const updatedTriageExams = updateExamsWithValidation(
    triageExams,
    validationResults,
    collectedDate
  );
  const allCriticalValid = areAllCriticalExamsValid(updatedTriageExams);
  const criticalExams = updatedTriageExams.filter(e => e.is_critical);
  const optionalExams = updatedTriageExams.filter(e => !e.is_critical);

  // Resumo para header
  const validCriticalCount = criticalExams.filter(e => e.status === "válido").length;
  const validOptionalCount = optionalExams.filter(e => e.status === "válido").length;

  return (
    <Card className={allCriticalValid ? "border-green-500/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              Exames Laboratoriais
              {allCriticalValid && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </CardTitle>
            <CardDescription>
              Exames definidos pela Triagem de Ortobiológicos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExamModalOpen(true)}
              className="gap-1.5"
            >
              <ClipboardList className="w-4 h-4" />
              Ver Solicitação
            </Button>
            <S2StatusBadge triageExams={updatedTriageExams} />
          </div>
        </div>
        
        {/* Resumo automático */}
        <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md mt-2">
          Críticos: {validCriticalCount} válidos de {criticalExams.length}
          {optionalExams.length > 0 && ` · Opcionais: ${validOptionalCount} de ${optionalExams.length}`}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data de Coleta */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <Label htmlFor="collection-date" className="text-sm">
              Data de Coleta dos Exames
            </Label>
            <Input
              id="collection-date"
              type="date"
              value={collectedDate}
              onChange={(e) => setCollectedDate(e.target.value)}
              disabled={disabled}
              className="max-w-[200px] mt-1"
            />
          </div>
        </div>

        {/* Mensagem de bloqueio S2 pendente */}
        {!allCriticalValid && criticalExams.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-sm">
            <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-300">
              Preencha e valide todos os exames críticos para avançar.
            </span>
          </div>
        )}

        {/* Exames Críticos */}
        {criticalExams.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Exames Críticos ({criticalExams.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalExams.map(exam => (
                <div key={exam.code} className="flex items-center gap-3 p-3 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`lab-${exam.code}`} className="text-sm font-medium">
                        {exam.label}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-800/30 dark:text-amber-400">
                            CRÍTICO
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Necessário para avançar no preparo.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id={`lab-${exam.code}`}
                      type="text"
                      placeholder="Valor"
                      value={labs[exam.code]?.value || ""}
                      onChange={(e) => handleLabChange(exam.code, e.target.value)}
                      disabled={disabled}
                      className="h-9"
                    />
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-1 items-end">
                    {getStatusBadge(validationResults?.[exam.code]?.status)}
                    <ExamInputMicroBadge exam={exam} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exames Opcionais */}
        {optionalExams.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Exames Complementares ({optionalExams.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optionalExams.map(exam => (
                <div key={exam.code} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`lab-${exam.code}`} className="text-sm font-medium">
                      {exam.label}
                    </Label>
                    <Input
                      id={`lab-${exam.code}`}
                      type="text"
                      placeholder="Valor"
                      value={labs[exam.code]?.value || ""}
                      onChange={(e) => handleLabChange(exam.code, e.target.value)}
                      disabled={disabled}
                      className="h-9"
                    />
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-1 items-end">
                    {getStatusBadge(validationResults?.[exam.code]?.status)}
                    <ExamInputMicroBadge exam={exam} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Visual */}
        <div className="border-t pt-4">
          <DynamicLabsChecklist 
            triageExams={updatedTriageExams}
            labsValidated={validationResults}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {allCriticalValid ? (
              <span className="text-green-600">✓ Todos os exames críticos válidos</span>
            ) : (
              <span>Exames serão validados ao salvar</span>
            )}
          </div>
          <Button 
            onClick={handleSaveAndValidate} 
            disabled={disabled || isSaving || !collectedDate}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Salvando..." : "Salvar e Validar Exames"}
          </Button>
        </div>
      </CardContent>

      {/* Modal de Solicitação de Exames */}
      <ExamRequestModal
        open={examModalOpen}
        onOpenChange={setExamModalOpen}
        patientName={patientName}
        recommendedExams={updatedTriageExams.map(e => e.code)}
      />
    </Card>
  );
}
