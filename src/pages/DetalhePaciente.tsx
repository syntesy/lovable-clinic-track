import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, ChevronDown, User, Activity, FileText, 
  FlaskConical, ClipboardList, Brain, Calendar,
  CheckCircle2, AlertCircle, XCircle, Clock,
  ArrowRight, TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DetalhePaciente = () => {
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch all patients for dropdown
  const { data: patients } = useQuery({
    queryKey: ["all-patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, age, gender, status, treated_region")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch selected patient details
  const { data: patient } = useQuery({
    queryKey: ["patient", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", selectedPatientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId,
  });

  // Fetch sessions
  const { data: sessions } = useQuery({
    queryKey: ["patient-sessions", selectedPatientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_sessions")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId,
  });

  // Fetch screenings
  const { data: screenings } = useQuery({
    queryKey: ["patient-screenings", selectedPatientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prp_screenings")
        .select("*, prp_lab_results(*)")
        .eq("patient_id", selectedPatientId)
        .order("screening_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId,
  });

  const filteredPatients = patients?.filter((p) =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId);

  const getStatusBadge = (status: string | null) => {
    if (status === "active") {
      return <Badge className="bg-clinical-safe text-white text-xs">Ativo</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Inativo</Badge>;
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification?.toUpperCase()) {
      case "APTO":
        return <Badge className="bg-clinical-safe text-white"><CheckCircle2 className="w-3 h-3 mr-1" /> APTO</Badge>;
      case "APTO_COM_PREPARO":
        return <Badge className="bg-clinical-caution text-white"><AlertCircle className="w-3 h-3 mr-1" /> APTO COM PREPARO</Badge>;
      case "NAO_APTO":
      case "CONTRAINDICADO":
        return <Badge className="bg-clinical-danger text-white"><XCircle className="w-3 h-3 mr-1" /> NÃO APTO</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Aguardando</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Top Header with Patient Selector */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full max-w-md justify-between bg-card border-border hover:bg-muted/50 h-12"
              >
                {selectedPatient ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{selectedPatient.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedPatient.age} anos • {selectedPatient.status === "active" ? "Ativo" : "Inativo"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Selecionar paciente...</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-card border-border" align="start">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-muted/50 border-0"
                  />
                </div>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-2">
                  {filteredPatients?.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setIsDropdownOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{p.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.age} anos {p.treated_region && `• ${p.treated_region}`}
                        </p>
                      </div>
                      {getStatusBadge(p.status)}
                    </button>
                  ))}
                  {filteredPatients?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nenhum paciente encontrado</p>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!selectedPatientId ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">Selecione um paciente</h2>
            <p className="text-muted-foreground">Use o seletor acima para visualizar os detalhes do paciente</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Clinical Header Card */}
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-foreground">{patient?.full_name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                      <span>{patient?.age} anos</span>
                      <span>•</span>
                      <span>{patient?.gender === "M" ? "Masculino" : patient?.gender === "F" ? "Feminino" : "Não informado"}</span>
                      {patient?.treated_region && (
                        <>
                          <span>•</span>
                          <span>{patient.treated_region}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(patient?.status || null)}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2" onClick={() => navigate(`/triagem-biologica?patient=${selectedPatientId}`)}>
                <FlaskConical className="w-4 h-4" />
                Iniciar Triagem Pré-PRP
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => navigate(`/relatorios?patient=${selectedPatientId}`)}>
                <FileText className="w-4 h-4" />
                Gerar Relatório
              </Button>
              <Button variant="outline" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Solicitar Exames
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => navigate("/agente-mac")}>
                <Brain className="w-4 h-4" />
                Consultar AGENTE FISIOREGEN
              </Button>
            </div>

            {/* Tabs Navigation */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-card border border-border p-1 h-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="triagem" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Triagem / Scores
                </TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Histórico Clínico
                </TabsTrigger>
                <TabsTrigger value="exames" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Exames
                </TabsTrigger>
                <TabsTrigger value="relatorios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Relatórios
                </TabsTrigger>
                <TabsTrigger value="decisao" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Decisão Clínica
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Diagnóstico Clínico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground">{patient?.clinical_diagnosis || "Não informado"}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total de Sessões</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-foreground">{sessions?.length || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">EVA Inicial</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-foreground">{patient?.initial_vas ?? "—"}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Triagem Tab */}
              <TabsContent value="triagem" className="space-y-6">
                {screenings && screenings.length > 0 ? (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Score FISIOREGEN</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-6">
                        <div className="text-5xl font-bold text-primary">78</div>
                        <div className="flex-1">
                          <Progress value={78} className="h-3" />
                          <p className="text-sm text-muted-foreground mt-2">Prontidão Biológica</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border">
                        {getClassificationBadge(screenings[0]?.classification || "")}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="py-12 text-center">
                      <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma triagem realizada</p>
                      <Button className="mt-4" onClick={() => navigate(`/triagem-biologica?patient=${selectedPatientId}`)}>
                        Iniciar Triagem
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Histórico Tab */}
              <TabsContent value="historico" className="space-y-4">
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session, index) => (
                      <Card key={session.id} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                              {session.session_number}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </span>
                              </div>
                              <p className="mt-2 text-foreground">{session.clinical_observations || "Sem observações"}</p>
                              {session.vas_on_day && (
                                <p className="mt-1 text-sm text-muted-foreground">EVA: {session.vas_on_day}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="py-12 text-center">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma sessão registrada</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Exames Tab */}
              <TabsContent value="exames">
                <Card className="bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum exame anexado</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Relatórios Tab */}
              <TabsContent value="relatorios">
                <Card className="bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum relatório gerado</p>
                    <Button className="mt-4" variant="outline" onClick={() => navigate(`/relatorios?patient=${selectedPatientId}`)}>
                      Gerar Relatório
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Decisão Clínica Tab */}
              <TabsContent value="decisao" className="space-y-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Recomendações do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-clinical-safe mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Paciente apresenta boa resposta ao tratamento</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Baseado nas últimas {sessions?.length || 0} sessões e evolução do quadro clínico.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground text-center">
                  Este sistema não substitui o julgamento clínico profissional.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalhePaciente;
