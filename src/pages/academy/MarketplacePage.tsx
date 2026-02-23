import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublishedProducts } from "@/hooks/useAcademyProducts";
import { Search, BookOpen, Users, Repeat, ShoppingBag, ArrowRight } from "lucide-react";

const typeIcons: Record<string, any> = { course: BookOpen, mentorship: Users, subscription: Repeat };
const typeLabels: Record<string, string> = { course: 'Curso', mentorship: 'Mentoria', subscription: 'Assinatura' };

const MarketplacePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { data: products = [], isLoading } = usePublishedProducts({ type: typeFilter, search: search || undefined });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-3">
            <ShoppingBag className="w-3 h-3 mr-1" /> Marketplace
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Explore o Marketplace Academy
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Cursos, mentorias e assinaturas de especialistas em Medicina Regenerativa
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="course">Cursos</TabsTrigger>
            <TabsTrigger value="mentorship">Mentorias</TabsTrigger>
            <TabsTrigger value="subscription">Assinaturas</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground">Tente ajustar seus filtros ou volte mais tarde.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => {
              const TypeIcon = typeIcons[product.type] || BookOpen;
              return (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => navigate(`/academy/marketplace/${product.id}`)}
                >
                  {product.cover_image_url && (
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeLabels[product.type]}
                      </Badge>
                      {product.category && <Badge variant="outline" className="text-xs">{product.category}</Badge>}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {product.title}
                    </CardTitle>
                    {product.subtitle && (
                      <CardDescription className="line-clamp-1">{product.subtitle}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-lg font-bold text-foreground">
                        {product.price_cents != null
                          ? product.price_cents === 0
                            ? 'Gratuito'
                            : `R$ ${(product.price_cents / 100).toFixed(2)}`
                          : 'Sob consulta'}
                      </span>
                      <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        Ver detalhes <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
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

export default MarketplacePage;
