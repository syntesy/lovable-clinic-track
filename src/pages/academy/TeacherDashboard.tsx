import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyProducts } from "@/hooks/useAcademyProducts";
import { useMyAcademyRoles } from "@/hooks/useAcademyRoles";
import { Plus, Package, BookOpen, Users, Repeat, ArrowRight } from "lucide-react";

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  in_review: 'Em Revisão',
  published: 'Publicado',
  archived: 'Arquivado',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  in_review: 'outline',
  published: 'default',
  archived: 'destructive',
};

const typeIcons: Record<string, any> = {
  course: BookOpen,
  mentorship: Users,
  subscription: Repeat,
};

const typeLabels: Record<string, string> = {
  course: 'Curso',
  mentorship: 'Mentoria',
  subscription: 'Assinatura',
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useMyProducts();
  const { data: roles = [] } = useMyAcademyRoles();

  const isTeacher = roles.includes('teacher_approved') || roles.includes('admin_academy');

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você precisa ser um professor aprovado para acessar esta área.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/academy/professor/candidatar')}>
              Candidatar-se como Professor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    total: products.length,
    published: products.filter(p => p.status === 'published').length,
    draft: products.filter(p => p.status === 'draft').length,
    inReview: products.filter(p => p.status === 'in_review').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel do Professor</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus cursos, mentorias e assinaturas</p>
          </div>
          <Button onClick={() => navigate('/academy/professor/produtos/novo')}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Package },
            { label: 'Publicados', value: stats.published, icon: BookOpen },
            { label: 'Rascunhos', value: stats.draft, icon: Package },
            { label: 'Em Revisão', value: stats.inReview, icon: Package },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                  <s.icon className="w-8 h-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Products List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum produto ainda</h3>
              <p className="text-muted-foreground mb-4">Crie seu primeiro curso, mentoria ou assinatura.</p>
              <Button onClick={() => navigate('/academy/professor/produtos/novo')}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {products.map(product => {
              const TypeIcon = typeIcons[product.type] || Package;
              return (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/academy/professor/produtos/${product.id}/editar`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <TypeIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
                          <Badge variant={statusVariant[product.status]}>
                            {statusLabels[product.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {typeLabels[product.type]}
                          {product.price_cents != null && ` · R$ ${(product.price_cents / 100).toFixed(2)}`}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
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

export default TeacherDashboard;
