import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronDown, User, Activity, FileText, FlaskConical, ClipboardList, Brain, Calendar, CheckCircle2, AlertCircle, XCircle, Clock, TrendingUp, Plus, Filter, Beaker, BarChart3, Pencil, Waves, Syringe, Pill, CheckCircle, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { AvaliacaoRegenapp } from "@/components/RegenEvaluation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditPatientModal } from "@/components/EditPatientModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PatientEvaluationReport } from "@/components/PatientEvaluationReport";
import { PrescriptionFormModal } from "@/components/patient/PrescriptionFormModal";
import { PatientPrescriptionsList } from "@/components/patient/PatientPrescriptionsList";
import { ScreeningDetailModal } from "@/components/ScreeningDetailModal";
import { AddProcedureModal } from "@/components/AddProcedureModal";
import { Tables } from "@/integrations/supabase/types";
const DetalhePaciente = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    id: patientIdFromUrl
  } = useParams();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedExamDate, setSelectedExamDate] = useState<string>("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<Tables<"prp_screenings"> | null>(null);
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);

  // Handler for creating new clinical record
  const handleCreateNewRecord = async () => {
    if (!selectedPatientId) return;

    setIsCreatingRecord(true);
    try {
      const { data, error } = await supabase
        .from("clinical_records")
        .insert({
          patient_id: selectedPatientId,
          status: "draft",
          chief_complaint: "",
          anamnesis: "",
          physical_exam: "",
          clinical_diagnosis: "",
        })
        .select("id")
        .single();

      if (error) throw error;

      if (data?.id) {
        toast.success("Novo prontuário criado");
        navigate(`/patients/${selectedPatientId}/records/${data.id}`);
      }
    } catch (error) {
      console.error("Erro ao criar prontuário:", error);
      toast.error("Erro ao criar prontuário");
    } finally {
      setIsCreatingRecord(false);
    }
  };

  // Set patient from URL parameter on mount
  useEffect(() => {
    if (patientIdFromUrl && patientIdFromUrl !== selectedPatientId) {
      setSelectedPatientId(patientIdFromUrl);
    }
  }, [patientIdFromUrl]);

  // Fetch all patients for dropdown
  const {
    data: patients
  } = useQuery({
    queryKey: ["all-patients"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("patients").select("id, full_name, age, gender, status, treated_region").order("full_name");
      if (error) throw error;
      return data;
    }
  });

  // Fetch selected patient details
  const {
    data: patient
  } = useQuery({
    queryKey: ["patient", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      const {
        data,
        error
      } = await supabase.from("patients").select("*").eq("id", selectedPatientId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Fetch sessions
  const {
    data: sessions
  } = useQuery({
    queryKey: ["patient-sessions", selectedPatientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("treatment_sessions").select("*").eq("patient_id", selectedPatientId).order("session_date", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Fetch screenings
  const {
    data: screenings
  } = useQuery({
    queryKey: ["patient-screenings", selectedPatientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("prp_screenings").select("*, prp_lab_results(*)").eq("patient_id", selectedPatientId).order("screening_date", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Fetch blood tests (exams)
  const {
    data: bloodTests
  } = useQuery({
    queryKey: ["patient-blood-tests", selectedPatientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("blood_tests").select("*").eq("patient_id", selectedPatientId).order("collection_date", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Fetch patient procedures
  const {
    data: procedures
  } = useQuery({
    queryKey: ["patient-procedures", selectedPatientId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("patient_procedures").select("*").eq("patient_id", selectedPatientId).order("procedure_date", {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Get unique exam dates for filtering
  const examDates = bloodTests ? [...new Set(bloodTests.map(bt => bt.collection_date))] : [];

  // Filter exams by selected date
  const filteredExams = bloodTests?.filter(exam => selectedExamDate === "all" ? true : exam.collection_date === selectedExamDate);
  const filteredPatients = patients?.filter(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedPatient = patients?.find(p => p.id === selectedPatientId);
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
  return <div className="min-h-screen bg-background">
      {/* Fixed Top Header with Patient Selector */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-center">
            <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full max-w-lg justify-between bg-card border-border hover:bg-muted/50 h-14 px-5">
                  {selectedPatient ? <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground text-base">{selectedPatient.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPatient.age} anos • {selectedPatient.status === "active" ? "Ativo" : "Inativo"}
                        </p>
                      </div>
                    </div> : <span className="text-muted-foreground">Selecionar paciente...</span>}
                  <ChevronDown className="w-5 h-5 text-muted-foreground ml-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-0 bg-card border-border shadow-lg" align="center">
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar paciente..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-muted/50 border-0 h-11" />
                  </div>
                </div>
                <ScrollArea className="h-[320px]">
                  <div className="p-3">
                    {filteredPatients?.map(p => <button key={p.id} onClick={() => {
                    setSelectedPatientId(p.id);
                    setIsDropdownOpen(false);
                    setSearchQuery("");
                    navigate(`/pacientes/${p.id}`);
                  }} className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors text-left">
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
                      </button>)}
                    {filteredPatients?.length === 0 && <p className="text-center text-muted-foreground py-10">Nenhum paciente encontrado</p>}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedPatientId ? <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-3">Selecione um paciente</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Use o seletor acima para visualizar os detalhes completos do paciente
            </p>
          </div> : <div className="space-y-8 animate-fade-in">
            {/* Clinical Header Card */}
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <Avatar className="w-20 h-20 border-4 border-primary/20 flex-shrink-0">
                    <AvatarImage src={patient?.photo_url || undefined} alt={patient?.full_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {patient?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || <User className="w-10 h-10" />}
                    </AvatarFallback>
                  </Avatar>
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
                      {patient?.treated_region && <>
                          <span className="text-border">•</span>
                          <span>{patient.treated_region}</span>
                        </>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditModalOpen(true)}>
                    <Pencil className="w-4 h-4" />
                    Editar Cadastro
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Edit Patient Modal */}
            <EditPatientModal patient={patient} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />

            {/* Prescription Form Modal */}
            <PrescriptionFormModal open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen} patientId={selectedPatientId!} patientName={patient?.full_name || ''} />

            {/* Primary Action - Prontuário */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Prontuário Clínico</h3>
                    <p className="text-sm text-muted-foreground">Anamnese, diagnóstico e escalas do paciente</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="gap-2" 
                      onClick={() => navigate(`/patients/${selectedPatientId}/records`)}
                    >
                      <FolderOpen className="w-5 h-5" />
                      Ver Histórico
                    </Button>
                    <Button 
                      size="lg" 
                      className="gap-2" 
                      onClick={handleCreateNewRecord}
                      disabled={isCreatingRecord}
                    >
                      {isCreatingRecord ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      Novo Prontuário
                    </Button>
                  </div>
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
                  <TabsTrigger value="avaliacao" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Avaliação REGENAPP
                  </TabsTrigger>
                  <TabsTrigger value="triagem" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Histórico Triagens
                  </TabsTrigger>
                  <TabsTrigger value="prontuarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Prontuários
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
                  <TabsTrigger value="prescricoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                    Prescrições
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
                    
                    {/* Procedimentos Realizados */}
                    <Card className="bg-card border-border col-span-1 sm:col-span-2 lg:col-span-1">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Procedimentos Realizados
                          </CardTitle>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsProcedureModalOpen(true)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {procedures && procedures.length > 0 ? <div className="space-y-2">
                            <p className="text-3xl font-bold text-foreground mb-3">{procedures.length}</p>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {procedures.slice(0, 8).map(proc => <Badge key={proc.id} variant="secondary" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {proc.procedure_name}
                                </Badge>)}
                              {procedures.length > 8 && <Badge variant="outline" className="text-xs">
                                  +{procedures.length - 8} mais
                                </Badge>}
                            </div>
                          </div> : <div className="text-center py-2">
                            <p className="text-muted-foreground text-sm mb-2">Nenhum procedimento</p>
                            <Button variant="outline" size="sm" onClick={() => setIsProcedureModalOpen(true)}>
                              <Plus className="w-3 h-3 mr-1" />
                              Registrar
                            </Button>
                          </div>}
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          EVA Inicial
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-4xl font-bold text-foreground">
                          {(() => {
                        // Prioriza EVA da triagem mais recente, depois fallback para patient.initial_vas
                        const latestScreening = screenings?.[0];
                        if (latestScreening?.questionnaire_responses) {
                          const responses = latestScreening.questionnaire_responses as Record<string, unknown>;
                          // Tenta extrair do regen_canonical primeiro, depois answers
                          const canonical = responses?.regen_canonical as Record<string, unknown> | undefined;
                          const complaint = canonical?.complaint as Record<string, unknown> | undefined;
                          const painNrs = complaint?.pain_nrs;
                          if (painNrs != null && (typeof painNrs === 'number' || typeof painNrs === 'string')) {
                            return String(painNrs);
                          }
                          const answers = responses?.answers as Record<string, unknown> | undefined;
                          const dorEscala = answers?.dor_escala;
                          if (dorEscala != null && (typeof dorEscala === 'number' || typeof dorEscala === 'string')) {
                            return String(dorEscala);
                          }
                        }
                        return patient?.initial_vas != null ? String(patient.initial_vas) : "—";
                      })()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Avaliação REGENAPP - Aba Principal */}
                <TabsContent value="avaliacao" className="mt-8">
                  {selectedPatientId && (
                    <AvaliacaoRegenapp 
                      patientId={selectedPatientId} 
                      patientName={patient?.full_name}
                    />
                  )}
                </TabsContent>

                {/* Triagem Tab - Histórico de Triagens */}
                {/* Prontuários Tab */}
                <TabsContent value="prontuarios" className="mt-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        Prontuários Clínicos
                      </h3>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`/patients/${selectedPatientId}/records`)}>
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Ver Todos
                        </Button>
                        <Button onClick={handleCreateNewRecord} disabled={isCreatingRecord}>
                          {isCreatingRecord ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                          Novo Prontuário
                        </Button>
                      </div>
                    </div>
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                          Clique em "Ver Todos" para acessar o histórico completo de prontuários.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="triagem" className="mt-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-primary" />
                      Histórico de Triagens
                    </h3>
                    {screenings && screenings.length > 0 ? (
                      screenings.map(screening => (
                        <Card 
                          key={screening.id} 
                          className="bg-card border-border cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" 
                          onClick={() => {
                            setSelectedScreening(screening);
                            setIsScreeningModalOpen(true);
                          }}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-5">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <FlaskConical className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">
                                      {format(new Date(screening.screening_date), "dd 'de' MMMM 'de' yyyy", {
                                        locale: ptBR
                                      })}
                                    </span>
                                  </div>
                                  {getClassificationBadge(screening.classification || "")}
                                </div>
                                <p className="text-foreground font-medium">Triagem de Ortobiológicos</p>
                                <p className="text-sm text-muted-foreground">Clique para ver avaliação completa</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="bg-card border-border">
                        <CardContent className="py-12 text-center">
                          <FlaskConical className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Nenhuma triagem encontrada</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Histórico Tab - apenas sessões de tratamento */}
                <TabsContent value="historico" className="mt-8">
                  <div className="space-y-8 max-w-3xl">
                    {/* Histórico de Sessões */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Sessões de Tratamento
                      </h3>
                      {sessions && sessions.length > 0 ? sessions.map(session => <Card key={session.id} className="bg-card border-border">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-5">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg flex-shrink-0">
                                  {session.session_number}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">
                                      {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR
                              })}
                                    </span>
                                  </div>
                                  <p className="text-foreground">{session.clinical_observations || "Sem observações"}</p>
                                  {session.vas_on_day && <p className="text-sm text-muted-foreground">EVA: {session.vas_on_day}</p>}
                                </div>
                              </div>
                            </CardContent>
                          </Card>) : <Card className="bg-card border-border">
                          <CardContent className="py-12 text-center">
                            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">Nenhuma sessão registrada</p>
                            <Button onClick={handleCreateNewRecord} disabled={isCreatingRecord}>
                              {isCreatingRecord ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4 mr-2" />
                              )}
                              Criar Prontuário Clínico
                            </Button>
                          </CardContent>
                        </Card>}
                    </div>
                  </div>
                </TabsContent>

                {/* Exames Tab */}
                <TabsContent value="exames" className="mt-8">
                  <div className="max-w-3xl space-y-6">
                    {/* Header with Add Button and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <Button onClick={() => navigate(`/triagem-biologica?paciente=${selectedPatientId}`)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Adicionar Exames
                      </Button>
                      
                      {examDates.length > 0 && <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-muted-foreground" />
                          <Select value={selectedExamDate} onValueChange={setSelectedExamDate}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Filtrar por data" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas as datas</SelectItem>
                              {examDates.map(date => <SelectItem key={date} value={date}>
                                  {format(new Date(date), "dd/MM/yyyy", {
                            locale: ptBR
                          })}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>}
                    </div>

                    {/* Exams List */}
                    {filteredExams && filteredExams.length > 0 ? <div className="space-y-4">
                        {filteredExams.map(exam => <Card key={exam.id} className="bg-card border-border">
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
                                      {format(new Date(exam.collection_date), "dd/MM/yyyy", {
                                locale: ptBR
                              })}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{exam.file_name}</p>
                                  {exam.observations && <p className="text-sm text-muted-foreground mt-2">{exam.observations}</p>}
                                </div>
                              </div>
                            </CardContent>
                          </Card>)}
                      </div> : <Card className="bg-card border-border">
                        <CardContent className="py-16 text-center">
                          <FileText className="w-14 h-14 text-muted-foreground mx-auto mb-5" />
                          <p className="text-muted-foreground text-lg mb-4">Nenhum exame registrado</p>
                          <p className="text-sm text-muted-foreground">
                            Adicione exames através da Triagem Biológica para acompanhar a evolução do paciente
                          </p>
                        </CardContent>
                      </Card>}
                  </div>
                </TabsContent>

                {/* Protocolos Tab */}
                <TabsContent value="protocolos" className="mt-8">
                  <div className="max-w-4xl space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/protocolos/mac?paciente=${selectedPatientId}`)}>
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Beaker className="w-7 h-7 text-primary" />
                          </div>
                          <h4 className="font-medium text-foreground mb-1">Protocolo MAC</h4>
                          <p className="text-sm text-muted-foreground">Modulação Avançada Celular</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/protocolos/epi?paciente=${selectedPatientId}`)}>
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-7 h-7 text-orange-500" />
                          </div>
                          <h4 className="font-medium text-foreground mb-1">Protocolos EPI</h4>
                          <p className="text-sm text-muted-foreground">Eletrólise Percutânea</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/protocolos/ortobiologicos?paciente=${selectedPatientId}`)}>
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                            <FlaskConical className="w-7 h-7 text-emerald-500" />
                          </div>
                          <h4 className="font-medium text-foreground mb-1">Ortobiológicos</h4>
                          <p className="text-sm text-muted-foreground">PRP, PRF, BMAC</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/protocolos/ondas-choque?paciente=${selectedPatientId}`)}>
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                            <Waves className="w-7 h-7 text-cyan-500" />
                          </div>
                          <h4 className="font-medium text-foreground mb-1">Ondas de Choque</h4>
                          <p className="text-sm text-muted-foreground">Radial e Focada</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/protocolos/injetaveis?paciente=${selectedPatientId}`)}>
                        <CardContent className="p-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                            <Syringe className="w-7 h-7 text-violet-500" />
                          </div>
                          <h4 className="font-medium text-foreground mb-1">Injetáveis</h4>
                          <p className="text-sm text-muted-foreground">Terapias Injetáveis</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Relatórios Tab */}
                <TabsContent value="relatorios" className="mt-8">
                  <div className="max-w-4xl space-y-6">
                    {/* Relatório de Avaliação e Plano Terapêutico - Novo Bloco Isolado */}
                    <PatientEvaluationReport patient={patient} latestScreening={screenings?.[0]} professionalName="Profissional Responsável" professionalRegistration="CREFITO-XX/XXXXX-F" />
                    
                    {/* Seção de Outros Relatórios (existente) */}
                    <div className="pt-6 border-t border-border">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-foreground">Outros Relatórios</h3>
                        <Button variant="outline" onClick={() => navigate(`/relatorios?paciente=${selectedPatientId}`)} className="gap-2">
                          <Plus className="w-4 h-4" />
                          Gerar Novo Relatório
                        </Button>
                      </div>
                      <Card className="bg-card border-border">
                        <CardContent className="py-12 text-center">
                          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-2">Nenhum relatório adicional gerado</p>
                          <p className="text-sm text-muted-foreground">
                            Gere relatórios clínicos para documentar a evolução do paciente
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Prescrições Tab */}
                <TabsContent value="prescricoes" className="mt-8">
                  <div className="max-w-4xl space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-foreground">Prescrições e Orientações</h3>
                        <p className="text-sm text-muted-foreground">
                          Gerencie cuidados alimentares, medicações e suplementação
                        </p>
                      </div>
                      <Button onClick={() => setIsPrescriptionModalOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nova Prescrição
                      </Button>
                    </div>

                    <PatientPrescriptionsList patientId={selectedPatientId!} patientName={patient?.full_name || "Paciente"} />
                  </div>
                </TabsContent>

              </Tabs>
            </div>
          </div>}
      </div>

      {/* Modal de detalhe de triagem */}
      <ScreeningDetailModal open={isScreeningModalOpen} onOpenChange={setIsScreeningModalOpen} screening={selectedScreening} />

      {/* Modal de adicionar procedimento */}
      <AddProcedureModal open={isProcedureModalOpen} onOpenChange={setIsProcedureModalOpen} patientId={selectedPatientId || ""} onSuccess={() => {
      queryClient.invalidateQueries({
        queryKey: ["patient-procedures", selectedPatientId]
      });
    }} />
    </div>;
};
export default DetalhePaciente;