import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, Calendar, Clock, FileText, Send, Check, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface PatientOperationalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  accessData: {
    id: string;
    patient_id: string;
    login_surname: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    patients: {
      id: string;
      full_name: string;
    } | null;
  } | null;
  onToggleActive: (accessId: string, isActive: boolean) => void;
}

export function PatientOperationalDrawer({ 
  isOpen, 
  onClose, 
  accessData,
  onToggleActive
}: PatientOperationalDrawerProps) {
  // Fetch follow-up count and last follow-up for this patient
  const { data: followupStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['patient-followup-stats', accessData?.patient_id],
    queryFn: async () => {
      if (!accessData?.patient_id) return null;

      const { data, error } = await supabase
        .from('procedure_followups')
        .select('id, created_at, completed_at, status')
        .eq('patient_id', accessData.patient_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalSent = data?.filter(f => f.status === 'completed').length || 0;
      const lastFollowup = data?.find(f => f.status === 'completed');
      
      return {
        totalSent,
        lastFollowupDate: lastFollowup?.completed_at || null,
        hasAnyFollowup: totalSent > 0
      };
    },
    enabled: !!accessData?.patient_id && isOpen
  });

  if (!accessData) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não disponível';
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getFollowupStatus = () => {
    if (!accessData.is_active) {
      return { label: 'Não enviado', variant: 'secondary' as const, icon: X };
    }
    if (followupStats?.hasAnyFollowup) {
      return { label: 'Enviado', variant: 'default' as const, icon: Check };
    }
    return { label: 'Pendente', variant: 'outline' as const, icon: AlertCircle };
  };

  const followupStatus = getFollowupStatus();

  const handleResendLink = () => {
    // Copy login info to clipboard as a simple "resend" action
    const loginInfo = `Portal do Paciente - Login: ${accessData.login_surname}`;
    navigator.clipboard.writeText(loginInfo);
    toast.success('Informações de login copiadas para a área de transferência');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Resumo Operacional do Paciente
          </SheetTitle>
          <SheetDescription>
            Acesso e participação no acompanhamento clínico autorreferido.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Informações Básicas
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Nome do paciente</p>
                  <p className="font-medium">{accessData.patients?.full_name}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 mt-0.5" /> {/* Spacer */}
                  <div>
                    <p className="text-sm text-muted-foreground">Status do acesso ao Portal</p>
                  </div>
                </div>
                {accessData.is_active ? (
                  <Badge className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <X className="h-3 w-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Data de criação do acesso</p>
                  <p className="font-medium">{formatDate(accessData.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Último login do paciente</p>
                  <p className="font-medium">{formatDate(accessData.last_login_at)}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Participação no Follow-up */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Participação no Follow-up
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total de follow-ups enviados</p>
                  <p className="font-medium">
                    {isLoadingStats ? '...' : followupStats?.totalSent || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Data do último follow-up</p>
                  <p className="font-medium">
                    {isLoadingStats ? '...' : formatDate(followupStats?.lastFollowupDate || null)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4" /> {/* Spacer */}
                  <div>
                    <p className="text-sm text-muted-foreground">Status do último follow-up</p>
                  </div>
                </div>
                <Badge variant={followupStatus.variant}>
                  <followupStatus.icon className="h-3 w-3 mr-1" />
                  {followupStatus.label}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Ações Operacionais */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Ações
            </h4>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleResendLink}
              >
                <Send className="h-4 w-4 mr-2" />
                Copiar informações de acesso
              </Button>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor="toggle-active" className="cursor-pointer">
                  {accessData.is_active ? 'Desativar acesso' : 'Ativar acesso'}
                </Label>
                <Switch
                  id="toggle-active"
                  checked={accessData.is_active}
                  onCheckedChange={(checked) => onToggleActive(accessData.id, checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Operacional */}
        <SheetFooter className="mt-4">
          <div className="w-full p-3 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Este painel apresenta apenas informações operacionais sobre o acesso do paciente ao Portal do Paciente.
              Não contém dados clínicos, análises, interpretações ou recomendações.
            </p>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
