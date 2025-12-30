import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, Lock, Eye, FileText, Users, Database, 
  CheckCircle2, AlertTriangle, ArrowLeft, Scale
} from "lucide-react";

export default function RegistryGovernance() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Governança do Registry</h1>
          <p className="text-sm text-muted-foreground">
            Princípios de privacidade, segurança e uso de dados
          </p>
        </div>
      </div>

      {/* Mission */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            Finalidade do Orthoregen Clinical Registry™
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            O Orthoregen Clinical Registry™ é uma iniciativa <strong className="text-foreground">científica e estatística</strong> destinada a:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Gerar evidências sobre terapias ortobiológicas (PRP, PRF, BMAC)</li>
            <li>Identificar padrões clínicos para melhoria contínua da prática</li>
            <li>Contribuir para pesquisas agregadas e publicações científicas</li>
            <li>Aprimorar algoritmos de triagem e score clínico</li>
          </ul>
        </CardContent>
      </Card>

      {/* Privacy Principles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-green-600" />
            Princípios de Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Dados Anonimizados</p>
                <p className="text-sm text-muted-foreground">
                  Nenhum identificador pessoal (nome, CPF, telefone, email) é incluído nos dados do Registry.
                  Apenas informações clínicas anonimizadas são coletadas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Dados Agregados</p>
                <p className="text-sm text-muted-foreground">
                  Parceiros institucionais (incluindo Orthoregen) têm acesso apenas a estatísticas 
                  agregadas. Nenhum dado individual de paciente ou profissional é compartilhado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Threshold Mínimo</p>
                <p className="text-sm text-muted-foreground">
                  Gráficos e estatísticas só são exibidos quando há um número mínimo de casos (≥10), 
                  prevenindo reidentificação por amostra pequena.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Consentimento Informado</p>
                <p className="text-sm text-muted-foreground">
                  A participação no Registry é opcional. O profissional registra a decisão do paciente 
                  (aceitar ou recusar) de forma não-bloqueante ao fluxo clínico.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LGPD Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-blue-600" />
            Conformidade com LGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            O Orthoregen Clinical Registry™ opera em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018):
          </p>
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">Art. 7º, IV</Badge>
              <span className="text-muted-foreground">Pesquisa científica com dados anonimizados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">Art. 12º</Badge>
              <span className="text-muted-foreground">Dados anonimizados não são considerados dados pessoais</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">Art. 13º</Badge>
              <span className="text-muted-foreground">Pesquisa em saúde pública</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-purple-600" />
            Controle de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Profissionais de Saúde</p>
                <p className="text-sm text-muted-foreground">
                  Acesso aos seus próprios pacientes e casos. Não visualizam dados de outros profissionais.
                  Veem apenas selo de elegibilidade (badge discreto) quando aplicável.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded">
                <Shield className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Administradores</p>
                <p className="text-sm text-muted-foreground">
                  Acesso ao dashboard de dados agregados. Não têm acesso a dados individuais 
                  de pacientes ou prontuários.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Parceiros Institucionais (Orthoregen)</p>
                <p className="text-sm text-muted-foreground">
                  Acesso restrito a dashboards agregados. Proibido acesso a pacientes, médicos, 
                  prontuários ou casos individuais.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-orange-600" />
            Auditoria e Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Todas as ações no Registry são registradas para fins de auditoria:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Acessos ao dashboard institucional (quem, quando, de onde)</li>
            <li>Mudanças de consentimento (aceite ou recusa, com timestamp)</li>
            <li>Exportações de dados agregados</li>
            <li>Alterações em configurações de governança</li>
          </ul>
        </CardContent>
      </Card>

      {/* Independence */}
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Independência Científica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            O Orthoregen Clinical Registry™ mantém <strong className="text-foreground">total independência científica</strong>:
          </p>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Nenhuma influência comercial no Score ou Curadoria Científica</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Algoritmos de triagem baseados exclusivamente em evidências</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Publicações científicas seguem padrões ICMJE</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pb-8">
        <p>Última atualização: Dezembro 2024</p>
        <p className="mt-1">
          Em caso de dúvidas, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}
