import { useState } from "react";
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
import { Plus, FileText, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface EPIProtocol {
  id: string;
  nome: string;
  tecido_alvo: string;
  intensidade: string;
  tempo_aplicacao: number;
  numero_puncturas: number;
  profundidade: string;
  observacoes: string;
  created_at: string;
}

type EPIProtocolFormData = Omit<EPIProtocol, "id" | "created_at">;

const INTENSIDADE_OPTIONS = ["Baixa", "Média", "Alta"];
const PROFUNDIDADE_OPTIONS = ["Superficial", "Média", "Profunda"];

const emptyFormData: EPIProtocolFormData = {
  nome: "",
  tecido_alvo: "",
  intensidade: "",
  tempo_aplicacao: 0,
  numero_puncturas: 0,
  profundidade: "",
  observacoes: "",
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

  // For now, we'll store EPI protocols in localStorage until a dedicated table is created
  const [protocols, setProtocols] = useState<EPIProtocol[]>(() => {
    const saved = localStorage.getItem("epi_protocols");
    return saved ? JSON.parse(saved) : [];
  });

  const saveProtocols = (newProtocols: EPIProtocol[]) => {
    localStorage.setItem("epi_protocols", JSON.stringify(newProtocols));
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

  const handleOpenEdit = (protocol: EPIProtocol) => {
    setEditingProtocol(protocol);
    setFormData({
      nome: protocol.nome,
      tecido_alvo: protocol.tecido_alvo,
      intensidade: protocol.intensidade,
      tempo_aplicacao: protocol.tempo_aplicacao,
      numero_puncturas: protocol.numero_puncturas,
      profundidade: protocol.profundidade,
      observacoes: protocol.observacoes,
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
      const newProtocol: EPIProtocol = {
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
                        {protocol.nome}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {protocol.tecido_alvo} • {protocol.intensidade}
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
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Ex: Protocolo Tendinopatia Patelar"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tecido Alvo</Label>
                <Input
                  value={formData.tecido_alvo}
                  onChange={(e) => handleInputChange("tecido_alvo", e.target.value)}
                  placeholder="Ex: Tendão patelar"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Intensidade</Label>
                <Select
                  value={formData.intensidade}
                  onValueChange={(v) => handleInputChange("intensidade", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENSIDADE_OPTIONS.map((opt) => (
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
                <Label>Tempo de Aplicação (seg)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.tempo_aplicacao || ""}
                  onChange={(e) =>
                    handleInputChange("tempo_aplicacao", parseInt(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Número de Puncturas</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.numero_puncturas || ""}
                  onChange={(e) =>
                    handleInputChange("numero_puncturas", parseInt(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Profundidade</Label>
                <Select
                  value={formData.profundidade}
                  onValueChange={(v) => handleInputChange("profundidade", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFUNDIDADE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <DialogTitle>{viewingProtocol?.nome || "Protocolo EPI"}</DialogTitle>
          </DialogHeader>
          {viewingProtocol && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Tecido Alvo</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.tecido_alvo || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Intensidade</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.intensidade || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Profundidade</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.profundidade || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Tempo (seg)</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.tempo_aplicacao || "—"}
                  </p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Puncturas</p>
                  <p className="font-semibold text-foreground">
                    {viewingProtocol.numero_puncturas || "—"}
                  </p>
                </div>
              </div>
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

export default ProtocolosEPI;
