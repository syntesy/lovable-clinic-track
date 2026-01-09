/**
 * REGEN RESULT HEADER
 * Header com informações de versão e auditoria
 */

import { Badge } from "@/components/ui/badge";
import { RegenEngineOutputs } from "@/types/regen-engine";
import { RegenCanonical } from "@/types/regen-canonical";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoRegenapp from "@/assets/logo-regenapp-new.png";

interface ResultHeaderProps {
  engineOutputs: RegenEngineOutputs;
  canonical?: RegenCanonical;
  caseId?: string;
  patientName?: string;
}

export function ResultHeader({ engineOutputs, canonical, caseId, patientName }: ResultHeaderProps) {
  const computedDate = engineOutputs.computed_at
    ? format(new Date(engineOutputs.computed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : "—";

  return (
    <div className="mb-6">
      {/* Logo / Title */}
      <div className="text-center mb-4">
        <img src={logoRegenapp} alt="SYNTESY" className="h-10 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">Resultado da Avaliação Clínica</p>
      </div>

      {/* Patient name if available */}
      {patientName && (
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">Paciente:</p>
          <p className="text-lg font-semibold">{patientName}</p>
        </div>
      )}

      {/* Versioning badges */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <Badge variant="outline" className="font-mono text-xs">
          Motor: {engineOutputs.engine_version}
        </Badge>
        <Badge variant="outline" className="font-mono text-xs">
          Regras: {engineOutputs.ruleset_version}
        </Badge>
        {canonical?.schema_version && (
          <Badge variant="outline" className="font-mono text-xs">
            Schema: {canonical.schema_version}
          </Badge>
        )}
        {caseId && (
          <Badge variant="secondary" className="font-mono text-xs">
            Caso: {caseId}
          </Badge>
        )}
      </div>

      {/* Computed date */}
      <div className="text-center text-sm text-muted-foreground">
        Calculado em: {computedDate}
      </div>
    </div>
  );
}
