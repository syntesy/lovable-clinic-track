import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Brain, Search, Microscope, FolderOpen, Rss, MessageSquare } from "lucide-react";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Reuse existing page content as tab panels
import AcademyLibraryContent from "@/components/academy/tabs/ExplorarTabContent";
import AplicarTabContent from "@/components/academy/tabs/AplicarTabContent";
import ColecoesTabContent from "@/components/academy/tabs/ColecoesTabContent";
import FeedTabContent from "@/components/academy/tabs/FeedTabContent";
import PerguntarTabContent from "@/components/academy/tabs/PerguntarTabContent";

const VALID_TABS = ["explorar", "aplicar", "colecoes", "feed", "perguntar"] as const;
type TabValue = (typeof VALID_TABS)[number];

export default function EvidenceCentralPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const currentTab: TabValue = VALID_TABS.includes(rawTab as TabValue) ? (rawTab as TabValue) : "explorar";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/academy/home")}
              className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Badge variant="secondary" className="mb-4">
              <Brain className="w-3 h-3 mr-1" />
              Central de Evidência
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Central de Evidência Clínica
            </h1>
            <p className="text-lg text-muted-foreground">
              Evidência científica organizada, aplicada e conectada à prática clínica.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <div className="border-b bg-background sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <TabsList className="h-12 bg-transparent p-0 gap-1">
              <TabsTrigger value="explorar" className="gap-1.5 data-[state=active]:bg-primary/10">
                <Search className="w-3.5 h-3.5" /> Explorar
              </TabsTrigger>
              <TabsTrigger value="aplicar" className="gap-1.5 data-[state=active]:bg-primary/10">
                <Microscope className="w-3.5 h-3.5" /> Aplicar
              </TabsTrigger>
              <TabsTrigger value="colecoes" className="gap-1.5 data-[state=active]:bg-primary/10">
                <FolderOpen className="w-3.5 h-3.5" /> Coleções
              </TabsTrigger>
              <TabsTrigger value="feed" className="gap-1.5 data-[state=active]:bg-primary/10">
                <Rss className="w-3.5 h-3.5" /> Feed
              </TabsTrigger>
              <TabsTrigger value="perguntar" className="gap-1.5 data-[state=active]:bg-primary/10">
                <MessageSquare className="w-3.5 h-3.5" /> Perguntar
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="explorar" className="mt-0">
          <AcademyLibraryContent />
        </TabsContent>
        <TabsContent value="aplicar" className="mt-0">
          <AplicarTabContent />
        </TabsContent>
        <TabsContent value="colecoes" className="mt-0">
          <ColecoesTabContent />
        </TabsContent>
        <TabsContent value="feed" className="mt-0">
          <FeedTabContent />
        </TabsContent>
        <TabsContent value="perguntar" className="mt-0">
          <PerguntarTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
