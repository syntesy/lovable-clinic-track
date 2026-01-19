import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle, FileText, Edit, AlertCircle, TrendingUp, Users, Minus } from "lucide-react";
import { ClinicalStandardWizard } from "./ClinicalStandardWizard";
import { useProcedureStandardRecord } from "@/hooks/useClinicalStandard";
import { useClusterOutcomes, TrendInfo } from "@/hooks/useCollectiveOutcomes";
import { PATHOLOGY_OPTIONS, ANATOMIC_REGION_OPTIONS } from "@/types/clinical-standard";
import { getStatusBadgeConfig, getDefaultMessage, type ClinicalStandardStatus } from "@/lib/clinical-standard-evaluator";
import { humanReadableClusterKey } from "@/lib/cluster-signature-generator";

interface ClinicalStandardCardProps {
  attendanceId: string;
  isClosed: boolean;
}

function TrendBadge({ trend }: { trend: TrendInfo }) {
  const colorClasses: Record<string, string> = {
    neutral: 'bg-muted text-muted-foreground',
    warning: 'bg-clinical-warning/20 text-clinical-warning',
    success: 'bg-clinical-safe/20 text-clinical-safe',
  };
  const Icon = trend.color === 'success' ? TrendingUp : Minus;
  return (
    <Badge variant="outline" className={`${colorClasses[trend.color]} gap-1`}>
      <Icon className="h-3 w-3" />
      {trend.label}
    </Badge>
  );
}

export function ClinicalStandardCard({ attendanceId, isClosed }: ClinicalStandardCardProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { data: existingRecord, isLoading } = useProcedureStandardRecord(attendanceId);
  const { data: clusterData } = useClusterOutcomes(existingRecord?.cluster_key);

  const pathologyLabel = PATHOLOGY_OPTIONS.find(p => p.value === existingRecord?.pathology)?.label;
  const regionLabel = ANATOMIC_REGION_OPTIONS.find(r => r.value === existingRecord?.anatomic_region)?.label;

  const status = (existingRecord?.clinical_standard_status || 'not_eligible') as ClinicalStandardStatus;
  const notes = existingRecord?.clinical_standard_notes || [];
  const statusConfig = getStatusBadgeConfig(status);
  const defaultMessage = getDefaultMessage(status, notes.length > 0);

  const hasClusterData = clusterData && clusterData.n_outcomes_used_pain_m3 >= 5;

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-primary" />
              Clinical Standard Engine
            </CardTitle>
            {existingRecord && (
              <Badge variant="outline" className="bg-clinical-safe/10 text-clinical-safe border-clinical-safe/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Registrado
              </Badge>
            )}
          </div>
          <CardDescription>
            Coleta de dados padronizados para inteligência clínica coletiva
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="h-16 flex items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : existingRecord ? (
            <div className="space-y-4">
              {/* Protocol info badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <FileText className="w-3 h-3 mr-1" />
                  {existingRecord.procedure_type}
                </Badge>
                <Badge variant="outline">{pathologyLabel}</Badge>
                <Badge variant="outline">{regionLabel}</Badge>
              </div>

              {/* Scientific Status Block */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{statusConfig.icon}</span>
                  <Badge className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Notes list or default message */}
                <div className="space-y-1.5">
                  {notes.length > 0 ? (
                    notes.map((note, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-clinical-warning" />
                        <span>{note}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{defaultMessage}</p>
                  )}
                </div>
              </div>

              {/* Cluster Trend Summary (Anonymous) */}
              {existingRecord.cluster_key && (
                <div className="bg-primary/5 rounded-lg p-4 space-y-3 border border-primary/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Tendência do Cluster (anônimo)</span>
                  </div>
                  
                  {hasClusterData ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {humanReadableClusterKey(existingRecord.cluster_key)}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Δ Dor (3m): </span>
                          {clusterData.mean_delta_pain_m3 !== null ? (
                            <span className={clusterData.mean_delta_pain_m3 > 0 ? 'text-clinical-safe font-medium' : ''}>
                              {clusterData.mean_delta_pain_m3 > 0 ? '-' : '+'}{Math.abs(clusterData.mean_delta_pain_m3)} pts
                              <span className="text-xs text-muted-foreground ml-1">(n={clusterData.n_outcomes_used_pain_m3})</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Resp. ≥30%: </span>
                          {clusterData.response_rate_pain_30_m3 !== null ? (
                            <span className={clusterData.response_rate_pain_30_m3 >= 50 ? 'text-clinical-safe font-medium' : ''}>
                              {clusterData.response_rate_pain_30_m3}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                      <div className="pt-1">
                        <TrendBadge trend={clusterData.trend_m3} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Dados insuficientes para exibir resultados anônimos deste cluster (mínimo 5 casos com outcomes).
                    </p>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-muted-foreground">
                Protocolo registrado em{" "}
                {new Date(existingRecord.created_at).toLocaleDateString("pt-BR")}
                {existingRecord.last_evaluated_at && (
                  <> • Avaliado em {new Date(existingRecord.last_evaluated_at).toLocaleDateString("pt-BR")}</>
                )}
              </p>

              {/* Edit button */}
              {!isClosed && (
                <Button
                  variant="outline"
                  onClick={() => setIsWizardOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Protocolo Padronizado
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Este formulário coleta dados estruturados essenciais para padronização clínica.
                Não substitui o prontuário tradicional.
              </p>
              <Button
                onClick={() => setIsWizardOpen(true)}
                disabled={isClosed}
                className="w-full sm:w-auto"
              >
                <Database className="w-4 h-4 mr-2" />
                Registrar Protocolo Padronizado
              </Button>
              {isClosed && (
                <p className="text-xs text-muted-foreground">
                  Atendimento concluído — registro não disponível.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ClinicalStandardWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        attendanceId={attendanceId}
      />
    </>
  );
}
