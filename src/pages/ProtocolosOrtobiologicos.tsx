import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Plus, FileText, Pencil, Trash2, Eye, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface OrtobiologicoProtocol {
  id: string;
  protocol_name: string;
  therapy_type: string;
  collection_method: string | null;
  processing_method: string | null;
  volume_collected: number | null;
  volume_applied: number | null;
  application_site: string | null;
  injection_technique: string | null;
  associated_therapies: string | null;
  session_frequency: string | null;
  total_sessions: number | null;
  clinical_observations: string | null;
  contraindications: string | null;
  pre_procedure_exams: string | null;
  created_at: string;
}

interface OrtobiologicoFormData {
  protocol_name: string;
  therapy_type: string;
  collection_method: string;
  processing_method: string;
  volume_collected: number;
  volume_applied: number;
  application_site: string;
  injection_technique: string;
  associated_therapies: string;
  session_frequency: string;
  total_sessions: number;
  clinical_observations: string;
  contraindications: string;
  pre_procedure_exams: string;
}

const TIPO_OPTIONS = ["PRP", "BMA", "BMAC"];
const TECNICA_OPTIONS = [
  "Injeção guiada por ultrassom",
  "Injeção direta",
  "Infiltração articular",
];

const emptyFormData: OrtobiologicoFormData = {
  protocol_name: "",
  therapy_type: "",
  collection_method: "",
  processing_method: "",
  volume_collected: 0,
  volume_applied: 0,
  application_site: "",
  injection_technique: "",
  associated_therapies: "",
  session_frequency: "",
  total_sessions: 1,
  clinical_observations: "",
  contraindications: "",
  pre_procedure_exams: "",
};

const ProtocolosOrtobiologicos = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("paciente");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<OrtobiologicoProtocol | null>(null);
  const [viewingProtocol, setViewingProtocol] = useState<OrtobiologicoProtocol | null>(null);
  const [deletingProtocol, setDeletingProtocol] = useState<OrtobiologicoProtocol | null>(null);
  const [formData, setFormData] = useState<OrtobiologicoFormData>(emptyFormData);

  // Migrate localStorage data on first load
  useEffect(() => {
    const migrateLocalStorage = async () => {
      const saved = localStorage.getItem("ortobiologicos_protocols");
      if (saved) {
        try {
          const localProtocols = JSON.parse(saved);
          if (localProtocols.length > 0) {
            for (const p of localProtocols) {
              await supabase.from("ortobiologicos_protocols").insert({
                protocol_name: p.nome || "Protocolo Migrado",
                therapy_type: p.tipo || "PRP",
                volume_collected: p.volume_coletado || null,
                volume_applied: p.volume_final || null,
                application_site: p.tecido_alvo || null,
                injection_technique: p.tecnica_aplicacao || null,
                total_sessions: p.numero_aplicacoes || null,
                session_frequency: p.intervalo_aplicacoes || null,
                clinical_observations: p.observacoes || null,
              });
            }
            localStorage.removeItem("ortobiologicos_protocols");
            toast.success("Protocolos Ortobiológicos migrados para o banco de dados!");
            queryClient.invalidateQueries({ queryKey: ["ortobiologicos-protocols"] });
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
    queryKey: ["ortobiologicos-protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ortobiologicos_protocols")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OrtobiologicoProtocol[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: OrtobiologicoFormData) => {
      const { error } = await supabase.from("ortobiologicos_protocols").insert({
        protocol_name: data.protocol_name,
        therapy_type: data.therapy_type,
        collection_method: data.collection_method || null,
        processing_method: data.processing_method || null,
        volume_collected: data.volume_collected || null,
        volume_applied: data.volume_applied || null,
        application_site: data.application_site || null,
        injection_technique: data.injection_technique || null,
        associated_therapies: data.associated_therapies || null,
        session_frequency: data.session_frequency || null,
        total_sessions: data.total_sessions || null,
        clinical_observations: data.clinical_observations || null,
        contraindications: data.contraindications || null,
        pre_procedure_exams: data.pre_procedure_exams || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ortobiologicos-protocols"] });
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
    mutationFn: async ({ id, data }: { id: string; data: OrtobiologicoFormData }) => {
      const { error } = await supabase
        .from("ortobiologicos_protocols")
        .update({
          protocol_name: data.protocol_name,
          therapy_type: data.therapy_type,
          collection_method: data.collection_method || null,
          processing_method: data.processing_method || null,
          volume_collected: data.volume_collected || null,
          volume_applied: data.volume_applied || null,
          application_site: data.application_site || null,
          injection_technique: data.injection_technique || null,
          associated_therapies: data.associated_therapies || null,
          session_frequency: data.session_frequency || null,
          total_sessions: data.total_sessions || null,
          clinical_observations: data.clinical_observations || null,
          contraindications: data.contraindications || null,
          pre_procedure_exams: data.pre_procedure_exams || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ortobiologicos-protocols"] });
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
      const { error } = await supabase.from("ortobiologicos_protocols").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ortobiologicos-protocols"] });
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

  const handleOpenEdit = (protocol: OrtobiologicoProtocol) => {
    setEditingProtocol(protocol);
    setFormData({
      protocol_name: protocol.protocol_name,
      therapy_type: protocol.therapy_type,
      collection_method: protocol.collection_method || "",
      processing_method: protocol.processing_method || "",
      volume_collected: protocol.volume_collected || 0,
      volume_applied: protocol.volume_applied || 0,
      application_site: protocol.application_site || "",
      injection_technique: protocol.injection_technique || "",
      associated_therapies: protocol.associated_therapies || "",
      session_frequency: protocol.session_frequency || "",
      total_sessions: protocol.total_sessions || 1,
      clinical_observations: protocol.clinical_observations || "",
      contraindications: protocol.contraindications || "",
      pre_procedure_exams: protocol.pre_procedure_exams || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenView = (protocol: OrtobiologicoProtocol) => {
    setViewingProtocol(protocol);
    setIsViewDialogOpen(true);
  };

  const handleOpenDelete = (protocol: OrtobiologicoProtocol) => {
    setDeletingProtocol(protocol);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (field: keyof OrtobiologicoFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.protocol_name.trim()) {
      toast.error("Nome do protocolo é obrigatório");
      return;
    }
    if (!formData.therapy_type) {
      toast.error("Tipo de terapia é obrigatório");
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

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "PRP":
        return "Plasma Rico em Plaquetas";
      case "BMA":
        return "Aspirado de Medula Óssea";
      case "BMAC":
        return "Concentrado de Aspirado de Medula Óssea";
      default:
        return tipo;
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
        <div className="flex items-center gap-3">
          {patientIdFromUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/pacientes/${patientIdFromUrl}`)}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Protocolos Ortobiológicos
            </h2>
            <p className="text-muted-foreground">Protocolos de PRP, BMA e BMAC</p>
          </div>
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
                        {protocol.therapy_type} • {protocol.application_site || "—"}
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
            Nenhum protocolo ortobiológico cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro protocolo de PRP, BMA ou BMAC
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
              {editingProtocol ? "Editar Protocolo" : "Novo Protocolo Ortobiológico"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Protocolo *</Label>
                <Input
                  value={formData.protocol_name}
                  onChange={(e) => handleInputChange("protocol_name", e.target.value)}
                  placeholder="Ex: PRP Articular Joelho"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Terapia *</Label>
                <Select
                  value={formData.therapy_type}
                  onValueChange={(v) => handleInputChange("therapy_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt} - {getTipoLabel(opt)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Método de Coleta</Label>
                <Input
                  value={formData.collection_method}
                  onChange={(e) => handleInputChange("collection_method", e.target.value)}
                  placeholder="Ex: Punção venosa periférica"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Método de Processamento</Label>
                <Input
                  value={formData.processing_method}
                  onChange={(e) => handleInputChange("processing_method", e.target.value)}
                  placeholder="Ex: Centrifugação dupla"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Volume Coletado (mL)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.volume_collected || ""}
                  onChange={(e) =>
                    handleInputChange("volume_collected", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Volume Aplicado (mL)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.volume_applied || ""}
                  onChange={(e) =>
                    handleInputChange("volume_applied", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Local de Aplicação</Label>
                <Input
                  value={formData.application_site}
                  onChange={(e) => handleInputChange("application_site", e.target.value)}
                  placeholder="Ex: Cartilagem articular joelho"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Técnica de Injeção</Label>
                <Select
                  value={formData.injection_technique}
                  onValueChange={(v) => handleInputChange("injection_technique", v)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>Frequência das Sessões</Label>
                <Input
                  value={formData.session_frequency}
                  onChange={(e) => handleInputChange("session_frequency", e.target.value)}
                  placeholder="Ex: 15 dias"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Terapias Associadas</Label>
              <Input
                value={formData.associated_therapies}
                onChange={(e) => handleInputChange("associated_therapies", e.target.value)}
                placeholder="Ex: Fisioterapia, MAC"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Exames Pré-Procedimento</Label>
              <Textarea
                value={formData.pre_procedure_exams}
                onChange={(e) => handleInputChange("pre_procedure_exams", e.target.value)}
                placeholder="Exames necessários antes do procedimento..."
                className="min-h-[60px]"
                maxLength={500}
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
            <DialogTitle>{viewingProtocol?.protocol_name || "Protocolo"}</DialogTitle>
          </DialogHeader>
          {viewingProtocol && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Tipo</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.therapy_type || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Local</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.application_site || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium text-sm">Técnica</p>
                  <p className="font-semibold text-foreground text-sm">
                    {viewingProtocol.injection_technique || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Vol. Coletado</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.volume_collected
                      ? `${viewingProtocol.volume_collected} mL`
                      : "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Vol. Aplicado</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.volume_applied
                      ? `${viewingProtocol.volume_applied} mL`
                      : "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Sessões</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.total_sessions || "—"}
                  </p>
                </div>
              </div>
              {viewingProtocol.session_frequency && (
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Frequência</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.session_frequency}
                  </p>
                </div>
              )}
              {viewingProtocol.pre_procedure_exams && (
                <div className="bg-blue-500/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                    Exames Pré-Procedimento
                  </p>
                  <p className="text-foreground">{viewingProtocol.pre_procedure_exams}</p>
                </div>
              )}
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

export default ProtocolosOrtobiologicos;
