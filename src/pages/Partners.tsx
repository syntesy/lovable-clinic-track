import { useState, useMemo } from "react";
import { 
  Search, 
  Info, 
  ExternalLink,
  Building2,
  Tag,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Types
interface Partner {
  id: string;
  name: string;
  description: string;
  categories: string[];
  logoUrl?: string;
  siteUrl: string;
  accessCount: number;
}

// Categories
const CATEGORIES = [
  "Todos",
  "Ortobiológicos / PRP",
  "Agulhas e materiais invasivos",
  "Ultrassom e acessórios",
  "Descartáveis / assepsia",
  "Equipamentos",
  "Suplementação",
];

// Mock data
const MOCK_PARTNERS: Partner[] = [
  {
    id: "1",
    name: "Parceiro 1",
    description: "Insumos e materiais para procedimentos guiados",
    categories: ["Ortobiológicos / PRP", "Descartáveis / assepsia"],
    siteUrl: "https://parceiro1.com.br",
    accessCount: 150,
  },
  {
    id: "2",
    name: "Parceiro 2",
    description: "Agulhas, cânulas e materiais invasivos",
    categories: ["Agulhas e materiais invasivos"],
    siteUrl: "https://parceiro2.com.br",
    accessCount: 120,
  },
  {
    id: "3",
    name: "Parceiro 3",
    description: "Acessórios e consumíveis para ultrassonografia",
    categories: ["Ultrassom e acessórios"],
    siteUrl: "https://parceiro3.com.br",
    accessCount: 95,
  },
  {
    id: "4",
    name: "Parceiro 4",
    description: "Equipamentos para reabilitação avançada",
    categories: ["Equipamentos"],
    siteUrl: "https://parceiro4.com.br",
    accessCount: 80,
  },
  {
    id: "5",
    name: "Parceiro 5",
    description: "Suplementação e recovery clínico",
    categories: ["Suplementação"],
    siteUrl: "https://parceiro5.com.br",
    accessCount: 65,
  },
];

// Sort options
type SortOption = "recommended" | "most_accessed" | "a_z";

const Partners = () => {
  const { toast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    partner: Partner | null;
  }>({ open: false, partner: null });

  // Filter and sort partners
  const filteredPartners = useMemo(() => {
    let result = [...MOCK_PARTNERS];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (partner) =>
          partner.name.toLowerCase().includes(query) ||
          partner.description.toLowerCase().includes(query) ||
          partner.categories.some((cat) => cat.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== "Todos") {
      result = result.filter((partner) =>
        partner.categories.includes(selectedCategory)
      );
    }

    // Sort
    switch (sortOption) {
      case "most_accessed":
        result.sort((a, b) => b.accessCount - a.accessCount);
        break;
      case "a_z":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "recommended":
      default:
        // Keep original order for recommended
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, sortOption]);

  // Handle partner click
  const handlePartnerClick = (partner: Partner) => {
    setConfirmDialog({ open: true, partner });
  };

  // Confirm and open partner site
  const confirmOpenSite = () => {
    if (!confirmDialog.partner) return;

    const partner = confirmDialog.partner;

    // Log event (in a real app, this would be sent to analytics)
    const event = {
      event: "partner_click",
      partner_name: partner.name,
      categories: partner.categories,
      search_term: searchQuery || null,
      active_category_filter: selectedCategory,
      timestamp: new Date().toISOString(),
    };
    console.log("Partner click event:", event);

    // Open partner site
    window.open(partner.siteUrl, "_blank", "noopener,noreferrer");

    // Show toast confirmation
    toast({
      title: "Redirecionando...",
      description: `Lembre-se de usar o cupom REGENAPP no site do ${partner.name}.`,
    });

    setConfirmDialog({ open: false, partner: null });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("Todos");
    setSortOption("recommended");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">
          Não foi possível carregar os parceiros.
        </p>
        <Button onClick={() => setHasError(false)}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Parceiros</h1>
        <p className="text-muted-foreground">
          Materiais e insumos recomendados para prática clínica
        </p>
      </div>

      {/* Info Card - Always Visible */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Info className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Importante</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Os benefícios, descontos e condições especiais apresentados nesta página 
                somente são válidos quando a compra é realizada diretamente no site do 
                parceiro utilizando o cupom:
              </p>
              <div className="inline-block">
                <Badge 
                  variant="default" 
                  className="text-base px-4 py-1.5 font-bold bg-primary hover:bg-primary"
                >
                  REGENAPP
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Compras realizadas sem o uso do cupom não garantem desconto nem vínculo com o REGENAPP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar parceiro ou tipo de produto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-card border-border"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Category Chips */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex-shrink-0 w-full sm:w-48">
          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="h-10 bg-card">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="recommended">Recomendados</SelectItem>
              <SelectItem value="most_accessed">Mais acessados</SelectItem>
              <SelectItem value="a_z">A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Partners Grid */}
      {filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPartners.map((partner) => (
            <Card 
              key={partner.id} 
              className="bg-card border-border hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  {/* Logo and Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      {partner.logoUrl ? (
                        <img 
                          src={partner.logoUrl} 
                          alt={partner.name}
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {partner.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {partner.description}
                      </p>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {partner.categories.map((category) => (
                      <Badge 
                        key={category} 
                        variant="secondary"
                        className="text-xs bg-muted text-muted-foreground"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {category}
                      </Badge>
                    ))}
                  </div>

                  {/* Coupon Badge */}
                  <div className="mb-4">
                    <Badge 
                      variant="outline" 
                      className="border-primary text-primary font-medium"
                    >
                      Cupom: REGENAPP
                    </Badge>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handlePartnerClick(partner)}
                    className="w-full mt-auto"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar site
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground text-center">
            Nenhum parceiro encontrado para os filtros selecionados.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}

      {/* Transparency Footer */}
      <div className="pt-8 pb-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Alguns links podem gerar comissionamento para o REGENAPP. O uso do cupom 
          REGENAPP é obrigatório para garantir benefícios e rastreio das compras.
        </p>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog({ open, partner: null })}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Atenção
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Utilize o cupom <strong className="text-primary">REGENAPP</strong> no 
              site do parceiro para garantir o desconto e o rastreio da compra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOpenSite}>
              Continuar para o site
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Partners;
