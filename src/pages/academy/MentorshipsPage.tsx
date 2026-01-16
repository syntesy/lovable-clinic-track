import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  ArrowRight,
  Search,
  Filter,
  MapPin,
  Video,
  Clock
} from "lucide-react";
import { useMentorships, type MentorshipFilters } from "@/hooks/useMentorships";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const clinicalAreas = [
  "Ortopedia",
  "Fisioterapia",
  "Dermatologia",
  "Medicina Esportiva",
  "Reumatologia",
  "Neurologia",
  "Medicina Estética",
];

const MentorshipsPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<MentorshipFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { data: mentorships = [], isLoading } = useMentorships(filters);

  const filteredMentorships = mentorships.filter(m => 
    searchTerm === "" || 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.mentor?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFilterChange = (key: keyof MentorshipFilters, value: string) => {
    if (value === "all") {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Users className="w-3 h-3 mr-1" />
              Mentorias
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Mentorias Clínicas
            </h1>
            <p className="text-lg text-muted-foreground">
              Conecte-se com especialistas renomados para discutir casos, 
              aprofundar conhecimentos e acelerar sua evolução profissional.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mentorias ou mentores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={filters.clinical_area || "all"}
                onValueChange={(v) => handleFilterChange('clinical_area', v)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Área clínica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  {clinicalAreas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.type || "all"}
                onValueChange={(v) => handleFilterChange('type', v)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="coletiva">Coletiva</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.modality || "all"}
                onValueChange={(v) => handleFilterChange('modality', v)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMentorships.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma mentoria encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou volte mais tarde para novas mentorias.
              </p>
              <Button variant="outline" onClick={() => { setFilters({}); setSearchTerm(""); }}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {filteredMentorships.length} mentoria{filteredMentorships.length !== 1 ? 's' : ''} encontrada{filteredMentorships.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentorships.map((mentorship) => (
                  <Card 
                    key={mentorship.id}
                    className="cursor-pointer hover:shadow-lg transition-all group flex flex-col"
                    onClick={() => navigate(`/mentorias/${mentorship.slug}`)}
                  >
                    <CardHeader className="flex-grow">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <Badge variant="secondary">
                          {mentorship.clinical_area || "Geral"}
                        </Badge>
                        <div className="flex gap-1">
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
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2 mt-3">
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
                      <CardDescription className="line-clamp-2 mt-2">
                        {mentorship.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {mentorship.duration_minutes} min
                        </div>
                        {mentorship.sessions && mentorship.sessions.length > 0 && (
                          <div className="flex items-center gap-1 text-primary">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(mentorship.sessions[0].scheduled_at), "dd MMM", { locale: ptBR })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
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
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default MentorshipsPage;
