import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Calendar, 
  User, 
  FlaskConical, 
  Search,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceSession } from "@/types/attendance";

const AtendimentosList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredAttendances = attendances?.filter(a => 
    a.patients?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAttendances?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum atendimento encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? "Tente buscar com outros termos"
                  : "Comece criando um novo atendimento para um paciente"
                }
              </p>
              {!searchQuery && (
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
