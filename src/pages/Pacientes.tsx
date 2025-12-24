import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, User, Users, Activity, TrendingDown, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pacientes = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch all patients for dropdown
  const { data: patients } = useQuery({
    queryKey: ["patients-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, age, gender, status")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Total patients count
  const { data: totalPatients } = useQuery({
    queryKey: ["dashboard-total-patients"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Active patients count
  const { data: activePatients } = useQuery({
    queryKey: ["dashboard-active-patients"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count || 0;
    },
  });

  // Orthobiologics protocols count by type
  const { data: ortobiologicosStats } = useQuery({
    queryKey: ["dashboard-ortobiologicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ortobiologicos_protocols")
        .select("therapy_type");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        const type = item.therapy_type || "Outros";
        counts[type] = (counts[type] || 0) + 1;
      });
      return counts;
    },
  });

  // Average EVA at discharge
  const { data: averageEva } = useQuery({
    queryKey: ["dashboard-average-eva"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("final_vas")
        .not("final_vas", "is", null);
      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      const sum = data.reduce((acc, p) => acc + (p.final_vas || 0), 0);
      return (sum / data.length).toFixed(1);
    },
  });

  const filteredPatients = patients?.filter((p) =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPatient = (patientId: string) => {
    setIsDropdownOpen(false);
    setSearchQuery("");
    navigate(`/pacientes/${patientId}`);
  };

  return (
    <div className="space-y-8">
      {/* Patient Selector and New Patient Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Patient Selector Dropdown */}
        <div className="relative flex-1 max-w-md">
          <div
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <User className="w-5 h-5 text-primary" />
            <span className="text-muted-foreground flex-1">Selecionar paciente...</span>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </div>

        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredPatients && filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.age} anos • {p.gender}
                      </p>
                    </div>
                    {p.status === "active" && (
                      <Badge variant="secondary" className="text-xs">Ativo</Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Nenhum paciente encontrado
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* New Patient Button */}
        <Button
          onClick={() => navigate("/novo-paciente")}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Novo Paciente
        </Button>
      </div>
      {/* Dashboard Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard Clínico – Ortobiológicos
        </h1>
        <p className="text-muted-foreground">
          Indicadores consolidados de acompanhamento e desfechos clínicos
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Patients */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pacientes atendidos
            </CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {totalPatients ?? "—"}
            </div>
          </CardContent>
        </Card>

        {/* Active Patients */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em tratamento ativo
            </CardTitle>
            <Activity className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-foreground">
                {activePatients ?? "—"}
              </span>
              <Badge variant="secondary" className="text-xs">Ativo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Orthobiologics by Type */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pacientes por técnica (Ortobiológicos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ortobiologicosStats && Object.keys(ortobiologicosStats).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(ortobiologicosStats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{type}</span>
                    <span className="text-sm font-semibold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum protocolo registrado</p>
            )}
          </CardContent>
        </Card>

        {/* Average EVA at Discharge */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              EVA média na alta
            </CardTitle>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {averageEva ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média da escala de dor (EVA) no momento da alta clínica
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pacientes;
