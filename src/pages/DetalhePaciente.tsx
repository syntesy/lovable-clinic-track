import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, ChevronDown, User, Activity, FileText, 
  FlaskConical, ClipboardList, Brain, Calendar,
  CheckCircle2, AlertCircle, XCircle, Clock,
  TrendingUp, Plus, Filter, Beaker, BarChart3
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DetalhePaciente = () => {
  const navigate = useNavigate();
  const { id: patientIdFromUrl } = useParams();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedExamDate, setSelectedExamDate] = useState<string>("all");

  // Set patient from URL parameter on mount
  useEffect(() => {
    if (patientIdFromUrl && patientIdFromUrl !== selectedPatientId) {
      setSelectedPatientId(patientIdFromUrl);
    }
  }, [patientIdFromUrl]);

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

  // Fetch blood tests (exams)
  const { data: bloodTests } = useQuery({
    queryKey: ["patient-blood-tests", selectedPatientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blood_tests")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("collection_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId,
  });

  // Get unique exam dates for filtering
  const examDates = bloodTests
    ? [...new Set(bloodTests.map((bt) => bt.collection_date))]
    : [];

  // Filter exams by selected date
  const filteredExams = bloodTests?.filter((exam) =>
    selectedExamDate === "all" ? true : exam.collection_date === selectedExamDate
  );

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
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-center">
            <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full max-w-lg justify-between bg-card border-border hover:bg-muted/50 h-14 px-5"
                >
                  {selectedPatient ? (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground text-base">{selectedPatient.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPatient.age} anos • {selectedPatient.status === "active" ? "Ativo" : "Inativo"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Selecionar paciente...</span>
                  )}
                  <ChevronDown className="w-5 h-5 text-muted-foreground ml-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-0 bg-card border-border shadow-lg" align="center">
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paciente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-muted/50 border-0 h-11"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[320px]">
                  <div className="p-3">
                    {filteredPatients?.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                          navigate(`/pacientes/${p.id}`);
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{p.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.age} anos {p.treated_region && `• ${p.treated_region}`}
                          </p>
                        </div>
                        {getStatusBadge(p.status)}
                      </button>
                    ))}
                    {filteredPatients?.length === 0 && (
                      <p className="text-center text-muted-foreground py-10">Nenhum paciente encontrado</p>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedPatientId ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-3">Selecione um paciente</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Use o seletor acima para visualizar os detalhes completos do paciente
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Clinical Header Card */}
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-semibold text-foreground">{patient?.full_name}</h1>
                      {getStatusBadge(patient?.status || null)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium">{patient?.age}</span> anos
                      </span>
                      <span className="text-border">•</span>
                      <span>{patient?.gender === "M" ? "Masculino" : patient?.gender === "F" ? "Feminino" : "Não informado"}</span>
                      {patient?.treated_region && (
                        <>
                          <span className="text-border">•</span>
                          <span>{patient.treated_region}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Primary Action - Prontuário */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Prontuário Clínico</h3>
                    <p className="text-sm text-muted-foreground">Anamnese, diagnóstico e escalas do paciente</p>
                  </div>
                  <Button size="lg" className="gap-2" onClick={() => navigate(`/prontuario/${selectedPatientId}`)}>
                    <ClipboardList className="w-5 h-5" />
                    Acessar Prontuário
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" className="gap-2 h-10" onClick={() => navigate(`/triagem-biologica?paciente=${selectedPatientId}`)}>
                    <FlaskConical className="w-4 h-4" />
                    Iniciar Triagem Pré-PRP
                  </Button>
                  <Button variant="outline" className="gap-2 h-10" onClick={() => navigate(`/relatorios?paciente=${selectedPatientId}`)}>
                    <FileText className="w-4 h-4" />
                    Gerar Relatório
                  </Button>
                  <Button variant="outline" className="gap-2 h-10">
                    <ClipboardList className="w-4 h-4" />
                    Solicitar Exames
                  </Button>
                  <Button variant="outline" className="gap-2 h-10" onClick={() => navigate(`/agente-mac?paciente=${selectedPatientId}`)}>
                    <Brain className="w-4 h-4" />
                    Consultar AGENTE FISIOREGEN
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Navigation */}
            <div className="pt-2">
              <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-card border border-border p-1.5 h-auto w-full flex-wrap justify-start">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger value="triagem" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Triagem / Scores
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Histórico Clínico
                  </TabsTrigger>
                  <TabsTrigger value="exames" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Exames
                  </TabsTrigger>
                  <TabsTrigger value="protocolos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Protocolos
                  </TabsTrigger>
                  <TabsTrigger value="relatorios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Relatórios
                  </TabsTrigger>
                  <TabsTrigger value="decisao" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Decisão Clínica
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-8">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Diagnóstico Clínico
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-foreground text-lg">{patient?.clinical_diagnosis || "Não informado"}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Total de Sessões
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-4xl font-bold text-foreground">{sessions?.length || 0}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          EVA Inicial
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-4xl font-bold text-foreground">{patient?.initial_vas ?? "—"}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Triagem Tab */}
                <TabsContent value="triagem" className="mt-8">
                  <div className="max-w-2xl">
                    {screenings && screenings.length > 0 ? (
                      <Card className="bg-card border-border">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl">Score FISIOREGEN</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex items-center gap-8">
                            <div className="text-6xl font-bold text-primary">78</div>
                            <div className="flex-1 space-y-2">
                              <Progress value={78} className="h-4" />
                              <p className="text-sm text-muted-foreground">Prontidão Biológica</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-border">
                            {getClassificationBadge(screenings[0]?.classification || "")}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-card border-border">
                        <CardContent className="py-16 text-center">
                          <FlaskConical className="w-14 h-14 text-muted-foreground mx-auto mb-5" />
                          <p className="text-muted-foreground text-lg mb-4">Nenhuma triagem realizada</p>
                          <Button size="lg" onClick={() => navigate(`/triagem-biologica?paciente=${selectedPatientId}`)}>
                            Iniciar Triagem
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Histórico Tab */}
                <TabsContent value="historico" className="mt-8">
                  <div className="space-y-4 max-w-3xl">
                    {sessions && sessions.length > 0 ? (
                      sessions.map((session) => (
                        <Card key={session.id} className="bg-card border-border">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-5">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg flex-shrink-0">
                                {session.session_number}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">
                                    {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy")}
                                  </span>
                                </div>
                                <p className="text-foreground">{session.clinical_observations || "Sem observações"}</p>
                                {session.vas_on_day && (
                                  <p className="text-sm text-muted-foreground">EVA: {session.vas_on_day}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="bg-card border-border">
                        <CardContent className="py-16 text-center">
                          <Activity className="w-14 h-14 text-muted-foreground mx-auto mb-5" />
                          <p className="text-muted-foreground text-lg mb-4">Nenhuma sessão registrada</p>
                          <Button size="lg" onClick={() => navigate(`/prontuario/${selectedPatientId}`)}>
                            Criar Prontuário Clínico
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Exames Tab */}
                <TabsContent value="exames" className="mt-8">
                  <div className="max-w-3xl space-y-6">
                    {/* Header with Add Button and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <Button 
                        onClick={() => navigate(`/triagem-biologica?paciente=${selectedPatientId}`)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Exames
                      </Button>
                      
                      {examDates.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-muted-foreground" />
                          <Select value={selectedExamDate} onValueChange={setSelectedExamDate}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Filtrar por data" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas as datas</SelectItem>
                              {examDates.map((date) => (
                                <SelectItem key={date} value={date}>
                                  {format(new Date(date), "dd/MM/yyyy", { locale: ptBR })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Exams List */}
                    {filteredExams && filteredExams.length > 0 ? (
                      <div className="space-y-4">
                        {filteredExams.map((exam) => (
                          <Card key={exam.id} className="bg-card border-border">
                            <CardContent className="p-5">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-foreground">{exam.test_type}</h4>
                                    <Badge variant="outline" className="gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(exam.collection_date), "dd/MM/yyyy", { locale: ptBR })}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{exam.file_name}</p>
                                  {exam.observations && (
                                    <p className="text-sm text-muted-foreground mt-2">{exam.observations}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="bg-card border-border">
                        <CardContent className="py-16 text-center">
                          <FileText className="w-14 h-14 text-muted-foreground mx-auto mb-5" />
                          <p className="text-muted-foreground text-lg mb-4">Nenhum exame registrado</p>
                          <p className="text-sm text-muted-foreground">
                            Adicione exames através da Triagem Biológica para acompanhar a evolução do paciente
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Protocolos Tab */}
                <TabsContent value="protocolos" className="mt-8">
                  <div className="max-w-3xl space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Card 
                        className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/protocolos/mac?paciente=${selectedPatientId}`)}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Beaker className="w-7 h-7 text-primary" />
                          </div>
                          <h4 className="font-medium text-foreground mb-1">Protocolo MAC</h4>
                          <p className="text-sm text-muted-foreground">Modulação Avançada Celular</p>
                        </CardContent>
                      </Card>
                      <Card 
                        className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/protocolos/epi?paciente=${selectedPatientId}`)}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-7 h-7 text-orange-500" />
                          </div>
                          <h4 className="font-medium text-foreground mb-1">Protocolos EPI</h4>
                          <p className="text-sm text-muted-foreground">Eletrólise Percutânea</p>
                        </CardContent>
                      </Card>
                      <Card 
                        className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/protocolos/ortobiologicos?paciente=${selectedPatientId}`)}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                            <FlaskConical className="w-7 h-7 text-emerald-500" />
                          </div>
                          <h4 className="font-medium text-foreground mb-1">Ortobiológicos</h4>
                          <p className="text-sm text-muted-foreground">PRP, PRF, BMAC</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Relatórios Tab */}
                <TabsContent value="relatorios" className="mt-8">
                  <div className="max-w-3xl space-y-6">
                    <div className="flex justify-end">
                      <Button onClick={() => navigate(`/relatorios?paciente=${selectedPatientId}`)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Gerar Novo Relatório
                      </Button>
                    </div>
                    <Card className="bg-card border-border">
                      <CardContent className="py-16 text-center">
                        <BarChart3 className="w-14 h-14 text-muted-foreground mx-auto mb-5" />
                        <p className="text-muted-foreground text-lg mb-4">Nenhum relatório gerado</p>
                        <p className="text-sm text-muted-foreground">
                          Gere relatórios clínicos para documentar a evolução do paciente
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Decisão Clínica Tab */}
                <TabsContent value="decisao" className="mt-8">
                  <div className="max-w-2xl space-y-6">
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Brain className="w-5 h-5" />
                          Recomendações do Sistema
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-5 bg-muted/50 rounded-lg">
                          <div className="flex items-start gap-4">
                            <TrendingUp className="w-6 h-6 text-clinical-safe mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                              <p className="font-medium text-foreground text-lg">Paciente apresenta boa resposta ao tratamento</p>
                              <p className="text-muted-foreground">
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
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalhePaciente;
