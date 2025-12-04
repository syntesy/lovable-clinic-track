import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Protocol {
  id: string;
  nome: string | null;
  diagnostico: string;
  regiao: string;
  tipo_luz_1: string | null;
  tempo_luz_1: number | null;
  tipo_luz_2: string | null;
  tempo_luz_2: number | null;
  tipo_luz_3: string | null;
  tempo_luz_3: number | null;
  tipo_luz_4: string | null;
  tempo_luz_4: number | null;
  efeito_luz: string | null;
  created_at: string;
}

type ProtocolFormData = Omit<Protocol, 'id' | 'created_at'>;

const emptyFormData: ProtocolFormData = {
  nome: "",
  diagnostico: "",
  regiao: "",
  tipo_luz_1: "",
  tempo_luz_1: null,
  tipo_luz_2: "",
  tempo_luz_2: null,
  tipo_luz_3: "",
  tempo_luz_3: null,
  tipo_luz_4: "",
  tempo_luz_4: null,
  efeito_luz: "",
};

const Protocolos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [deletingProtocolId, setDeletingProtocolId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProtocolFormData>(emptyFormData);

  const { data: protocols, isLoading } = useQuery({
    queryKey: ["reference_protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_protocols")
        .select("*")
        .order("diagnostico", { ascending: true });
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
      diagnostico: protocol.diagnostico,
      regiao: protocol.regiao,
      tipo_luz_1: protocol.tipo_luz_1 || "",
      tempo_luz_1: protocol.tempo_luz_1,
      tipo_luz_2: protocol.tipo_luz_2 || "",
      tempo_luz_2: protocol.tempo_luz_2,
      tipo_luz_3: protocol.tipo_luz_3 || "",
      tempo_luz_3: protocol.tempo_luz_3,
      tipo_luz_4: protocol.tipo_luz_4 || "",
      tempo_luz_4: protocol.tempo_luz_4,
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

  const handleSubmit = () => {
    if (!formData.diagnostico.trim() || !formData.regiao.trim()) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Protocolos de Referência</h1>
        <Button onClick={handleOpenNewDialog} className="bg-[#2F3F6B] hover:bg-[#2F3F6B]/90">
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
        <div className="grid gap-4">
          {protocols?.map((protocol) => (
            <Card key={protocol.id} className="p-6 bg-card/85 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  {protocol.nome && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{protocol.nome}</p>
                  )}
                  <h3 className="text-lg font-semibold text-foreground">{protocol.diagnostico}</h3>
                  <p className="text-sm text-muted-foreground">Região: {protocol.regiao}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(protocol)}
                    className="border-[#3D4F7C] text-[#3D4F7C] hover:bg-[#3D4F7C]/10"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeleteDialog(protocol.id)}
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {protocol.tipo_luz_1 && (
                  <div className="bg-[#F5F6FA] p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">1ª Luz</p>
                    <p className="font-medium text-foreground">{protocol.tipo_luz_1}</p>
                    <p className="text-sm text-muted-foreground">{protocol.tempo_luz_1}s</p>
                  </div>
                )}
                {protocol.tipo_luz_2 && (
                  <div className="bg-[#F5F6FA] p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">2ª Luz</p>
                    <p className="font-medium text-foreground">{protocol.tipo_luz_2}</p>
                    <p className="text-sm text-muted-foreground">{protocol.tempo_luz_2}s</p>
                  </div>
                )}
                {protocol.tipo_luz_3 && (
                  <div className="bg-[#F5F6FA] p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">3ª Luz</p>
                    <p className="font-medium text-foreground">{protocol.tipo_luz_3}</p>
                    <p className="text-sm text-muted-foreground">{protocol.tempo_luz_3}s</p>
                  </div>
                )}
                {protocol.tipo_luz_4 && (
                  <div className="bg-[#F5F6FA] p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">4ª Luz</p>
                    <p className="font-medium text-foreground">{protocol.tipo_luz_4}</p>
                    <p className="text-sm text-muted-foreground">{protocol.tempo_luz_4}s</p>
                  </div>
                )}
              </div>

              {protocol.efeito_luz && (
                <div className="bg-[#F5F6FA] p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Efeito da Luz</p>
                  <p className="text-sm text-foreground">{protocol.efeito_luz}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingProtocol ? "Editar Protocolo" : "Novo Protocolo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diagnostico" className="text-foreground">Diagnóstico *</Label>
                <Input
                  id="diagnostico"
                  value={formData.diagnostico}
                  onChange={(e) => handleInputChange("diagnostico", e.target.value)}
                  placeholder="Ex: Tendinopatia de Aquiles"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regiao" className="text-foreground">Região *</Label>
                <Input
                  id="regiao"
                  value={formData.regiao}
                  onChange={(e) => handleInputChange("regiao", e.target.value)}
                  placeholder="Ex: Tornozelo"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_luz_1" className="text-foreground">1ª Luz</Label>
                <Input
                  id="tipo_luz_1"
                  value={formData.tipo_luz_1 || ""}
                  onChange={(e) => handleInputChange("tipo_luz_1", e.target.value)}
                  placeholder="Ex: Vermelho"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo_luz_1" className="text-foreground">Tempo 1ª Luz (s)</Label>
                <Input
                  id="tempo_luz_1"
                  type="number"
                  value={formData.tempo_luz_1 || ""}
                  onChange={(e) => handleInputChange("tempo_luz_1", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Ex: 300"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_luz_2" className="text-foreground">2ª Luz</Label>
                <Input
                  id="tipo_luz_2"
                  value={formData.tipo_luz_2 || ""}
                  onChange={(e) => handleInputChange("tipo_luz_2", e.target.value)}
                  placeholder="Ex: Infravermelho"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo_luz_2" className="text-foreground">Tempo 2ª Luz (s)</Label>
                <Input
                  id="tempo_luz_2"
                  type="number"
                  value={formData.tempo_luz_2 || ""}
                  onChange={(e) => handleInputChange("tempo_luz_2", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Ex: 600"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_luz_3" className="text-foreground">3ª Luz</Label>
                <Input
                  id="tipo_luz_3"
                  value={formData.tipo_luz_3 || ""}
                  onChange={(e) => handleInputChange("tipo_luz_3", e.target.value)}
                  placeholder="Ex: Verde"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo_luz_3" className="text-foreground">Tempo 3ª Luz (s)</Label>
                <Input
                  id="tempo_luz_3"
                  type="number"
                  value={formData.tempo_luz_3 || ""}
                  onChange={(e) => handleInputChange("tempo_luz_3", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Ex: 300"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_luz_4" className="text-foreground">4ª Luz</Label>
                <Input
                  id="tipo_luz_4"
                  value={formData.tipo_luz_4 || ""}
                  onChange={(e) => handleInputChange("tipo_luz_4", e.target.value)}
                  placeholder="Ex: Âmbar"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo_luz_4" className="text-foreground">Tempo 4ª Luz (s)</Label>
                <Input
                  id="tempo_luz_4"
                  type="number"
                  value={formData.tempo_luz_4 || ""}
                  onChange={(e) => handleInputChange("tempo_luz_4", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Ex: 300"
                  className="bg-[#F5F6FA] border-[#C5CADF]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="efeito_luz" className="text-foreground">Efeito da Luz</Label>
              <Textarea
                id="efeito_luz"
                value={formData.efeito_luz || ""}
                onChange={(e) => handleInputChange("efeito_luz", e.target.value)}
                placeholder="Descreva o efeito esperado da aplicação..."
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
              className="bg-destructive hover:bg-destructive/90"
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
