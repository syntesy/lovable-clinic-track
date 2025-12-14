import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, FileText, Pencil, Trash2, Eye, X } from "lucide-react";
import { toast } from "sonner";

interface Protocol {
  id: string;
  nome: string | null;
  tipo_luz_1: string | null;
  tipo_luz_2: string | null;
  tipo_luz_3: string | null;
  tipo_luz_4: string | null;
  tempo_luz_1: number | null;
  tempo_luz_1_b: number | null;
  tempo_luz_1_c: number | null;
  tempo_luz_2: number | null;
  tempo_luz_2_b: number | null;
  tempo_luz_2_c: number | null;
  tempo_luz_3: number | null;
  tempo_luz_3_b: number | null;
  tempo_luz_3_c: number | null;
  tempo_luz_4: number | null;
  tempo_luz_4_b: number | null;
  tempo_luz_4_c: number | null;
  efeito_luz: string | null;
  created_at: string;
}

type ProtocolFormData = Omit<Protocol, "id" | "created_at">;

const LIGHT_TYPE_OPTIONS = ["Vermelho", "Infravermelho", "Verde", "Âmbar"];

const emptyFormData: ProtocolFormData = {
  nome: "",
  tipo_luz_1: null,
  tipo_luz_2: null,
  tipo_luz_3: null,
  tipo_luz_4: null,
  tempo_luz_1: null,
  tempo_luz_1_b: null,
  tempo_luz_1_c: null,
  tempo_luz_2: null,
  tempo_luz_2_b: null,
  tempo_luz_2_c: null,
  tempo_luz_3: null,
  tempo_luz_3_b: null,
  tempo_luz_3_c: null,
  tempo_luz_4: null,
  tempo_luz_4_b: null,
  tempo_luz_4_c: null,
  efeito_luz: "",
};

const ProtocolosMAC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [viewingProtocol, setViewingProtocol] = useState<Protocol | null>(null);
  const [deletingProtocol, setDeletingProtocol] = useState<Protocol | null>(null);
  const [formData, setFormData] = useState<ProtocolFormData>(emptyFormData);

  const { data: protocols, isLoading } = useQuery({
    queryKey: ["reference-protocols"],
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
      queryClient.invalidateQueries({ queryKey: ["reference-protocols"] });
      toast.success("Protocolo criado com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao criar protocolo");
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
      queryClient.invalidateQueries({ queryKey: ["reference-protocols"] });
      toast.success("Protocolo atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao atualizar protocolo");
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
      queryClient.invalidateQueries({ queryKey: ["reference-protocols"] });
      toast.success("Protocolo excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingProtocol(null);
    },
    onError: () => {
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

  const handleOpenEdit = (protocol: Protocol) => {
    setEditingProtocol(protocol);
    setFormData({
      nome: protocol.nome,
      tipo_luz_1: protocol.tipo_luz_1,
      tipo_luz_2: protocol.tipo_luz_2,
      tipo_luz_3: protocol.tipo_luz_3,
      tipo_luz_4: protocol.tipo_luz_4,
      tempo_luz_1: protocol.tempo_luz_1,
      tempo_luz_1_b: protocol.tempo_luz_1_b,
      tempo_luz_1_c: protocol.tempo_luz_1_c,
      tempo_luz_2: protocol.tempo_luz_2,
      tempo_luz_2_b: protocol.tempo_luz_2_b,
      tempo_luz_2_c: protocol.tempo_luz_2_c,
      tempo_luz_3: protocol.tempo_luz_3,
      tempo_luz_3_b: protocol.tempo_luz_3_b,
      tempo_luz_3_c: protocol.tempo_luz_3_c,
      tempo_luz_4: protocol.tempo_luz_4,
      tempo_luz_4_b: protocol.tempo_luz_4_b,
      tempo_luz_4_c: protocol.tempo_luz_4_c,
      efeito_luz: protocol.efeito_luz,
    });
    setIsDialogOpen(true);
  };

  const handleOpenView = (protocol: Protocol) => {
    setViewingProtocol(protocol);
    setIsViewDialogOpen(true);
  };

  const handleOpenDelete = (protocol: Protocol) => {
    setDeletingProtocol(protocol);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (field: keyof ProtocolFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearLight = (lightNumber: 1 | 2 | 3 | 4) => {
    if (lightNumber === 1) {
      setFormData((prev) => ({ ...prev, tipo_luz_1: null, tempo_luz_1: null, tempo_luz_1_b: null, tempo_luz_1_c: null }));
    } else if (lightNumber === 2) {
      setFormData((prev) => ({ ...prev, tipo_luz_2: null, tempo_luz_2: null, tempo_luz_2_b: null, tempo_luz_2_c: null }));
    } else if (lightNumber === 3) {
      setFormData((prev) => ({ ...prev, tipo_luz_3: null, tempo_luz_3: null, tempo_luz_3_b: null, tempo_luz_3_c: null }));
    } else if (lightNumber === 4) {
      setFormData((prev) => ({ ...prev, tipo_luz_4: null, tempo_luz_4: null, tempo_luz_4_b: null, tempo_luz_4_c: null }));
    }
  };

  const handleSubmit = () => {
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

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Protocolos MAC
          </h2>
          <p className="text-muted-foreground">
            Gerencie os protocolos de referência do Método de Aceleração Cicatricial
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

      {protocols && protocols.length > 0 ? (
        <div className="grid gap-4">
          {protocols.map((protocol) => (
            <Card key={protocol.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-foreground">
                      {protocol.nome || "Protocolo sem nome"}
                    </span>
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
            Nenhum protocolo cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro protocolo MAC
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
              {editingProtocol ? "Editar Protocolo" : "Novo Protocolo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Protocolo</Label>
              <Input
                value={formData.nome || ""}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Ex: Protocolo Tendinopatia"
              />
            </div>

            {/* 1ª Luz */}
            <div className="space-y-2 p-3 bg-accent/10 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">1ª Luz</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleClearLight(1)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Select value={formData.tipo_luz_1 || undefined} onValueChange={(v) => handleInputChange("tipo_luz_1", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{LIGHT_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                </Select>
                <Input type="number" placeholder="Tempo 1" value={formData.tempo_luz_1 || ""} onChange={(e) => handleInputChange("tempo_luz_1", e.target.value ? parseInt(e.target.value) : null)} />
                <Input type="number" placeholder="Tempo 2" value={formData.tempo_luz_1_b || ""} onChange={(e) => handleInputChange("tempo_luz_1_b", e.target.value ? parseInt(e.target.value) : null)} />
                <Input type="number" placeholder="Tempo 3" value={formData.tempo_luz_1_c || ""} onChange={(e) => handleInputChange("tempo_luz_1_c", e.target.value ? parseInt(e.target.value) : null)} />
              </div>
            </div>

            {/* 2ª Luz */}
            <div className="space-y-2 p-3 bg-accent/10 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">2ª Luz</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleClearLight(2)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Select value={formData.tipo_luz_2 || undefined} onValueChange={(v) => handleInputChange("tipo_luz_2", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{LIGHT_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                </Select>
                <Input type="number" placeholder="Tempo 1" value={formData.tempo_luz_2 || ""} onChange={(e) => handleInputChange("tempo_luz_2", e.target.value ? parseInt(e.target.value) : null)} />
                <Input type="number" placeholder="Tempo 2" value={formData.tempo_luz_2_b || ""} onChange={(e) => handleInputChange("tempo_luz_2_b", e.target.value ? parseInt(e.target.value) : null)} />
                <Input type="number" placeholder="Tempo 3" value={formData.tempo_luz_2_c || ""} onChange={(e) => handleInputChange("tempo_luz_2_c", e.target.value ? parseInt(e.target.value) : null)} />
              </div>
            </div>

            {/* 3ª Luz */}
            <div className="space-y-2 p-3 bg-accent/10 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">3ª Luz</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleClearLight(3)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Select value={formData.tipo_luz_3 || undefined} onValueChange={(v) => handleInputChange("tipo_luz_3", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{LIGHT_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                </Select>
                <Input type="number" placeholder="Tempo 1" value={formData.tempo_luz_3 || ""} onChange={(e) => handleInputChange("tempo_luz_3", e.target.value ? parseInt(e.target.value) : null)} />
                <Input type="number" placeholder="Tempo 2" value={formData.tempo_luz_3_b || ""} onChange={(e) => handleInputChange("tempo_luz_3_b", e.target.value ? parseInt(e.target.value) : null)} />
                <Input type="number" placeholder="Tempo 3" value={formData.tempo_luz_3_c || ""} onChange={(e) => handleInputChange("tempo_luz_3_c", e.target.value ? parseInt(e.target.value) : null)} />
              </div>
            </div>

            {/* 4ª Luz */}
            <div className="space-y-2 p-3 bg-accent/10 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">4ª Luz</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleClearLight(4)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Select value={formData.tipo_luz_4 || undefined} onValueChange={(v) => handleInputChange("tipo_luz_4", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{LIGHT_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                </Select>
                <Input type="number" placeholder="Tempo 1" value={formData.tempo_luz_4 || ""} onChange={(e) => handleInputChange("tempo_luz_4", e.target.value ? parseInt(e.target.value) : null)} />
                <Input type="number" placeholder="Tempo 2" value={formData.tempo_luz_4_b || ""} onChange={(e) => handleInputChange("tempo_luz_4_b", e.target.value ? parseInt(e.target.value) : null)} />
                <Input type="number" placeholder="Tempo 3" value={formData.tempo_luz_4_c || ""} onChange={(e) => handleInputChange("tempo_luz_4_c", e.target.value ? parseInt(e.target.value) : null)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Objetivos de Tratamento</Label>
              <Textarea
                value={formData.efeito_luz || ""}
                onChange={(e) => handleInputChange("efeito_luz", e.target.value)}
                placeholder="Descreva os objetivos e efeitos esperados..."
                className="min-h-[100px]"
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {viewingProtocol.tipo_luz_1 && (
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <p className="text-xs text-[#5A6080] font-medium">1ª Luz</p>
                    <p className="font-semibold text-foreground">
                      {viewingProtocol.tipo_luz_1}
                    </p>
                    <p className="text-xs text-[#5A6080]">
                      {[
                        viewingProtocol.tempo_luz_1,
                        viewingProtocol.tempo_luz_1_b,
                        viewingProtocol.tempo_luz_1_c,
                      ]
                        .filter(Boolean)
                        .join("s / ")}
                      s
                    </p>
                  </div>
                )}
                {viewingProtocol.tipo_luz_2 && (
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <p className="text-xs text-[#5A6080] font-medium">2ª Luz</p>
                    <p className="font-semibold text-foreground">
                      {viewingProtocol.tipo_luz_2}
                    </p>
                    <p className="text-xs text-[#5A6080]">
                      {[
                        viewingProtocol.tempo_luz_2,
                        viewingProtocol.tempo_luz_2_b,
                        viewingProtocol.tempo_luz_2_c,
                      ]
                        .filter(Boolean)
                        .join("s / ")}
                      s
                    </p>
                  </div>
                )}
                {viewingProtocol.tipo_luz_3 && (
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <p className="text-xs text-[#5A6080] font-medium">3ª Luz</p>
                    <p className="font-semibold text-foreground">
                      {viewingProtocol.tipo_luz_3}
                    </p>
                    <p className="text-xs text-[#5A6080]">
                      {[
                        viewingProtocol.tempo_luz_3,
                        viewingProtocol.tempo_luz_3_b,
                        viewingProtocol.tempo_luz_3_c,
                      ]
                        .filter(Boolean)
                        .join("s / ")}
                      s
                    </p>
                  </div>
                )}
                {viewingProtocol.tipo_luz_4 && (
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <p className="text-xs text-[#5A6080] font-medium">4ª Luz</p>
                    <p className="font-semibold text-foreground">
                      {viewingProtocol.tipo_luz_4}
                    </p>
                    <p className="text-xs text-[#5A6080]">
                      {[
                        viewingProtocol.tempo_luz_4,
                        viewingProtocol.tempo_luz_4_b,
                        viewingProtocol.tempo_luz_4_c,
                      ]
                        .filter(Boolean)
                        .join("s / ")}
                      s
                    </p>
                  </div>
                )}
              </div>
              {viewingProtocol.efeito_luz && (
                <div className="bg-accent/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-[#5A6080] mb-1">
                    Objetivos de Tratamento
                  </p>
                  <p className="text-foreground">{viewingProtocol.efeito_luz}</p>
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

export default ProtocolosMAC;
