/**
 * ObservationalRegistryCard - Card de status do Registro Observacional
 * 
 * Exibe status e permite opt-in para inclusão no registro.
 * Camada paralela - NÃO altera motor clínico.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useObservationalRegistry } from "@/hooks/useObservationalRegistry";
import { ObservationalConsentModal } from "./ObservationalConsentModal";
import { ObservationalFollowupForm } from "./ObservationalFollowupForm";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ObservationalRegistryCardProps {
  patientId: string;
  screeningId?: string;
  caseStatus?: 'S0' | 'S1' | 'S2' | 'S3';
  /** Código do item da taxonomia vinculado ao caso (opcional) */
  therapyItemCode?: string | null;
}

export function ObservationalRegistryCard({
  patientId,
  screeningId,
  caseStatus,
  therapyItemCode
}: ObservationalRegistryCardProps) {
  const {
    status,
    loading,
    hasConsent,
    registryCase,
    includeInRegistry,
    withdrawConsent,
    captureFollowup,
    getFollowups
  } = useObservationalRegistry(patientId, screeningId);

  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [existingFollowups, setExistingFollowups] = useState<number[]>([]);

  // Load existing followups when expanding
  const handleFollowupToggle = async () => {
    if (!followupOpen && hasConsent) {
      const followups = await getFollowups();
      setExistingFollowups(followups.map((f: { timepoint: number }) => f.timepoint));
    }
    setFollowupOpen(!followupOpen);
  };

  const handleAcceptConsent = async () => {
    const success = await includeInRegistry();
    if (success) {
      setConsentModalOpen(false);
    }
  };

  const handleDeclineConsent = () => {
    setConsentModalOpen(false);
  };

  const StatusBadge = () => {
    switch (status) {
      case 'included':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Incluído
          </Badge>
        );
      case 'withdrawn':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            Retirado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Não incluído
          </Badge>
        );
    }
  };

  // Só mostrar opção de incluir após avaliação clínica (S2 ou S3)
  const canInclude = caseStatus === 'S2' || caseStatus === 'S3';

  return (
    <>
      <Card className="border-dashed border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Registro Observacional</CardTitle>
            </div>
            <StatusBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informação sobre o que é */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Contribua com evidência clínica usando dados <strong className="text-foreground">anonimizados</strong>.
                LGPD garantida.
              </p>
            </div>
          </div>

          {/* Estado: Não incluído */}
          {status === 'not_included' && (
            <>
              {canInclude ? (
                <Button
                  onClick={() => setConsentModalOpen(true)}
                  disabled={loading}
                  className="w-full"
                >
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Incluir no Registro Observacional
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Disponível após avaliação clínica completa (S2/S3)</span>
                </div>
              )}
            </>
          )}

          {/* Estado: Incluído */}
          {status === 'included' && hasConsent && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>
                    Case ID: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {registryCase?.registry_case_id?.slice(0, 8)}...
                    </code>
                  </span>
                </p>
              </div>

              {/* Follow-ups */}
              <Collapsible open={followupOpen} onOpenChange={handleFollowupToggle}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Follow-ups Longitudinais
                    </span>
                    {followupOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <ObservationalFollowupForm
                    onSave={captureFollowup}
                    existingTimepoints={existingFollowups}
                    therapyItemCode={therapyItemCode}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Retirar consentimento */}
              <Button
                variant="ghost"
                size="sm"
                onClick={withdrawConsent}
                disabled={loading}
                className="text-muted-foreground hover:text-destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Retirar consentimento
              </Button>
            </div>
          )}

          {/* Estado: Retirado */}
          {status === 'withdrawn' && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Consentimento retirado. Os dados não serão incluídos em análises futuras.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Consentimento */}
      <ObservationalConsentModal
        open={consentModalOpen}
        onOpenChange={setConsentModalOpen}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
        loading={loading}
      />
    </>
  );
}
