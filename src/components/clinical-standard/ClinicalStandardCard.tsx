import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle, FileText } from "lucide-react";
import { ClinicalStandardWizard } from "./ClinicalStandardWizard";
import { useProcedureStandardRecord } from "@/hooks/useClinicalStandard";
import { PATHOLOGY_OPTIONS, ANATOMIC_REGION_OPTIONS } from "@/types/clinical-standard";

interface ClinicalStandardCardProps {
  attendanceId: string;
  isClosed: boolean;
}

export function ClinicalStandardCard({ attendanceId, isClosed }: ClinicalStandardCardProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { data: existingRecord, isLoading } = useProcedureStandardRecord(attendanceId);

  const pathologyLabel = PATHOLOGY_OPTIONS.find(p => p.value === existingRecord?.pathology)?.label;
  const regionLabel = ANATOMIC_REGION_OPTIONS.find(r => r.value === existingRecord?.anatomic_region)?.label;

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
        <CardContent>
          {isLoading ? (
            <div className="h-16 flex items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : existingRecord ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <FileText className="w-3 h-3 mr-1" />
                  {existingRecord.procedure_type}
                </Badge>
                <Badge variant="outline">{pathologyLabel}</Badge>
                <Badge variant="outline">{regionLabel}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Protocolo padronizado registrado em{" "}
                {new Date(existingRecord.created_at).toLocaleDateString("pt-BR")}
              </p>
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
