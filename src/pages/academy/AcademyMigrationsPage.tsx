import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Play, Eye, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EvidenceMethodSeal } from "@/components/academy/EvidenceMethodSeal";

interface MigrationResult {
  processed: number;
  updated: number;
  failed: number;
  paper_ids: string[];
  results?: { paper_id: string; status: string; error?: string }[];
  dry_run?: boolean;
  would_process?: number;
  papers?: { id: string; title: string }[];
}

export default function AcademyMigrationsPage() {
  const navigate = useNavigate();
  const [batchSize, setBatchSize] = useState(10);
  const [dryRun, setDryRun] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<MigrationResult | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("academy-migrate-reghen-method", {
        body: { batch_size: batchSize, dry_run: dryRun },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLastResult(data as MigrationResult);
      if (dryRun) {
        toast.info(`Dry run: ${data.would_process} papers seriam processados.`);
      } else {
        toast.success(`Migração concluída: ${data.updated} atualizados, ${data.failed} falhas.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na migração.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">Migração Reghen Evidence Method™</h1>
          <EvidenceMethodSeal />
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Re-curar papers publicados que não possuem as 7 camadas estruturadas do método.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-[200px]">
                <Label>Batch size</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={dryRun} onCheckedChange={setDryRun} id="dry-run" />
                <Label htmlFor="dry-run" className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Dry run (simulação)
                </Label>
              </div>
            </div>

            {!dryRun && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Modo real: os papers serão re-curados e atualizados no banco de dados.
                </p>
              </div>
            )}

            <Button onClick={handleRun} disabled={isRunning} className="gap-2">
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : dryRun ? (
                <Eye className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {dryRun ? "Simular migração" : "Executar migração"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {lastResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Resultado {lastResult.dry_run && <Badge variant="outline">Dry Run</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastResult.dry_run ? (
                <>
                  <p className="text-sm text-foreground">
                    <strong>{lastResult.would_process}</strong> paper(s) seriam processados.
                  </p>
                  {lastResult.papers && lastResult.papers.length > 0 && (
                    <div className="space-y-1.5">
                      {lastResult.papers.map((p) => (
                        <div key={p.id} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="text-primary">•</span>
                          <span className="truncate">{p.title}</span>
                          <Badge variant="outline" className="text-[9px] shrink-0">{p.id.slice(0, 8)}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{lastResult.processed}</p>
                      <p className="text-xs text-muted-foreground">Processados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-400">{lastResult.updated}</p>
                      <p className="text-xs text-muted-foreground">Atualizados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{lastResult.failed}</p>
                      <p className="text-xs text-muted-foreground">Falhas</p>
                    </div>
                  </div>

                  {lastResult.results && lastResult.results.length > 0 && (
                    <div className="space-y-1.5">
                      {lastResult.results.map((r) => (
                        <div key={r.paper_id} className="text-sm flex items-center gap-2">
                          {r.status === "updated" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          )}
                          <span className="text-muted-foreground truncate">{r.paper_id.slice(0, 8)}</span>
                          {r.error && <span className="text-xs text-red-400 truncate">{r.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
