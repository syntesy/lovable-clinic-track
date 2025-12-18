import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, FileText, Thermometer, Edit } from "lucide-react";

const ProntuarioClinico = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: ultrasoundImages } = useQuery({
    queryKey: ["ultrasound-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ultrasound_images")
        .select("*")
        .eq("patient_id", id)
        .order("exam_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: thermographyImages } = useQuery({
    queryKey: ["thermography-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thermography_images")
        .select("*")
        .eq("patient_id", id)
        .order("exam_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (!patient) {
    return <div className="text-center py-12">Paciente não encontrado</div>;
  }

  const getFototipoLabel = (code: string) => {
    const fototipos: { [key: string]: string } = {
      "I": "Fototipo I – Pele branca pálida",
      "II": "Fototipo II – Pele clara",
      "III": "Fototipo III – Branco mais escuro",
      "IV": "Fototipo IV – Pele morena clara",
      "V": "Fototipo V – Pele morena escura",
      "VI": "Fototipo VI – Pele negra"
    };
    return fototipos[code] || code;
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/pacientes")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-3xl font-bold text-foreground truncate">{patient.full_name}</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {patient.age} anos • {patient.gender || "—"} • {getFototipoLabel(patient.skin_phototype || "")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/pacientes/editar/${id}`)}
          className="w-full sm:w-auto"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar Cadastro
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Avaliação Clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Anamnese</Label>
            <Textarea
              className="border-input min-h-[100px]"
              placeholder="Histórico clínico detalhado do paciente..."
            />
          </div>
          <div className="space-y-2">
            <Label>Diagnóstico Clínico</Label>
            <Textarea
              className="border-input"
              defaultValue={patient.clinical_diagnosis || ""}
            />
          </div>
          <div className="space-y-3">
            <Label>Classificação da Dor</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pain_nociceptive"
                  defaultChecked={patient.pain_type_nociceptive || false}
                />
                <Label htmlFor="pain_nociceptive" className="font-normal">
                  Nociceptiva
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pain_neuropathic"
                  defaultChecked={patient.pain_type_neuropathic || false}
                />
                <Label htmlFor="pain_neuropathic" className="font-normal">
                  Neuropática
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pain_nociplastic"
                  defaultChecked={patient.pain_type_nociplastic || false}
                />
                <Label htmlFor="pain_nociplastic" className="font-normal">
                  Nociplástica
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Escalas Baseline (Pré-Tratamento)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>EVA Inicial (0-10)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="border-input max-w-xs"
              defaultValue={patient.initial_vas || ""}
            />
          </div>
        </CardContent>
      </Card>

      {/* Imagens de Ultrassom */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            Imagens de Ultrassom
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            Adicionar Imagem de Ultrassom
          </Button>
          {ultrasoundImages && ultrasoundImages.length > 0 ? (
            <div className="space-y-2">
              {ultrasoundImages.map((image) => (
                <div key={image.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                  <div>
                    <p className="font-medium">{image.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {image.image_type} • {new Date(image.exam_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Visualizar</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma imagem cadastrada</p>
          )}
        </CardContent>
      </Card>

      {/* Imagens de Termografia */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Thermometer className="h-5 w-5 mr-2 text-primary" />
            Imagens de Termografia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            Adicionar Imagem de Termografia
          </Button>
          {thermographyImages && thermographyImages.length > 0 ? (
            <div className="space-y-2">
              {thermographyImages.map((image) => (
                <div key={image.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                  <div>
                    <p className="font-medium">{image.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {image.evaluated_region} • {new Date(image.exam_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Visualizar</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma imagem cadastrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProntuarioClinico;
