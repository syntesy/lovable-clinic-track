import { Sparkles, Target, AlertTriangle, TrendingUp } from "lucide-react";

export function WizardStep0() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Bem-vindo ao FISIOREGEN SCORE</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Esta ferramenta calcula a prontidão biológica do paciente para tratamentos ortobiológicos, 
          gerando um score de 0 a 100 baseado em 3 domínios principais.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Target className="h-5 w-5" />
            <span className="font-semibold">Domínio A</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Fatores sistêmicos: HbA1c, tabagismo, plaquetas, PCR e medicações.
          </p>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Máx: 35 pontos</p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">Domínio B</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Prontidão tecidual: integridade, substrato, estágio biológico e tentativas prévias.
          </p>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Máx: 45 pontos</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Domínio C</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Execução e adesão: logística, adesão estimada e realismo de expectativas.
          </p>
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Máx: 20 pontos</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <p className="font-medium text-amber-700 dark:text-amber-400">Bloqueios Automáticos</p>
          <p className="text-sm text-muted-foreground">
            Condições específicas podem bloquear o tratamento independentemente do score, 
            como infecções ativas, janelas críticas de medicamentos ou lesões estruturais graves.
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Clique em <strong>"Próximo"</strong> para iniciar a avaliação.
      </p>
    </div>
  );
}
