import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  User,
  Mail,
  Stethoscope,
  BookOpen,
  Link as LinkIcon,
  Sparkles,
  Clock,
  FileText,
  Briefcase,
  Target,
  AlertCircle,
} from "lucide-react";
import { useSubmitTeacherApplication, useMyTeacherApplication } from "@/hooks/useAcademyRoles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TeacherApplicationPage = () => {
  const navigate = useNavigate();
  const submitMutation = useSubmitTeacherApplication();
  const { data: existingApplication, isLoading: checkingApplication } = useMyTeacherApplication();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    formation: "",
    professional_registration: "",
    clinical_area: "",
    experience_years: "",
    linkedin: "",
    instagram: "",
    website: "",
    course_proposal_title: "",
    course_proposal_summary: "",
    course_proposal_audience: "",
    observations: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user?.email) {
        setFormData(prev => ({ ...prev, email: session.user.email || "" }));
      }
      setCheckingAuth(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info("Faça login para enviar sua candidatura");
      navigate("/auth", { state: { returnTo: "/academy/professor/candidatar" } });
      return;
    }

    const years = parseInt(formData.experience_years);
    if (isNaN(years) || years < 0) {
      toast.error("Informe um tempo de experiência válido");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        full_name: formData.full_name,
        email: formData.email,
        formation: formData.formation,
        professional_registration: formData.professional_registration,
        clinical_area: formData.clinical_area,
        experience_years: years,
        links: {
          ...(formData.linkedin && { linkedin: formData.linkedin }),
          ...(formData.instagram && { instagram: formData.instagram }),
          ...(formData.website && { website: formData.website }),
        },
        course_proposal_title: formData.course_proposal_title,
        course_proposal_summary: formData.course_proposal_summary,
        course_proposal_audience: formData.course_proposal_audience,
        observations: formData.observations || null,
      });
      navigate("/academy/home");
    } catch {
      // Error handled in mutation
    }
  };

  if (checkingAuth || checkingApplication) {
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

  // Show status if already applied
  if (existingApplication) {
    const statusConfig: Record<string, { icon: any; color: string; label: string; message: string }> = {
      pending: {
        icon: Clock,
        color: "text-blue-600",
        label: "Em análise",
        message: "Sua candidatura está sendo analisada pela equipe do REGEN Academy. Entraremos em contato em breve.",
      },
      approved: {
        icon: CheckCircle2,
        color: "text-green-600",
        label: "Aprovado",
        message: "Parabéns! Sua candidatura foi aprovada. Você já pode criar cursos e mentorias.",
      },
      rejected: {
        icon: AlertCircle,
        color: "text-red-600",
        label: "Não aprovado",
        message: "Infelizmente sua candidatura não foi aprovada neste momento.",
      },
      needs_changes: {
        icon: FileText,
        color: "text-amber-600",
        label: "Ajustes necessários",
        message: existingApplication.review_notes || "Ajustes foram solicitados na sua candidatura.",
      },
    };

    const config = statusConfig[existingApplication.status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
      <div className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <StatusIcon className={`w-16 h-16 ${config.color} mx-auto mb-4`} />
              <Badge variant="secondary" className="mb-4">{config.label}</Badge>
              <h1 className="text-2xl font-bold text-foreground mb-4">Candidatura enviada</h1>
              <p className="text-muted-foreground mb-6">{config.message}</p>
              <Button onClick={() => navigate("/academy/home")}>Voltar ao Academy</Button>
            </div>
          </div>
        </section>
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
              Tornar-se Professor
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Candidate-se a Professor REGEN Academy
            </h1>
            <p className="text-lg text-muted-foreground">
              Crie cursos, mentorias e assinaturas dentro do ecossistema REGHEN.
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
                <h3 className="font-semibold text-foreground">Marketplace</h3>
                <p className="text-sm text-muted-foreground">Publique no marketplace do Academy</p>
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
                <h3 className="font-semibold text-foreground">Monetização</h3>
                <p className="text-sm text-muted-foreground">Receba por seus cursos e mentorias</p>
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
                Preencha suas informações profissionais e proposta de curso. Nossa equipe analisará sua candidatura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Nome completo *
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Dr. João Silva"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" /> E-mail *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <Separator />

                {/* Professional Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informações Profissionais</h3>

                  <div className="space-y-2">
                    <Label htmlFor="formation" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Formação *
                    </Label>
                    <Input
                      id="formation"
                      value={formData.formation}
                      onChange={(e) => setFormData(prev => ({ ...prev, formation: e.target.value }))}
                      placeholder="Residência em Ortopedia, Pós-graduação em..."
                      required
                      maxLength={500}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="professional_registration" className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" /> Registro profissional *
                    </Label>
                    <Input
                      id="professional_registration"
                      value={formData.professional_registration}
                      onChange={(e) => setFormData(prev => ({ ...prev, professional_registration: e.target.value }))}
                      placeholder="CRM, CREFITO, etc."
                      required
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinical_area" className="flex items-center gap-2">
                      <Target className="w-4 h-4" /> Área de atuação *
                    </Label>
                    <Input
                      id="clinical_area"
                      value={formData.clinical_area}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinical_area: e.target.value }))}
                      placeholder="Ortobiológicos, Fisioterapia, Medicina Esportiva..."
                      required
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience_years" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Tempo de experiência (anos) *
                    </Label>
                    <Input
                      id="experience_years"
                      type="number"
                      min={0}
                      max={60}
                      value={formData.experience_years}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                      placeholder="5"
                      required
                    />
                  </div>
                </div>

                <Separator />

                {/* Links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Links <span className="font-normal">(opcional)</span>
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" /> LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="@seuusuario"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Site</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://seusite.com"
                    />
                  </div>
                </div>

                <Separator />

                {/* Course Proposal */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Proposta de Curso</h3>

                  <div className="space-y-2">
                    <Label htmlFor="course_title" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Título do curso *
                    </Label>
                    <Input
                      id="course_title"
                      value={formData.course_proposal_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, course_proposal_title: e.target.value }))}
                      placeholder="PRP aplicado à Ortopedia Regenerativa"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course_summary">Breve ementa *</Label>
                    <Textarea
                      id="course_summary"
                      value={formData.course_proposal_summary}
                      onChange={(e) => setFormData(prev => ({ ...prev, course_proposal_summary: e.target.value }))}
                      placeholder="Descreva os principais tópicos e objetivos do curso..."
                      rows={4}
                      required
                      maxLength={2000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course_audience">Público-alvo *</Label>
                    <Input
                      id="course_audience"
                      value={formData.course_proposal_audience}
                      onChange={(e) => setFormData(prev => ({ ...prev, course_proposal_audience: e.target.value }))}
                      placeholder="Médicos ortopedistas, fisioterapeutas..."
                      required
                      maxLength={300}
                    />
                  </div>
                </div>

                <Separator />

                {/* Observations */}
                <div className="space-y-2">
                  <Label htmlFor="observations">
                    Observações <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Informações adicionais que queira compartilhar..."
                    rows={3}
                    maxLength={1000}
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

export default TeacherApplicationPage;
