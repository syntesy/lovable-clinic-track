import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Play, Loader2, Clock, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Watchlist {
  id: string;
  name: string;
  query: string;
  frequency: string;
  last_run_at: string | null;
  last_run_results: any;
  created_at: string;
}

export default function AcademyWatchlistsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showResults, setShowResults] = useState<Watchlist | null>(null);
  const [newName, setNewName] = useState("");
  const [newQuery, setNewQuery] = useState("");
  const [newFreq, setNewFreq] = useState("weekly");

  const { data: watchlists = [], isLoading } = useQuery({
    queryKey: ["academy-watchlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_pubmed_watchlists" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Watchlist[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("academy_pubmed_watchlists" as any)
        .insert({ name: newName, query: newQuery, frequency: newFreq, created_by: user?.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-watchlists"] });
      setShowCreate(false);
      setNewName("");
      setNewQuery("");
      toast.success("Watchlist criada.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const runMutation = useMutation({
    mutationFn: async (watchlistId: string) => {
      const { data, error } = await supabase.functions.invoke("academy-watchlist-run", {
        body: { watchlist_id: watchlistId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["academy-watchlists"] });
      toast.success(`Concluído: ${data.imported} importados de ${data.total_found} encontrados.`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Monitoramento PubMed</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Watchlists para importação automática de papers novos via PubMed E-utilities.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Watchlist
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : watchlists.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Nenhuma watchlist criada. Crie sua primeira para monitorar publicações.
          </div>
        ) : (
          <div className="space-y-3">
            {watchlists.map((wl) => (
              <Card key={wl.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{wl.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Search className="w-3 h-3" /> {wl.query}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{wl.frequency === "daily" ? "Diário" : "Semanal"}</Badge>
                        {wl.last_run_at && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Última: {new Date(wl.last_run_at).toLocaleDateString("pt-BR")}
                          </Badge>
                        )}
                        {wl.last_run_results && (
                          <Badge variant="outline" className="text-xs">
                            {wl.last_run_results.imported || 0} importados
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {wl.last_run_results && (
                        <Button variant="outline" size="sm" onClick={() => setShowResults(wl)} className="gap-1">
                          <Eye className="w-3 h-3" /> Resultados
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runMutation.mutate(wl.id)}
                        disabled={runMutation.isPending}
                        className="gap-1"
                      >
                        {runMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Rodar Agora
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Watchlist PubMed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: PRP Joelho 2024-2025" />
            </div>
            <div>
              <Label>Query PubMed</Label>
              <Input value={newQuery} onChange={(e) => setNewQuery(e.target.value)} placeholder='Ex: "platelet-rich plasma" AND "knee osteoarthritis"' />
              <p className="text-xs text-muted-foreground mt-1">Use sintaxe PubMed padrão (AND, OR, MeSH terms).</p>
            </div>
            <div>
              <Label>Frequência</Label>
              <Select value={newFreq} onValueChange={setNewFreq}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!newName.trim() || !newQuery.trim() || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={!!showResults} onOpenChange={(o) => !o && setShowResults(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resultados: {showResults?.name}</DialogTitle>
          </DialogHeader>
          {showResults?.last_run_results && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{showResults.last_run_results.total_found}</p>
                  <p className="text-xs text-muted-foreground">Encontrados</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{showResults.last_run_results.new_found}</p>
                  <p className="text-xs text-muted-foreground">Novos</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{showResults.last_run_results.imported}</p>
                  <p className="text-xs text-muted-foreground">Importados</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{showResults.last_run_results.errors}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </div>
              {showResults.last_run_results.imported_papers?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Papers Importados</h4>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {showResults.last_run_results.imported_papers.map((p: any, i: number) => (
                      <div key={i} className="rounded border p-2">
                        <p className="text-xs text-foreground line-clamp-2">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground">PMID: {p.pmid}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
