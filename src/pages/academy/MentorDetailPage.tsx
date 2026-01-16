import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  ArrowRight,
  Stethoscope,
  Award,
  Calendar,
  Users,
  BookOpen
} from "lucide-react";
import { useMentorBySlug } from "@/hooks/useMentors";
import { useMentorships } from "@/hooks/useMentorships";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MentorDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: mentor, isLoading } = useMentorBySlug(slug);
  const { data: allMentorships = [] } = useMentorships();

  // Filter mentorships by this mentor
  const mentorMentorships = mentor 
    ? allMentorships.filter(m => m.mentor_id === mentor.id)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-muted rounded-full" />
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Mentor não encontrado</h2>
          <Button onClick={() => navigate("/mentores")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ver todos os mentores
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
            onClick={() => navigate("/mentores")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para mentores
          </Button>
          
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="w-32 h-32 ring-4 ring-primary/20">
              <AvatarImage src={mentor.photo_url || undefined} />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {mentor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {mentor.is_featured && (
                  <Badge variant="default">
                    <Award className="w-3 h-3 mr-1" />
                    Mentor Destaque
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {mentor.name}
              </h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2 mb-4">
                <Stethoscope className="w-5 h-5" />
                {mentor.specialty}
              </p>
              {mentor.headline && (
                <p className="text-muted-foreground max-w-2xl">
                  {mentor.headline}
                </p>
              )}
              {mentor.clinical_areas && mentor.clinical_areas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {mentor.clinical_areas.map((area, i) => (
                    <Badge key={i} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio */}
              {mentor.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Biografia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {mentor.bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Active Mentorships */}
              {mentorMentorships.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Mentorias Ativas
                    </CardTitle>
                    <CardDescription>
                      Participe de sessões de mentoria com {mentor.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mentorMentorships.map((mentorship) => (
                        <div 
                          key={mentorship.id}
                          className="p-4 border rounded-lg hover:border-primary/50 cursor-pointer transition-all"
                          onClick={() => navigate(`/mentorias/${mentorship.slug}`)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge variant="secondary">
                                  {mentorship.clinical_area || "Geral"}
                                </Badge>
                                <Badge variant={mentorship.type === 'individual' ? 'default' : 'outline'}>
                                  {mentorship.type === 'individual' ? 'Individual' : 'Coletiva'}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-foreground mb-1">
                                {mentorship.title}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {mentorship.description}
                              </p>
                              {mentorship.sessions && mentorship.sessions.length > 0 && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                                  <Calendar className="w-4 h-4" />
                                  Próxima: {format(new Date(mentorship.sessions[0].scheduled_at), "dd MMM, HH:mm", { locale: ptBR })}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                {mentorship.price_cents === 0 
                                  ? 'Gratuito' 
                                  : `R$ ${(mentorship.price_cents / 100).toFixed(2)}`}
                              </p>
                              <Button size="sm" variant="ghost" className="mt-2">
                                Ver
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Mentorias ativas
                      </span>
                      <span className="font-semibold">{mentorMentorships.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Áreas de atuação
                      </span>
                      <span className="font-semibold">{mentor.clinical_areas?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-foreground mb-2">
                    Quer aprender com {mentor.name.split(' ')[0]}?
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore as mentorias disponíveis e acelere seu desenvolvimento profissional.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => navigate("/mentorias")}
                  >
                    Ver mentorias
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MentorDetailPage;
