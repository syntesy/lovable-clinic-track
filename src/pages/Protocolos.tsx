import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Pencil, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Protocolos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProtocol, setEditingProtocol] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: protocols, isLoading } = useQuery({
    queryKey: ["reference-protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_protocols")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateProtocol = useMutation({
    mutationFn: async (updatedProtocol: any) => {
      const { error } = await supabase
        .from("reference_protocols")
        .update({
          protocol_name: updatedProtocol.protocol_name,
          region: updatedProtocol.region,
          technique: updatedProtocol.technique,
          wavelength: updatedProtocol.wavelength,
          application_time: updatedProtocol.application_time,
          power: updatedProtocol.power,
          total_energy: updatedProtocol.total_energy,
          fluence: updatedProtocol.fluence,
          irradiated_area: updatedProtocol.irradiated_area,
          indications: updatedProtocol.indications,
          observations: updatedProtocol.observations,
        })
        .eq("id", updatedProtocol.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference-protocols"] });
      setIsEditDialogOpen(false);
      setEditingProtocol(null);
      toast({
        title: "Protocolo atualizado",
        description: "O protocolo foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o protocolo.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const deleteProtocol = useMutation({
    mutationFn: async (protocolId: string) => {
      const { error } = await supabase
        .from("reference_protocols")
        .delete()
        .eq("id", protocolId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference-protocols"] });
      setIsDeleteDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingProtocol(null);
      toast({
        title: "Protocolo excluído",
        description: "O protocolo foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o protocolo.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleEditClick = (protocol: any) => {
    setEditingProtocol({ ...protocol });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingProtocol) {
      updateProtocol.mutate(editingProtocol);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (editingProtocol) {
      deleteProtocol.mutate(editingProtocol.id);
    }
  };

  // Group protocols by pathology
  const groupedProtocols = protocols?.reduce((acc, protocol) => {
    let category = "";
    
    if (protocol.protocol_name.includes("Muscular") || protocol.protocol_name.includes("Muscle")) {
      category = "Lesões Musculares";
    } else if (protocol.protocol_name.includes("Ligamento") || protocol.protocol_name.includes("Entorse") || protocol.protocol_name.includes("Sprain")) {
      category = "Lesões de Ligamento – Entorse";
    } else if (protocol.protocol_name.includes("Menisco") || protocol.protocol_name.includes("Meniscus")) {
      category = "Lesão de Menisco";
    } else if (protocol.protocol_name.includes("Tendão Agudo") || protocol.protocol_name.includes("Tendon Acute")) {
      category = "Lesões de Tendão – Agudo";
    } else if (protocol.protocol_name.includes("Tendão Crônico") || protocol.protocol_name.includes("Tendon Chronic")) {
      category = "Lesões de Tendão – Crônico";
    } else if (protocol.protocol_name.includes("Tendão") || protocol.protocol_name.includes("Tendon")) {
      // Generic tendon injuries if not specified as acute or chronic
      if (protocol.indications?.toLowerCase().includes("agudo") || protocol.indications?.toLowerCase().includes("acute")) {
        category = "Lesões de Tendão – Agudo";
      } else if (protocol.indications?.toLowerCase().includes("crônico") || protocol.indications?.toLowerCase().includes("chronic")) {
        category = "Lesões de Tendão – Crônico";
      } else {
        category = "Lesões de Tendão – Agudo";
      }
    } else if (protocol.protocol_name.includes("Fratura Qx") || protocol.protocol_name.includes("Fx Qx") || protocol.protocol_name.includes("Fracture Surgery")) {
      category = "Fraturas Cirúrgicas – Fx Qx";
    } else if (protocol.protocol_name.includes("Fratura no Qx") || protocol.protocol_name.includes("Fx no Qx") || protocol.protocol_name.includes("Fracture No Surgery")) {
      category = "Fraturas Não Cirúrgicas – Fx no Qx";
    } else if (protocol.protocol_name.includes("Fratura") || protocol.protocol_name.includes("Fracture")) {
      // Generic fracture if not specified
      if (protocol.indications?.toLowerCase().includes("cirurgia") || protocol.indications?.toLowerCase().includes("surgery")) {
        category = "Fraturas Cirúrgicas – Fx Qx";
      } else {
        category = "Fraturas Não Cirúrgicas – Fx no Qx";
      }
    } else {
      category = "Outros";
    }

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(protocol);
    return acc;
  }, {} as Record<string, typeof protocols>);

  // Define pathology order
  const pathologyOrder = [
    "Lesões Musculares",
    "Lesões de Ligamento – Entorse",
    "Lesão de Menisco",
    "Lesões de Tendão – Agudo",
    "Lesões de Tendão – Crônico",
    "Fraturas Cirúrgicas – Fx Qx",
    "Fraturas Não Cirúrgicas – Fx no Qx",
    "Outros",
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Protocolos de Referência
          </h2>
          <p className="text-muted-foreground">
            Biblioteca de protocolos MAC e fotobiomodulação
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Novo Protocolo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando...
        </div>
      ) : protocols && protocols.length > 0 ? (
        <>
          <Accordion type="multiple" className="space-y-4">
            {pathologyOrder.map((category) => {
              const categoryProtocols = groupedProtocols?.[category];
              if (!categoryProtocols || categoryProtocols.length === 0) return null;
              
              return (
                <AccordionItem key={category} value={category} className="border border-border rounded-lg bg-card">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {category}
                      </h3>
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({categoryProtocols.length} protocolos)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="grid gap-4 mt-2">
                      {categoryProtocols.map((protocol) => (
                        <Card key={protocol.id} className="border-border/50">
                          <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-medium text-foreground">
                              {protocol.protocol_name}
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(protocol)}
                              className="gap-2"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Região:</span>
                                <p className="font-medium text-foreground">{protocol.region}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Técnica:</span>
                                <p className="font-medium text-foreground">{protocol.technique}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">λ (nm):</span>
                                <p className="font-medium text-foreground">{protocol.wavelength}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Tempo:</span>
                                <p className="font-medium text-foreground">{protocol.application_time}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Potência:</span>
                                <p className="font-medium text-foreground">{protocol.power}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Energia:</span>
                                <p className="font-medium text-foreground">{protocol.total_energy}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Fluência:</span>
                                <p className="font-medium text-foreground">{protocol.fluence}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Área:</span>
                                <p className="font-medium text-foreground">{protocol.irradiated_area}</p>
                              </div>
                            </div>
                            {protocol.indications && (
                              <div className="pt-2 border-t border-border/50">
                                <span className="text-muted-foreground text-sm">Indicações:</span>
                                <p className="text-sm text-foreground mt-1">{protocol.indications}</p>
                              </div>
                            )}
                            {protocol.observations && (
                              <div className="pt-2 border-t border-border/50">
                                <span className="text-muted-foreground text-sm">Observações:</span>
                                <p className="text-sm text-foreground mt-1">{protocol.observations}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Protocolo</DialogTitle>
              </DialogHeader>
              {editingProtocol && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="protocol_name">Nome do Protocolo</Label>
                    <Input
                      id="protocol_name"
                      value={editingProtocol.protocol_name}
                      onChange={(e) =>
                        setEditingProtocol({ ...editingProtocol, protocol_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Região</Label>
                    <Input
                      id="region"
                      value={editingProtocol.region}
                      onChange={(e) =>
                        setEditingProtocol({ ...editingProtocol, region: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technique">Técnica</Label>
                    <Input
                      id="technique"
                      value={editingProtocol.technique}
                      onChange={(e) =>
                        setEditingProtocol({ ...editingProtocol, technique: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wavelength">Comprimento de Onda (nm)</Label>
                      <Input
                        id="wavelength"
                        value={editingProtocol.wavelength}
                        onChange={(e) =>
                          setEditingProtocol({ ...editingProtocol, wavelength: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="application_time">Tempo de Aplicação</Label>
                      <Input
                        id="application_time"
                        value={editingProtocol.application_time}
                        onChange={(e) =>
                          setEditingProtocol({ ...editingProtocol, application_time: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="power">Potência</Label>
                      <Input
                        id="power"
                        value={editingProtocol.power}
                        onChange={(e) =>
                          setEditingProtocol({ ...editingProtocol, power: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total_energy">Energia Total</Label>
                      <Input
                        id="total_energy"
                        value={editingProtocol.total_energy}
                        onChange={(e) =>
                          setEditingProtocol({ ...editingProtocol, total_energy: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fluence">Fluência</Label>
                      <Input
                        id="fluence"
                        value={editingProtocol.fluence}
                        onChange={(e) =>
                          setEditingProtocol({ ...editingProtocol, fluence: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="irradiated_area">Área Irradiada</Label>
                      <Input
                        id="irradiated_area"
                        value={editingProtocol.irradiated_area}
                        onChange={(e) =>
                          setEditingProtocol({ ...editingProtocol, irradiated_area: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="indications">Indicações</Label>
                    <Textarea
                      id="indications"
                      value={editingProtocol.indications || ""}
                      onChange={(e) =>
                        setEditingProtocol({ ...editingProtocol, indications: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      value={editingProtocol.observations || ""}
                      onChange={(e) =>
                        setEditingProtocol({ ...editingProtocol, observations: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-between gap-2 pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteClick}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir Protocolo
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveEdit}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita.
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
        </>
      ) : (
        <Card className="p-12 text-center border-border">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum protocolo cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Adicione protocolos de referência para consulta rápida
          </p>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Protocolo
          </Button>
        </Card>
      )}
    </div>
  );
};

export default Protocolos;
