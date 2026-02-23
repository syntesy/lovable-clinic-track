import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  BookOpen, 
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { useMyMentorships } from "@/hooks/useMentorships";
import { useEduEnrollments } from "@/hooks/useEduMembership";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MyJourneyPage = () => {
  const navigate = useNavigate();
  const { data: mentorshipEnrollments = [] } = useMyMentorships();
  const { data: courseEnrollments = [] } = useEduEnrollments();

  const completedMentorships = mentorshipEnrollments.filter(e => e.status === 'completed');
  const activeCourses = courseEnrollments.filter(e => e.status === 'active');

  // Build timeline from all activities
  const timeline = [
    ...completedMentorships.map(e => ({
      type: 'mentorship' as const,
      title: e.mentorship?.title || 'Mentoria',
      date: e.completed_at || e.enrolled_at,
      icon: Users,
    })),
    ...activeCourses.map(e => ({
      type: 'course' as const,
      title: (e.cohort as any)?.name || 'Curso',
      date: e.enrolled_at,
      icon: BookOpen,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="w-3 h-3 mr-1" />
              Minha Jornada
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sua Jornada Profissional
            </h1>
            <p className="text-lg text-muted-foreground">
              Você constrói maturidade clínica, não apenas consome conteúdo.
              Acompanhe seu desenvolvimento e conquistas.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeCourses.length}</p>
                    <p className="text-sm text-muted-foreground">Cursos ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedMentorships.length}</p>
                    <p className="text-sm text-muted-foreground">Mentorias concluídas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Artigos estudados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{timeline.length}</p>
                    <p className="text-sm text-muted-foreground">Atividades totais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">Linha do Tempo</h2>
          
          {timeline.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comece sua jornada</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Sua linha do tempo está vazia. Participe de mentorias, 
                  cursos e estudos para começar a construir sua história.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button onClick={() => navigate("/mentorias")}>
                    <Users className="w-4 h-4 mr-2" />
                    Explorar mentorias
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/edu/cohorts")}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Ver cursos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-translate-x-0.5" />
              
              <div className="space-y-8">
                {timeline.map((item, index) => (
                  <div 
                    key={index}
                    className={`relative flex items-start gap-4 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-4 w-2 h-2 bg-primary rounded-full -translate-x-1/2 mt-2 md:left-1/2" />
                    
                    {/* Content */}
                    <Card className={`ml-8 flex-1 md:ml-0 ${
                      index % 2 === 0 ? 'md:mr-[calc(50%+1rem)]' : 'md:ml-[calc(50%+1rem)]'
                    }`}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            item.type === 'mentorship' 
                              ? 'bg-emerald-500/10' 
                              : 'bg-primary/10'
                          }`}>
                            <item.icon className={`w-5 h-5 ${
                              item.type === 'mentorship' 
                                ? 'text-emerald-600' 
                                : 'text-primary'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {item.type === 'mentorship' ? 'Mentoria' : 'Curso'}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(item.date), "dd MMM yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <h4 className="font-medium text-foreground truncate">
                              {item.title}
                            </h4>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Encouragement */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto text-center border-primary/20 bg-primary/5">
            <CardContent className="py-8">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                Continue evoluindo
              </h3>
              <p className="text-muted-foreground mb-6">
                Cada mentoria, cada estudo, cada reflexão clínica contribui 
                para sua maturidade profissional. Sua jornada é única.
              </p>
              <Button onClick={() => navigate("/home")}>
                Explorar mais
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MyJourneyPage;
