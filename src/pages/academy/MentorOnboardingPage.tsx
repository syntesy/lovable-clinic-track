import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  Circle,
  User,
  FileText,
  Target,
  Shield,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers
} from "lucide-react";
import { 
  useMyMentorProfile, 
  useOnboardingChecklist, 
  useUpdateMentorProfile,
  useAcceptMentorTerms,
  mentorStatusLabels,
  type MentorStatus
} from "@/hooks/useMentorOnboarding";
import { useMentorTaxonomies, useMentorHasTaxonomies } from "@/hooks/useClinicalTaxonomies";
import { TaxonomySelector } from "@/components/academy/TaxonomySelector";
import { MentorVerifiedBadge } from "@/components/academy/MentorVerifiedBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CLINICAL_AREAS = [
  "PRP", "Ortobiológicos", "Dor Crônica", "Ortopedia Regenerativa",
  "Fisioterapia", "Medicina Esportiva", "Reumatologia", "Ondas de Choque",
  "Laserterapia", "Outros"
];

const MentorOnboardingPage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: loadingProfile } = useMyMentorProfile();
  const { checklist, isLoading: loadingChecklist } = useOnboardingChecklist();
  const updateProfileMutation = useUpdateMentorProfile();
  const acceptTermsMutation = useAcceptMentorTerms();
  const { hasTaxonomies, isLoading: loadingTaxonomies } = useMentorHasTaxonomies(profile?.id);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [editMode, setEditMode] = useState<'profile' | 'bio' | 'areas' | 'taxonomies' | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    headline: "",
    bio: "",
    clinical_areas: [] as string[],
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (!session) {
        navigate("/auth", { state: { returnTo: "/academy/mentor/onboarding" } });
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        specialty: profile.specialty || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        clinical_areas: profile.clinical_areas || [],
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    await updateProfileMutation.mutateAsync({
      name: formData.name,
      specialty: formData.specialty,
      headline: formData.headline,
    });
    setEditMode(null);
  };

  const handleSaveBio = async () => {
    if (formData.bio.length < 50) {
      toast.error("A bio deve ter pelo menos 50 caracteres");
      return;
    }
    await updateProfileMutation.mutateAsync({ bio: formData.bio });
    setEditMode(null);
  };

  const handleSaveAreas = async () => {
    if (formData.clinical_areas.length === 0) {
      toast.error("Selecione pelo menos uma área");
      return;
    }
    await updateProfileMutation.mutateAsync({ clinical_areas: formData.clinical_areas });
    setEditMode(null);
  };

  const handleAcceptTerms = async () => {
    if (!termsAccepted) {
      toast.error("Você precisa aceitar os termos");
      return;
    }
    await acceptTermsMutation.mutateAsync();
  };

  const toggleArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      clinical_areas: prev.clinical_areas.includes(area)
        ? prev.clinical_areas.filter(a => a !== area)
        : [...prev.clinical_areas, area]
    }));
  };

  if (loadingProfile || loadingChecklist || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6 max-w-3xl mx-auto">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Candidatura não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              Você ainda não se candidatou a mentor.
            </p>
            <Button onClick={() => navigate("/academy/mentores/candidatar")}>
              Candidatar-se agora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = (profile.status as MentorStatus) || 'pending_review';
  const statusInfo = mentorStatusLabels[status];

  const statusVariantClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    green: "bg-green-500/10 text-green-600 border-green-500/30",
    red: "bg-red-500/10 text-red-600 border-red-500/30",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate('/academy/home')} className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Onboarding do Mentor
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
              Bem-vindo, {profile.name?.split(' ')[0]}!
              <MentorVerifiedBadge 
                hasValidSeal={profile.has_curation_seal === true} 
                size="lg"
              />
            </h1>
            <p className="text-lg text-muted-foreground">
              Complete seu perfil para começar a criar mentorias no REGEN Academy.
            </p>
          </div>
        </div>
      </section>

      {/* Status Banner */}
      <section className="py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Alert className={statusVariantClasses[statusInfo.variant]}>
              {status === 'pending_review' && <Clock className="h-4 w-4" />}
              {status === 'approved' && <CheckCircle2 className="h-4 w-4" />}
              {status === 'rejected' && <AlertCircle className="h-4 w-4" />}
              {status === 'suspended' && <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{statusInfo.label}</AlertTitle>
              <AlertDescription>{statusInfo.description}</AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* Onboarding Checklist */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Checklist Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Checklist de Onboarding
                </CardTitle>
                <CardDescription>
                  Complete todos os itens para finalizar seu cadastro como mentor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Item 1: Profile */}
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className="mt-0.5">
                    {checklist?.hasCompletedProfile ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Completar perfil profissional</h4>
                      {editMode !== 'profile' && (
                        <Button variant="ghost" size="sm" onClick={() => setEditMode('profile')}>
                          Editar
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nome, especialidade e headline profissional
                    </p>
                    
                    {editMode === 'profile' && (
                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Nome completo</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Especialidade</Label>
                          <Input
                            value={formData.specialty}
                            onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Headline profissional</Label>
                          <Input
                            value={formData.headline}
                            onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                            placeholder="Ex: Especialista em Ortobiológicos e PRP"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditMode(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Item 2: Bio */}
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className="mt-0.5">
                    {checklist?.hasBio ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Inserir bio clínica</h4>
                      {editMode !== 'bio' && (
                        <Button variant="ghost" size="sm" onClick={() => setEditMode('bio')}>
                          Editar
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mínimo de 50 caracteres
                    </p>
                    
                    {editMode === 'bio' && (
                      <div className="mt-4 space-y-4">
                        <Textarea
                          value={formData.bio}
                          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                          rows={4}
                          placeholder="Descreva sua experiência clínica..."
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.bio.length} / 50 caracteres mínimos
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveBio} disabled={updateProfileMutation.isPending}>
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditMode(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Item 3: Taxonomias Clínicas Oficiais (NOVO) */}
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className="mt-0.5">
                    {hasTaxonomies ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Áreas de Atuação Clínica (Taxonomia Oficial)
                      </h4>
                      {editMode !== 'taxonomies' && (
                        <Button variant="ghost" size="sm" onClick={() => setEditMode('taxonomies')}>
                          {hasTaxonomies ? 'Editar' : 'Selecionar'}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Selecione suas áreas de atuação na taxonomia oficial do REGEN Academy
                    </p>
                    
                    {editMode === 'taxonomies' && profile?.id && (
                      <div className="mt-4">
                        <TaxonomySelector 
                          mentorId={profile.id} 
                          onSave={() => setEditMode(null)}
                          minSelection={1}
                          maxSelection={5}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Item 4: Areas (legado - opcional) */}
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className="mt-0.5">
                    {checklist?.hasClinicalAreas ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Áreas de expertise adicionais (opcional)</h4>
                      {editMode !== 'areas' && (
                        <Button variant="ghost" size="sm" onClick={() => setEditMode('areas')}>
                          Editar
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complementar: selecione áreas de expertise específicas
                    </p>
                    
                    {editMode === 'areas' && (
                      <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {CLINICAL_AREAS.map((area) => (
                            <Badge
                              key={area}
                              variant={formData.clinical_areas.includes(area) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleArea(area)}
                            >
                              {formData.clinical_areas.includes(area) && (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              )}
                              {area}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveAreas} disabled={updateProfileMutation.isPending}>
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditMode(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Item 4: Terms */}
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className="mt-0.5">
                    {checklist?.hasAcceptedTerms ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Confirmar termos do Academy</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Aceite os termos de uso e conduta do REGEN Academy
                    </p>
                    
                    {!checklist?.hasAcceptedTerms && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                          <Checkbox
                            id="terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                          />
                          <label htmlFor="terms" className="text-sm cursor-pointer">
                            Li e aceito os termos de uso do REGEN Academy, incluindo as diretrizes de qualidade, 
                            conduta ética e padrões científicos exigidos para mentores.
                          </label>
                        </div>
                        <Button
                          onClick={handleAcceptTerms}
                          disabled={!termsAccepted || acceptTermsMutation.isPending}
                        >
                          Aceitar termos
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            {checklist?.isComplete && status === 'pending_review' && (
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardContent className="py-6">
                  <div className="flex items-start gap-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Checklist completo!
                      </h3>
                      <p className="text-muted-foreground">
                        Seu perfil está em análise pela curadoria do REGEN Academy. 
                        Você receberá uma notificação quando for aprovado.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {status === 'approved' && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="py-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        Você está aprovado!
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Parabéns! Você já pode criar e publicar mentorias no REGEN Academy.
                      </p>
                      <Button onClick={() => navigate("/academy/mentorias")}>
                        Criar minha primeira mentoria
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MentorOnboardingPage;
