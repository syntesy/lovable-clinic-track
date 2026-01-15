import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  User, 
  UserPlus,
  Loader2,
  FlaskConical,
  ChevronDown,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useCreateAttendance } from "@/hooks/useAttendance";
import { cn } from "@/lib/utils";

const NovoAtendimento = () => {
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [involvesOrthobiologics, setInvolvesOrthobiologics] = useState(false);
  const [open, setOpen] = useState(false);
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

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  const handleCreateAttendance = async () => {
    if (!selectedPatientId) return;
    
    try {
      const result = await createAttendance.mutateAsync({
        patientId: selectedPatientId,
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Patient Selection Card */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Selecionar Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patient Dropdown */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-12 text-left font-normal"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando pacientes...
                    </span>
                  ) : selectedPatient ? (
                    <span className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{selectedPatient.full_name}</span>
                        {selectedPatient.age && (
                          <span className="text-xs text-muted-foreground">
                            {selectedPatient.age} anos
                          </span>
                        )}
                      </div>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Selecione um paciente...</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover border border-border shadow-lg" align="start">
                <Command className="bg-popover">
                  <CommandInput placeholder="Buscar paciente..." className="h-10" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum paciente encontrado.
                    </CommandEmpty>
                    <CommandGroup>
                      {patients?.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={patient.full_name}
                          onSelect={() => {
                            setSelectedPatientId(patient.id);
                            setOpen(false);
                          }}
                          className="flex items-center gap-3 py-3 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{patient.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {patient.age ? `${patient.age} anos` : "Idade não informada"}
                              {patient.gender && (
                                <> • {patient.gender === "male" ? "Masculino" : 
                                      patient.gender === "female" ? "Feminino" : patient.gender}</>
                              )}
                            </p>
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4 text-primary",
                              selectedPatientId === patient.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* New Patient Button */}
            <Button
              variant="ghost"
              onClick={() => navigate("/novo-paciente")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <UserPlus className="w-4 h-4" />
              Cadastrar Novo Paciente
            </Button>
          </CardContent>
        </Card>

        {/* Options */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              Opções do Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="orthobiologics" className="font-medium">
                  Envolve Ortobiológicos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Marque se este atendimento incluirá procedimentos com ortobiológicos
                </p>
              </div>
              <Switch
                id="orthobiologics"
                checked={involvesOrthobiologics}
                onCheckedChange={setInvolvesOrthobiologics}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          onClick={handleCreateAttendance}
          disabled={!selectedPatientId || createAttendance.isPending}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {createAttendance.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando atendimento...
            </>
          ) : (
            "Iniciar Atendimento"
          )}
        </Button>
      </div>
    </div>
  );
};

export default NovoAtendimento;
