import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Activity, TrendingUp, AlertTriangle, FlaskConical, CheckCircle2, XCircle, AlertCircle, Clock, FileSearch } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseRecommendedExams, parseLabResults, type ExamGroup, type LabResult } from "@/types/screening";
const DetalhePaciente = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: protocols } = useQuery({
    queryKey: ["patient-protocols", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mac_protocols")
        .select("*")
        .eq("patient_id", id);

      if (error) throw error;
      return data;
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["patient-sessions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_sessions")
        .select("*")
        .eq("patient_id", id)
        .order("session_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Query for PRP screenings
  const { data: screenings } = useQuery({
    queryKey: ["patient-screenings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prp_screenings")
        .select("*, prp_lab_results(*)")
        .eq("patient_id", id)
        .order("screening_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Query for blood tests
  const { data: bloodTests } = useQuery({
    queryKey: ["patient-blood-tests", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blood_tests")
        .select("*")
        .eq("patient_id", id)
        .order("collection_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getClassificationBadge = (classification: string) => {
    switch (classification?.toUpperCase()) {
      case "APTO":
        return <Badge className="bg-emerald-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" /> APTO</Badge>;
      case "APTO_COM_PREPARO":
        return <Badge className="bg-amber-500 text-white"><AlertCircle className="w-3 h-3 mr-1" /> APTO COM PREPARO</Badge>;
      case "NAO_APTO":
      case "CONTRAINDICADO":
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" /> NÃO APTO</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> {classification || "Aguardando"}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (!patient) {
    return <div className="text-center py-12">Paciente não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/pacientes")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            {patient.full_name}
          </h2>
          <p className="text-muted-foreground">
            {patient.age} anos • {patient.treated_region}
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={`inline-block px-3 py-1 text-sm rounded-full ${
              patient.status === "active"
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {patient.status === "active" ? "Em Tratamento" : "Alta"}
          </span>
        </div>
        <Button
          onClick={() => navigate(`/protocolo-mac/${id}`)}
          style={{
            backgroundColor: '#2F3F6B',
            color: '#FFFFFF',
            borderRadius: '12px',
            fontWeight: 600,
          }}
          className="hover:opacity-90 ml-2"
        >
          <FileText className="h-4 w-4 mr-2" />
          Novo Protocolo MAC
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="info">Dados Clínicos</TabsTrigger>
          <TabsTrigger value="triagem" className="flex items-center gap-1">
            <FlaskConical className="h-3 w-3" />
            Triagem & Exames
          </TabsTrigger>
          <TabsTrigger value="protocol">Protocolo MAC</TabsTrigger>
          <TabsTrigger value="sessions">Evolução</TabsTrigger>
          <TabsTrigger value="contraindications">Contra-Indicações</TabsTrigger>
          <TabsTrigger value="discharge">Alta</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Gênero</p>
                <p className="font-medium">{patient.gender || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{patient.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{patient.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profissão</p>
                <p className="font-medium">{patient.profession || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atividade Esportiva</p>
                <p className="font-medium">{patient.sport_activity || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Avaliação Clínica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Diagnóstico Clínico
                </p>
                <p className="text-sm">{patient.clinical_diagnosis || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Diagnóstico por Imagem
                </p>
                <p className="text-sm">{patient.imaging_diagnosis || "—"}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tempo de Sintomas
                  </p>
                  <p className="text-sm">{patient.symptoms_duration || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Classificação da Dor
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {patient.pain_type_nociceptive && (
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                        Nociceptiva
                      </span>
                    )}
                    {patient.pain_type_neuropathic && (
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                        Neuropática
                      </span>
                    )}
                    {patient.pain_type_nociplastic && (
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                        Nociplástica
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Escalas Baseline</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-accent/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">EVA Inicial</p>
                <p className="text-3xl font-bold text-foreground">
                  {patient.initial_vas ?? "—"}
                </p>
              </div>
              <div className="text-center p-4 bg-accent/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Função Inicial</p>
                <p className="text-3xl font-bold text-foreground">
                  {patient.initial_function ?? "—"}
                </p>
              </div>
              <div className="text-center p-4 bg-accent/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Mobilidade Inicial
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {patient.initial_mobility ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Triagem & Exames Tab */}
        <TabsContent value="triagem" className="space-y-6">
          {/* Triagens Realizadas */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <FlaskConical className="mr-2 h-5 w-5 text-primary" />
                Triagens Biológicas Pré-PRP
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/triagem-biologica?paciente=${id}`)}
              >
                Nova Triagem
              </Button>
            </CardHeader>
            <CardContent>
              {screenings && screenings.length > 0 ? (
                <div className="space-y-4">
                  {screenings.map((screening) => {
                    const recommendedExams: ExamGroup[] = parseRecommendedExams(screening.recommended_exams);
                    const labResults: LabResult[] = parseLabResults(screening.prp_lab_results);
                    
                    return (
                      <Card key={screening.id} className="bg-accent/5 border-border/50">
                        <CardContent className="pt-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium">
                                {format(new Date(screening.screening_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </div>
                              {getClassificationBadge(screening.classification || "")}
                            </div>
                          </div>
                          
                          {screening.analysis_result && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground mb-1">Análise</p>
                              <p className="text-sm bg-background/50 p-3 rounded-lg">{screening.analysis_result}</p>
                            </div>
                          )}

                          {/* Exames Solicitados */}
                          {recommendedExams && recommendedExams.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <FileSearch className="h-4 w-4" />
                                Exames Solicitados
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {recommendedExams.map((exam: ExamGroup, idx: number) => (
                                  <div key={idx} className="text-sm bg-background/50 p-2 rounded border border-border/30">
                                    <span className="font-medium">{exam.axis}</span>
                                    {exam.exams && exam.exams.length > 0 && (
                                      <p className="text-xs text-muted-foreground mt-1">{exam.exams.join(", ")}</p>
                                    )}
                                    {exam.justification && (
                                      <p className="text-xs text-muted-foreground mt-1">{exam.justification}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resultados de Exames */}
                          {labResults && labResults.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Resultados de Exames
                              </p>
                              <div className="space-y-2">
                                {labResults.map((result: LabResult) => (
                                  <div key={result.id} className="text-sm bg-emerald-500/10 p-3 rounded border border-emerald-500/20">
                                    {result.interpretation && (
                                      <p className="text-sm">{result.interpretation}</p>
                                    )}
                                    {result.updated_classification && (
                                      <div className="mt-2">
                                        <span className="text-xs text-muted-foreground">Classificação Atualizada: </span>
                                        {getClassificationBadge(result.updated_classification)}
                                      </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Registrado em {format(new Date(result.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {screening.patient_orientations && (
                            <div className="mt-4 pt-4 border-t border-border/30">
                              <p className="text-sm text-muted-foreground mb-1">Orientações ao Paciente</p>
                              <p className="text-sm">{screening.patient_orientations}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma triagem realizada ainda</p>
                  <Button 
                    onClick={() => navigate(`/triagem-biologica?paciente=${id}`)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Iniciar Triagem
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exames de Sangue */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Exames Laboratoriais
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bloodTests && bloodTests.length > 0 ? (
                <div className="space-y-3">
                  {bloodTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-border/30">
                      <div>
                        <p className="font-medium text-sm">{test.test_type}</p>
                        <p className="text-xs text-muted-foreground">
                          Coleta: {format(new Date(test.collection_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        {test.observations && (
                          <p className="text-xs text-muted-foreground mt-1">{test.observations}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">{test.file_name}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum exame laboratorial registrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocol" className="space-y-4">
          {protocols && protocols.length > 0 ? (
            protocols.map((protocol) => (
              <Card key={protocol.id} className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-primary" />
                    Protocolo MAC
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Luz</p>
                      <p className="font-medium">{protocol.light_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Comprimento de Onda
                      </p>
                      <p className="font-medium">{protocol.wavelength} nm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Potência</p>
                      <p className="font-medium">{protocol.power} mW</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Energia Total</p>
                      <p className="font-medium">{protocol.total_energy} J</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fluência</p>
                      <p className="font-medium">{protocol.fluence} J/cm²</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tempo de Aplicação
                      </p>
                      <p className="font-medium">{protocol.application_time}s</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modo</p>
                      <p className="font-medium">{protocol.delivery_mode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Técnica</p>
                      <p className="font-medium">{protocol.technique}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tecido Alvo
                      </p>
                      <p className="font-medium">{protocol.target_tissue}</p>
                    </div>
                  </div>
                  {protocol.uses_photosensitizer && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold mb-2">
                        Fotossensibilizador
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo</p>
                          <p className="font-medium">
                            {protocol.photosensitizer_type}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Concentração
                          </p>
                          <p className="font-medium">
                            {protocol.concentration}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center border-border">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum protocolo cadastrado ainda
              </p>
              <Button 
                className="mt-4 bg-primary hover:bg-primary/90"
                onClick={() => navigate(`/protocolo-mac/${id}`)}
              >
                Adicionar Protocolo
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => navigate(`/evolucao/${id}`)}
              style={{
                backgroundColor: '#2F3F6B',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontWeight: 600,
              }}
              className="hover:opacity-90"
            >
              <Activity className="h-4 w-4 mr-2" />
              Registrar Evolução
            </Button>
          </div>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Activity className="mr-2 h-5 w-5 text-primary" />
                        Sessão #{session.session_number}
                      </span>
                      <span className="text-sm text-muted-foreground font-normal">
                        {new Date(session.session_date).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-accent/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          EVA
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {session.vas_on_day ?? "—"}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-accent/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Função
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {session.function_score ?? "—"}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-accent/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Mobilidade
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {session.mobility_score ?? "—"}
                        </p>
                      </div>
                    </div>
                    {session.session_description && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Descrição
                        </p>
                        <p className="text-sm">{session.session_description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center border-border">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma sessão registrada ainda
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contraindications" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-primary" />
                Contra-Indicações por Tratamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="mac" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="mac">MAC</TabsTrigger>
                  <TabsTrigger value="epi">EPI</TabsTrigger>
                  <TabsTrigger value="prp">PRP</TabsTrigger>
                  <TabsTrigger value="bma">BMA</TabsTrigger>
                  <TabsTrigger value="bmac">BMAC</TabsTrigger>
                </TabsList>

                <TabsContent value="mac" className="mt-4">
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">MAC - Método de Aceleração Cicatricial</h4>
                    <p className="text-sm text-muted-foreground">
                      Adicione aqui as contra-indicações específicas para o tratamento MAC.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="epi" className="mt-4">
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">EPI - Eletrólise Percutânea Intratecidual</h4>
                    <p className="text-sm text-muted-foreground">
                      Adicione aqui as contra-indicações específicas para o tratamento EPI.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="prp" className="mt-4">
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">PRP - Plasma Rico em Plaquetas</h4>
                    <p className="text-sm text-muted-foreground">
                      Adicione aqui as contra-indicações específicas para o tratamento PRP.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="bma" className="mt-4">
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">BMA - Aspirado de Medula Óssea</h4>
                    <p className="text-sm text-muted-foreground">
                      Adicione aqui as contra-indicações específicas para o tratamento BMA.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="bmac" className="mt-4">
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">BMAC - Concentrado de Aspirado de Medula Óssea</h4>
                    <p className="text-sm text-muted-foreground">
                      Adicione aqui as contra-indicações específicas para o tratamento BMAC.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discharge" className="space-y-4">
          {patient.status === "discharged" ? (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  Dados de Alta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      EVA Final
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {patient.final_vas ?? "—"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Função Final
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {patient.final_function ?? "—"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Mobilidade Final
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {patient.final_mobility ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total de Sessões
                    </p>
                    <p className="text-2xl font-bold">
                      {patient.total_sessions ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tempo Total
                    </p>
                    <p className="text-2xl font-bold">
                      {patient.total_treatment_days ?? "—"} dias
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center border-border">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Paciente ainda em tratamento
              </p>
              <Button className="mt-4 bg-primary hover:bg-primary/90">
                Registrar Alta
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetalhePaciente;
