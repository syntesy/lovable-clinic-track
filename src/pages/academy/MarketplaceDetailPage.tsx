import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useAcademyProduct, useCourseModules, useMentorshipCohorts, useSubscriptionPosts,
} from "@/hooks/useAcademyProducts";
import { ArrowLeft, BookOpen, Users, Repeat, ShoppingCart, Clock, Lock } from "lucide-react";

const typeLabels: Record<string, string> = { course: 'Curso', mentorship: 'Mentoria', subscription: 'Assinatura' };

const MarketplaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useAcademyProduct(id);
  const { data: modules = [] } = useCourseModules(product?.type === 'course' ? id : undefined);
  const { data: cohorts = [] } = useMentorshipCohorts(product?.type === 'mentorship' ? id : undefined);
  const { data: posts = [] } = useSubscriptionPosts(product?.type === 'subscription' ? id : undefined);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!product) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Produto não encontrado</div>;

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalSessions = cohorts.reduce((acc, c) => acc + (c.sessions?.length || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/academy/marketplace')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Marketplace
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{typeLabels[product.type]}</Badge>
                {product.category && <Badge variant="outline">{product.category}</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.title}</h1>
              {product.subtitle && <p className="text-lg text-muted-foreground">{product.subtitle}</p>}
            </div>

            <Card>
              <CardHeader><CardTitle>Descrição</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
              </CardContent>
            </Card>

            {/* Course Structure */}
            {product.type === 'course' && modules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Conteúdo do Curso
                    <Badge variant="secondary">{modules.length} módulos · {totalLessons} aulas</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {modules.map(mod => (
                    <div key={mod.id}>
                      <h4 className="font-medium text-foreground mb-2">{mod.title}</h4>
                      <div className="space-y-1 ml-4">
                        {mod.lessons?.map(lesson => (
                          <div key={lesson.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {lesson.is_free_preview ? (
                              <BookOpen className="w-3 h-3 text-primary" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            <span>{lesson.title}</span>
                            {lesson.duration_seconds && (
                              <span className="text-xs">({Math.ceil(lesson.duration_seconds / 60)} min)</span>
                            )}
                            {lesson.is_free_preview && <Badge variant="outline" className="text-xs">Preview</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Mentorship Cohorts */}
            {product.type === 'mentorship' && cohorts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Turmas
                    <Badge variant="secondary">{cohorts.length} turmas · {totalSessions} sessões</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cohorts.map(cohort => (
                    <div key={cohort.id}>
                      <h4 className="font-medium text-foreground mb-2">
                        {cohort.title}
                        {cohort.capacity && <span className="text-sm text-muted-foreground ml-2">({cohort.capacity} vagas)</span>}
                      </h4>
                      <div className="space-y-1 ml-4">
                        {cohort.sessions?.map(session => (
                          <div key={session.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{session.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Subscription Posts */}
            {product.type === 'subscription' && posts.filter(p => p.status === 'published').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-primary" />
                    Conteúdo Recente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {posts.filter(p => p.status === 'published').map(post => (
                    <div key={post.id} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-foreground">{post.title}</p>
                      {post.published_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(post.published_at).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="pt-6 space-y-4">
                {product.cover_image_url && (
                  <img src={product.cover_image_url} alt={product.title} className="w-full rounded-lg aspect-video object-cover mb-4" />
                )}
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {product.price_cents != null
                      ? product.price_cents === 0
                        ? 'Gratuito'
                        : `R$ ${(product.price_cents / 100).toFixed(2)}`
                      : 'Sob consulta'}
                  </p>
                  {product.access_policy === 'time_limited' && product.access_days && (
                    <p className="text-sm text-muted-foreground">{product.access_days} dias de acesso</p>
                  )}
                  {product.access_policy === 'lifetime' && (
                    <p className="text-sm text-muted-foreground">Acesso vitalício</p>
                  )}
                </div>
                <Button className="w-full" size="lg" disabled>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Checkout em breve
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  O sistema de pagamento será ativado em breve.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDetailPage;
