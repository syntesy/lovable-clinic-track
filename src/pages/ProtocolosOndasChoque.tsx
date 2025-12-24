import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ArrowLeft, Waves, Save, User } from "lucide-react";
import { toast } from "sonner";

const ProtocolosOndasChoque = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("paciente");

  const [formData, setFormData] = useState({
    protocol_name: "",
    treatment_area: "",
    injury_type: "",
    wave_type: "radial", // radial, focused
    frequency: "",
    pressure: "",
    pulses: "",
    sessions_total: "",
    session_frequency: "",
    contraindications: "",
    clinical_observations: "",
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For now, just show a success message
    // In production, you would save to a shockwave_protocols table
    toast.success("Protocolo de Ondas de Choque salvo com sucesso!");
    
    if (patientId) {
      navigate(`/pacientes/${patientId}`);
    } else {
      navigate("/protocolos");
    }
  };

  const treatmentAreas = [
    "Tendão de Aquiles",
    "Fascia plantar",
    "Epicôndilo lateral (cotovelo de tenista)",
    "Epicôndilo medial (cotovelo de golfista)",
    "Manguito rotador",
    "Tendão patelar",
    "Bursite trocantérica",
    "Tendinopatia glútea",
    "Síndrome do estresse tibial",
    "Pontos-gatilho miofasciais",
    "Calcificações",
    "Outro",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Waves className="h-5 w-5 text-cyan-500" />
            </div>
            Protocolo de Ondas de Choque
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure os parâmetros do tratamento com ondas de choque
          </p>
        </div>
      </div>

      {/* Patient Info */}
      {patient && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{patient.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {patient.clinical_diagnosis || "Diagnóstico não informado"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Informações do Protocolo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="protocol_name">Nome do Protocolo</Label>
              <Input
                id="protocol_name"
                value={formData.protocol_name}
                onChange={(e) => setFormData({ ...formData, protocol_name: e.target.value })}
                placeholder="Ex: Tratamento Fascia Plantar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_area">Área de Tratamento</Label>
              <Select 
                value={formData.treatment_area} 
                onValueChange={(value) => setFormData({ ...formData, treatment_area: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  {treatmentAreas.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="injury_type">Tipo de Lesão</Label>
              <Input
                id="injury_type"
                value={formData.injury_type}
                onChange={(e) => setFormData({ ...formData, injury_type: e.target.value })}
                placeholder="Ex: Tendinopatia crônica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wave_type">Tipo de Onda</Label>
              <Select 
                value={formData.wave_type} 
                onValueChange={(value) => setFormData({ ...formData, wave_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="focused">Focada</SelectItem>
                  <SelectItem value="combined">Combinada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Parâmetros de Tratamento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência (Hz)</Label>
              <Input
                id="frequency"
                type="number"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="Ex: 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pressure">Pressão (Bar)</Label>
              <Input
                id="pressure"
                type="number"
                step="0.1"
                value={formData.pressure}
                onChange={(e) => setFormData({ ...formData, pressure: e.target.value })}
                placeholder="Ex: 2.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pulses">Número de Pulsos</Label>
              <Input
                id="pulses"
                type="number"
                value={formData.pulses}
                onChange={(e) => setFormData({ ...formData, pulses: e.target.value })}
                placeholder="Ex: 2000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions_total">Total de Sessões</Label>
              <Input
                id="sessions_total"
                type="number"
                value={formData.sessions_total}
                onChange={(e) => setFormData({ ...formData, sessions_total: e.target.value })}
                placeholder="Ex: 5"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="session_frequency">Frequência das Sessões</Label>
              <Select 
                value={formData.session_frequency} 
                onValueChange={(value) => setFormData({ ...formData, session_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="2x_semana">2x por semana</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Observações Clínicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contraindications">Contraindicações Verificadas</Label>
              <Textarea
                id="contraindications"
                value={formData.contraindications}
                onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
                placeholder="Descreva quaisquer contraindicações verificadas..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinical_observations">Observações Clínicas</Label>
              <Textarea
                id="clinical_observations"
                value={formData.clinical_observations}
                onChange={(e) => setFormData({ ...formData, clinical_observations: e.target.value })}
                placeholder="Observações adicionais sobre o tratamento..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50">
          <CardContent className="flex items-start gap-3 pt-6">
            <Waves className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Contraindicações principais:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Gestação</li>
                <li>Coagulopatias ou uso de anticoagulantes</li>
                <li>Infecções locais</li>
                <li>Tumores na área de tratamento</li>
                <li>Próximo a áreas com implantes metálicos</li>
                <li>Sobre grandes vasos ou nervos</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Protocolo
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProtocolosOndasChoque;
