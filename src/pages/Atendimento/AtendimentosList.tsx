import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Calendar, 
  User, 
  FlaskConical, 
  Loader2,
  ChevronRight,
  X,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceSession } from "@/types/attendance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const AtendimentosList = () => {
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Fetch all attendance sessions for the current user
  const { data: attendances, isLoading } = useQuery({
    queryKey: ["all-attendance-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select(`
          *,
          patients:patient_id (
            id,
            full_name,
            age,
            gender
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (AttendanceSession & { 
        patients: { id: string; full_name: string; age: number; gender: string } 
      })[];
    },
  });

  // Get unique patients for the dropdown
  const uniquePatients = useMemo(() => {
    if (!attendances) return [];
    const patientsMap = new Map<string, { id: string; full_name: string }>();
    attendances.forEach(a => {
      if (a.patients && !patientsMap.has(a.patients.id)) {
        patientsMap.set(a.patients.id, { id: a.patients.id, full_name: a.patients.full_name });
      }
    });
    return Array.from(patientsMap.values()).sort((a, b) => 
      a.full_name.localeCompare(b.full_name)
    );
  }, [attendances]);

  // Filter attendances
  const filteredAttendances = useMemo(() => {
    if (!attendances) return [];
    
    return attendances.filter(a => {
      // Patient filter
      if (selectedPatientId !== "all" && a.patients?.id !== selectedPatientId) {
        return false;
      }
      
      // Date from filter
      if (dateFrom) {
        const attendanceDate = new Date(a.created_at);
        if (isBefore(attendanceDate, startOfDay(dateFrom))) {
          return false;
        }
      }
      
      // Date to filter
      if (dateTo) {
        const attendanceDate = new Date(a.created_at);
        if (isAfter(attendanceDate, endOfDay(dateTo))) {
          return false;
        }
      }
      
      return true;
    });
  }, [attendances, selectedPatientId, dateFrom, dateTo]);

  const hasActiveFilters = selectedPatientId !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSelectedPatientId("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Atendimentos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os atendimentos clínicos
            </p>
          </div>
          <Button onClick={() => navigate("/atendimentos/novo")} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Atendimento
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Patient Filter */}
            <div className="w-full sm:w-72">
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger className="bg-card">
                  <User className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar por paciente" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  {uniquePatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 bg-card"
                >
                  <Calendar className="w-4 h-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {/* Date To Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 bg-card"
                >
                  <Calendar className="w-4 h-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Active filters count */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>
                {filteredAttendances.length} atendimento{filteredAttendances.length !== 1 ? 's' : ''} encontrado{filteredAttendances.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAttendances.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum atendimento encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters 
                  ? "Tente ajustar os filtros para ver mais resultados"
                  : "Comece criando um novo atendimento para um paciente"
                }
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Limpar filtros
                </Button>
              ) : (
                <Button onClick={() => navigate("/atendimentos/novo")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Atendimento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAttendances?.map((attendance) => (
              <Card
                key={attendance.id}
                className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/atendimentos/${attendance.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {attendance.patients?.full_name || "Paciente"}
                        </h3>
                        {attendance.involves_orthobiologics && (
                          <Badge variant="outline" className="gap-1 flex-shrink-0">
                            <FlaskConical className="w-3 h-3" />
                            Ortobiológicos
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {format(new Date(attendance.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        {attendance.patients?.age && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{attendance.patients.age} anos</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AtendimentosList;
