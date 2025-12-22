import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EPIProtocol {
  id: string;
  protocol_name: string;
  injury_region: string | null;
  specific_tissue: string | null;
  needle_type: string | null;
  current_intensity: number | null;
  application_time: number | null;
  technique: string | null;
  session_frequency: string | null;
  total_sessions: number | null;
  clinical_observations: string | null;
  contraindications: string | null;
  created_at: string;
}

interface EPIProtocolFormData {
  protocol_name: string;
  injury_region: string;
  specific_tissue: string;
  needle_type: string;
  current_intensity: number;
  application_time: number;
  technique: string;
  session_frequency: string;
  total_sessions: number;
  clinical_observations: string;
  contraindications: string;
}

const INTENSIDADE_OPTIONS = ["Baixa", "Média", "Alta"];
const TECNICA_OPTIONS = ["Punctura única", "Puncturas múltiplas", "Varredura"];

const emptyFormData: EPIProtocolFormData = {
  protocol_name: "",
  injury_region: "",
  specific_tissue: "",
  needle_type: "",
  current_intensity: 0,
  application_time: 0,
  technique: "",
  session_frequency: "",
  total_sessions: 1,
  clinical_observations: "",
  contraindications: "",
};

const ProtocolosEPI = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<EPIProtocol | null>(null);
  const [viewingProtocol, setViewingProtocol] = useState<EPIProtocol | null>(null);
  const [deletingProtocol, setDeletingProtocol] = useState<EPIProtocol | null>(null);
  const [formData, setFormData] = useState<EPIProtocolFormData>(emptyFormData);

  // Migrate localStorage data on first load
  useEffect(() => {
    const migrateLocalStorage = async () => {
      const saved = localStorage.getItem("epi_protocols");
      if (saved) {
        try {
          const localProtocols = JSON.parse(saved);
          if (localProtocols.length > 0) {
            // Migrate each protocol to the database
            for (const p of localProtocols) {
              await supabase.from("epi_protocols").insert({
                protocol_name: p.nome || "Protocolo Migrado",
                specific_tissue: p.tecido_alvo || null,
                technique: p.intensidade || null,
                application_time: p.tempo_aplicacao || null,
                clinical_observations: p.observacoes || null,
              });
            }
            // Remove localStorage after migration
            localStorage.removeItem("epi_protocols");
            toast.success("Protocolos EPI migrados para o banco de dados!");
            queryClient.invalidateQueries({ queryKey: ["epi-protocols"] });
          }
        } catch (error) {
          console.error("Erro ao migrar protocolos:", error);
        }
      }
    };
    migrateLocalStorage();
  }, [queryClient]);

  // Fetch protocols from database
  const { data: protocols = [], isLoading } = useQuery({
    queryKey: ["epi-protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_protocols")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EPIProtocol[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: EPIProtocolFormData) => {
      const { error } = await supabase.from("epi_protocols").insert({
        protocol_name: data.protocol_name,
        injury_region: data.injury_region || null,
        specific_tissue: data.specific_tissue || null,
        needle_type: data.needle_type || null,
        current_intensity: data.current_intensity || null,
        application_time: data.application_time || null,
        technique: data.technique || null,
        session_frequency: data.session_frequency || null,
        total_sessions: data.total_sessions || null,
        clinical_observations: data.clinical_observations || null,
        contraindications: data.contraindications || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epi-protocols"] });
      toast.success("Protocolo criado com sucesso!");
      handleCloseDialog();
    },
    onError: (error) => {
      console.error("Erro ao criar protocolo:", error);
      toast.error("Erro ao criar protocolo");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EPIProtocolFormData }) => {
      const { error } = await supabase
        .from("epi_protocols")
        .update({
          protocol_name: data.protocol_name,
          injury_region: data.injury_region || null,
          specific_tissue: data.specific_tissue || null,
          needle_type: data.needle_type || null,
          current_intensity: data.current_intensity || null,
          application_time: data.application_time || null,
          technique: data.technique || null,
          session_frequency: data.session_frequency || null,
          total_sessions: data.total_sessions || null,
          clinical_observations: data.clinical_observations || null,
          contraindications: data.contraindications || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epi-protocols"] });
      toast.success("Protocolo atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: (error) => {
      console.error("Erro ao atualizar protocolo:", error);
      toast.error("Erro ao atualizar protocolo");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("epi_protocols").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epi-protocols"] });
      toast.success("Protocolo excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingProtocol(null);
    },
    onError: (error) => {
      console.error("Erro ao excluir protocolo:", error);
      toast.error("Erro ao excluir protocolo");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProtocol(null);
    setFormData(emptyFormData);
  };

  const handleOpenCreate = () => {
    setEditingProtocol(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (protocol: EPIProtocol) => {
    setEditingProtocol(protocol);
    setFormData({
      protocol_name: protocol.protocol_name,
      injury_region: protocol.injury_region || "",
      specific_tissue: protocol.specific_tissue || "",
      needle_type: protocol.needle_type || "",
      current_intensity: protocol.current_intensity || 0,
      application_time: protocol.application_time || 0,
      technique: protocol.technique || "",
      session_frequency: protocol.session_frequency || "",
      total_sessions: protocol.total_sessions || 1,
      clinical_observations: protocol.clinical_observations || "",
      contraindications: protocol.contraindications || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenView = (protocol: EPIProtocol) => {
    setViewingProtocol(protocol);
    setIsViewDialogOpen(true);
  };

  const handleOpenDelete = (protocol: EPIProtocol) => {
    setDeletingProtocol(protocol);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (field: keyof EPIProtocolFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.protocol_name.trim()) {
      toast.error("Nome do protocolo é obrigatório");
      return;
    }

    if (editingProtocol) {
      updateMutation.mutate({ id: editingProtocol.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingProtocol) {
      deleteMutation.mutate(deletingProtocol.id);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Protocolos EPI
          </h2>
          <p className="text-muted-foreground">
            Protocolos de Eletrólise Percutânea Intratecidual
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          style={{
            backgroundColor: "#2F3F6B",
            color: "#FFFFFF",
            borderRadius: "12px",
            fontWeight: 600,
          }}
          className="hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Protocolo
        </Button>
      </div>

      {protocols.length > 0 ? (
        <div className="grid gap-4">
          {protocols.map((protocol) => (
            <Card key={protocol.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">
                        {protocol.protocol_name}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {protocol.specific_tissue || "—"} • {protocol.technique || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenView(protocol)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(protocol)}
                      className="flex-1 sm:flex-none"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenDelete(protocol)}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-border">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum protocolo EPI cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro protocolo de Eletrólise Percutânea
          </p>
          <Button
            onClick={handleOpenCreate}
            style={{
              backgroundColor: "#2F3F6B",
              color: "#FFFFFF",
              borderRadius: "12px",
            }}
            className="hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Protocolo
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProtocol ? "Editar Protocolo EPI" : "Novo Protocolo EPI"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Protocolo *</Label>
              <Input
                value={formData.protocol_name}
                onChange={(e) => handleInputChange("protocol_name", e.target.value)}
                placeholder="Ex: Protocolo Tendinopatia Patelar"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Região da Lesão</Label>
                <Input
                  value={formData.injury_region}
                  onChange={(e) => handleInputChange("injury_region", e.target.value)}
                  placeholder="Ex: Joelho"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Tecido Específico</Label>
                <Input
                  value={formData.specific_tissue}
                  onChange={(e) => handleInputChange("specific_tissue", e.target.value)}
                  placeholder="Ex: Tendão patelar"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Agulha</Label>
                <Input
                  value={formData.needle_type}
                  onChange={(e) => handleInputChange("needle_type", e.target.value)}
                  placeholder="Ex: 0.30 x 40mm"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label>Técnica</Label>
                <Select
                  value={formData.technique}
                  onValueChange={(v) => handleInputChange("technique", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TECNICA_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Intensidade (mA)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.current_intensity || ""}
                  onChange={(e) =>
                    handleInputChange("current_intensity", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo de Aplicação (seg)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.application_time || ""}
                  onChange={(e) =>
                    handleInputChange("application_time", parseInt(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Total de Sessões</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.total_sessions || ""}
                  onChange={(e) =>
                    handleInputChange("total_sessions", parseInt(e.target.value) || 1)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Frequência das Sessões</Label>
              <Input
                value={formData.session_frequency}
                onChange={(e) => handleInputChange("session_frequency", e.target.value)}
                placeholder="Ex: 1x por semana"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações Clínicas</Label>
              <Textarea
                value={formData.clinical_observations}
                onChange={(e) => handleInputChange("clinical_observations", e.target.value)}
                placeholder="Observações sobre o protocolo..."
                className="min-h-[80px]"
                maxLength={1000}
              />
            </div>

            <div className="space-y-2">
              <Label>Contraindicações</Label>
              <Textarea
                value={formData.contraindications}
                onChange={(e) => handleInputChange("contraindications", e.target.value)}
                placeholder="Contraindicações específicas..."
                className="min-h-[60px]"
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDialog} disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                style={{
                  backgroundColor: "#2F3F6B",
                  color: "#FFFFFF",
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : editingProtocol ? (
                  "Salvar"
                ) : (
                  "Criar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingProtocol?.protocol_name || "Protocolo EPI"}</DialogTitle>
          </DialogHeader>
          {viewingProtocol && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Região</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.injury_region || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Tecido</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.specific_tissue || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Técnica</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.technique || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Agulha</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.needle_type || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Intensidade</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.current_intensity ? `${viewingProtocol.current_intensity} mA` : "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Tempo (seg)</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.application_time || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Sessões</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.total_sessions || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground font-medium">Frequência</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.session_frequency || "—"}
                  </p>
                </div>
              </div>
              {viewingProtocol.clinical_observations && (
                <div className="bg-accent/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Observações Clínicas
                  </p>
                  <p className="text-foreground">{viewingProtocol.clinical_observations}</p>
                </div>
              )}
              {viewingProtocol.contraindications && (
                <div className="bg-destructive/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Contraindicações
                  </p>
                  <p className="text-foreground">{viewingProtocol.contraindications}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o protocolo "
              {deletingProtocol?.protocol_name || "sem nome"}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProtocolosEPI;
