import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  BookOpen, 
  Microscope, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  GraduationCap,
  Stethoscope,
  FileText,
  ShoppingBag,
  Library
} from "lucide-react";
import { useMentors } from "@/hooks/useMentors";
import { useMentorships } from "@/hooks/useMentorships";
import { useLatestAcademyArticles } from "@/hooks/useAcademyArticles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AcademyHome = () => {
  const navigate = useNavigate();
  const { data: mentors = [] } = useMentors({ featured: true });
  const { data: mentorships = [] } = useMentorships({ featured: true });
  const { data: latestArticles = [] } = useLatestAcademyArticles(3);

  const actionCards = [
    {
      title: "Feed Científico",
      description: "Novidades e artigos relevantes para você",
      icon: TrendingUp,
      href: "/academy/feed",
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      title: "Quero mentoria clínica",
      description: "Conecte-se com especialistas para discutir seus casos",
      icon: Users,
      href: "/academy/mentorias",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Biblioteca Científica",
      description: "Artigos curados com evidência e resumos clínicos",
      icon: Library,
      href: "/academy/biblioteca",
      color: "bg-teal-500/10 text-teal-600",
    },
    {
      title: "Quero estudar ciência aplicada",
      description: "Artigos científicos com comentários clínicos",
      icon: Microscope,
      href: "/academy/ciencia-aplicada",
      color: "bg-emerald-500/10 text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <GraduationCap className="w-3 h-3 mr-1" />
              REGEN Academy
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Medicina Regenerativa com{" "}
              <span className="text-primary">Maturidade Clínica</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Aprenda com os melhores mentores, domine a ciência por trás da prática 
              e construa uma carreira sólida em terapias regenerativas.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/academy/marketplace")}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Explorar Marketplace
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/academy/minhas-compras")}>
                <BookOpen className="w-4 h-4 mr-2" />
                Minhas Compras
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/academy/mentorias")}>
                <Users className="w-4 h-4 mr-2" />
                Mentorias
              </Button>
              <Button size="lg" variant="ghost" onClick={() => navigate("/academy/mentores")}>
                Conhecer Mentores
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </section>

      {/* What do you want to do? */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              O que você quer fazer agora?
            </h2>
            <p className="text-muted-foreground">
              Escolha sua jornada de aprendizado
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {actionCards.map((card) => (
              <Card 
                key={card.href}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] group border-2 hover:border-primary/20"
                onClick={() => navigate(card.href)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Mentorships */}
      {mentorships.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Mentorias em Destaque
                </h2>
                <p className="text-muted-foreground">
                  Sessões exclusivas com especialistas renomados
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/academy/mentorias")}>
                Ver todas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentorships.slice(0, 3).map((mentorship) => (
                <Card 
                  key={mentorship.id}
                  className="cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => navigate(`/academy/mentorias/${mentorship.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary" className="mb-2">
                        {mentorship.clinical_area || "Geral"}
                      </Badge>
                      <Badge variant={mentorship.type === 'individual' ? 'default' : 'outline'}>
                        {mentorship.type === 'individual' ? 'Individual' : 'Coletiva'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {mentorship.title}
                    </CardTitle>
                    {mentorship.mentor && (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={mentorship.mentor.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {mentorship.mentor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {mentorship.mentor.name}
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {mentorship.description}
                    </p>
                    {mentorship.sessions && mentorship.sessions.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>
                          {format(new Date(mentorship.sessions[0].scheduled_at), "dd MMM, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">
                        {mentorship.price_cents === 0 
                          ? 'Gratuito' 
                          : `R$ ${(mentorship.price_cents / 100).toFixed(2)}`}
                      </span>
                      <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        Ver mentoria
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Mentors */}
      {mentors.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Mentores REGEN
                </h2>
                <p className="text-muted-foreground">
                  Especialistas que transformam prática em resultados
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/academy/mentores")}>
                Ver todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mentors.slice(0, 4).map((mentor) => (
                <Card 
                  key={mentor.id}
                  className="cursor-pointer hover:shadow-lg transition-all group text-center"
                  onClick={() => navigate(`/academy/mentores/${mentor.slug}`)}
                >
                  <CardHeader className="pb-2">
                    <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                      <AvatarImage src={mentor.photo_url || undefined} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {mentor.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {mentor.name}
                    </CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      {mentor.specialty}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mentor.headline && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {mentor.headline}
                      </p>
                    )}
                    <Button size="sm" variant="ghost" className="mt-4">
                      Ver perfil
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Applied Science */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-2 border-primary/10">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-primary mb-4">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium uppercase tracking-wide">
                      Ciência Aplicada
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Evidência científica traduzida para a prática clínica
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Artigos comentados, aulas baseadas em evidência e discussões 
                    que conectam a ciência ao dia a dia do consultório.
                  </p>
                  <Button onClick={() => navigate("/academy/ciencia-aplicada")}>
                    Explorar Biblioteca
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="bg-gradient-to-br from-primary/5 to-primary/20 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <Microscope className="w-24 h-24 text-primary/50 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Base científica para decisões clínicas
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest Articles from Library */}
      {latestArticles.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Últimos Artigos
                </h2>
                <p className="text-muted-foreground">
                  Evidência científica recente curada pela equipe
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/academy/biblioteca")}>
                Ver biblioteca
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestArticles.map((article) => (
                <Card
                  key={article.id}
                  className="cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => navigate("/academy/biblioteca")}
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant="secondary" className="text-xs">{article.study_type}</Badge>
                      {article.interventions.slice(0, 2).map((i) => (
                        <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                      ))}
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {article.year} • {article.journal}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.summary_short}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para evoluir sua prática clínica?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Junte-se a uma comunidade de profissionais comprometidos com excelência 
            em Medicina Regenerativa.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/academy/mentorias")}
            >
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/academy/mentores")}
            >
              Conhecer Mentores
            </Button>
            <Button 
              size="lg" 
              variant="ghost"
              className="border-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/academy/mentores/candidatar")}
            >
              Se tornar Mentor
            </Button>
            <Button 
              size="lg" 
              variant="ghost"
              className="border-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate("/academy/professor/candidatar")}
            >
              Tornar-se Professor
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AcademyHome;
