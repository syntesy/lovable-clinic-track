import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Protocolo</TableHead>
                    <TableHead>Região</TableHead>
                    <TableHead>Técnica</TableHead>
                    <TableHead>λ (nm)</TableHead>
                    <TableHead>Potência</TableHead>
                    <TableHead>Energia</TableHead>
                    <TableHead>Fluência</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Azul de Metileno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {protocols.map((protocol) => (
                    <TableRow key={protocol.id}>
                      <TableCell className="font-medium">
                        {protocol.protocol_name}
                      </TableCell>
                      <TableCell>{protocol.region}</TableCell>
                      <TableCell>{protocol.technique}</TableCell>
                      <TableCell>{protocol.wavelength}</TableCell>
                      <TableCell>{protocol.power}</TableCell>
                      <TableCell>{protocol.total_energy}</TableCell>
                      <TableCell>{protocol.fluence}</TableCell>
                      <TableCell>{protocol.application_time}</TableCell>
                      <TableCell>
                        {protocol.uses_methylene_blue ? "Sim" : "Não"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
