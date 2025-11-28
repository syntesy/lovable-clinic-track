import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Relatorios = () => {
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    toast.info("Funcionalidade de exportação será implementada em breve");
  };

  const handleGenerateReport = () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente primeiro");
      return;
    }
    navigate(`/relatorios/visualizar/${selectedPatientId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Relatórios e Exportação
        </h2>
        <p className="text-muted-foreground">
          Exporte dados para pesquisa científica
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="mr-2 h-5 w-5 text-primary" />
              Exportar Dados Completos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Exporta todos os dados dos pacientes, protocolos, sessões e
              resultados em formato CSV ou Excel para análise científica.
            </p>
            <div className="space-y-2">
              <Button
                onClick={handleExport}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar para CSV
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar para Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Relatório de Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gera relatório consolidado com estatísticas de tratamento,
              evolução de escalas e distribuição de resultados.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecionar Paciente</label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateReport}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!selectedPatientId}
            >
              <Download className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Dados Incluídos na Exportação</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Dados completos de identificação dos pacientes
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Avaliações clínicas e diagnósticos
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Parâmetros completos dos protocolos MAC utilizados
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Evolução por sessão com escalas EVA, função e mobilidade
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Técnicas complementares aplicadas
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Resultados finais e tempo de tratamento
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Links para documentos e imagens armazenadas
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;
