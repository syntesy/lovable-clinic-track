import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronDown, User, Activity, FileText, FlaskConical, Calendar, CheckCircle2, AlertCircle, XCircle, Clock, Filter, BarChart3, Pencil, CheckCircle, ExternalLink, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditPatientModal } from "@/components/EditPatientModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PatientPrescriptionsList } from "@/components/patient/PatientPrescriptionsList";
import { PatientExamUploadAnalysis } from "@/components/patient/PatientExamUploadAnalysis";
import { ScreeningDetailModal } from "@/components/ScreeningDetailModal";
import { Tables } from "@/integrations/supabase/types";
import { getLatestClinicalRecord } from "@/lib/clinical-record-helpers";
import { useCreateAttendance } from "@/hooks/useAttendance";

const DetalhePaciente = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: patientIdFromUrl } = useParams();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedExamDate, setSelectedExamDate] = useState<string>("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<Tables<"prp_screenings"> | null>(null);
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  
  // Hook for creating new attendance - the ONLY clinical action allowed on this page
  const createAttendance = useCreateAttendance();

  // Handler for creating new attendance (the only allowed clinical CTA)
  const handleNovoAtendimento = async () => {
    if (!selectedPatientId) return;
    
    try {
      const newAttendance = await createAttendance.mutateAsync({
        patientId: selectedPatientId,
        involvesOrthobiologics: false
      });
      
      navigate(`/atendimentos/${newAttendance.id}`);
    } catch (error) {
      console.error("Erro ao criar atendimento:", error);
    }
  };

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
    }
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
    enabled: !!selectedPatientId
  });

  // Fetch sessions (historical) — reads from attendance_sessions (current system)
  const { data: sessions } = useQuery({
    queryKey: ["patient-sessions", selectedPatientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("id, created_at, title, closed_at, involves_orthobiologics")
        .eq("patient_id", selectedPatientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Fetch screenings (historical)
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
    enabled: !!selectedPatientId
  });

  // Fetch blood tests (exams - historical)
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
    enabled: !!selectedPatientId
  });

  // Fetch patient procedures (historical)
  const { data: procedures } = useQuery({
    queryKey: ["patient-procedures", selectedPatientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_procedures")
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("procedure_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId
  });

  // Fetch latest clinical record for overview (read-only summary)
  const { data: latestClinicalRecord, isLoading: isLoadingLatestRecord } = useQuery({
    queryKey: ["clinical-record", "latest", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      return getLatestClinicalRecord(selectedPatientId);
    },
    enabled: !!selectedPatientId
  });

  // Get unique exam dates for filtering
  const examDates = bloodTests ? [...new Set(bloodTests.map(bt => bt.collection_date))] : [];

  // Filter exams by selected date
  const filteredExams = bloodTests?.filter(exam => 
    selectedExamDate === "all" ? true : exam.collection_date === selectedExamDate
  );
  
  const filteredPatients = patients?.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Top Header with Patient Selector */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-center">
            <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full max-w-lg justify-between bg-card border-border hover:bg-muted/50 h-14 px-5">
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
                      onChange={e => setSearchQuery(e.target.value)} 
                      className="pl-10 bg-muted/50 border-0 h-11" 
                    />
                  </div>
                </div>
                <ScrollArea className="h-[320px]">
                  <div className="p-3">
                    {filteredPatients?.map(p => (
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
                      {patient?.treated_region && (
                        <>
                          <span className="text-border">•</span>
                          <span>{patient.treated_region}</span>
                        </>
                      )}
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

            {/* CTA ÚNICO: Novo Atendimento */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-primary" />
                      Iniciar Atendimento Clínico
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Inicie um novo atendimento para avaliar, triar ou tratar este paciente.
                    </p>
                  </div>
                  <Button 
                    onClick={handleNovoAtendimento}
                    disabled={createAttendance.isPending}
                    className="gap-2"
                    size="lg"
                  >
                    <PlayCircle className="w-5 h-5" />
                    {createAttendance.isPending ? "Criando..." : "Novo Atendimento"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Navigation - ONLY historical/read-only tabs */}
            <div className="pt-2">
              <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-card border border-border rounded-xl p-3 sm:p-4 h-auto w-full grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/50 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium transition-all duration-200"
                  >
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger 
                    value="triagem" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/50 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium transition-all duration-200"
                  >
                    Histórico Triagens
                  </TabsTrigger>
                  <TabsTrigger 
                    value="historico" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/50 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium transition-all duration-200"
                  >
                    Atendimentos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="exames" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/50 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium transition-all duration-200"
                  >
                    Exames
                  </TabsTrigger>
                  <TabsTrigger 
                    value="relatorios" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/50 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium transition-all duration-200"
                  >
                    Relatórios
                  </TabsTrigger>
                  <TabsTrigger 
                    value="prescricoes" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/50 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium transition-all duration-200"
                  >
                    Prescrições
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab - READ-ONLY consolidated view */}
                <TabsContent value="overview" className="mt-8">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Diagnóstico Clínico - READ-ONLY */}
                    <Card className="bg-card border-border sm:col-span-2 lg:col-span-2">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Diagnóstico Clínico
                          </CardTitle>
                          {latestClinicalRecord && (
                            <Badge variant="outline" className="text-[10px] font-normal w-fit">
                              Baseado no último prontuário ({format(new Date(latestClinicalRecord.created_at), "dd/MM/yyyy", { locale: ptBR })})
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2 space-y-4">
                        {isLoadingLatestRecord ? (
                          <Skeleton className="h-7 w-3/4" />
                        ) : !latestClinicalRecord ? (
                          <div className="flex items-center gap-3 py-2">
                            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Sem prontuários registrados</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-foreground text-lg font-medium leading-relaxed">
                              {latestClinicalRecord.clinical_diagnosis?.trim() 
                                ? latestClinicalRecord.clinical_diagnosis 
                                : latestClinicalRecord.chief_complaint?.trim()
                                  ? latestClinicalRecord.chief_complaint
                                  : "Não informado"}
                            </p>
                            {latestClinicalRecord.status === "draft" && 
                              !latestClinicalRecord.clinical_diagnosis?.trim() && 
                              !latestClinicalRecord.chief_complaint?.trim() && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Rascunho em andamento
                              </Badge>
                            )}
                          </div>
                        )}
                        {latestClinicalRecord && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs text-muted-foreground hover:text-primary gap-1.5 -ml-3"
                            onClick={() => navigate(`/patients/${selectedPatientId}/records`)}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Ver histórico de prontuários
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* EVA Inicial - READ-ONLY */}
                    <Card className="bg-card border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          EVA Inicial
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary">
                              {(() => {
                                const latestScreening = screenings?.[0];
                                if (latestScreening?.questionnaire_responses) {
                                  const responses = latestScreening.questionnaire_responses as Record<string, unknown>;
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
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Escala de dor</p>
                            <p className="text-xs text-muted-foreground/70">0-10 pontos</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Procedimentos Realizados - READ-ONLY */}
                    <Card className="bg-card border-border sm:col-span-2 lg:col-span-3">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Procedimentos Realizados
                          </CardTitle>
                          {procedures && procedures.length > 0 && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                              {procedures.length} {procedures.length === 1 ? 'procedimento' : 'procedimentos'}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        {procedures && procedures.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {procedures.slice(0, 10).map(proc => (
                              <Badge 
                                key={proc.id} 
                                variant="secondary" 
                                className="text-xs py-1.5 px-3 gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-clinical-safe" />
                                {proc.procedure_name}
                              </Badge>
                            ))}
                            {procedures.length > 10 && (
                              <Badge variant="outline" className="text-xs py-1.5 px-3">
                                +{procedures.length - 10} mais
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 py-2">
                            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-sm">Nenhum procedimento registrado</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Triagem Tab - HISTÓRICO APENAS */}
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
                                      {format(new Date(screening.screening_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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

                {/* Atendimentos Tab - HISTÓRICO APENAS */}
                <TabsContent value="historico" className="mt-8">
                  <div className="space-y-6 max-w-3xl">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Histórico de Atendimentos
                    </h3>
                    
                    <div className="space-y-4">
                      {sessions && sessions.length > 0 ? (
                        sessions.map(session => (
                          <Card
                            key={session.id}
                            className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer"
                            onClick={() => navigate(`/atendimentos/${session.id}`)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center gap-5">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Activity className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {session.title || format(new Date(session.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(session.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                    {session.involves_orthobiologics && (
                                      <Badge variant="outline" className="text-[10px] py-0">Ortobiológico</Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={session.closed_at ? "secondary" : "outline"} className="text-xs shrink-0">
                                  {session.closed_at ? "Encerrado" : "Em andamento"}
                                </Badge>
                                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card className="bg-card border-border">
                          <CardContent className="py-12 text-center">
                            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhum atendimento registrado</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Exames Tab - Upload + Análise + Histórico */}
                <TabsContent value="exames" className="mt-8">
                  <div className="max-w-4xl space-y-6">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Exames do Paciente
                    </h3>
                    
                    <PatientExamUploadAnalysis
                      patientId={selectedPatientId!}
                      patientName={selectedPatient?.full_name || "Paciente"}
                    />

                    {/* Legacy blood_tests history */}
                    {filteredExams && filteredExams.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-medium text-foreground">Registros Anteriores</h4>
                          {examDates.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Filter className="w-4 h-4 text-muted-foreground" />
                              <Select value={selectedExamDate} onValueChange={setSelectedExamDate}>
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Filtrar por data" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todas as datas</SelectItem>
                                  {examDates.map(date => (
                                    <SelectItem key={date} value={date}>
                                      {format(new Date(date), "dd/MM/yyyy", { locale: ptBR })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        {filteredExams.map(exam => (
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
                                  {exam.observations && (
                                    <p className="text-sm text-muted-foreground">{exam.observations}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Relatórios Tab - HISTÓRICO APENAS */}
                <TabsContent value="relatorios" className="mt-8">
                  <div className="max-w-4xl space-y-6">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Relatórios Gerados
                    </h3>
                    
                    <Card className="bg-card border-border">
                      <CardContent className="py-12 text-center">
                        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-2">Nenhum relatório gerado</p>
                        <p className="text-sm text-muted-foreground">
                          Relatórios são gerados durante os atendimentos clínicos
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Prescrições Tab - HISTÓRICO APENAS */}
                <TabsContent value="prescricoes" className="mt-8">
                  <div className="max-w-4xl space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">Histórico de Prescrições</h3>
                      <p className="text-sm text-muted-foreground">
                        Visualize o histórico de cuidados alimentares, medicações e suplementação
                      </p>
                    </div>

                    <PatientPrescriptionsList patientId={selectedPatientId!} patientName={patient?.full_name || "Paciente"} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalhe de triagem - READ-ONLY */}
      <ScreeningDetailModal 
        open={isScreeningModalOpen} 
        onOpenChange={setIsScreeningModalOpen} 
        screening={selectedScreening} 
      />
    </div>
  );
};

export default DetalhePaciente;
