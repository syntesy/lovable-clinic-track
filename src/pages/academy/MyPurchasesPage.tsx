import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyEnrollments } from "@/hooks/useAcademyEnrollments";
import { useMyOrders, useRequestRefund } from "@/hooks/useAcademyPayments";
import { ArrowLeft, BookOpen, Users, Repeat, ShoppingBag, AlertCircle, Undo2, Loader2 } from "lucide-react";

const typeIcons: Record<string, any> = { course: BookOpen, mentorship: Users, subscription: Repeat };
const typeLabels: Record<string, string> = { course: 'Curso', mentorship: 'Mentoria', subscription: 'Assinatura' };
const statusLabels: Record<string, string> = { active: 'Ativo', expired: 'Expirado', refunded: 'Reembolsado', canceled: 'Cancelado' };

const MyPurchasesPage = () => {
  const navigate = useNavigate();
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  const activeEnrollments = enrollments.filter(e => e.access_status === 'active');
  const inactiveEnrollments = enrollments.filter(e => e.access_status !== 'active');

  const getAccessUrl = (enrollment: typeof enrollments[0]) => {
    if (!enrollment.product) return '#';
    const p = enrollment.product;
    if (p.type === 'course') return `/academy/curso/${p.id}`;
    if (p.type === 'mentorship') return `/academy/mentoria/${p.id}`;
    if (p.type === 'subscription') return `/academy/assinatura/${p.id}`;
    return '#';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/academy/home')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Minhas Compras</h1>
        </div>

        {isLoading && <p className="text-muted-foreground">Carregando...</p>}

        {!isLoading && enrollments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Você ainda não possui nenhum produto.</p>
              <Button onClick={() => navigate('/academy/marketplace')}>Explorar Marketplace</Button>
            </CardContent>
          </Card>
        )}

        {activeEnrollments.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-foreground">Acessos Ativos</h2>
            {activeEnrollments.map(enrollment => {
              const Icon = typeIcons[enrollment.product?.type || 'course'] || BookOpen;
              return (
                <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-4 py-4">
                    {enrollment.product?.cover_image_url ? (
                      <img src={enrollment.product.cover_image_url} alt="" className="w-20 h-14 rounded object-cover" />
                    ) : (
                      <div className="w-20 h-14 rounded bg-muted flex items-center justify-center">
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{enrollment.product?.title || 'Produto'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{typeLabels[enrollment.product?.type || ''] || ''}</Badge>
                        <Badge variant="default" className="text-xs">Ativo</Badge>
                        {enrollment.access_expires_at && (
                          <span className="text-xs text-muted-foreground">
                            Expira em {new Date(enrollment.access_expires_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => navigate(getAccessUrl(enrollment))}>Acessar</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {inactiveEnrollments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-muted-foreground">Acessos Inativos</h2>
            {inactiveEnrollments.map(enrollment => {
              const Icon = typeIcons[enrollment.product?.type || 'course'] || BookOpen;
              return (
                <Card key={enrollment.id} className="opacity-60">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-20 h-14 rounded bg-muted flex items-center justify-center">
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{enrollment.product?.title || 'Produto'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{typeLabels[enrollment.product?.type || ''] || ''}</Badge>
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {statusLabels[enrollment.access_status]}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" disabled>Acessar</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurchasesPage;
