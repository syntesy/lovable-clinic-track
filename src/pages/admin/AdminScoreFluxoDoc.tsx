/**
 * Documentação Técnica do Fluxo SCORE — REGENAPP
 * 
 * Página administrativa para documentação interna do motor clínico.
 * NÃO ALTERA O MOTOR — APENAS DOCUMENTAÇÃO.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Zap,
  FileText,
  ClipboardList,
  RefreshCw,
  Database,
  Lock,
  Eye
} from "lucide-react";
import { 
  REGEN_CASE_STATUS_MAP, 
  REQUIRED_CRITICAL_LABS, 
  CRITICAL_LAB_LABELS,
  getAllowedActions,
  RegenCaseStatus
} from "@/types/regen-case-status";
import { ActionStateMap } from "@/components/RegenEvaluation/ActionStateMap";

const STATES: RegenCaseStatus[] = ["S0", "S1", "S2", "S3"];

export default function AdminScoreFluxoDoc() {
  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Documentação Técnica — Fluxo SCORE REGENAPP
          </h1>
          <p className="text-sm text-muted-foreground">
            Motor: <code className="bg-muted px-1 rounded">regen_engine_v1.0.0</code> | 
            Ruleset: <code className="bg-muted px-1 rounded">regen_rules_v1</code> | 
            Status: ❄️ CONGELADO
          </p>
        </div>
      </div>

      <Alert className="border-destructive bg-destructive/5">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertTitle className="text-destructive">AVISO: Motor Clínico Congelado</AlertTitle>
        <AlertDescription>
          O motor clínico, regras, pesos, domínios e thresholds estão congelados e não podem ser alterados.
          Esta documentação é apenas informativa.
        </AlertDescription>
      </Alert>

      {/* Seção 1 — Estados e Definições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Seção 1 — Estados e Definições
          </CardTitle>
          <CardDescription>
            Máquina de estados S0 → S1 → S2 → S3 (fonte única: <code>regen-case-status.ts</code>)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {STATES.map(status => {
              const info = REGEN_CASE_STATUS_MAP[status];
              const colorMap = {
                blue: "bg-blue-100 text-blue-800 border-blue-200",
                yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
                green: "bg-green-100 text-green-800 border-green-200",
                red: "bg-primary/10 text-primary border-primary/20"
              };
              return (
                <div key={status} className={`p-4 rounded-lg border ${colorMap[info.color]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono">{status}</Badge>
                    <span className="font-semibold">{info.label}</span>
                  </div>
                  <p className="text-sm">{info.description || info.provisionalLabel}</p>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold">Transições de Estado:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li><strong>S0 → S1:</strong> Avaliação clínica profissional completa (queixa + anamnese + exame físico + diagnóstico)</li>
              <li><strong>S1 → S2:</strong> Todos os 6 exames críticos com valor + data + DIE = USE</li>
              <li><strong>S2 → S3:</strong> Clique em "Gerar Score Definitivo" (executa runRegenEngine)</li>
            </ul>
          </div>

          <div className="bg-muted/50 p-3 rounded text-sm">
            <strong>Função responsável:</strong>{" "}
            <code>computeCaseStatus()</code> em <code>src/types/regen-case-status.ts</code>
          </div>
        </CardContent>
      </Card>

      {/* Seção 2 — Exames Críticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Seção 2 — Exames Críticos
          </CardTitle>
          <CardDescription>
            Lista exata dos exames obrigatórios para liberação do Score Definitivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            {REQUIRED_CRITICAL_LABS.map(lab => (
              <div key={lab} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <Badge variant="secondary" className="font-mono text-xs">{lab}</Badge>
                <span className="text-sm">{CRITICAL_LAB_LABELS[lab]}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold">Requisitos para Exame Válido:</h4>
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm block whitespace-pre">
{`areAllCriticalLabsValid(labsValidated) {
  return REQUIRED_CRITICAL_LABS.every(lab => {
    const labData = labsValidated[lab];
    return (
      labData.status === "USE" &&   // DIE validou como utilizável
      labData.value !== null &&      // Valor numérico presente
      labData.date !== ""            // Data de coleta presente
    );
  });
}`}
              </code>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <strong>Arquivo:</strong> <code>src/types/regen-case-status.ts</code> linhas 103-120
          </div>
        </CardContent>
      </Card>

      {/* Seção 3 — STALE Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Seção 3 — Detecção de STALE (Resultado Desatualizado)
          </CardTitle>
          <CardDescription>
            Mecanismo para detectar quando os dados foram alterados após geração do score
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm block">
{`isStale = canonical_updated_at > engine_computed_at`}
            </code>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Impacto na UI:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>Banner de aviso amarelo/laranja é exibido</li>
              <li>Mostra data do exame que causou o STALE</li>
              <li>Botão "Recalcular" é habilitado em S3</li>
              <li>Score definitivo NÃO é recalculado automaticamente</li>
            </ul>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Regra:</strong> O sistema NUNCA recalcula automaticamente. 
              Recálculo requer ação explícita do profissional.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground">
            <strong>Implementação:</strong> <code>AvaliacaoRegenapp.tsx</code> linhas 95-98
          </div>
        </CardContent>
      </Card>

      {/* Seção 4 — Backend Fail-Safe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Seção 4 — Validação de Backend (Fail-Safe)
          </CardTitle>
          <CardDescription>
            Proteção contra manipulação via DevTools ou chamadas diretas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm block whitespace-pre">
{`// Validação dupla: UI + Backend
if (currentStatus !== "S2") {
  // UI bloqueia o botão
  return;
}

// Validação de backend (após buscar dados atualizados do DB)
const dbStatus = currentScreening.regen_case_status;
if (dbStatus !== "S2") {
  toast.error("Operação recusada pelo backend");
  console.error("[BACKEND_BLOCK] Score recusado");
  return;
}`}
            </code>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Proteções:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>UI: Botões desabilitados/ocultos conforme estado</li>
              <li>Frontend: Validação antes de chamar a ação</li>
              <li>Backend: Validação do status no banco antes de executar</li>
              <li>Logs: Todas as tentativas são registradas na auditoria</li>
            </ul>
          </div>

          <div className="text-sm text-muted-foreground">
            <strong>Implementação:</strong> <code>AvaliacaoRegenapp.tsx</code> linhas 113-137
          </div>
        </CardContent>
      </Card>

      {/* Seção 5 — Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Seção 5 — Logs de Auditoria
          </CardTitle>
          <CardDescription>
            Sistema de registro de eventos críticos para rastreabilidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Eventos Registrados:</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                { action: "SCORE_FINAL", desc: "Geração do Score Definitivo" },
                { action: "RECALC", desc: "Recálculo após alteração de dados" },
                { action: "EXAMS_REQUEST", desc: "Solicitação de exames laboratoriais" },
                { action: "PRE_REPORT", desc: "Geração de pré-relatório de triagem" }
              ].map(e => (
                <div key={e.action} className="p-2 bg-muted/50 rounded flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{e.action}</Badge>
                  <span className="text-sm">{e.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold">Campos em Cada Log:</h4>
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm block whitespace-pre">
{`{
  action: "SCORE_FINAL",
  tableName: "prp_screenings",
  recordId: "screening_id",
  additionalInfo: {
    engine_version: "regen_engine_v1.0.0",
    ruleset_version: "regen_rules_v1",
    regen_case_status: "S3",
    canonical_hash: "hash_base64_32chars"
  }
}`}
              </code>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Papel do canonical_hash:</h4>
            <p className="text-sm text-muted-foreground">
              O <code>canonical_hash</code> é uma representação compacta (base64, 32 chars) do objeto canonical 
              no momento da ação. Permite verificar posteriormente se os dados de entrada foram alterados 
              entre ações e garante rastreabilidade completa.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <strong>Onde visualizar logs:</strong>{" "}
                Tabela <code>audit_logs</code> no banco de dados. 
                Filtrar por <code>action</code> = SCORE_FINAL, RECALC, EXAMS_REQUEST, PRE_REPORT
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <strong>Hook:</strong> <code>useAuditLog.ts</code> → função <code>logAction()</code>
          </div>
        </CardContent>
      </Card>

      {/* Mapa de Ações por Estado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Mapa de Ações por Estado
          </CardTitle>
          <CardDescription>
            Visualização dinâmica derivada de <code>getAllowedActions()</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionStateMap />
        </CardContent>
      </Card>

      {/* Footer */}
      <Alert className="bg-muted/50 border-muted-foreground/20">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-xs text-muted-foreground">
          <strong>AVISO LEGAL:</strong> Esta documentação é interna e destinada apenas a desenvolvedores e administradores.
          O REGENAPP é um sistema de suporte informacional. Não prescreve, não decide e não substitui o julgamento clínico.
        </AlertDescription>
      </Alert>
    </div>
  );
}
