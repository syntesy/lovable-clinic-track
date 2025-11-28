import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Protocolos = () => {
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

  // Group protocols by category
  const groupedProtocols = protocols?.reduce((acc, protocol) => {
    let category = "";
    
    if (protocol.protocol_name.includes("Luz Vermelha") || protocol.protocol_name.includes("RED")) {
      category = "Luz Vermelha (660 nm)";
    } else if (protocol.protocol_name.includes("Infravermelho") || protocol.protocol_name.includes("INFRARED")) {
      category = "Infravermelho (850-808 nm)";
    } else if (protocol.protocol_name.includes("Luz Verde") || protocol.protocol_name.includes("GREEN")) {
      category = "Luz Verde (530 nm)";
    } else if (protocol.protocol_name.includes("Luz Âmbar") || protocol.protocol_name.includes("AMBER")) {
      category = "Luz Âmbar (590 nm)";
    } else if (protocol.protocol_name.includes("Muscular")) {
      category = "Lesões Musculares";
    } else if (protocol.protocol_name.includes("Ligamento") || protocol.protocol_name.includes("Entorse")) {
      category = "Lesões de Ligamento - Entorse";
    } else if (protocol.protocol_name.includes("Menisco")) {
      category = "Lesão de Menisco";
    } else if (protocol.protocol_name.includes("Tendão")) {
      category = "Lesões de Tendão";
    } else if (protocol.protocol_name.includes("Fratura")) {
      category = "Fraturas";
    } else {
      category = "Outros";
    }

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(protocol);
    return acc;
  }, {} as Record<string, typeof protocols>);

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
        <Accordion type="multiple" className="space-y-4">
          {Object.entries(groupedProtocols || {}).map(([category, categoryProtocols]) => (
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
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium text-foreground">
                          {protocol.protocol_name}
                        </CardTitle>
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
          ))}
        </Accordion>
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
