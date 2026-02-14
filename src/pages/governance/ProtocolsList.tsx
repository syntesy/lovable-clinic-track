import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Copy, Edit, ToggleLeft, ToggleRight, Shield, Loader2 } from "lucide-react";
import { useProtocolsList, useProtocolAreas, useUserRole, useDuplicateProtocol, useToggleProtocolActive, Protocol } from "@/hooks/useProtocols";
import { DuplicateProtocolModal } from "@/components/governance/DuplicateProtocolModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ProtocolType = "REGEN_BASE" | "DERIVED" | "INSTITUTIONAL";

export default function ProtocolsList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProtocolType>("REGEN_BASE");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [duplicateTarget, setDuplicateTarget] = useState<Protocol | null>(null);

  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { data: areas = [] } = useProtocolAreas();
  const duplicateMutation = useDuplicateProtocol();
  const toggleActiveMutation = useToggleProtocolActive();

  const filters = {
    search: search || undefined,
    area: areaFilter !== "all" ? areaFilter : undefined,
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
  };

  const { data: protocols = [], isLoading } = useProtocolsList(activeTab, filters);

  const canEdit = userRole === "admin" || userRole === "professional";
  const isReadOnly = userRole === "nurse_tech";

  const handleDuplicate = async (title: string) => {
    if (!duplicateTarget) return;
    const newProto = await duplicateMutation.mutateAsync({
      sourceProtocolId: duplicateTarget.id,
      newTitle: title,
    });
    setDuplicateTarget(null);
    navigate(`/governanca/protocolos/${newProto.id}/editar`);
  };

  const handleToggleActive = (protocol: Protocol) => {
    toggleActiveMutation.mutate({
      protocolId: protocol.id,
      isActive: !protocol.is_active,
    });
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Protocolos Clínicos</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de protocolos base, derivados e institucionais
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProtocolType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="REGEN_BASE">Base REGHEN</TabsTrigger>
          <TabsTrigger value="DERIVED">Derivados</TabsTrigger>
          <TabsTrigger value="INSTITUTIONAL">Institucionais</TabsTrigger>
        </TabsList>

        {(["REGEN_BASE", "DERIVED", "INSTITUTIONAL"] as ProtocolType[]).map((type) => (
          <TabsContent key={type} value={type}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : protocols.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum protocolo encontrado.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead className="hidden md:table-cell">Área</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Versão</TableHead>
                      <TableHead className="hidden lg:table-cell">Atualização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {protocols.map((protocol) => (
                      <TableRow key={protocol.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {protocol.title}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {protocol.area || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={protocol.is_active ? "default" : "secondary"} className="text-xs">
                            {protocol.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          v{protocol.latest_version_label || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {protocol.updated_at
                            ? format(new Date(protocol.updated_at), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/governanca/protocolos/${protocol.id}`)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDuplicateTarget(protocol)}
                                title="Duplicar"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}

                            {canEdit && type !== "REGEN_BASE" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/governanca/protocolos/${protocol.id}/editar`)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleActive(protocol)}
                                  title={protocol.is_active ? "Desativar" : "Ativar"}
                                >
                                  {protocol.is_active ? (
                                    <ToggleRight className="h-4 w-4 text-primary" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Duplicate Modal */}
      <DuplicateProtocolModal
        open={!!duplicateTarget}
        onOpenChange={(open) => !open && setDuplicateTarget(null)}
        sourceTitle={duplicateTarget?.title || ""}
        onConfirm={handleDuplicate}
        isPending={duplicateMutation.isPending}
      />
    </div>
  );
}
