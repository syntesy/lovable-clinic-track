import { useState } from "react";
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
import { Plus, FileText, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface OrtobiologicoProtocol {
  id: string;
  nome: string;
  tipo: string;
  volume_coletado: number;
  volume_final: number;
  tecido_alvo: string;
  tecnica_aplicacao: string;
  numero_aplicacoes: number;
  intervalo_aplicacoes: string;
  observacoes: string;
  created_at: string;
}

type OrtobiologicoProtocolFormData = Omit<OrtobiologicoProtocol, "id" | "created_at">;

const TIPO_OPTIONS = ["PRP", "BMA", "BMAC"];
const TECNICA_OPTIONS = ["Injeção guiada por ultrassom", "Injeção direta", "Infiltração articular"];

const emptyFormData: OrtobiologicoProtocolFormData = {
  nome: "",
  tipo: "",
  volume_coletado: 0,
  volume_final: 0,
  tecido_alvo: "",
  tecnica_aplicacao: "",
  numero_aplicacoes: 1,
  intervalo_aplicacoes: "",
  observacoes: "",
};

const ProtocolosOrtobiologicos = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<OrtobiologicoProtocol | null>(null);
  const [viewingProtocol, setViewingProtocol] = useState<OrtobiologicoProtocol | null>(null);
  const [deletingProtocol, setDeletingProtocol] = useState<OrtobiologicoProtocol | null>(null);
  const [formData, setFormData] = useState<OrtobiologicoProtocolFormData>(emptyFormData);

  // For now, we'll store protocols in localStorage until a dedicated table is created
  const [protocols, setProtocols] = useState<OrtobiologicoProtocol[]>(() => {
    const saved = localStorage.getItem("ortobiologicos_protocols");
    return saved ? JSON.parse(saved) : [];
  });

  const saveProtocols = (newProtocols: OrtobiologicoProtocol[]) => {
    localStorage.setItem("ortobiologicos_protocols", JSON.stringify(newProtocols));
    setProtocols(newProtocols);
  };

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
      nome: protocol.nome,
      tipo: protocol.tipo,
      volume_coletado: protocol.volume_coletado,
      volume_final: protocol.volume_final,
      tecido_alvo: protocol.tecido_alvo,
      tecnica_aplicacao: protocol.tecnica_aplicacao,
      numero_aplicacoes: protocol.numero_aplicacoes,
      intervalo_aplicacoes: protocol.intervalo_aplicacoes,
      observacoes: protocol.observacoes,
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

  const handleInputChange = (field: keyof OrtobiologicoProtocolFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome do protocolo é obrigatório");
      return;
    }

    if (editingProtocol) {
      const updated = protocols.map((p) =>
        p.id === editingProtocol.id ? { ...p, ...formData } : p
      );
      saveProtocols(updated);
      toast.success("Protocolo atualizado com sucesso!");
    } else {
      const newProtocol: OrtobiologicoProtocol = {
        ...formData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      saveProtocols([...protocols, newProtocol]);
      toast.success("Protocolo criado com sucesso!");
    }
    handleCloseDialog();
  };

  const handleConfirmDelete = () => {
    if (deletingProtocol) {
      const updated = protocols.filter((p) => p.id !== deletingProtocol.id);
      saveProtocols(updated);
      toast.success("Protocolo excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingProtocol(null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Protocolos Ortobiológicos
          </h2>
          <p className="text-muted-foreground">
            Protocolos de PRP, BMA e BMAC
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
                        {protocol.nome}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {protocol.tipo} • {protocol.tecido_alvo}
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
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Ex: PRP Articular Joelho"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Ortobiológico</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => handleInputChange("tipo", v)}
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
                <Label>Volume Coletado (mL)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.volume_coletado || ""}
                  onChange={(e) =>
                    handleInputChange("volume_coletado", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Volume Final (mL)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.volume_final || ""}
                  onChange={(e) =>
                    handleInputChange("volume_final", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tecido Alvo</Label>
                <Input
                  value={formData.tecido_alvo}
                  onChange={(e) => handleInputChange("tecido_alvo", e.target.value)}
                  placeholder="Ex: Cartilagem articular"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Técnica de Aplicação</Label>
                <Select
                  value={formData.tecnica_aplicacao}
                  onValueChange={(v) => handleInputChange("tecnica_aplicacao", v)}
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
                <Label>Número de Aplicações</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.numero_aplicacoes || ""}
                  onChange={(e) =>
                    handleInputChange("numero_aplicacoes", parseInt(e.target.value) || 1)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Intervalo entre Aplicações</Label>
                <Input
                  value={formData.intervalo_aplicacoes}
                  onChange={(e) => handleInputChange("intervalo_aplicacoes", e.target.value)}
                  placeholder="Ex: 15 dias"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                placeholder="Observações sobre o protocolo..."
                className="min-h-[100px]"
                maxLength={1000}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                style={{
                  backgroundColor: "#2F3F6B",
                  color: "#FFFFFF",
                }}
              >
                {editingProtocol ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingProtocol?.nome || "Protocolo"}</DialogTitle>
          </DialogHeader>
          {viewingProtocol && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Tipo</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.tipo || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Tecido Alvo</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.tecido_alvo || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Técnica</p>
                  <p className="font-semibold text-foreground text-sm">
                    {viewingProtocol.tecnica_aplicacao || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Vol. Coletado</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.volume_coletado ? `${viewingProtocol.volume_coletado} mL` : "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Vol. Final</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.volume_final ? `${viewingProtocol.volume_final} mL` : "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Aplicações</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.numero_aplicacoes || "—"}
                  </p>
                </div>
              </div>
              {viewingProtocol.intervalo_aplicacoes && (
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Intervalo</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.intervalo_aplicacoes}
                  </p>
                </div>
              )}
              {viewingProtocol.observacoes && (
                <div className="bg-accent/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Observações
                  </p>
                  <p className="text-foreground">{viewingProtocol.observacoes}</p>
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
              {deletingProtocol?.nome || "sem nome"}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProtocolosOrtobiologicos;
