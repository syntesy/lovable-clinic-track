import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Copy, Edit, CheckCircle, XCircle, FileText, History, Loader2, Shield } from "lucide-react";
import { useProtocol, useProtocolVersions, useUserRole, useDuplicateProtocol, ProtocolVersion } from "@/hooks/useProtocols";
import { DuplicateProtocolModal } from "@/components/governance/DuplicateProtocolModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProtocolDetail() {
  const { protocolId } = useParams<{ protocolId: string }>();
  const navigate = useNavigate();
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [snapshotVersion, setSnapshotVersion] = useState<ProtocolVersion | null>(null);

  const { data: protocol, isLoading } = useProtocol(protocolId);
  const { data: versions = [] } = useProtocolVersions(protocolId);
  const { data: userRole } = useUserRole();
  const duplicateMutation = useDuplicateProtocol();

  const canEdit = (userRole === "admin" || userRole === "professional");
  const isBase = protocol?.protocol_type === "REGEN_BASE";

  const handleDuplicate = async (title: string) => {
    if (!protocolId) return;
    const newProto = await duplicateMutation.mutateAsync({
      sourceProtocolId: protocolId,
      newTitle: title,
    });
    setDuplicateOpen(false);
    navigate(`/governanca/protocolos/${newProto.id}/editar`);
  };

  if (isLoading || !protocol) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderJsonList = (data: any, label: string) => {
    if (!data) return null;
    let items: string[] = [];
    if (Array.isArray(data)) {
      items = data.map((d) => (typeof d === "string" ? d : JSON.stringify(d)));
    } else if (typeof data === "object") {
      items = Object.entries(data).map(([k, v]) => `${k}: ${v}`);
    }
    if (items.length === 0) return null;
    return (
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">{label}</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderChecklist = (template: any) => {
    if (!template || !Array.isArray(template)) return null;
    return (
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Checklist Template</h4>
        <div className="space-y-1.5">
          {template.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {item.required ? (
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-foreground">{item.label}</span>
              {item.required && (
                <Badge variant="outline" className="text-[10px] ml-1">Obrigatório</Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/governanca/protocolos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{protocol.title}</h1>
              <Badge variant={isBase ? "default" : "secondary"} className="text-xs">
                {isBase ? "Base REGHEN" : protocol.protocol_type === "DERIVED" ? "Derivado" : "Institucional"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{protocol.area || "Sem área"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setDuplicateOpen(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          )}
          {canEdit && !isBase && (
            <Button onClick={() => navigate(`/governanca/protocolos/${protocolId}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {isBase && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            Protocolo base REGHEN — somente leitura. Duplique para criar uma versão editável.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Protocol Data */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Dados Essenciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {protocol.indication_summary && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Indicação</h4>
                  <p className="text-sm text-muted-foreground">{protocol.indication_summary}</p>
                </div>
              )}
              {protocol.evidence_level && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Nível de Evidência</h4>
                  <Badge variant="outline">{protocol.evidence_level}</Badge>
                </div>
              )}
              {protocol.technique_summary && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Técnica</h4>
                  <p className="text-sm text-muted-foreground">{protocol.technique_summary}</p>
                </div>
              )}
              {renderJsonList(protocol.evidence_refs, "Referências")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Critérios & Exames</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderJsonList(protocol.inclusion_criteria, "Critérios de Inclusão")}
              {renderJsonList(protocol.exclusion_criteria, "Critérios de Exclusão")}
              {renderJsonList(protocol.required_exams, "Exames Obrigatórios")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              {renderChecklist(protocol.checklist_template)}
            </CardContent>
          </Card>
        </div>

        {/* Right: Version History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Histórico de Versões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma versão registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Versão</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">v{v.version_label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(v.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">
                        {v.change_summary}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSnapshotVersion(v)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Modal */}
      <DuplicateProtocolModal
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        sourceTitle={protocol.title}
        onConfirm={handleDuplicate}
        isPending={duplicateMutation.isPending}
      />

      {/* Snapshot Viewer */}
      <Dialog open={!!snapshotVersion} onOpenChange={(open) => !open && setSnapshotVersion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Snapshot — v{snapshotVersion?.version_label}</DialogTitle>
          </DialogHeader>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[60vh]">
            {JSON.stringify(snapshotVersion?.snapshot, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
