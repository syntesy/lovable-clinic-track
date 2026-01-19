/**
 * Admin QA Seed Data Page
 * 
 * Generates synthetic clinical data for testing:
 * - k-anonymity (n>=5)
 * - Benchmark seals (n>=10)
 * - Cluster distributions
 * - Outcomes and deltas
 * 
 * ONLY for dev/staging environments.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Database, 
  Play, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Beaker,
  BarChart3,
  Shield,
  Users,
  Clock,
  RefreshCw
} from "lucide-react";
import { useSeedData, type SeedConfig } from "@/hooks/useSeedData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminSeedQA() {
  const { generateSeedData, clearSyntheticData, fetchMetadata, isGenerating, progress, metadata } = useSeedData();
  
  const [config, setConfig] = useState<SeedConfig>({
    includeM1: true,
    includeM6: false,
    includeM12: false,
  });

  // Fetch metadata on mount
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const handleGenerate = async () => {
    await generateSeedData(config);
  };

  const handleClear = async () => {
    if (window.confirm('Tem certeza que deseja remover TODOS os dados sintéticos? Esta ação não pode ser desfeita.')) {
      await clearSyntheticData();
    }
  };

  const progressPercent = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  // Check if in production
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('lovable.app') && !hostname.includes('preview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Beaker className="h-6 w-6 text-primary" />
          Gerador de Dados Sintéticos (QA)
        </h1>
        <p className="text-muted-foreground mt-1">
          Crie dados fictícios para testar dashboards, k-anonimato e selos de performance
        </p>
      </div>

      {/* Production Warning */}
      {isProduction && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Bloqueado em Produção</AlertTitle>
          <AlertDescription>
            A geração de dados sintéticos está desabilitada em ambiente de produção.
            Use apenas em ambientes de desenvolvimento ou staging.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Status Card */}
      <Card className={metadata.totalSyntheticPatients > 0 ? "border-primary/50" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Status Atual
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchMetadata}
              disabled={isGenerating}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Última geração</p>
                <p className="font-medium text-sm">
                  {metadata.lastGeneration 
                    ? format(new Date(metadata.lastGeneration), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : "Nunca gerado"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Pacientes sintéticos</p>
                <p className="font-medium text-sm">
                  {metadata.totalSyntheticPatients} 
                  {metadata.totalSyntheticPatients > 0 && (
                    <Badge variant="secondary" className="ml-2">Ativo</Badge>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Atendimentos sintéticos</p>
                <p className="font-medium text-sm">{metadata.totalSyntheticAttendances}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            O que será gerado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">10 clusters com n=4</p>
                <p className="text-xs text-muted-foreground">
                  Devem ficar ocultos pelo k-anonimato
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">10 clusters com n=5</p>
                <p className="text-xs text-muted-foreground">
                  Devem aparecer no dashboard coletivo
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">10 clusters com n=12</p>
                <p className="text-xs text-muted-foreground">
                  Habilitam benchmark e selos de performance
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total de casos</p>
              <p className="font-semibold text-lg">200</p>
            </div>
            <div>
              <p className="text-muted-foreground">Casos com penalidade</p>
              <p className="font-semibold text-lg">~25%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Timepoints</p>
              <p className="font-semibold text-lg">Baseline + M3</p>
            </div>
            <div>
              <p className="text-muted-foreground">Marcador</p>
              <p className="font-semibold text-lg">"Sintético QA"</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuração
          </CardTitle>
          <CardDescription>
            Selecione os timepoints adicionais para gerar outcomes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="baseline" 
                checked={true} 
                disabled 
              />
              <Label htmlFor="baseline" className="text-sm">
                Baseline <Badge variant="secondary" className="ml-1">Obrigatório</Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="m1" 
                checked={config.includeM1}
                onCheckedChange={(checked) => setConfig(c => ({ ...c, includeM1: !!checked }))}
              />
              <Label htmlFor="m1" className="text-sm">M1 (1 mês)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="m3" 
                checked={true} 
                disabled 
              />
              <Label htmlFor="m3" className="text-sm">
                M3 (3 meses) <Badge variant="secondary" className="ml-1">Obrigatório</Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="m6" 
                checked={config.includeM6}
                onCheckedChange={(checked) => setConfig(c => ({ ...c, includeM6: !!checked }))}
              />
              <Label htmlFor="m6" className="text-sm">M6 (6 meses)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="m12" 
                checked={config.includeM12}
                onCheckedChange={(checked) => setConfig(c => ({ ...c, includeM12: !!checked }))}
              />
              <Label htmlFor="m12" className="text-sm">M12 (12 meses)</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.phase}</span>
                <span className="font-medium">{progress.current} / {progress.total}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progressPercent}% concluído
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {progress.errors.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Erros durante a geração ({progress.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {progress.errors.slice(0, 10).map((error, i) => (
                <p key={i} className="text-xs text-muted-foreground font-mono">
                  {error}
                </p>
              ))}
              {progress.errors.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  ... e mais {progress.errors.length - 10} erros
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || isProduction}
              className="flex-1"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Gerar 200 Casos Sintéticos
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleClear}
              disabled={isGenerating || isProduction}
              variant="destructive"
              size="lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Dados Sintéticos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Checklist de Validação
          </CardTitle>
          <CardDescription>
            Após gerar os dados, verifique os seguintes cenários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">Dashboard Coletivo (/insights)</p>
              <ul className="space-y-1 text-muted-foreground pl-4">
                <li>• Clusters com n&lt;5 não aparecem</li>
                <li>• Clusters com n≥5 exibem métricas</li>
                <li>• Δ Dor e Δ Função calculados corretamente</li>
                <li>• Resposta 30%/50% funciona</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Performance (/insights/performance)</p>
              <ul className="space-y-1 text-muted-foreground pl-4">
                <li>• Selos aparecem apenas para n≥10</li>
                <li>• Selo 🟢 para acima da média</li>
                <li>• Selo 🟡 para dentro da média</li>
                <li>• Selo 🔴 para abaixo da média</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Penalidades</p>
              <ul className="space-y-1 text-muted-foreground pl-4">
                <li>• ~25% com status "eligible_with_penalty"</li>
                <li>• Motivos: PRP desconhecido ou AINE recente</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Segurança</p>
              <ul className="space-y-1 text-muted-foreground pl-4">
                <li>• Dados marcados como "Sintético QA"</li>
                <li>• Sem dados reais de pacientes</li>
                <li>• Bloqueado em produção</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
