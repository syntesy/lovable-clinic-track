import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Calendar, 
  ArrowLeft,
  MapPin,
  Video,
  Clock,
  CheckCircle2,
  Target,
  User,
  CreditCard
} from "lucide-react";
import { useMentorshipBySlug, useEnrollInMentorship } from "@/hooks/useMentorships";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const MentorshipDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: mentorship, isLoading } = useMentorshipBySlug(slug);
  const enrollMutation = useEnrollInMentorship();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.info("Faça login para se inscrever nesta mentoria");
      navigate("/auth", { state: { returnTo: `/academy/mentorias/${slug}` } });
      return;
    }

    if (!mentorship) return;

    try {
      const result = await enrollMutation.mutateAsync({
        mentorshipId: mentorship.id,
        sessionId: selectedSession || undefined,
      });

      if (result.manual) {
        // Manual enrollment - no Stripe configured
        toast.success(result.message || "Solicitação de inscrição enviada! Aguarde aprovação.");
        navigate("/academy/minhas-mentorias");
      } else if (result.url) {
        // Stripe checkout - redirect to payment
        window.location.href = result.url;
      } else {
        toast.success("Inscrição realizada com sucesso!");
        navigate("/academy/minhas-mentorias");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar inscrição");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-12 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!mentorship) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Mentoria não encontrada</h2>
          <Button onClick={() => navigate("/mentorias")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ver todas as mentorias
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-8">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/mentorias")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para mentorias
          </Button>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">
              {mentorship.clinical_area || "Geral"}
            </Badge>
            <Badge variant={mentorship.type === 'individual' ? 'default' : 'outline'}>
              {mentorship.type === 'individual' ? 'Individual' : 'Coletiva'}
            </Badge>
            <Badge variant="outline" className="gap-1">
              {mentorship.modality === 'online' ? (
                <Video className="w-3 h-3" />
              ) : (
                <MapPin className="w-3 h-3" />
              )}
              {mentorship.modality}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {mentorship.title}
          </h1>
          {mentorship.mentor && (
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/mentores/${mentorship.mentor?.slug}`)}
            >
              <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                <AvatarImage src={mentorship.mentor.photo_url || undefined} />
                <AvatarFallback className="text-lg">
                  {mentorship.mentor.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{mentorship.mentor.name}</p>
                <p className="text-sm text-muted-foreground">{mentorship.mentor.specialty}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {mentorship.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sobre esta mentoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {mentorship.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Target Audience */}
              {mentorship.target_audience && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Público-alvo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {mentorship.target_audience}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Topics */}
              {mentorship.topics && mentorship.topics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      O que será abordado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {mentorship.topics.map((topic, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Mentor Card */}
              {mentorship.mentor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Sobre o mentor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                        <AvatarImage src={mentorship.mentor.photo_url || undefined} />
                        <AvatarFallback className="text-2xl">
                          {mentorship.mentor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {mentorship.mentor.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {mentorship.mentor.specialty}
                        </p>
                        {mentorship.mentor.headline && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {mentorship.mentor.headline}
                          </p>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/mentores/${mentorship.mentor?.slug}`)}
                        >
                          Ver perfil completo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Enrollment */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="flex items-baseline justify-between">
                    <CardTitle className="text-3xl font-bold">
                      {mentorship.price_cents === 0 
                        ? 'Gratuito' 
                        : `R$ ${(mentorship.price_cents / 100).toFixed(2)}`}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {mentorship.duration_minutes} minutos por sessão
                    </div>
                    {mentorship.max_spots && (
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-4 h-4" />
                        Até {mentorship.max_spots} participantes
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Available Sessions */}
                  {mentorship.sessions && mentorship.sessions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Próximas datas disponíveis:</h4>
                      <div className="space-y-2">
                        {mentorship.sessions.slice(0, 3).map((session) => (
                          <div 
                            key={session.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedSession === session.id 
                                ? 'border-primary bg-primary/5' 
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedSession(session.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span className="font-medium">
                                  {format(new Date(session.scheduled_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              {session.spots_available && (
                                <Badge variant="secondary" className="text-xs">
                                  {session.spots_available} vagas
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? (
                      "Processando..."
                    ) : mentorship.price_cents === 0 ? (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Participar da mentoria
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Quero participar
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    {mentorship.price_cents === 0 
                      ? "Gratuito - inscrição sujeita a confirmação"
                      : "Pagamento via Stripe ou inscrição manual"}
                  </p>

                  {!isAuthenticated && (
                    <p className="text-xs text-center text-muted-foreground">
                      Você precisará fazer login para continuar
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MentorshipDetailPage;
