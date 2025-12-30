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
import { Shield, FlaskConical } from 'lucide-react';

interface RegistryConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  patientName?: string;
}

export function RegistryConsentModal({
  open,
  onOpenChange,
  onAccept,
  onDecline,
  patientName
}: RegistryConsentModalProps) {
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!lgpdAccepted) return;
    setLoading(true);
    try {
      await onAccept();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await onDecline();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <FlaskConical className="h-5 w-5" />
            <DialogTitle className="text-lg">Contribuir para Evidência Clínica</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            {patientName ? `Caso de ${patientName}` : 'Este caso'} pode contribuir para iniciativas científicas com dados anonimizados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Privacidade garantida:</strong> Os dados são anonimizados e agregados. 
                Nenhuma informação individual é compartilhada.
              </p>
            </div>
          </div>

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
              Confirmo ciência de que dados clínicos anonimizados poderão ser utilizados 
              para fins científicos, conforme a LGPD.
            </label>
          </div>
        </div>

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
            disabled={!lgpdAccepted || loading}
            className="sm:order-2"
          >
            {loading ? 'Salvando...' : 'Participar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
