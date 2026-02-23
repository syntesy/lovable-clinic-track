import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  ArrowRight,
  ArrowLeft,
  Video,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import { useMyMentorships } from "@/hooks/useMentorships";
import { format, isPast, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";

const MyMentorshipsPage = () => {
  const navigate = useNavigate();
  const { data: enrollments = [], isLoading } = useMyMentorships();

  // Active enrollments - user can access content
  const activeEnrollments = enrollments.filter(e => 
    e.status === 'active' || e.status === 'confirmed'
  );

  const upcomingEnrollments = activeEnrollments.filter(e => 
    e.session && isFuture(new Date(e.session.scheduled_at))
  );

  const pastEnrollments = enrollments.filter(e => 
    e.session && isPast(new Date(e.session.scheduled_at)) || e.status === 'completed'
  );

  // Pending - awaiting payment or manual approval
  const pendingEnrollments = enrollments.filter(e => 
    e.status === 'pending_manual' || (e.status as string) === 'pending_payment' || (e.status as string) === 'pending'
  );

  // Status label map - standardized copy
  const statusLabelMap: Record<string, { label: string; variant: 'blue' | 'amber' | 'green' | 'red' | 'gray' }> = {
    pending_manual: { label: 'Reserva solicitada', variant: 'blue' },
    pending_payment: { label: 'Pagamento pendente', variant: 'amber' },
    pending: { label: 'Pagamento pendente', variant: 'amber' }, // legacy fallback
    active: { label: 'Ativa', variant: 'green' },
    confirmed: { label: 'Ativa', variant: 'green' },
    expired: { label: 'Expirada', variant: 'red' },
    cancelled: { label: 'Cancelada', variant: 'gray' },
  };

  const getStatusBadge = (enrollment: typeof enrollments[0]) => {
    const statusInfo = statusLabelMap[enrollment.status];
    
    if (!statusInfo) {
      return <Badge variant="outline">{enrollment.status}</Badge>;
    }

    const variantClasses: Record<string, string> = {
      blue: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      amber: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      green: "bg-green-500/10 text-green-600 border-green-500/30",
      red: "bg-red-500/10 text-red-600 border-red-500/30",
      gray: "bg-muted text-muted-foreground border-muted",
    };

    const icon = statusInfo.variant === 'green' ? (
      <CheckCircle2 className="w-3 h-3 mr-1" />
    ) : statusInfo.variant === 'blue' || statusInfo.variant === 'amber' ? (
      <Clock className="w-3 h-3 mr-1" />
    ) : null;

    return (
      <Badge variant="secondary" className={variantClasses[statusInfo.variant]}>
        {icon}
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
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
          <div className="max-w-3xl">
            <Button variant="ghost" size="sm" onClick={() => navigate('/academy/home')} className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Badge variant="secondary" className="mb-4">
              <Users className="w-3 h-3 mr-1" />
              Minhas Mentorias
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Suas Mentorias
            </h1>
            <p className="text-lg text-muted-foreground">
              Acompanhe suas inscrições, acesse sessões e revise seu histórico.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {enrollments.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma mentoria ainda</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Você ainda não se inscreveu em nenhuma mentoria. 
                Explore nosso catálogo e encontre a mentoria ideal para você.
              </p>
              <Button onClick={() => navigate("/academy/mentorias")}>
                Explorar mentorias
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Próximas ({upcomingEnrollments.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pendentes ({pendingEnrollments.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Histórico ({pastEnrollments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                {upcomingEnrollments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma sessão futura agendada.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate("/academy/mentorias")}
                      >
                        Explorar mentorias
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {upcomingEnrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="py-6">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge variant="default">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {enrollment.session && format(
                                    new Date(enrollment.session.scheduled_at), 
                                    "dd 'de' MMMM 'às' HH:mm", 
                                    { locale: ptBR }
                                  )}
                                </Badge>
                                <Badge variant="outline">
                                  {enrollment.status === 'confirmed' ? 'Confirmado' : 'Inscrito'}
                                </Badge>
                              </div>
                              <h3 className="text-lg font-semibold text-foreground mb-1">
                                {enrollment.mentorship?.title || 'Mentoria'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {enrollment.mentorship?.description}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {enrollment.session?.meeting_url && (
                                <Button asChild>
                                  <a 
                                    href={enrollment.session.meeting_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <Video className="w-4 h-4 mr-2" />
                                    Acessar sessão
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                  </a>
                                </Button>
                              )}
                              <Button 
                                variant="outline"
                                onClick={() => navigate(`/academy/mentorias/${enrollment.mentorship?.slug}`)}
                              >
                                Ver detalhes
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending">
                {pendingEnrollments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma inscrição pendente.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingEnrollments.map((enrollment) => (
                      <Card 
                        key={enrollment.id} 
                        className={enrollment.status === 'pending_manual' 
                          ? "border-blue-500/30 bg-blue-500/5" 
                          : "border-amber-500/30 bg-amber-500/5"
                        }
                      >
                        <CardContent className="py-6">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                              {getStatusBadge(enrollment)}
                              <h3 className="text-lg font-semibold text-foreground mb-1 mt-2">
                                {enrollment.mentorship?.title || 'Mentoria'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {enrollment.status === 'pending_manual' 
                                  ? "Sua solicitação foi enviada. Aguarde aprovação do mentor/administrador."
                                  : "Complete o pagamento para confirmar sua inscrição."
                                }
                              </p>
                            </div>
                            {enrollment.status === 'pending' && (
                              <Button onClick={() => navigate(`/academy/mentorias/${enrollment.mentorship?.slug}`)}>
                                Completar pagamento
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                {pastEnrollments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma mentoria concluída ainda.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pastEnrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="opacity-80">
                        <CardContent className="py-6">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                              <Badge variant="secondary" className="mb-2">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Concluída
                              </Badge>
                              <h3 className="text-lg font-semibold text-foreground mb-1">
                                {enrollment.mentorship?.title || 'Mentoria'}
                              </h3>
                              {enrollment.session && (
                                <p className="text-sm text-muted-foreground">
                                  Realizada em {format(
                                    new Date(enrollment.session.scheduled_at), 
                                    "dd 'de' MMMM 'de' yyyy", 
                                    { locale: ptBR }
                                  )}
                                </p>
                              )}
                            </div>
                            <Button 
                              variant="outline"
                              onClick={() => navigate(`/academy/mentorias/${enrollment.mentorship?.slug}`)}
                            >
                              Ver detalhes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>
    </div>
  );
};

export default MyMentorshipsPage;
