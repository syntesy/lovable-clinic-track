import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, Pencil, Trash2, Loader2, Eye, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LIGHT_TYPE_OPTIONS = ["Vermelho", "Infravermelho", "Verde", "Âmbar"];

interface Protocol {
  id: string;
  nome: string | null;
  tipo_luz_1: string | null;
  tempo_luz_1: number | null;
  tempo_luz_1_b: number | null;
  tempo_luz_1_c: number | null;
  tipo_luz_2: string | null;
  tempo_luz_2: number | null;
  tempo_luz_2_b: number | null;
  tempo_luz_2_c: number | null;
  tipo_luz_3: string | null;
  tempo_luz_3: number | null;
  tempo_luz_3_b: number | null;
  tempo_luz_3_c: number | null;
  tipo_luz_4: string | null;
  tempo_luz_4: number | null;
  tempo_luz_4_b: number | null;
  tempo_luz_4_c: number | null;
  efeito_luz: string | null;
  created_at: string;
}

type ProtocolFormData = Omit<Protocol, 'id' | 'created_at'>;

const emptyFormData: ProtocolFormData = {
  nome: "",
  tipo_luz_1: "",
  tempo_luz_1: null,
  tempo_luz_1_b: null,
  tempo_luz_1_c: null,
  tipo_luz_2: "",
  tempo_luz_2: null,
  tempo_luz_2_b: null,
  tempo_luz_2_c: null,
  tipo_luz_3: "",
  tempo_luz_3: null,
  tempo_luz_3_b: null,
  tempo_luz_3_c: null,
  tipo_luz_4: "",
  tempo_luz_4: null,
  tempo_luz_4_b: null,
  tempo_luz_4_c: null,
  efeito_luz: "",
};

const Protocolos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [viewingProtocol, setViewingProtocol] = useState<Protocol | null>(null);
  const [deletingProtocolId, setDeletingProtocolId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProtocolFormData>(emptyFormData);

  const { data: protocols, isLoading } = useQuery({
    queryKey: ["reference_protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_protocols")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as Protocol[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProtocolFormData) => {
      const { error } = await supabase.from("reference_protocols").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference_protocols"] });
      toast({ title: "Protocolo criado com sucesso" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao criar protocolo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProtocolFormData }) => {
      const { error } = await supabase
        .from("reference_protocols")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference_protocols"] });
      toast({ title: "Protocolo atualizado com sucesso" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar protocolo", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reference_protocols")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference_protocols"] });
      toast({ title: "Protocolo excluído com sucesso" });
      setIsDeleteDialogOpen(false);
      setDeletingProtocolId(null);
    },
    onError: () => {
      toast({ title: "Erro ao excluir protocolo", variant: "destructive" });
    },
  });

  const handleOpenNewDialog = () => {
    setEditingProtocol(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (protocol: Protocol) => {
    setEditingProtocol(protocol);
    setFormData({
      nome: protocol.nome || "",
      tipo_luz_1: protocol.tipo_luz_1 || "",
      tempo_luz_1: protocol.tempo_luz_1,
      tempo_luz_1_b: protocol.tempo_luz_1_b,
      tempo_luz_1_c: protocol.tempo_luz_1_c,
      tipo_luz_2: protocol.tipo_luz_2 || "",
      tempo_luz_2: protocol.tempo_luz_2,
      tempo_luz_2_b: protocol.tempo_luz_2_b,
      tempo_luz_2_c: protocol.tempo_luz_2_c,
      tipo_luz_3: protocol.tipo_luz_3 || "",
      tempo_luz_3: protocol.tempo_luz_3,
      tempo_luz_3_b: protocol.tempo_luz_3_b,
      tempo_luz_3_c: protocol.tempo_luz_3_c,
      tipo_luz_4: protocol.tipo_luz_4 || "",
      tempo_luz_4: protocol.tempo_luz_4,
      tempo_luz_4_b: protocol.tempo_luz_4_b,
      tempo_luz_4_c: protocol.tempo_luz_4_c,
      efeito_luz: protocol.efeito_luz || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProtocol(null);
    setFormData(emptyFormData);
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingProtocolId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenViewDialog = (protocol: Protocol) => {
    setViewingProtocol(protocol);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingProtocol) {
      updateMutation.mutate({ id: editingProtocol.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingProtocolId) {
      deleteMutation.mutate(deletingProtocolId);
    }
  };

  const handleInputChange = (field: keyof ProtocolFormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearLight = (lightNumber: 1 | 2 | 3 | 4) => {
    setFormData((prev) => {
      const updates = { ...prev };
      if (lightNumber === 1) {
        updates.tipo_luz_1 = null;
        updates.tempo_luz_1 = null;
        updates.tempo_luz_1_b = null;
        updates.tempo_luz_1_c = null;
      } else if (lightNumber === 2) {
        updates.tipo_luz_2 = null;
        updates.tempo_luz_2 = null;
        updates.tempo_luz_2_b = null;
        updates.tempo_luz_2_c = null;
      } else if (lightNumber === 3) {
        updates.tipo_luz_3 = null;
        updates.tempo_luz_3 = null;
        updates.tempo_luz_3_b = null;
        updates.tempo_luz_3_c = null;
      } else if (lightNumber === 4) {
        updates.tipo_luz_4 = null;
        updates.tempo_luz_4 = null;
        updates.tempo_luz_4_b = null;
        updates.tempo_luz_4_c = null;
      }
      return updates;
    });
  };

  const formatTimes = (t1: number | null, t2: number | null, t3: number | null) => {
    const times = [t1, t2, t3].filter(t => t !== null);
    return times.length > 0 ? times.join('s / ') + 's' : '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Protocolos de Referência</h1>
        <Button onClick={handleOpenNewDialog} className="bg-[#2F3F6B] hover:bg-[#2F3F6B]/90 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Protocolo
        </Button>
      </div>

      {protocols && protocols.length === 0 ? (
        <Card className="p-8 text-center bg-card/85 backdrop-blur-sm">
          <p className="text-muted-foreground">Nenhum protocolo cadastrado.</p>
          <Button onClick={handleOpenNewDialog} className="mt-4 bg-[#2F3F6B] hover:bg-[#2F3F6B]/90">
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Protocolo
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {protocols?.map((protocol) => (
            <Card key={protocol.id} className="p-4 md:p-6 bg-card/85 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-foreground truncate">{protocol.nome || "Protocolo sem nome"}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenViewDialog(protocol)}
                    className="border-[#3D4F7C] text-[#3D4F7C] hover:bg-[#3D4F7C]/10 text-xs md:text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(protocol)}
                    className="border-[#3D4F7C] text-[#3D4F7C] hover:bg-[#3D4F7C]/10 text-xs md:text-sm"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeleteDialog(protocol.id)}
                    className="border-destructive text-destructive hover:bg-destructive/10 text-xs md:text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingProtocol ? "Editar Protocolo" : "Novo Protocolo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-foreground">Nome do Protocolo</Label>
              <Input
                id="nome"
                value={formData.nome || ""}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Ex: Protocolo Tendão de Aquiles Fase Aguda"
                className="bg-[#F5F6FA] border-[#C5CADF]"
              />
            </div>

            {/* 1ª Luz */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">1ª Luz</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={formData.tipo_luz_1 || undefined}
                  onValueChange={(value) => handleInputChange("tipo_luz_1", value)}
                >
                  <SelectTrigger className="w-[160px] bg-[#F5F6FA] border-[#C5CADF]">
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {LIGHT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={formData.tempo_luz_1 || ""}
                  onChange={(e) => handleInputChange("tempo_luz_1", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T1 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Input
                  type="number"
                  value={formData.tempo_luz_1_b || ""}
                  onChange={(e) => handleInputChange("tempo_luz_1_b", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T2 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Input
                  type="number"
                  value={formData.tempo_luz_1_c || ""}
                  onChange={(e) => handleInputChange("tempo_luz_1_c", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T3 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClearLight(1)}
                  className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  title="Excluir luz"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 2ª Luz */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">2ª Luz</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={formData.tipo_luz_2 || undefined}
                  onValueChange={(value) => handleInputChange("tipo_luz_2", value)}
                >
                  <SelectTrigger className="w-[160px] bg-[#F5F6FA] border-[#C5CADF]">
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {LIGHT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={formData.tempo_luz_2 || ""}
                  onChange={(e) => handleInputChange("tempo_luz_2", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T1 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Input
                  type="number"
                  value={formData.tempo_luz_2_b || ""}
                  onChange={(e) => handleInputChange("tempo_luz_2_b", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T2 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Input
                  type="number"
                  value={formData.tempo_luz_2_c || ""}
                  onChange={(e) => handleInputChange("tempo_luz_2_c", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T3 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClearLight(2)}
                  className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  title="Excluir luz"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 3ª Luz */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">3ª Luz</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={formData.tipo_luz_3 || undefined}
                  onValueChange={(value) => handleInputChange("tipo_luz_3", value)}
                >
                  <SelectTrigger className="w-[160px] bg-[#F5F6FA] border-[#C5CADF]">
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {LIGHT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={formData.tempo_luz_3 || ""}
                  onChange={(e) => handleInputChange("tempo_luz_3", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T1 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Input
                  type="number"
                  value={formData.tempo_luz_3_b || ""}
                  onChange={(e) => handleInputChange("tempo_luz_3_b", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T2 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Input
                  type="number"
                  value={formData.tempo_luz_3_c || ""}
                  onChange={(e) => handleInputChange("tempo_luz_3_c", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T3 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClearLight(3)}
                  className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  title="Excluir luz"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 4ª Luz */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">4ª Luz</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={formData.tipo_luz_4 || undefined}
                  onValueChange={(value) => handleInputChange("tipo_luz_4", value)}
                >
                  <SelectTrigger className="w-[160px] bg-[#F5F6FA] border-[#C5CADF]">
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {LIGHT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={formData.tempo_luz_4 || ""}
                  onChange={(e) => handleInputChange("tempo_luz_4", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T1 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Input
                  type="number"
                  value={formData.tempo_luz_4_b || ""}
                  onChange={(e) => handleInputChange("tempo_luz_4_b", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T2 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Input
                  type="number"
                  value={formData.tempo_luz_4_c || ""}
                  onChange={(e) => handleInputChange("tempo_luz_4_c", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="T3 (s)"
                  className="w-[100px] bg-[#F5F6FA] border-[#C5CADF]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClearLight(4)}
                  className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  title="Excluir luz"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="efeito_luz" className="text-foreground">Objetivos de Tratamento</Label>
              <Textarea
                id="efeito_luz"
                value={formData.efeito_luz || ""}
                onChange={(e) => handleInputChange("efeito_luz", e.target.value)}
                placeholder="Descreva os objetivos do tratamento..."
                rows={3}
                className="bg-[#F5F6FA] border-[#C5CADF]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} className="border-[#C5CADF]">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#2F3F6B] hover:bg-[#2F3F6B]/90"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingProtocol ? "Salvar Alterações" : "Criar Protocolo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Protocol Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">
              {viewingProtocol?.nome || "Protocolo"}
            </DialogTitle>
          </DialogHeader>

          {viewingProtocol && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {viewingProtocol.tipo_luz_1 && (
                  <div className="bg-[#F5F6FA] p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">1ª Luz</p>
                    <p className="font-semibold text-foreground">{viewingProtocol.tipo_luz_1}</p>
                    <p className="text-sm text-muted-foreground">{formatTimes(viewingProtocol.tempo_luz_1, viewingProtocol.tempo_luz_1_b, viewingProtocol.tempo_luz_1_c)}</p>
                  </div>
                )}
                {viewingProtocol.tipo_luz_2 && (
                  <div className="bg-[#F5F6FA] p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">2ª Luz</p>
                    <p className="font-semibold text-foreground">{viewingProtocol.tipo_luz_2}</p>
                    <p className="text-sm text-muted-foreground">{formatTimes(viewingProtocol.tempo_luz_2, viewingProtocol.tempo_luz_2_b, viewingProtocol.tempo_luz_2_c)}</p>
                  </div>
                )}
                {viewingProtocol.tipo_luz_3 && (
                  <div className="bg-[#F5F6FA] p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">3ª Luz</p>
                    <p className="font-semibold text-foreground">{viewingProtocol.tipo_luz_3}</p>
                    <p className="text-sm text-muted-foreground">{formatTimes(viewingProtocol.tempo_luz_3, viewingProtocol.tempo_luz_3_b, viewingProtocol.tempo_luz_3_c)}</p>
                  </div>
                )}
                {viewingProtocol.tipo_luz_4 && (
                  <div className="bg-[#F5F6FA] p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">4ª Luz</p>
                    <p className="font-semibold text-foreground">{viewingProtocol.tipo_luz_4}</p>
                    <p className="text-sm text-muted-foreground">{formatTimes(viewingProtocol.tempo_luz_4, viewingProtocol.tempo_luz_4_b, viewingProtocol.tempo_luz_4_c)}</p>
                  </div>
                )}
              </div>

              {viewingProtocol.efeito_luz && (
                <div className="bg-[#F5F6FA] p-4 rounded-lg">
                  <p className="text-sm font-semibold text-foreground mb-2">Objetivos de Tratamento</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{viewingProtocol.efeito_luz}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
              className="border-[#C5CADF]"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#C5CADF]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Protocolos;
