/**
 * QA SCORE — Cenários de Teste
 * 
 * Página administrativa para validação manual do fluxo SCORE.
 * NÃO ALTERA O MOTOR — APENAS TESTES.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldCheck, 
  TestTube,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Database
} from "lucide-react";
import { ActionStateMap } from "@/components/RegenEvaluation/ActionStateMap";
import { CriticalLabsChecklist } from "@/components/RegenEvaluation/CriticalLabsChecklist";

interface QAScenario {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expected: string;
  evidenceField?: boolean;
}

const QA_SCENARIOS: QAScenario[] = [
  {
    id: "cenario-1",
    title: "Cenário 1 — Ataque via DevTools (S1)",
    description: "Verificar que o backend recusa ações de score quando status != S2",
    steps: [
      "Abrir caso em estado S1 (avaliação clínica completa, exames pendentes)",
      "Abrir DevTools (F12) → Console",
      "Tentar chamar a função de geração de score diretamente",
      "Verificar resposta e logs"
    ],
    expected: "Backend retorna erro/recusa. Log de auditoria registra tentativa bloqueada.",
    evidenceField: true
  },
  {
    id: "cenario-2",
    title: "Cenário 2 — Labs Incompletos",
    description: "Verificar que areAllCriticalLabsValid() retorna false quando faltam exames",
    steps: [
      "Abrir caso em estado S1",
      "Inserir apenas 3 dos 6 exames críticos (ex: hemoglobina, leucócitos, plaquetas)",
      "Salvar exames",
      "Verificar estado e ações disponíveis"
    ],
    expected: "areAllCriticalLabsValid() = false. UI mantém ações de score bloqueadas. Checklist mostra exames pendentes.",
    evidenceField: true
  },
  {
    id: "cenario-3",
    title: "Cenário 3 — Lab sem Data",
    description: "Verificar que exame com valor mas sem data não é considerado válido",
    steps: [
      "Abrir caso em estado S1",
      "Inserir todos os 6 exames com valores",
      "Deixar campo de data vazio em pelo menos 1 exame",
      "Salvar e verificar"
    ],
    expected: "Ações bloqueadas. Checklist mostra 'Pendente' com indicação de data faltando.",
    evidenceField: true
  },
  {
    id: "cenario-4",
    title: "Cenário 4 — Lab sem USE",
    description: "Verificar que exame com valor + data mas sem DIE = USE não valida",
    steps: [
      "Abrir caso em estado S1",
      "Inserir todos os 6 exames com valor + data",
      "Forçar status DIE diferente de USE em pelo menos 1 exame (ex: REPEAT)",
      "Verificar estado"
    ],
    expected: "Ações de score bloqueadas. Checklist mostra status incorreto.",
    evidenceField: true
  },
  {
    id: "cenario-5",
    title: "Cenário 5 — STALE Detection",
    description: "Verificar que alteração de dados após score mostra aviso de desatualizado",
    steps: [
      "Criar caso e avançar até S3 (score gerado)",
      "Editar dados clínicos ou exames (trigger canonical_updated_at)",
      "Verificar UI"
    ],
    expected: "Banner STALE exibido com data explícita. Ações críticas mostram aviso. Botão 'Recalcular' disponível.",
    evidenceField: true
  },
  {
    id: "cenario-6",
    title: "Cenário 6 — Exames Válidos (Condição S2)",
    description: "Verificar que todos os exames válidos liberam transição para S2",
    steps: [
      "Abrir caso em estado S1",
      "Inserir TODOS os 6 exames críticos com: valor + data + DIE = USE",
      "Salvar exames",
      "Verificar transição de estado"
    ],
    expected: "Sistema reconhece condições de S2. Ações de S2 são liberadas (Gerar Score Definitivo habilitado).",
    evidenceField: true
  },
  {
    id: "cenario-7",
    title: "Cenário 7 — Fluxo Completo S0 → S3",
    description: "Simular fluxo completo de avaliação",
    steps: [
      "Iniciar triagem nova (S0)",
      "Preencher avaliação clínica completa → transição para S1",
      "Inserir todos os 6 exames válidos → transição para S2",
      "Clicar 'Gerar Score Definitivo' → transição para S3",
      "Verificar cards de resultado e logs de auditoria"
    ],
    expected: "Fluxo completo funciona. Botões habilitam/desabilitam corretamente. Logs gerados em cada etapa.",
    evidenceField: true
  }
];

export default function AdminScoreQA() {
  const [checkedScenarios, setCheckedScenarios] = useState<Record<string, boolean>>({});
  const [evidences, setEvidences] = useState<Record<string, string>>({});

  const handleToggle = (id: string) => {
    setCheckedScenarios(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEvidenceChange = (id: string, value: string) => {
    setEvidences(prev => ({ ...prev, [id]: value }));
  };

  const completedCount = Object.values(checkedScenarios).filter(Boolean).length;

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TestTube className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              QA SCORE — Cenários de Teste
            </h1>
            <p className="text-sm text-muted-foreground">
              Motor: <code className="bg-muted px-1 rounded">regen_engine_v1.0.0</code> | 
              Status: ❄️ CONGELADO
            </p>
          </div>
        </div>
        <Badge variant={completedCount === QA_SCENARIOS.length ? "default" : "secondary"}>
          {completedCount}/{QA_SCENARIOS.length} concluídos
        </Badge>
      </div>

      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Testes Manuais</AlertTitle>
        <AlertDescription>
          Esta página é para documentação de testes manuais. Os checkboxes são locais (não persistidos).
          Registre evidências (URLs de prints) nos campos apropriados.
        </AlertDescription>
      </Alert>

      {/* Componentes Visuais de Referência */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Checklist de Exames Críticos
            </CardTitle>
            <CardDescription className="text-xs">
              Exemplo visual (simulado)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CriticalLabsChecklist 
              labsValidated={{
                hemoglobin: { status: "USE", value: 14.5, date: "2026-01-02" },
                leukocytes: { status: "USE", value: 7200, date: "2026-01-02" },
                platelets: { status: "REPEAT", value: null, date: "" },
                crp: { status: "USE", value: 2.1, date: "2026-01-02" },
                hba1c: { status: "REQUEST", value: null, date: "" },
                ferritin: { status: "USE", value: 85, date: "2026-01-02" }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Mapa de Ações por Estado
            </CardTitle>
            <CardDescription className="text-xs">
              Derivado de getAllowedActions()
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionStateMap compact />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Cenários */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">7 Cenários de QA Obrigatórios</h2>
        
        {QA_SCENARIOS.map((scenario, index) => (
          <Card 
            key={scenario.id} 
            className={checkedScenarios[scenario.id] ? "border-green-500 bg-green-50/50 dark:bg-green-950/10" : ""}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id={scenario.id}
                  checked={checkedScenarios[scenario.id] || false}
                  onCheckedChange={() => handleToggle(scenario.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {checkedScenarios[scenario.id] ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    {scenario.title}
                  </CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pl-10">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">PASSOS:</Label>
                <ol className="text-sm mt-1 space-y-1 list-decimal list-inside text-muted-foreground">
                  {scenario.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              
              <div className="bg-muted/50 p-2 rounded">
                <Label className="text-xs font-semibold text-muted-foreground">ESPERADO:</Label>
                <p className="text-sm mt-1">{scenario.expected}</p>
              </div>

              {scenario.evidenceField && (
                <div>
                  <Label htmlFor={`evidence-${scenario.id}`} className="text-xs font-semibold text-muted-foreground">
                    EVIDÊNCIA (URL / Print):
                  </Label>
                  <Input
                    id={`evidence-${scenario.id}`}
                    placeholder="Cole URL do print ou anotação..."
                    value={evidences[scenario.id] || ""}
                    onChange={(e) => handleEvidenceChange(scenario.id, e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onde verificar logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Onde Verificar Logs de Recusa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para confirmar que tentativas de ataque foram bloqueadas e registradas:
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm block">
{`-- Query para verificar logs de auditoria
SELECT 
  created_at,
  action,
  user_id,
  record_id,
  additional_info
FROM audit_logs
WHERE action IN ('SCORE_FINAL', 'RECALC', 'EXAMS_REQUEST', 'PRE_REPORT')
  AND (additional_info->>'regen_case_status')::text != 'S2'
ORDER BY created_at DESC
LIMIT 20;`}
            </code>
          </div>
          <div className="space-y-2 text-sm">
            <p><strong>Campos esperados em cada log:</strong></p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li><code>action</code> — tipo de ação (SCORE_FINAL, RECALC, etc.)</li>
              <li><code>record_id</code> — ID do screening</li>
              <li><code>user_id</code> — usuário que tentou a ação</li>
              <li><code>additional_info.regen_case_status</code> — status no momento</li>
              <li><code>additional_info.canonical_hash</code> — hash para rastreabilidade</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Alert className="bg-muted/50 border-muted-foreground/20">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-xs text-muted-foreground">
          <strong>NOTA:</strong> Esta página é apenas para fins de QA interno. 
          Os testes não alteram o motor clínico, regras ou comportamento do sistema.
        </AlertDescription>
      </Alert>
    </div>
  );
}
