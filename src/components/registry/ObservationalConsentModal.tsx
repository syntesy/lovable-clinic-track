/**
 * ObservationalConsentModal - Modal de consentimento LGPD
 * 
 * Termo de consentimento digital para inclusão no Registro Observacional.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  FlaskConical, 
  Lock, 
  Database,
  FileCheck,
  AlertCircle
} from 'lucide-react';

interface ObservationalConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => Promise<void>;
  onDecline: () => void;
  loading?: boolean;
}

export function ObservationalConsentModal({
  open,
  onOpenChange,
  onAccept,
  onDecline,
  loading = false
}: ObservationalConsentModalProps) {
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [dataUseAccepted, setDataUseAccepted] = useState(false);

  const canAccept = lgpdAccepted && dataUseAccepted;

  const handleAccept = async () => {
    if (!canAccept) return;
    await onAccept();
    setLgpdAccepted(false);
    setDataUseAccepted(false);
  };

  const handleDecline = () => {
    onDecline();
    setLgpdAccepted(false);
    setDataUseAccepted(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <FlaskConical className="h-5 w-5" />
            <DialogTitle className="text-lg">Registro Clínico Observacional</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            Contribua para a construção de evidência científica em medicina regenerativa.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4 py-4">
            {/* O que é o registro */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                O que é o Registro Observacional?
              </h4>
              <p className="text-sm text-muted-foreground">
                Um sistema para coleta de dados clínicos reais (Real-World Data) de forma 
                estruturada e anonimizada, permitindo análises científicas futuras sobre 
                eficácia de procedimentos regenerativos.
              </p>
            </div>

            {/* Garantias de privacidade */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Garantias de Privacidade:</h4>
              
              <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
                <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Anonimização Total</p>
                  <p className="text-xs text-green-700">
                    Nome, CPF, email, telefone e endereço NUNCA são armazenados no registro.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                <Lock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Conformidade LGPD</p>
                  <p className="text-xs text-blue-700">
                    Todos os dados são tratados conforme a Lei Geral de Proteção de Dados.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
                <FileCheck className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-800">Consentimento Reversível</p>
                  <p className="text-xs text-purple-700">
                    O consentimento pode ser retirado a qualquer momento, e os dados 
                    serão excluídos de análises futuras.
                  </p>
                </div>
              </div>
            </div>

            {/* Dados coletados */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Dados Coletados (Anonimizados):</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Faixa etária e sexo</li>
                <li>Diagnóstico e região anatômica</li>
                <li>Tipo de procedimento realizado</li>
                <li>Resultados laboratoriais (se disponíveis)</li>
                <li>Evolução clínica (dor, função)</li>
                <li>Eventos adversos (se ocorrerem)</li>
              </ul>
            </div>

            {/* Aviso importante */}
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                A participação é <strong>voluntária</strong> e não afeta o tratamento clínico.
              </p>
            </div>

            {/* Checkboxes de aceite */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="lgpd-consent"
                  checked={lgpdAccepted}
                  onCheckedChange={(checked) => setLgpdAccepted(checked === true)}
                  className="mt-1"
                />
                <label 
                  htmlFor="lgpd-consent" 
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  Confirmo ciência de que dados clínicos <strong>anonimizados</strong> poderão 
                  ser utilizados para fins científicos, conforme a LGPD.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="data-use-consent"
                  checked={dataUseAccepted}
                  onCheckedChange={(checked) => setDataUseAccepted(checked === true)}
                  className="mt-1"
                />
                <label 
                  htmlFor="data-use-consent" 
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  Autorizo a inclusão dos dados deste caso no Registro Observacional 
                  e compreendo que posso retirar o consentimento a qualquer momento.
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleDecline}
            disabled={loading}
            className="sm:order-1"
          >
            Agora não
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!canAccept || loading}
            className="sm:order-2"
          >
            {loading ? 'Processando...' : 'Aceitar e Participar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
