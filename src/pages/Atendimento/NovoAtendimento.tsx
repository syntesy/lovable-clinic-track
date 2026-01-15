import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Search, 
  User, 
  UserPlus,
  Loader2,
  FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useCreateAttendance } from "@/hooks/useAttendance";

const NovoAtendimento = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [involvesOrthobiologics, setInvolvesOrthobiologics] = useState(false);
  const createAttendance = useCreateAttendance();

  // Fetch all patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients-for-attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, age, gender, status")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filteredPatients = patients?.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPatient = async (patientId: string) => {
    try {
      const result = await createAttendance.mutateAsync({
        patientId,
        involvesOrthobiologics,
      });
      
      if (result?.id) {
        navigate(`/atendimentos/${result.id}`);
      }
    } catch (error) {
      console.error("Erro ao criar atendimento:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/atendimentos")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Atendimentos
          </Button>
          
          <h1 className="text-2xl font-semibold text-foreground">
            Novo Atendimento
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecione um paciente para iniciar o atendimento
          </p>
        </div>

        {/* Options */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Opções do Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FlaskConical className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="orthobiologics" className="font-medium">
                    Envolve Ortobiológicos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Marque se este atendimento incluirá procedimentos com ortobiológicos
                  </p>
                </div>
              </div>
              <Switch
                id="orthobiologics"
                checked={involvesOrthobiologics}
                onCheckedChange={setInvolvesOrthobiologics}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* New Patient Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/novo-paciente")}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar Novo Paciente
          </Button>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPatients?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum paciente encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? "Tente buscar com outros termos"
                  : "Cadastre um paciente para iniciar um atendimento"
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/novo-paciente")}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Paciente
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              {filteredPatients?.length} paciente(s) encontrado(s)
            </p>
            {filteredPatients?.map((patient) => (
              <Card
                key={patient.id}
                className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleSelectPatient(patient.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {patient.full_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {patient.age && <span>{patient.age} anos</span>}
                        {patient.age && patient.gender && (
                          <span className="text-muted-foreground/50">•</span>
                        )}
                        {patient.gender && (
                          <span>
                            {patient.gender === "male" ? "Masculino" : 
                             patient.gender === "female" ? "Feminino" : patient.gender}
                          </span>
                        )}
                      </div>
                    </div>

                    {createAttendance.isPending && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    )}
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

export default NovoAtendimento;
