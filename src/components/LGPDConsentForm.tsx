import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Loader2, FileText, Shield, Eye, Trash2, Share2 } from "lucide-react";

interface ConsentFormProps {
  patientId: string;
  patientName: string;
  onConsentAccepted: () => void;
  onCancel?: () => void;
}

const CONSENT_TEXT = `
TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS
(Em conformidade com a Lei Geral de Proteção de Dados - LGPD, Lei nº 13.709/2018)

1. IDENTIFICAÇÃO DO CONTROLADOR
O responsável pelo tratamento dos seus dados pessoais é o profissional de saúde que utiliza este sistema de prontuário eletrônico para gerenciamento de informações clínicas.

2. DADOS PESSOAIS COLETADOS
Para a prestação adequada dos serviços de saúde, serão coletados e tratados os seguintes dados:
• Dados de identificação: nome completo, data de nascimento, gênero, CPF, endereço, telefone, e-mail
• Dados de saúde: histórico médico, diagnósticos, exames, tratamentos, evolução clínica, imagens médicas
• Dados sensíveis: informações sobre condições de saúde física e mental

3. FINALIDADES DO TRATAMENTO
Seus dados pessoais serão utilizados para:
• Prestação de serviços de saúde e acompanhamento clínico
• Elaboração de prontuário médico conforme exigência legal (CFM)
• Comunicação sobre tratamentos e agendamentos
• Faturamento e gestão administrativa
• Cumprimento de obrigações legais e regulatórias

4. BASE LEGAL
O tratamento dos seus dados é realizado com base em:
• Seu consentimento expresso (Art. 7º, I e Art. 11, I da LGPD)
• Tutela da saúde (Art. 7º, VIII e Art. 11, II, f da LGPD)
• Cumprimento de obrigação legal (Art. 7º, II da LGPD)

5. COMPARTILHAMENTO DE DADOS
Seus dados poderão ser compartilhados com:
• Laboratórios e clínicas para realização de exames
• Outros profissionais de saúde envolvidos no seu tratamento
• Órgãos reguladores, quando exigido por lei
• Operadoras de planos de saúde, se aplicável

6. PERÍODO DE RETENÇÃO
Seus dados serão mantidos pelo período mínimo de 20 (vinte) anos após o último atendimento, conforme determinação do Conselho Federal de Medicina (Resolução CFM nº 1.821/2007).

7. SEUS DIREITOS
Você tem direito a:
• Confirmar a existência de tratamento dos seus dados
• Acessar seus dados pessoais
• Corrigir dados incompletos ou desatualizados
• Solicitar anonimização ou bloqueio de dados desnecessários
• Solicitar portabilidade dos dados
• Revogar este consentimento (observadas as obrigações legais de guarda)
• Obter informações sobre compartilhamento de dados

8. MEDIDAS DE SEGURANÇA
Implementamos medidas técnicas e administrativas para proteger seus dados, incluindo:
• Criptografia de dados em trânsito e em repouso
• Controle de acesso com autenticação segura
• Logs de auditoria de todas as operações
• Backup regular e seguro das informações

9. CONTATO
Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento dos seus dados, entre em contato diretamente com o profissional de saúde responsável.
`;

const CONSENT_ITEMS = [
  {
    id: "data_collection",
    label: "Coleta de Dados Pessoais",
    description: "Autorizo a coleta e armazenamento dos meus dados pessoais e de saúde para fins de tratamento médico.",
    icon: FileText,
    required: true,
  },
  {
    id: "data_treatment",
    label: "Tratamento de Dados Sensíveis",
    description: "Autorizo o tratamento de dados sensíveis (informações de saúde) para elaboração do prontuário e acompanhamento clínico.",
    icon: Shield,
    required: true,
  },
  {
    id: "data_access",
    label: "Acesso ao Prontuário",
    description: "Estou ciente de que terei acesso às informações do meu prontuário mediante solicitação.",
    icon: Eye,
    required: true,
  },
  {
    id: "data_retention",
    label: "Período de Retenção",
    description: "Estou ciente de que meus dados serão mantidos por no mínimo 20 anos conforme exigência legal do CFM.",
    icon: Trash2,
    required: true,
  },
  {
    id: "data_sharing",
    label: "Compartilhamento de Dados",
    description: "Autorizo o compartilhamento de dados com outros profissionais de saúde envolvidos no meu tratamento, quando necessário.",
    icon: Share2,
    required: false,
  },
];

export default function LGPDConsentForm({
  patientId,
  patientName,
  onConsentAccepted,
  onCancel,
}: ConsentFormProps) {
  const { logConsentAccepted } = useAuditLog();
  const [acceptedItems, setAcceptedItems] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const requiredItems = CONSENT_ITEMS.filter(item => item.required);
  const allRequiredAccepted = requiredItems.every(item => acceptedItems[item.id]);
  const canSubmit = hasReadTerms && allRequiredAccepted;

  const handleItemChange = (itemId: string, checked: boolean) => {
    setAcceptedItems(prev => ({ ...prev, [itemId]: checked }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Registrar cada consentimento aceito
      const consentsToInsert = Object.entries(acceptedItems)
        .filter(([, accepted]) => accepted)
        .map(([itemId]) => ({
          patient_id: patientId,
          consent_type: itemId,
          consent_text: CONSENT_TEXT,
          accepted: true,
          accepted_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          witness_user_id: user?.id,
        }));

      const { error } = await supabase
        .from("patient_consents")
        .insert(consentsToInsert);

      if (error) throw error;

      // Registrar log de auditoria
      await logConsentAccepted(patientId, "LGPD_FULL_CONSENT");

      toast.success("Termo de consentimento registrado com sucesso!");
      onConsentAccepted();
    } catch (error) {
      console.error("Erro ao registrar consentimento:", error);
      toast.error("Erro ao registrar consentimento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Termo de Consentimento LGPD
          </CardTitle>
          <CardDescription>
            Paciente: <span className="font-medium text-foreground">{patientName}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
          {/* Termo completo */}
          <div className="p-4 border-b">
            <Label className="text-sm font-medium mb-2 block">
              Leia o termo completo antes de prosseguir:
            </Label>
            <ScrollArea className="h-48 rounded-md border bg-muted/30 p-4">
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">
                {CONSENT_TEXT}
              </pre>
            </ScrollArea>
            <div className="flex items-center space-x-2 mt-3">
              <Checkbox
                id="read_terms"
                checked={hasReadTerms}
                onCheckedChange={(checked) => setHasReadTerms(checked === true)}
              />
              <Label htmlFor="read_terms" className="text-sm">
                Li e compreendi o termo de consentimento acima
              </Label>
            </div>
          </div>

          {/* Items de consentimento */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {CONSENT_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                    acceptedItems[item.id]
                      ? "bg-primary/5 border-primary/20"
                      : "bg-background border-border"
                  }`}
                >
                  <Checkbox
                    id={item.id}
                    checked={acceptedItems[item.id] || false}
                    onCheckedChange={(checked) => handleItemChange(item.id, checked === true)}
                    disabled={!hasReadTerms}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={item.id} className="font-medium">
                        {item.label}
                        {item.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Botões */}
          <div className="p-4 border-t flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              * Campos obrigatórios
            </p>
            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancelar
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="bg-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Aceitar e Continuar"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
