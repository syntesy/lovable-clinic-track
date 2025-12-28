import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePatientLimit } from '@/hooks/usePatientLimit';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, UserPlus, Search, Crown, AlertTriangle, Check, X, Loader2 } from 'lucide-react';

export default function PatientsManage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: limitInfo, isLoading: isLoadingLimit } = usePatientLimit();

  // Buscar pacientes do profissional
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, cpf, email, phone')
        .order('full_name');

      if (error) throw error;
      return data || [];
    }
  });

  // Buscar acessos ao portal
  const { data: portalAccess, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['patient-portal-access'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('patient_portal_access')
        .select(`
          id,
          patient_id,
          login_surname,
          is_active,
          last_login_at,
          created_at,
          patients (
            id,
            full_name,
            cpf
          )
        `)
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Criar acesso ao portal
  const createAccessMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados do paciente
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('full_name, cpf')
        .eq('id', patientId)
        .single();

      if (patientError || !patient) throw new Error('Paciente não encontrado');
      if (!patient.cpf) throw new Error('Paciente não possui CPF cadastrado');

      // Extrair sobrenome
      const nameParts = patient.full_name.trim().split(' ');
      const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

      // Limpar CPF e gerar hash
      const cleanCpf = patient.cpf.replace(/\D/g, '');
      
      // Usar a função do banco para gerar hash
      const { data: hashResult } = await supabase.rpc('generate_integrity_hash', {
        data: cleanCpf
      });

      const { error } = await supabase.from('patient_portal_access').insert({
        patient_id: patientId,
        professional_id: user.id,
        login_surname: surname.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        cpf_hash: hashResult
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este paciente já possui acesso ao portal');
        }
        throw error;
      }

      // Registrar evento
      await supabase.from('patient_events').insert({
        patient_id: patientId,
        professional_id: user.id,
        event_name: 'patient_created',
        event_data: { timestamp: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-portal-access'] });
      queryClient.invalidateQueries({ queryKey: ['patient-limit'] });
      setIsDialogOpen(false);
      setSelectedPatientId('');
      toast.success('Acesso criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Toggle ativo/inativo
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ accessId, isActive }: { accessId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('patient_portal_access')
        .update({ is_active: isActive })
        .eq('id', accessId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-portal-access'] });
      queryClient.invalidateQueries({ queryKey: ['patient-limit'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    }
  });

  const handleCreateAccess = async () => {
    if (!selectedPatientId) {
      toast.error('Selecione um paciente');
      return;
    }

    setIsSubmitting(true);
    await createAccessMutation.mutateAsync(selectedPatientId);
    setIsSubmitting(false);
  };

  // Filtrar pacientes que não têm acesso ao portal
  const patientsWithoutAccess = patients?.filter(
    p => !portalAccess?.some(a => a.patient_id === p.id)
  ) || [];

  const filteredAccess = portalAccess?.filter(
    a => a.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Verificar se plano permite acesso
  if (!isLoadingLimit && limitInfo?.currentPlan === 'basic') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <Card className="border-amber-500/50">
            <CardHeader className="text-center">
              <Crown className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <CardTitle>Área do Paciente</CardTitle>
              <CardDescription>
                A Área do Paciente está disponível a partir do plano Premium.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/subscription')}>
                Fazer upgrade
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestão de Pacientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie o acesso dos pacientes ao portal
            </p>
          </div>
        </div>

        {/* Contador de Pacientes */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pacientes ativos</p>
                  <p className="text-sm text-muted-foreground">
                    {limitInfo?.isUnlimited ? (
                      'Plano PRO - Ilimitado'
                    ) : (
                      `Plano ${limitInfo?.currentPlan?.toUpperCase()}`
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {limitInfo?.activePatients || 0}
                  {!limitInfo?.isUnlimited && (
                    <span className="text-muted-foreground font-normal">
                      {' '}/ {limitInfo?.maxPatients}
                    </span>
                  )}
                </p>
                {limitInfo?.isUnlimited && (
                  <Badge className="bg-primary">Ilimitado</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerta de limite atingido */}
        {!limitInfo?.canAddPatient && !limitInfo?.isUnlimited && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Limite atingido</AlertTitle>
            <AlertDescription>
              Limite de {limitInfo?.maxPatients} pacientes atingido no plano Premium.
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2"
                onClick={() => navigate('/subscription')}
              >
                Fazer upgrade para o plano PRO para pacientes ilimitados.
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Barra de ações */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!limitInfo?.canAddPatient}>
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Acesso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Acesso ao Portal</DialogTitle>
                <DialogDescription>
                  Selecione um paciente para criar acesso à Área do Paciente.
                  O paciente usará o sobrenome e CPF para fazer login.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientsWithoutAccess.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nenhum paciente disponível
                        </SelectItem>
                      ) : (
                        patientsWithoutAccess.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.full_name}
                            {!patient.cpf && ' (sem CPF)'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPatientId && (
                  <Alert>
                    <AlertDescription>
                      O paciente fará login com:<br />
                      <strong>Sobrenome:</strong> Último nome do paciente<br />
                      <strong>Senha:</strong> CPF do paciente
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAccess} disabled={!selectedPatientId || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Acesso'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de acessos */}
        {isLoadingAccess ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : filteredAccess.length > 0 ? (
          <div className="space-y-3">
            {filteredAccess.map((access) => (
              <Card key={access.id} className="border-border/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {access.patients?.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Login: {access.login_surname}
                          {access.last_login_at && (
                            <> • Último acesso: {new Date(access.last_login_at).toLocaleDateString('pt-BR')}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {access.is_active ? (
                          <Badge variant="default" className="bg-green-500">
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
                      <Switch
                        checked={access.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ accessId: access.id, isActive: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                Nenhum acesso criado
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie acessos para que seus pacientes possam visualizar relatórios e prescrições.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} disabled={!limitInfo?.canAddPatient}>
                <UserPlus className="h-4 w-4 mr-2" />
                Criar primeiro acesso
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
