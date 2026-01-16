import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  ArrowRight,
  Search,
  Stethoscope,
  Award
} from "lucide-react";
import { useMentors } from "@/hooks/useMentors";

const MentorsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: mentors = [], isLoading } = useMentors();

  const filteredMentors = mentors.filter(m => 
    searchTerm === "" || 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Award className="w-3 h-3 mr-1" />
              Mentores
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Mentores REGEN Academy
            </h1>
            <p className="text-lg text-muted-foreground">
              Conheça os especialistas que lideram a formação em Medicina Regenerativa.
              Profissionais com experiência clínica comprovada e dedicação ao ensino.
            </p>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Mentors Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="text-center">
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4" />
                    <div className="h-6 bg-muted rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum mentor encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente buscar por outro nome ou especialidade.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Limpar busca
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 'es' : ''} encontrado{filteredMentors.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMentors.map((mentor) => (
                  <Card 
                    key={mentor.id}
                    className="cursor-pointer hover:shadow-lg transition-all group text-center"
                    onClick={() => navigate(`/mentores/${mentor.slug}`)}
                  >
                    <CardHeader className="pb-2">
                      {mentor.is_featured && (
                        <Badge variant="secondary" className="w-fit mx-auto mb-2">
                          <Award className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                      <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all">
                        <AvatarImage src={mentor.photo_url || undefined} />
                        <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                          {mentor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {mentor.name}
                      </CardTitle>
                      <CardDescription className="flex items-center justify-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        {mentor.specialty}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {mentor.headline && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {mentor.headline}
                        </p>
                      )}
                      {mentor.clinical_areas && mentor.clinical_areas.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mb-4">
                          {mentor.clinical_areas.slice(0, 3).map((area, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button size="sm" variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                        Ver perfil
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
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

export default MentorsPage;
