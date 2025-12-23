import { ComputedResult, FisioRegenFormData } from "@/types/fisioregen-score";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Copy, RotateCcw, AlertTriangle, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ScoreResultProps {
  result: ComputedResult;
  formData: FisioRegenFormData;
  onReset: () => void;
}

const statusConfig = {
  NAO_APTO_NO_MOMENTO: { color: "bg-gray-500", label: "NÃO APTO NO MOMENTO", icon: XCircle },
  NAO_APTO: { color: "bg-red-500", label: "NÃO APTO", icon: XCircle },
  APTO_COM_ALTO_RISCO: { color: "bg-amber-500", label: "APTO COM ALTO RISCO", icon: AlertCircle },
  APTO: { color: "bg-green-500", label: "APTO", icon: CheckCircle },
  EXCELENTE_CANDIDATO: { color: "bg-emerald-500", label: "EXCELENTE CANDIDATO", icon: CheckCircle },
};

export function ScoreResult({ result, formData, onReset }: ScoreResultProps) {
  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify({ formData, result }, null, 2));
    toast({ title: "JSON copiado!", description: "Dados copiados para a área de transferência." });
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(result.mensagem_profissional);
    toast({ title: "Texto copiado!", description: "Resumo copiado para a área de transferência." });
  };

  return (
    <div className="container mx-auto max-w-3xl py-6 px-4 space-y-6">
      {/* Header com Score */}
      <Card className={`${result.bloqueio ? "border-gray-400" : ""}`}>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <StatusIcon className={`h-12 w-12 ${result.bloqueio ? "text-gray-500" : result.status === "NAO_APTO" ? "text-red-500" : result.status === "APTO_COM_ALTO_RISCO" ? "text-amber-500" : "text-green-500"}`} />
          </div>
          <CardTitle className="text-2xl">{config.label}</CardTitle>
          <p className="text-4xl font-bold mt-2">{result.biological_readiness_score}/100</p>
        </CardHeader>
        <CardContent>
          <Progress value={result.biological_readiness_score} className={`h-4 ${config.color}`} />
          <p className="text-center text-muted-foreground mt-4">{result.mensagem_paciente}</p>
        </CardContent>
      </Card>

      {/* Domínios */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="pt-4 text-center">
            <p className="text-sm font-medium text-blue-600">Domínio A</p>
            <p className="text-2xl font-bold">{result.domains.A}/35</p>
            <Progress value={(result.domains.A / 35) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="pt-4 text-center">
            <p className="text-sm font-medium text-emerald-600">Domínio B</p>
            <p className="text-2xl font-bold">{result.domains.B}/45</p>
            <Progress value={(result.domains.B / 45) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-950/30">
          <CardContent className="pt-4 text-center">
            <p className="text-sm font-medium text-purple-600">Domínio C</p>
            <p className="text-2xl font-bold">{result.domains.C}/20</p>
            <Progress value={(result.domains.C / 20) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Bloqueios */}
      {result.triggered_blocks.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Bloqueios Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.triggered_blocks.map((block) => (
                <li key={block} className="text-sm bg-destructive/10 p-2 rounded">{block}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Flags */}
      {result.triggered_flags.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Flags de Atenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.triggered_flags.map((flag) => (
                <span key={flag} className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">{flag}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={handleCopyJSON} variant="outline" className="gap-2">
          <Copy className="h-4 w-4" /> Copiar JSON
        </Button>
        <Button onClick={handleCopyText} variant="outline" className="gap-2">
          <Copy className="h-4 w-4" /> Copiar Texto
        </Button>
        <Button onClick={onReset} variant="secondary" className="gap-2">
          <RotateCcw className="h-4 w-4" /> Nova Avaliação
        </Button>
      </div>
    </div>
  );
}
