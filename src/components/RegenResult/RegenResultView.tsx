/**
 * REGEN RESULT VIEW
 * 
 * Componente principal da UI de resultado do motor REGENAPP.
 * READ-ONLY - consome apenas regen_engine_outputs e regen_canonical para exibição.
 * 
 * Estados:
 * - loading: Carregando dados
 * - empty: Sem resultado disponível
 * - error: Erro ao carregar
 * - outdated: Resultado desatualizado
 * - ready: Resultado pronto para exibição
 */

import { useRef } from "react";
import { AlertTriangle, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RegenEngineOutputs } from "@/types/regen-engine";
import { RegenCanonical } from "@/types/regen-canonical";
import { ResultState, RESULT_MESSAGES } from "./types";
import { ResultHeader } from "./ResultHeader";
import { ResultActions } from "./ResultActions";
import { CardSafety } from "./CardSafety";
import { CardCRS } from "./CardCRS";
import { CardDIE } from "./CardDIE";
import { CardBRS } from "./CardBRS";
import { CardTOG } from "./CardTOG";
import { CardPEE } from "./CardPEE";
import { CardDataQuality } from "./CardDataQuality";

interface RegenResultViewProps {
  // Data
  engineOutputs: RegenEngineOutputs | null;
  canonical?: RegenCanonical | null;
  canonicalUpdatedAt?: string;
  
  // Identifiers
  caseId?: string;
  patientName?: string;
  
  // State
  isLoading?: boolean;
  error?: string | null;
  
  // Actions
  onGenerateResult?: () => void;
  onRecalculate?: () => void;
  onReviewTriage?: () => void;
  onReferEvaluation?: () => void;
  onSaveNote?: (noteContent: string) => Promise<void>;
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function EmptyState({ onGenerateResult }: { onGenerateResult?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Info className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Nenhum resultado disponível</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {RESULT_MESSAGES.EMPTY}
      </p>
      {onGenerateResult && (
        <Button onClick={onGenerateResult} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Gerar Resultado
        </Button>
      )}
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Erro ao carregar resultado</AlertTitle>
      <AlertDescription>
        {error || RESULT_MESSAGES.ERROR}
      </AlertDescription>
    </Alert>
  );
}

function OutdatedBanner({ onRecalculate }: { onRecalculate?: () => void }) {
  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Resultado desatualizado</AlertTitle>
      <AlertDescription className="text-amber-700">
        {RESULT_MESSAGES.OUTDATED}
        {onRecalculate && (
          <Button
            onClick={onRecalculate}
            variant="outline"
            size="sm"
            className="ml-4 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recalcular
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function RegenResultView({
  engineOutputs,
  canonical,
  canonicalUpdatedAt,
  caseId,
  patientName,
  isLoading = false,
  error = null,
  onGenerateResult,
  onRecalculate,
  onReviewTriage,
  onReferEvaluation,
  onSaveNote,
}: RegenResultViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  // Determine state
  const getState = (): ResultState => {
    if (isLoading) return "loading";
    if (error) return "error";
    if (!engineOutputs || !engineOutputs.computed_at) return "empty";
    
    // Check if outdated
    if (canonicalUpdatedAt && engineOutputs.computed_at) {
      const canonicalTime = new Date(canonicalUpdatedAt).getTime();
      const computedTime = new Date(engineOutputs.computed_at).getTime();
      if (canonicalTime > computedTime) return "outdated";
    }
    
    return "ready";
  };

  const state = getState();
  const safetyBlocked = engineOutputs?.safety.block ?? false;

  // Render based on state
  if (state === "loading") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <LoadingState />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorState error={error!} />
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <EmptyState onGenerateResult={onGenerateResult} />
      </div>
    );
  }

  // Ready or outdated state - render full UI
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Outdated banner */}
      {state === "outdated" && <OutdatedBanner onRecalculate={onRecalculate} />}

      {/* Actions bar */}
      <div className="mb-6">
        <ResultActions
          engineOutputs={engineOutputs!}
          canonical={canonical ?? undefined}
          patientName={patientName}
          caseId={caseId}
          reportRef={reportRef}
          onSaveNote={onSaveNote}
        />
      </div>

      {/* Report content */}
      <div
        ref={reportRef}
        className="bg-background rounded-2xl shadow-lg p-6 md:p-8 print:shadow-none print:p-4 space-y-6"
      >
        {/* Header */}
        <ResultHeader
          engineOutputs={engineOutputs!}
          canonical={canonical ?? undefined}
          caseId={caseId}
          patientName={patientName}
        />

        {/* CARDS - ORDEM FIXA */}
        
        {/* CARD A - Safety */}
        <CardSafety
          safety={engineOutputs!.safety}
          onReviewTriage={safetyBlocked ? onReviewTriage : undefined}
          onReferEvaluation={safetyBlocked ? onReferEvaluation : undefined}
        />

        {/* CARD B - CRS */}
        <CardCRS crs={engineOutputs!.crs} safetyBlocked={safetyBlocked} />

        {/* CARD C - DIE */}
        <CardDIE die={engineOutputs!.die} safetyBlocked={safetyBlocked} />

        {/* CARD D - BRS */}
        <CardBRS brs={engineOutputs!.brs} safetyBlocked={safetyBlocked} />

        {/* CARD E - TOG */}
        <CardTOG tog={engineOutputs!.tog} safetyBlocked={safetyBlocked} />

        {/* CARD F - PEE */}
        <CardPEE
          pee={engineOutputs!.pee}
          brs={engineOutputs!.brs}
          safetyBlocked={safetyBlocked}
        />

        {/* CARD G - Data Quality */}
        <CardDataQuality dataQuality={engineOutputs!.data_quality} />

        {/* Footer - Disclaimer */}
        <div className="mt-8 pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">
            {RESULT_MESSAGES.PROFESSIONAL_USE}
          </p>
        </div>
      </div>
    </div>
  );
}
