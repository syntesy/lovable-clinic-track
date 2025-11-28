import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, User } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const Relatorios = () => {
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

  const { data: patientReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ["patient-report", selectedPatientId],
    enabled: !!selectedPatientId,
    queryFn: async () => {
      // Buscar dados do paciente
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", selectedPatientId)
        .single();

      if (patientError) throw patientError;

      // Buscar prontuário clínico
      const { data: clinicalRecord } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .maybeSingle();

      // Buscar protocolos MAC
      const { data: protocols } = await supabase
        .from("mac_protocols")
        .select("*")
        .eq("patient_id", selectedPatientId);

      // Buscar sessões de tratamento
      const { data: sessions } = await supabase
        .from("treatment_sessions")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("session_number", { ascending: true });

      // Buscar imagens de ultrassom
      const { data: ultrasoundImages } = await supabase
        .from("ultrasound_images")
        .select("*")
        .eq("patient_id", selectedPatientId);

      // Buscar imagens de termografia
      const { data: thermographyImages } = await supabase
        .from("thermography_images")
        .select("*")
        .eq("patient_id", selectedPatientId);

      // Buscar exames de sangue
      const { data: bloodTests } = await supabase
        .from("blood_tests")
        .select("*")
        .eq("patient_id", selectedPatientId);

      return {
        patient,
        clinicalRecord,
        protocols: protocols || [],
        sessions: sessions || [],
        ultrasoundImages: ultrasoundImages || [],
        thermographyImages: thermographyImages || [],
        bloodTests: bloodTests || [],
      };
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
    toast.success("Gerando relatório...");
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

      {selectedPatientId && patientReport && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              Relatório Completo - {patientReport.patient.full_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados do Paciente */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Dados do Paciente</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{patientReport.patient.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Idade:</span>
                  <p className="font-medium">{patientReport.patient.age} anos</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gênero:</span>
                  <p className="font-medium">{patientReport.patient.gender || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{patientReport.patient.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{patientReport.patient.email || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fototipo:</span>
                  <p className="font-medium">{patientReport.patient.skin_phototype || "—"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Avaliação Clínica Inicial */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Avaliação Clínica Inicial</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Região Tratada:</span>
                  <p className="font-medium">{patientReport.patient.treated_region || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">EVA Inicial:</span>
                  <p className="font-medium">{patientReport.patient.initial_vas || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Função Inicial:</span>
                  <p className="font-medium">{patientReport.patient.initial_function || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mobilidade Inicial:</span>
                  <p className="font-medium">{patientReport.patient.initial_mobility || "—"}</p>
                </div>
              </div>
              {patientReport.patient.clinical_diagnosis && (
                <div className="mt-3">
                  <span className="text-muted-foreground text-sm">Diagnóstico Clínico:</span>
                  <p className="text-sm mt-1">{patientReport.patient.clinical_diagnosis}</p>
                </div>
              )}
              {patientReport.clinicalRecord?.anamnesis && (
                <div className="mt-3">
                  <span className="text-muted-foreground text-sm">Anamnese:</span>
                  <p className="text-sm mt-1">{patientReport.clinicalRecord.anamnesis}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Protocolos MAC */}
            {patientReport.protocols.length > 0 && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Protocolos MAC Utilizados ({patientReport.protocols.length})
                  </h3>
                  <div className="space-y-3">
                    {patientReport.protocols.map((protocol, idx) => (
                      <div key={protocol.id} className="border border-border rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-2">Protocolo {idx + 1}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Tipo de Luz:</span>
                            <p>{protocol.light_type}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Comprimento de Onda:</span>
                            <p>{protocol.wavelength} nm</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Potência:</span>
                            <p>{protocol.power} W</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tempo:</span>
                            <p>{protocol.application_time} min</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Sessões de Evolução */}
            {patientReport.sessions.length > 0 && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Evolução por Sessão ({patientReport.sessions.length} sessões)
                  </h3>
                  <div className="space-y-3">
                    {patientReport.sessions.map((session) => (
                      <div key={session.id} className="border border-border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">Sessão #{session.session_number}</h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(session.session_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {session.vas_on_day !== null && (
                            <div>
                              <span className="text-muted-foreground">EVA no Dia:</span>
                              <p>{session.vas_on_day}</p>
                            </div>
                          )}
                          {session.function_score !== null && (
                            <div>
                              <span className="text-muted-foreground">Função:</span>
                              <p>{session.function_score}</p>
                            </div>
                          )}
                          {session.mobility_score !== null && (
                            <div>
                              <span className="text-muted-foreground">Mobilidade:</span>
                              <p>{session.mobility_score}</p>
                            </div>
                          )}
                          {session.light_type && (
                            <div>
                              <span className="text-muted-foreground">Luz Utilizada:</span>
                              <p>{session.light_type}</p>
                            </div>
                          )}
                        </div>
                        {session.clinical_observations && (
                          <div className="mt-2">
                            <span className="text-muted-foreground text-xs">Observações:</span>
                            <p className="text-xs mt-1">{session.clinical_observations}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Resultados Finais */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Resultados Finais</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {patientReport.patient.final_vas !== null && (
                  <div>
                    <span className="text-muted-foreground">EVA Final:</span>
                    <p className="font-medium">{patientReport.patient.final_vas}</p>
                  </div>
                )}
                {patientReport.patient.final_function !== null && (
                  <div>
                    <span className="text-muted-foreground">Função Final:</span>
                    <p className="font-medium">{patientReport.patient.final_function}</p>
                  </div>
                )}
                {patientReport.patient.final_mobility !== null && (
                  <div>
                    <span className="text-muted-foreground">Mobilidade Final:</span>
                    <p className="font-medium">{patientReport.patient.final_mobility}</p>
                  </div>
                )}
                {patientReport.patient.total_sessions !== null && (
                  <div>
                    <span className="text-muted-foreground">Total de Sessões:</span>
                    <p className="font-medium">{patientReport.patient.total_sessions}</p>
                  </div>
                )}
              </div>
              {patientReport.patient.final_outcome && (
                <div className="mt-3">
                  <span className="text-muted-foreground text-sm">Desfecho Final:</span>
                  <p className="text-sm mt-1">{patientReport.patient.final_outcome}</p>
                </div>
              )}
            </div>

            {/* Exames e Imagens */}
            <Separator />
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Exames e Documentação</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="border border-border rounded p-3">
                  <span className="text-muted-foreground">Ultrassom:</span>
                  <p className="font-medium">{patientReport.ultrasoundImages.length} imagens</p>
                </div>
                <div className="border border-border rounded p-3">
                  <span className="text-muted-foreground">Termografia:</span>
                  <p className="font-medium">{patientReport.thermographyImages.length} imagens</p>
                </div>
                <div className="border border-border rounded p-3">
                  <span className="text-muted-foreground">Exames de Sangue:</span>
                  <p className="font-medium">{patientReport.bloodTests.length} exames</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoadingReport && selectedPatientId && (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            Carregando relatório...
          </CardContent>
        </Card>
      )}

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
