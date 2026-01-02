/**
 * Triagem Summary - Exibe resumo da triagem como READ-ONLY
 * Dados coletados por secretária/paciente (AUTORRELATO)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, User, Stethoscope, Pill, Activity, Apple, Moon } from "lucide-react";
import { RegenCanonical } from "@/types/regen-canonical";

interface TriageSummaryProps {
  canonical: RegenCanonical | null;
  rawAnswers?: Record<string, unknown> | null;
}

export function TriageSummary({ canonical, rawAnswers }: TriageSummaryProps) {
  if (!canonical && !rawAnswers) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma triagem encontrada para este caso.</p>
        </CardContent>
      </Card>
    );
  }

  const getSafetyWarnings = () => {
    if (!canonical) return [];
    const warnings: string[] = [];
    
    if (canonical.safety.cancer_tx_now_or_last_12m === "yes") {
      warnings.push("Tratamento oncológico nos últimos 12 meses");
    }
    if (canonical.safety.fever_last_7d === "yes") {
      warnings.push("Febre nos últimos 7 dias");
    }
    if (canonical.safety.open_wound_or_skin_infection_at_pain_site === "yes") {
      warnings.push("Ferida aberta ou infecção no local");
    }
    if (canonical.safety.active_infection) {
      warnings.push("Infecção ativa");
    }
    if (canonical.safety.autoimmune_disease_active) {
      warnings.push("Doença autoimune em atividade");
    }
    
    return warnings;
  };

  const safetyWarnings = getSafetyWarnings();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Resumo da Triagem
            </CardTitle>
            <CardDescription>Dados coletados via questionário (autorrelato)</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            AUTORRELATO
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Safety Warnings */}
        {safetyWarnings.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              Red Flags Reportados (não confirmados clinicamente)
            </div>
            <ul className="text-sm text-destructive/80 space-y-1 ml-6 list-disc">
              {safetyWarnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Queixa Principal */}
        {canonical?.complaint && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Stethoscope className="w-4 h-4" />
              Queixa Principal
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Região:</span>{" "}
                {canonical.complaint.pain_region || canonical.complaint.pain_region_text || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Dor (EVA):</span>{" "}
                {canonical.complaint.pain_nrs ?? "—"}/10
              </div>
              <div>
                <span className="text-muted-foreground">Duração:</span>{" "}
                {canonical.complaint.symptom_duration_bucket === "lt_3m" ? "< 3 meses" :
                 canonical.complaint.symptom_duration_bucket === "m3_6" ? "3-6 meses" :
                 canonical.complaint.symptom_duration_bucket === "gt_6m" ? "> 6 meses" : "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Diagnóstico Suspeito:</span>{" "}
                {canonical.complaint.suspected_diagnosis || "—"}
              </div>
            </div>
          </div>
        )}

        {/* Medicamentos */}
        {canonical?.medications && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Pill className="w-4 h-4" />
              Medicamentos Relevantes
            </div>
            <div className="flex flex-wrap gap-2">
              {canonical.medications.nsaid_recent_14d === "yes" && (
                <Badge variant="secondary">AINE (últimos 14 dias)</Badge>
              )}
              {canonical.medications.steroid_recent === "yes" && (
                <Badge variant="secondary">Corticoide recente</Badge>
              )}
              {canonical.medications.anticoagulant && (
                <Badge variant="secondary">Anticoagulante</Badge>
              )}
              {canonical.medications.immunosuppressor && (
                <Badge variant="secondary">Imunossupressor</Badge>
              )}
              {canonical.medications.aspirin && (
                <Badge variant="secondary">AAS</Badge>
              )}
              {canonical.medications.p2y12 && (
                <Badge variant="secondary">Inibidor P2Y12</Badge>
              )}
              {!canonical.medications.nsaid_recent_14d && 
               !canonical.medications.steroid_recent &&
               !canonical.medications.anticoagulant &&
               !canonical.medications.immunosuppressor &&
               !canonical.medications.aspirin &&
               !canonical.medications.p2y12 && (
                <span className="text-muted-foreground text-sm">Nenhum medicamento relevante reportado</span>
              )}
            </div>
          </div>
        )}

        {/* Solo Biológico */}
        {canonical?.biological_soil && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="w-4 h-4" />
              Fatores Biológicos
            </div>
            <div className="flex flex-wrap gap-2">
              {canonical.biological_soil.anemia_or_low_iron_or_low_b12 && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  Anemia/Deficiência de Ferro ou B12
                </Badge>
              )}
              {canonical.biological_soil.smoker && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  Tabagista
                </Badge>
              )}
              {canonical.biological_soil.high_bmi && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  IMC Elevado
                </Badge>
              )}
              {canonical.biological_soil.no_recent_labs && (
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  Sem exames recentes
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Nutrição */}
        {canonical?.nutrition && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Apple className="w-4 h-4" />
              Nutrição
            </div>
            <div className="flex flex-wrap gap-2">
              {canonical.nutrition.low_sun_vitd && (
                <Badge variant="outline">Baixa exposição solar/Vit D</Badge>
              )}
              {canonical.nutrition.restrictive_diet && (
                <Badge variant="outline">Dieta restritiva</Badge>
              )}
              {canonical.nutrition.low_fruit_veg && (
                <Badge variant="outline">Baixo consumo de frutas/vegetais</Badge>
              )}
            </div>
          </div>
        )}

        {/* Estilo de Vida */}
        {canonical?.lifestyle && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Moon className="w-4 h-4" />
              Estilo de Vida
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Sono:</span>{" "}
                {canonical.lifestyle.sleep_quality || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Álcool (&gt;2x/sem):</span>{" "}
                {canonical.lifestyle.alcohol_gt_2wk ? "Sim" : "Não"}
              </div>
              <div>
                <span className="text-muted-foreground">Estresse:</span>{" "}
                {canonical.lifestyle.perceived_stress || "—"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}