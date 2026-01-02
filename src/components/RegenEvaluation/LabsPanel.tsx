/**
 * Labs Panel - Entrada e validação de exames laboratoriais
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, FlaskConical, CheckCircle2, AlertTriangle, XCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  REQUIRED_CRITICAL_LABS, 
  CRITICAL_LAB_LABELS,
  RequiredCriticalLab
} from "@/types/regen-case-status";
import { computeDIE } from "@/lib/regen-engine";
import { RegenCanonical, RegenLabValue, defaultLabValue } from "@/types/regen-canonical";

interface LabsPanelProps {
  screeningId: string;
  canonical: RegenCanonical | null;
  labsValidated?: Record<string, { status: string; validity_days?: number }> | null;
  labsCollectedDate?: string | null;
  onSave?: () => void;
  disabled?: boolean;
}

interface LabInputState {
  value: string;
  date: string;
}

export function LabsPanel({
  screeningId,
  canonical,
  labsValidated,
  labsCollectedDate,
  onSave,
  disabled = false
}: LabsPanelProps) {
  const [labs, setLabs] = useState<Record<RequiredCriticalLab, LabInputState>>(() => {
    const initial: Record<string, LabInputState> = {};
    REQUIRED_CRITICAL_LABS.forEach(lab => {
      const labData = canonical?.labs?.[lab as keyof typeof canonical.labs];
      initial[lab] = {
        value: (labData as RegenLabValue)?.raw_value || "",
        date: labsCollectedDate || ""
      };
    });
    return initial as Record<RequiredCriticalLab, LabInputState>;
  });
  
  const [collectedDate, setCollectedDate] = useState(labsCollectedDate || "");
  const [isSaving, setIsSaving] = useState(false);
  const [validationResults, setValidationResults] = useState(labsValidated || null);

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

  const handleLabChange = (lab: RequiredCriticalLab, value: string) => {
    setLabs(prev => ({
      ...prev,
      [lab]: { ...prev[lab], value }
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
      
      REQUIRED_CRITICAL_LABS.forEach(lab => {
        const rawValue = labs[lab].value.trim();
        const parsed = parseFloat(rawValue.replace(",", "."));
        
        updatedLabs[lab] = {
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
      const newValidation: Record<string, { status: string; validity_days?: number }> = {};
      dieResult.lab_recommendations.forEach(lab => {
        newValidation[lab.lab_code] = {
          status: lab.status,
          validity_days: lab.days_since_collection || undefined
        };
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
      
      // Verificar se todos os labs críticos estão USE para atualizar status
      const allValid = REQUIRED_CRITICAL_LABS.every(lab => 
        newValidation[lab]?.status === "USE"
      );
      
      if (allValid) {
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

  const allLabsValid = REQUIRED_CRITICAL_LABS.every(lab => 
    validationResults?.[lab]?.status === "USE"
  );

  return (
    <Card className={allLabsValid ? "border-green-500/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              Exames Laboratoriais
              {allLabsValid && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </CardTitle>
            <CardDescription>
              Exames críticos obrigatórios para Score Definitivo
            </CardDescription>
          </div>
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

        {/* Labs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REQUIRED_CRITICAL_LABS.map(lab => (
            <div key={lab} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`lab-${lab}`} className="text-sm font-medium">
                  {CRITICAL_LAB_LABELS[lab]}
                </Label>
                <Input
                  id={`lab-${lab}`}
                  type="text"
                  placeholder="Valor"
                  value={labs[lab].value}
                  onChange={(e) => handleLabChange(lab, e.target.value)}
                  disabled={disabled}
                  className="h-9"
                />
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(validationResults?.[lab]?.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {allLabsValid ? (
              <span className="text-green-600">✓ Todos os exames válidos (USE)</span>
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
    </Card>
  );
}