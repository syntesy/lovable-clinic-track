import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Users, Activity, TrendingUp, Calendar } from "lucide-react";
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

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Total de pacientes
      const { count: totalPatients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      // Pacientes ativos
      const { count: activePatients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Total de sessões
      const { count: totalSessions } = await supabase
        .from("treatment_sessions")
        .select("*", { count: "exact", head: true });

      // Pacientes com alta
      const { count: dischargedPatients } = await supabase
        .from("patient_discharges")
        .select("*", { count: "exact", head: true });

      // Média de melhora (baseada em EVA)
      const { data: patientsWithVAS } = await supabase
        .from("patients")
        .select("initial_vas, final_vas")
        .not("initial_vas", "is", null)
        .not("final_vas", "is", null);

      let avgImprovement = 0;
      if (patientsWithVAS && patientsWithVAS.length > 0) {
        const improvements = patientsWithVAS.map(
          (p) => ((p.initial_vas! - p.final_vas!) / p.initial_vas!) * 100
        );
        avgImprovement =
          improvements.reduce((a, b) => a + b, 0) / improvements.length;
      }

      return {
        totalPatients: totalPatients || 0,
        activePatients: activePatients || 0,
        totalSessions: totalSessions || 0,
        dischargedPatients: dischargedPatients || 0,
        avgImprovement: avgImprovement.toFixed(1),
      };
    },
  });

  const handleExportCSV = async () => {
    try {
      // Buscar todos os dados necessários
      const { data: allPatients, error: patientsError } = await supabase
        .from("patients")
        .select("*")
        .order("full_name", { ascending: true });

      if (patientsError) throw patientsError;

      // Buscar sessões de todos os pacientes
      const { data: allSessions, error: sessionsError } = await supabase
        .from("treatment_sessions")
        .select("*")
        .order("session_date", { ascending: true });

      if (sessionsError) throw sessionsError;

      // Buscar protocolos de todos os pacientes
      const { data: allProtocols, error: protocolsError } = await supabase
        .from("mac_protocols")
        .select("*");

      if (protocolsError) throw protocolsError;

      // Criar CSV
      let csv = "DADOS COMPLETOS - SISTEMA MAC\n\n";

      // Cabeçalho de pacientes
      csv += "PACIENTES\n";
      csv += "Nome,Idade,Gênero,Telefone,Email,Região Tratada,Status,";
      csv += "EVA Inicial,EVA Final,Função Inicial,Função Final,";
      csv += "Mobilidade Inicial,Mobilidade Final,Total Sessões,";
      csv += "Dias de Tratamento,Diagnóstico Clínico,Desfecho Final\n";

      // Dados dos pacientes
      allPatients?.forEach((p) => {
        csv += `"${p.full_name}",${p.age || ""},"${p.gender || ""}","${
          p.phone || ""
        }","${p.email || ""}","${p.treated_region || ""}","${p.status || ""}",`;
        csv += `${p.initial_vas || ""},${p.final_vas || ""},${
          p.initial_function || ""
        },${p.final_function || ""},`;
        csv += `${p.initial_mobility || ""},${p.final_mobility || ""},${
          p.total_sessions || ""
        },${p.total_treatment_days || ""},`;
        csv += `"${p.clinical_diagnosis || ""}","${p.final_outcome || ""}"\n`;
      });

      csv += "\n\nSESSÕES DE TRATAMENTO\n";
      csv += "Paciente ID,Número da Sessão,Data,EVA,Função,Mobilidade,";
      csv += "Tipo de Luz,Tempo de Tratamento(s),Fármaco,Técnicas Associadas,";
      csv += "Descrição,Observações Clínicas\n";

      // Dados das sessões
      allSessions?.forEach((s) => {
        csv += `"${s.patient_id}",${s.session_number},"${s.session_date}",`;
        csv += `${s.vas_on_day || ""},${s.function_score || ""},${
          s.mobility_score || ""
        },`;
        csv += `"${s.light_type || ""}",${s.treatment_time || ""},"${
          s.pharmaceutical_used || ""
        }","${s.associated_techniques || ""}",`;
        csv += `"${s.session_description || ""}","${
          s.clinical_observations || ""
        }"\n`;
      });

      csv += "\n\nPROTOCOLOS MAC\n";
      csv += "Paciente ID,Tipo de Luz,Comprimento de Onda(nm),Potência(mW),";
      csv += "Energia Total(J),Fluência(J/cm²),Área Irradiada(cm²),";
      csv += "Tempo de Aplicação(s),Modo,Técnica,Tecido Alvo,";
      csv += "Usa Fotossensibilizador,Tipo Fotossensibilizador,Concentração(%)\n";

      // Dados dos protocolos
      allProtocols?.forEach((p) => {
        csv += `"${p.patient_id}","${p.light_type}",${p.wavelength},${p.power},`;
        csv += `${p.total_energy},${p.fluence},${p.irradiated_area},`;
        csv += `${p.application_time},"${p.delivery_mode}","${p.technique}","${p.target_tissue}",`;
        csv += `${p.uses_photosensitizer ? "Sim" : "Não"},"${
          p.photosensitizer_type || ""
        }",${p.concentration || ""}\n`;
      });

      // Download do arquivo
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `dados_mac_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar dados");
    }
  };

  const handleExportExcel = () => {
    toast.info(
      "Funcionalidade Excel em desenvolvimento. Use a exportação CSV que pode ser aberta no Excel."
    );
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
          Dashboard e Relatórios
        </h2>
        <p className="text-muted-foreground">
          Estatísticas e exportação de dados científicos
        </p>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activePatients || 0} em tratamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sessões realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes com Alta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dischargedPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tratamentos concluídos
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhora Média (EVA)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgImprovement || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Redução de dor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exportação e Relatórios */}
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
                onClick={handleExportCSV}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar para CSV
              </Button>
              <Button
                onClick={handleExportExcel}
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
              Relatório de Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gera relatório consolidado com estatísticas de tratamento,
              evolução de escalas e distribuição de resultados de um paciente específico.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Selecionar Paciente</label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger style={{
                  backgroundColor: '#F5F6FA',
                  border: '2px solid #3D4F7C',
                  borderRadius: '14px',
                }}>
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
              Dados completos de identificação dos pacientes (nome, idade, contato, região tratada)
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Avaliações clínicas e diagnósticos (EVA, função, mobilidade inicial e final)
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Parâmetros completos dos protocolos MAC utilizados (luz, potência, energia, fluência)
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Evolução por sessão com escalas EVA, função e mobilidade
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Técnicas complementares e fármacos aplicados
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Resultados finais e tempo de tratamento
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Dados de fotossensibilizadores quando aplicável
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;
