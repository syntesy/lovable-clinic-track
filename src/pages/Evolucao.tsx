import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, User, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Evolucao = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients-search", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("patients")
        .select("*")
        .order("full_name", { ascending: true });

      if (searchTerm) {
        query = query.ilike("full_name", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 2 || searchTerm.length === 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Evolução de Pacientes</h2>
        <p className="text-muted-foreground">
          Busque e registre a evolução dos pacientes em tratamento
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            Buscar Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Nome do Paciente</Label>
            <Input
              id="search"
              placeholder="Digite o nome do paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-input"
            />
            <p className="text-xs text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading && searchTerm.length >= 2 && (
        <div className="text-center py-8 text-muted-foreground">
          Buscando pacientes...
        </div>
      )}

      {patients && patients.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Resultados ({patients.length})
          </h3>
          <div className="grid gap-3">
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className="border-border hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {patient.full_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {patient.age} anos • {patient.gender || "—"} • {patient.treated_region || "Região não especificada"}
                        </p>
                        <div className="mt-1">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                              patient.status === "active"
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {patient.status === "active" ? "Em Tratamento" : "Alta"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/evolucao/${patient.id}`)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Registrar Evolução
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {patients && patients.length === 0 && searchTerm.length >= 2 && (
        <Card className="p-12 text-center border-border">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum paciente encontrado
          </h3>
          <p className="text-muted-foreground">
            Tente buscar com outro nome ou verifique a ortografia
          </p>
        </Card>
      )}

      {searchTerm.length === 0 && (
        <Card className="p-12 text-center border-border">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Busque um paciente
          </h3>
          <p className="text-muted-foreground">
            Digite o nome do paciente no campo acima para começar
          </p>
        </Card>
      )}
    </div>
  );
};

export default Evolucao;
