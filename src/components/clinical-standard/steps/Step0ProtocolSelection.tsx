import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, ShieldCheck, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProtocolsList } from "@/hooks/useProtocols";
import { useClinicProfessionals, useCurrentUserRole } from "@/hooks/useClinicProfessionals";

interface Step0Props {
  selectedProtocolId: string;
  onChange: (protocolId: string) => void;
  responsibleProfessionalId: string;
  onResponsibleChange: (userId: string) => void;
}

export function Step0ProtocolSelection({ 
  selectedProtocolId, 
  onChange,
  responsibleProfessionalId,
  onResponsibleChange,
}: Step0Props) {
  // Fetch all active protocols (all types)
  const { data: baseProtocols, isLoading: loadingBase } = useProtocolsList("REGEN_BASE", { isActive: true });
  const { data: derivedProtocols, isLoading: loadingDerived } = useProtocolsList("DERIVED", { isActive: true });
  const { data: institutionalProtocols, isLoading: loadingInst } = useProtocolsList("INSTITUTIONAL", { isActive: true });

  // Fetch professionals and current user
  const { data: professionals, isLoading: loadingProfessionals } = useClinicProfessionals();
  const { data: currentUser } = useCurrentUserRole();

  const isLoading = loadingBase || loadingDerived || loadingInst || loadingProfessionals;

  // Auto-select current user as responsible if they are professional/admin
  useEffect(() => {
    if (currentUser && !responsibleProfessionalId) {
      if (currentUser.role === "professional" || currentUser.role === "admin") {
        onResponsibleChange(currentUser.userId);
      }
    }
  }, [currentUser, responsibleProfessionalId, onResponsibleChange]);

  const allProtocols = [
    ...(baseProtocols || []),
    ...(derivedProtocols || []),
    ...(institutionalProtocols || []),
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando protocolos...</p>
      </div>
    );
  }

  if (allProtocols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm font-medium">Nenhum protocolo ativo encontrado</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          É necessário ter pelo menos um protocolo ativo na governança clínica antes de registrar um procedimento padronizado.
        </p>
      </div>
    );
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case "REGEN_BASE": return "Base REGHEN";
      case "DERIVED": return "Derivado";
      case "INSTITUTIONAL": return "Institucional";
      default: return type;
    }
  };

  const typeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case "REGEN_BASE": return "default";
      case "DERIVED": return "secondary";
      default: return "outline";
    }
  };

  const isProfessionalOrAdmin = currentUser?.role === "professional" || currentUser?.role === "admin";

  const getProfessionalLabel = (prof: { user_id: string; role: string; email: string }) => {
    if (prof.email) return `${prof.email} (${prof.role})`;
    // Truncate UUID for display
    const shortId = prof.user_id.substring(0, 8);
    const isCurrentUser = prof.user_id === currentUser?.userId;
    const suffix = isCurrentUser ? " (você)" : "";
    if (currentUser?.email && isCurrentUser) return `${currentUser.email}${suffix}`;
    return `Profissional ${shortId}...${suffix}`;
  };

  return (
    <div className="space-y-6">
      {/* Responsible Professional Selector */}
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <User className="w-4 h-4" />
          Profissional responsável *
        </Label>
        <p className="text-sm text-muted-foreground">
          {isProfessionalOrAdmin
            ? "Você será definido como responsável. Pode alterar se necessário."
            : "Selecione o profissional responsável pelo procedimento."}
        </p>
        <Select
          value={responsibleProfessionalId}
          onValueChange={onResponsibleChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o profissional responsável" />
          </SelectTrigger>
          <SelectContent>
            {(professionals || []).map((prof) => (
              <SelectItem key={prof.user_id} value={prof.user_id}>
                {getProfessionalLabel(prof)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!responsibleProfessionalId && (
          <p className="text-xs text-destructive">Selecione o profissional responsável para continuar.</p>
        )}
      </div>

      {/* Protocol Selection */}
      <div className="space-y-1">
        <Label className="text-base font-semibold">Selecione o protocolo clínico *</Label>
        <p className="text-sm text-muted-foreground">
          O procedimento será vinculado à versão mais recente do protocolo selecionado.
        </p>
      </div>

      <RadioGroup
        value={selectedProtocolId}
        onValueChange={onChange}
        className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1"
      >
        {allProtocols.map((protocol) => (
          <div
            key={protocol.id}
            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              selectedProtocolId === protocol.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <RadioGroupItem value={protocol.id} id={`protocol-${protocol.id}`} className="mt-1" />
            <Label htmlFor={`protocol-${protocol.id}`} className="cursor-pointer flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{protocol.title}</span>
                <Badge variant={typeVariant(protocol.protocol_type)} className="text-[10px] px-1.5 py-0">
                  {typeLabel(protocol.protocol_type)}
                </Badge>
                {protocol.latest_version_label && (
                  <span className="text-[10px] text-muted-foreground">
                    v{protocol.latest_version_label}
                  </span>
                )}
              </div>
              {protocol.area && (
                <p className="text-xs text-muted-foreground">{protocol.area}</p>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {selectedProtocolId && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
          <span>A versão será fixada automaticamente no momento da criação.</span>
        </div>
      )}
    </div>
  );
}
