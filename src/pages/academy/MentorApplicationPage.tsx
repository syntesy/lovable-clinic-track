import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight,
  User,
  Mail,
  Stethoscope,
  BookOpen,
  Link as LinkIcon,
  Sparkles
} from "lucide-react";
import { useSubmitMentorApplication, useMyMentorProfile } from "@/hooks/useMentorOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CLINICAL_AREAS = [
  "PRP",
  "Ortobiológicos",
  "Dor Crônica",
  "Ortopedia Regenerativa",
  "Fisioterapia",
  "Medicina Esportiva",
  "Reumatologia",
  "Ondas de Choque",
  "Laserterapia",
  "Outros"
];

const MentorApplicationPage = () => {
  const navigate = useNavigate();
  const submitMutation = useSubmitMentorApplication();
  const { data: existingProfile, isLoading: checkingProfile } = useMyMentorProfile();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialty: "",
    formation: "",
    bio: "",
    linkedin_url: "",
  });
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user?.email) {
        setFormData(prev => ({ ...prev, email: session.user.email || "" }));
      }
      setCheckingAuth(false);
    });
  }, []);

  // Redirect if already has a mentor profile
  useEffect(() => {
    if (!checkingProfile && existingProfile) {
      toast.info("Você já possui uma candidatura. Redirecionando...");
      navigate("/academy/mentor/onboarding");
    }
  }, [existingProfile, checkingProfile, navigate]);

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info("Faça login para enviar sua candidatura");
      navigate("/auth", { state: { returnTo: "/academy/mentores/candidatar" } });
      return;
    }

    if (selectedAreas.length === 0) {
      toast.error("Selecione pelo menos uma área de atuação");
      return;
    }

    if (formData.bio.length < 50) {
      toast.error("A bio clínica deve ter pelo menos 50 caracteres");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        ...formData,
        clinical_areas: selectedAreas,
      });
      navigate("/academy/mentor/onboarding");
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (checkingAuth || checkingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6 max-w-2xl mx-auto">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <GraduationCap className="w-3 h-3 mr-1" />
              Seja um Mentor
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Candidate-se a Mentor REGEN Academy
            </h1>
            <p className="text-lg text-muted-foreground">
              Compartilhe sua experiência clínica e forme a próxima geração de especialistas em Medicina Regenerativa.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Visibilidade</h3>
                <p className="text-sm text-muted-foreground">Destaque no marketplace de mentorias</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Curadoria</h3>
                <p className="text-sm text-muted-foreground">Selo de qualidade REGEN Academy</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Impacto</h3>
                <p className="text-sm text-muted-foreground">Forme profissionais de excelência</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Formulário de Candidatura</CardTitle>
              <CardDescription>
                Preencha suas informações profissionais. Nossa curadoria analisará sua candidatura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. João Silva"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mail *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="joao@exemplo.com"
                    required
                  />
                </div>

                {/* Specialty */}
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Especialidade principal *
                  </Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="Ortopedia, Fisioterapia, Medicina Esportiva..."
                    required
                  />
                </div>

                {/* Formation */}
                <div className="space-y-2">
                  <Label htmlFor="formation" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Formação acadêmica *
                  </Label>
                  <Input
                    id="formation"
                    value={formData.formation}
                    onChange={(e) => setFormData(prev => ({ ...prev, formation: e.target.value }))}
                    placeholder="Residência em Ortopedia - USP, Pós-graduação em Dor..."
                    required
                  />
                </div>

                {/* Clinical Areas */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Áreas de atuação *
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione as áreas em que você atua clinicamente.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CLINICAL_AREAS.map((area) => (
                      <Badge
                        key={area}
                        variant={selectedAreas.includes(area) ? "default" : "outline"}
                        className="cursor-pointer transition-all"
                        onClick={() => toggleArea(area)}
                      >
                        {selectedAreas.includes(area) && (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">
                    Bio clínica * <span className="text-muted-foreground font-normal">(mínimo 50 caracteres)</span>
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Descreva sua experiência clínica, áreas de expertise e o que o motiva a ser mentor..."
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.bio.length} / 50 caracteres mínimos
                  </p>
                </div>

                {/* LinkedIn */}
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    LinkedIn / Lattes / Currículo <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/seu-perfil"
                  />
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      "Enviando..."
                    ) : (
                      <>
                        Enviar candidatura
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Ao enviar, você concorda com os termos do REGEN Academy.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MentorApplicationPage;
