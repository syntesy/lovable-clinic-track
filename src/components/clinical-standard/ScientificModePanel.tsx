import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dna, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScientificModePanelProps {
  psrId: string | undefined;
  scientificModeEnabled: boolean;
  scientificBadgeStatus: string; // 'NONE' | 'DRAFT' | 'VALIDATED'
  onStatusChange: () => void;
}

export function ScientificModeBadge({
  status,
}: {
  status: string;
}) {
  if (status === "DRAFT") {
    return (
      <Badge variant="outline" className="gap-1 text-xs border-amber-500/30 text-amber-600 bg-amber-500/10">
        <Dna className="w-3 h-3" />
        Científico (rascunho)
      </Badge>
    );
  }
  if (status === "VALIDATED") {
    return (
      <Badge className="gap-1 text-xs bg-emerald-600 text-white">
        <Dna className="w-3 h-3" />
        Científico (validado)
      </Badge>
    );
  }
  return null;
}

export function ScientificModePanel({
  psrId,
  scientificModeEnabled,
  scientificBadgeStatus,
  onStatusChange,
}: ScientificModePanelProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalAction, setModalAction] = useState<"enable" | "validate">("enable");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAction = async () => {
    if (!password.trim() || !psrId) return;
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const res = await supabase.functions.invoke("scientific-mode", {
        body: { action: modalAction, psr_id: psrId, password },
      });

      if (res.error) {
        throw new Error(res.error.message || "Erro ao processar");
      }

      const result = res.data as any;
      if (result?.error) {
        setError(result.error);
        return;
      }

      toast.success(
        modalAction === "enable"
          ? "Modo científico ativado com sucesso!"
          : "Registro científico validado com sucesso!"
      );
      setShowPasswordModal(false);
      setPassword("");
      onStatusChange();
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (action: "enable" | "validate") => {
    setModalAction(action);
    setPassword("");
    setError("");
    setShowPasswordModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <ScientificModeBadge status={scientificBadgeStatus} />

        {!scientificModeEnabled && psrId && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => openModal("enable")}
          >
            <Dna className="w-3.5 h-3.5" />
            Registrar como Caso Científico
          </Button>
        )}

        {scientificBadgeStatus === "DRAFT" && psrId && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
            onClick={() => openModal("validate")}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Validar Registro Científico
          </Button>
        )}

        {scientificBadgeStatus === "VALIDATED" && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            Edições exigem justificativa
          </span>
        )}
      </div>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dna className="w-5 h-5 text-primary" />
              {modalAction === "enable"
                ? "Ativar Modo Científico"
                : "Validar Registro Científico"}
            </DialogTitle>
            <DialogDescription>
              {modalAction === "enable"
                ? "O registro será marcado como caso científico (rascunho). Confirme sua identidade."
                : "Após validação, edições em campos críticos exigirão justificativa. Confirme sua identidade."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Senha de acesso</Label>
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAction()}
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {modalAction === "enable" ? "Ativar" : "Validar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Justification modal for post-validation edits
export function JustificationModal({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justification: string) => void;
  loading?: boolean;
}) {
  const [justification, setJustification] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Justificativa Obrigatória
          </DialogTitle>
          <DialogDescription>
            Este registro científico já foi validado. Para alterar campos
            críticos, informe a justificativa que será registrada no histórico de
            auditoria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label className="text-sm">Motivo da alteração</Label>
          <Textarea
            placeholder="Descreva o motivo da alteração..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm(justification);
              setJustification("");
            }}
            disabled={!justification.trim() || loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Confirmar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
