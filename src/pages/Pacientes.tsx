import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, User, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pacientes = () => {
  const navigate = useNavigate();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Pacientes</h2>
          <p className="text-muted-foreground">
            Cadastro e acompanhamento clínico
          </p>
        </div>
        <Button
          onClick={() => navigate("/pacientes/novo")}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando...
        </div>
      ) : patients && patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <Card
              key={patient.id}
              className="p-6 hover:shadow-lg transition-shadow border-border"
            >
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {patient.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {patient.age} anos • {patient.gender}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {patient.treated_region || "Região não especificada"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        patient.status === "active"
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {patient.status === "active" ? "Ativo" : "Alta"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/prontuario/${patient.id}`)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Prontuário
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-border">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum paciente cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece cadastrando seu primeiro paciente
          </p>
          <Button
            onClick={() => navigate("/pacientes/novo")}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Paciente
          </Button>
        </Card>
      )}
    </div>
  );
};

export default Pacientes;
