import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Microscope, 
  ArrowLeft,
  Search,
  Filter,
  FileText,
  BookOpen,
  Award
} from "lucide-react";

// Placeholder data until we connect to curadoria_articles
const mockArticles = [
  {
    id: '1',
    title: 'Eficácia do PRP em Osteoartrite de Joelho: Revisão Sistemática',
    authors: 'Silva et al.',
    journal: 'Journal of Regenerative Medicine',
    year: 2024,
    evidence_level: 'Nível I',
    technique: 'PRP',
    pathology: 'Osteoartrite',
    summary: 'Revisão sistemática demonstrando eficácia superior do PRP em comparação ao ácido hialurônico.',
  },
  {
    id: '2',
    title: 'Células-Tronco Mesenquimais no Tratamento de Lesões Tendinosas',
    authors: 'Santos et al.',
    journal: 'Stem Cell Research',
    year: 2024,
    evidence_level: 'Nível II',
    technique: 'Células-Tronco',
    pathology: 'Tendinopatia',
    summary: 'Estudo randomizado sobre uso de MSCs em tendinopatias crônicas.',
  },
  {
    id: '3',
    title: 'Protocolos de Fotobiomodulação para Regeneração Tecidual',
    authors: 'Oliveira et al.',
    journal: 'Photomedicine and Laser Surgery',
    year: 2023,
    evidence_level: 'Nível II',
    technique: 'Fotobiomodulação',
    pathology: 'Cicatrização',
    summary: 'Parâmetros ideais de LLLT para otimização da regeneração.',
  },
];

const techniques = ['PRP', 'Células-Tronco', 'Fotobiomodulação', 'Ondas de Choque', 'Proloterapia'];
const evidenceLevels = ['Nível I', 'Nível II', 'Nível III', 'Nível IV', 'Nível V'];

const AppliedSciencePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnique, setSelectedTechnique] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const filteredArticles = mockArticles.filter(article => {
    const matchesSearch = searchTerm === "" || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.authors.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTechnique = selectedTechnique === "all" || article.technique === selectedTechnique;
    const matchesLevel = selectedLevel === "all" || article.evidence_level === selectedLevel;
    return matchesSearch && matchesTechnique && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Microscope className="w-3 h-3 mr-1" />
              Ciência Aplicada
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Biblioteca de Ciência Aplicada
            </h1>
            <p className="text-lg text-muted-foreground">
              Artigos científicos curados e comentados por especialistas, 
              conectando evidência à prática clínica diária.
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
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={selectedTechnique}
                onValueChange={setSelectedTechnique}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Técnica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as técnicas</SelectItem>
                  {techniques.map(tech => (
                    <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedLevel}
                onValueChange={setSelectedLevel}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Nível de evidência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  {evidenceLevels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros de busca.
              </p>
              <Button variant="outline" onClick={() => { 
                setSearchTerm(""); 
                setSelectedTechnique("all"); 
                setSelectedLevel("all"); 
              }}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {filteredArticles.length} artigo{filteredArticles.length !== 1 ? 's' : ''} encontrado{filteredArticles.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <Card 
                    key={article.id}
                    className="cursor-pointer hover:shadow-lg transition-all group"
                  >
                    <CardContent className="py-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="secondary">
                              {article.technique}
                            </Badge>
                            <Badge variant="outline">
                              {article.pathology}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Award className="w-3 h-3" />
                              {article.evidence_level}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {article.authors} • {article.journal} • {article.year}
                          </p>
                          <p className="text-muted-foreground">
                            {article.summary}
                          </p>
                        </div>
                        <div className="flex md:flex-col gap-2 md:justify-center">
                          <Button variant="outline" size="sm" className="gap-2">
                            <BookOpen className="w-4 h-4" />
                            Ler análise
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Ver original
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-8">
              <Microscope className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                Quer sugerir um artigo?
              </h3>
              <p className="text-muted-foreground mb-6">
                Contribua com a comunidade sugerindo artigos relevantes 
                para análise e curadoria clínica.
              </p>
              <Button variant="outline">
                Sugerir artigo
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AppliedSciencePage;
