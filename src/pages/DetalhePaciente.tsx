import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Activity, TrendingUp } from "lucide-react";

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
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="info">Dados Clínicos</TabsTrigger>
          <TabsTrigger value="protocol">Protocolo MAC</TabsTrigger>
          <TabsTrigger value="sessions">Evolução</TabsTrigger>
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
              <Button className="mt-4 bg-primary hover:bg-primary/90">
                Adicionar Protocolo
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
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
              <Button className="mt-4 bg-primary hover:bg-primary/90">
                Registrar Sessão
              </Button>
            </Card>
          )}
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
